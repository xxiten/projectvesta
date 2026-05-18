#!/usr/bin/env python3
"""
Reusable Proxmox VM provisioner for the Vesta live-test environment.

Drives a Proxmox host over SSH (paramiko) to create a Debian 13 VM from the
official genericcloud image, cloud-init (SSH key + DHCP), then installs Docker
and brings up the Vesta compose bundle.

Secrets are NEVER hard-coded: the host password is read from $PVE_PASS.
Run stages individually (idempotent-ish) or `all`.

Usage:
  PVE_PASS='...' python infra/proxmox/provision-vm.py <stage>
  stages: check | download | create | ip | provision | up | snapshot
"""
from __future__ import annotations
import os
import sys
import time
import paramiko

HOST = os.environ.get("PVE_HOST", "192.168.1.58")
USER = os.environ.get("PVE_USER", "root")
PASS = os.environ.get("PVE_PASS")

VMID = os.environ.get("VESTA_VMID", "101")
VMNAME = "vesta-test"
STORAGE = "local-lvm"
BRIDGE = "vmbr0"
RAM = "5120"
CORES = "4"
DISK = "40G"
CIUSER = "vesta"

IMG_URL = (
    "https://cloud.debian.org/images/cloud/trixie/latest/"
    "debian-13-genericcloud-amd64.qcow2"
)
IMG_PATH = "/var/lib/vz/tmp-vesta/debian-13-genericcloud-amd64.qcow2"
PUBKEY_LOCAL = os.path.expanduser(os.environ.get("VESTA_PUBKEY", "~/.ssh/vesta_test.pub"))


def client() -> paramiko.SSHClient:
    if not PASS:
        sys.exit("ERROR: set $PVE_PASS")
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username=USER, password=PASS, timeout=15, look_for_keys=False,
              allow_agent=False)
    return c


def run(c: paramiko.SSHClient, cmd: str, quiet: bool = False) -> tuple[int, str, str]:
    _in, out, err = c.exec_command(cmd, timeout=600)
    rc = out.channel.recv_exit_status()
    so, se = out.read().decode(errors="replace"), err.read().decode(errors="replace")
    if not quiet:
        if so.strip():
            print(so.rstrip())
        if se.strip():
            print("STDERR:", se.rstrip())
    return rc, so, se


def stage_check(c):
    run(c, "pveversion; echo '---'; qm list; echo '---'; "
           "free -m | head -2; echo '---'; "
           "pvesm status; echo '---'; "
           "curl -sI -m 8 https://cloud.debian.org/ | head -1 || echo 'NO INTERNET'")


def stage_download(c):
    run(c, f"mkdir -p $(dirname {IMG_PATH}); "
           f"if [ -s {IMG_PATH} ]; then echo 'image already present'; "
           f"else nohup wget -q -O {IMG_PATH} '{IMG_URL}' "
           f">/var/lib/vz/tmp-vesta/dl.log 2>&1 & echo \"download started pid $!\"; fi")
    # poll size
    for _ in range(60):
        rc, so, _ = run(c, f"stat -c %s {IMG_PATH} 2>/dev/null || echo 0", quiet=True)
        size = int(so.strip() or 0)
        print(f"  image size: {size/1_000_000:.1f} MB")
        rc2, ps, _ = run(c, "pgrep -f 'wget .*debian-13-genericcloud' >/dev/null "
                             "&& echo RUNNING || echo DONE", quiet=True)
        if ps.strip() == "DONE" and size > 100_000_000:
            print("download complete")
            return
        if ps.strip() == "DONE" and size <= 100_000_000:
            run(c, "cat /var/lib/vz/tmp-vesta/dl.log")
            sys.exit("download finished but image too small — check log above")
        time.sleep(15)
    sys.exit("download still running after timeout; re-run 'download' to keep polling")


def _upload_pubkey(c):
    if not os.path.isfile(PUBKEY_LOCAL):
        sys.exit(f"ERROR: public key not found at {PUBKEY_LOCAL}")
    sftp = c.open_sftp()
    sftp.put(PUBKEY_LOCAL, "/var/lib/vz/tmp-vesta/vesta.pub")
    sftp.close()


def stage_create(c):
    rc, so, _ = run(c, f"qm status {VMID} 2>/dev/null && echo EXISTS || echo FREE",
                    quiet=True)
    if "EXISTS" in so:
        print(f"VM {VMID} already exists — skipping create")
        return
    _upload_pubkey(c)
    import secrets
    cipass = secrets.token_urlsafe(18)
    with open(os.path.expanduser("~/.ssh/vesta_test.cipass"), "w") as f:
        f.write(cipass + "\n")
    print("cloud-init password written to ~/.ssh/vesta_test.cipass (local)")
    cmds = [
        f"qm create {VMID} --name {VMNAME} --memory {RAM} --balloon 0 "
        f"--cores {CORES} --cpu host --numa 0 --ostype l26 "
        f"--net0 virtio,bridge={BRIDGE} --scsihw virtio-scsi-single "
        f"--agent enabled=1 --serial0 socket --vga serial0",
        f"qm disk import {VMID} {IMG_PATH} {STORAGE} --format raw",
        f"qm set {VMID} --scsi0 {STORAGE}:vm-{VMID}-disk-0",
        f"qm set {VMID} --ide2 {STORAGE}:cloudinit",
        f"qm set {VMID} --boot order=scsi0",
        f"qm set {VMID} --ciuser {CIUSER} --cipassword '{cipass}' "
        f"--sshkeys /var/lib/vz/tmp-vesta/vesta.pub --ipconfig0 ip=dhcp",
        f"qm disk resize {VMID} scsi0 {DISK}",
        f"qm start {VMID}",
    ]
    for cmd in cmds:
        print(f"\n$ {cmd}")
        rc, _, se = run(c, cmd)
        if rc != 0 and "disk import" in cmd:
            print("retrying with legacy importdisk…")
            run(c, f"qm importdisk {VMID} {IMG_PATH} {STORAGE} --format raw")
        elif rc != 0:
            sys.exit(f"command failed (rc={rc})")
    print("\nVM created and starting.")


def stage_ip(c):
    for _ in range(40):
        rc, so, _ = run(
            c, f"qm guest cmd {VMID} network-get-interfaces 2>/dev/null", quiet=True)
        import re
        ips = re.findall(r'"ip-address"\s*:\s*"(192\.168\.\d+\.\d+)"', so)
        if ips:
            print("VM IP:", ips[0])
            with open(os.path.expanduser("~/.ssh/vesta_test.ip"), "w") as f:
                f.write(ips[0] + "\n")
            return ips[0]
        time.sleep(10)
    sys.exit("guest agent did not report an IP yet; re-run 'ip' shortly")


STAGES = {
    "check": stage_check,
    "download": stage_download,
    "create": stage_create,
    "ip": stage_ip,
}

if __name__ == "__main__":
    stage = sys.argv[1] if len(sys.argv) > 1 else "check"
    c = client()
    try:
        if stage == "all":
            for s in ("check", "download", "create", "ip"):
                print(f"\n===== STAGE {s} =====")
                STAGES[s](c)
        else:
            STAGES[stage](c)
    finally:
        c.close()
