import Link from "next/link";

const Home = (): JSX.Element => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(186,230,253,0.28),transparent_45%),linear-gradient(180deg,#fdfefe_0%,#f5f7fb_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(144,202,249,0.14),transparent_45%),linear-gradient(180deg,#121212_0%,#171717_100%)]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center gap-12 px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
          <div className="space-y-5">
            <p className="text-sm font-semibold tracking-[0.2em] text-slate-600 uppercase dark:text-slate-300">
              TruFlow booking platform
            </p>
            <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl dark:text-white">
              Reserve the right TruFlow experience without broken journeys.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-700 dark:text-slate-200">
              Start with a guided session, a hosted event, or a rental booking. Every route leads to
              availability, customer details, and a final payment choice.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/book"
                className="flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-slate-800 focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 focus:outline-none dark:bg-blue-300 dark:text-slate-950 dark:hover:bg-blue-200 dark:focus:ring-blue-300"
              >
                View all offerings
              </Link>
            </div>
          </div>

          <div className="rounded-4xl border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Quick paths</h2>
            <div className="mt-4 grid gap-3">
              <Link
                href="/book?type=SESSION"
                className="rounded-2xl border border-slate-200 px-4 py-4 text-left transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <span className="block text-sm font-semibold text-slate-950 dark:text-white">
                  Book a session
                </span>
                <span className="mt-1 block text-sm leading-6 text-slate-700 dark:text-slate-200">
                  One-to-one appointments with secure deposit or bank transfer.
                </span>
              </Link>
              <Link
                href="/book?type=EVENT"
                className="rounded-2xl border border-slate-200 px-4 py-4 text-left transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <span className="block text-sm font-semibold text-slate-950 dark:text-white">
                  Reserve an event
                </span>
                <span className="mt-1 block text-sm leading-6 text-slate-700 dark:text-slate-200">
                  Hosted group experiences with clear availability and payment steps.
                </span>
              </Link>
              <Link
                href="/book?type=RENTAL"
                className="rounded-2xl border border-slate-200 px-4 py-4 text-left transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <span className="block text-sm font-semibold text-slate-950 dark:text-white">
                  Reserve a rental
                </span>
                <span className="mt-1 block text-sm leading-6 text-slate-700 dark:text-slate-200">
                  Private space reservations with booking confirmation and transfer references.
                </span>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          <div className="dark:bg-surface-elevated dark:ring-border rounded-2xl bg-blue-50 p-6 text-center dark:ring-1">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-200 dark:bg-blue-300">
              <span className="text-2xl">📅</span>
            </div>
            <h3 className="dark:text-foreground mb-2 font-semibold text-blue-950">
              Reachable journeys
            </h3>
            <p className="dark:text-foreground text-sm leading-6 text-blue-900">
              Every public CTA takes you into a complete flow with valid next steps.
            </p>
          </div>

          <div className="bg-gold-50 dark:bg-surface-elevated dark:ring-border rounded-2xl p-6 text-center dark:ring-1">
            <div className="bg-gold-200 dark:bg-gold-300 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
              <span className="text-2xl">💳</span>
            </div>
            <h3 className="text-gold-900 dark:text-foreground mb-2 font-semibold">
              Clear payment choices
            </h3>
            <p className="text-gold-900 dark:text-foreground text-sm leading-6">
              Card deposits and bank transfer reservations are explained before you commit.
            </p>
          </div>

          <div className="dark:bg-surface-elevated dark:ring-border rounded-2xl bg-green-50 p-6 text-center dark:ring-1">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-200 dark:bg-green-300">
              <span className="text-2xl">✨</span>
            </div>
            <h3 className="dark:text-foreground mb-2 font-semibold text-green-950">
              Operational admin tools
            </h3>
            <p className="dark:text-foreground text-sm leading-6 text-green-900">
              Services, availability, emergency blocks, and payment states stay manageable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
