import { getMessages, DEFAULT_LOCALE } from '@vesta/i18n';

const t = getMessages(DEFAULT_LOCALE);

export default function DashboardPage() {
  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">{t['nav.dashboard']}</h1>
        <p className="text-sm text-neutral-500">{t['action.today']}</p>
      </header>
      <div className="grid grid-cols-4 gap-4">
        {['Anreisen', 'Abreisen', 'In-House', 'Freie Zimmer'].map((label) => (
          <div
            key={label}
            className="rounded-lg border border-neutral-200 bg-neutral-0 p-4"
          >
            <p className="text-sm text-neutral-500">{label}</p>
            <p className="tabular mt-2 text-2xl font-semibold text-neutral-900">—</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-neutral-500">
        Operative Module folgen ab Epic E1 (Inventory &amp; Reservation).
      </p>
    </section>
  );
}
