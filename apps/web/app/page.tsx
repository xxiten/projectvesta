import Link from 'next/link';
import { Button } from '@vesta/design-system';

export default function MarketingHome() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center gap-6 px-8">
      <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">Vesta</p>
      <h1 className="text-4xl font-semibold leading-tight text-neutral-900">
        Hotelmanagement, ruhig und schnell.
      </h1>
      <p className="text-lg text-neutral-700">
        Reservierung, Front Desk, Housekeeping und Abrechnung in einer klaren, tastaturfreundlichen
        Oberfläche. Südtirol-first, international vorbereitet.
      </p>
      <Link href="/plan">
        <Button>Zum Zimmerplan</Button>
      </Link>
    </main>
  );
}
