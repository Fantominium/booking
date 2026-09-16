import Link from "next/link";

const Home = (): JSX.Element => {
  return (
    <div className="min-h-screen bg-slate-950">
      <section className="relative isolate overflow-hidden">
        <video
          className="hero-background-video absolute inset-0 -z-20 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
        >
          <source src="/uploads/hero-background.mp4" type="video/mp4" />
        </video>
        <div
          className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,6,23,0.9)_0%,rgba(2,6,23,0.68)_48%,rgba(2,6,23,0.28)_100%)]"
          aria-hidden="true"
        />
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center px-6 py-16">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
            <div className="space-y-5">
              <p className="text-sm font-semibold tracking-[0.2em] text-slate-200 uppercase">
                TruFlow
              </p>
              <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-white sm:text-6xl">
                The Truflow Experience
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-100">
                Uniquely catered treatments for your bespoke needs
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/book"
                  className="flex min-h-11 items-center justify-center rounded-xl bg-white px-8 py-4 text-lg font-semibold text-slate-950 shadow-lg transition hover:bg-slate-100 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-950 focus:outline-none"
                >
                  View all offerings
                </Link>
              </div>
            </div>

            <div className="rounded-4xl border border-white/30 bg-slate-950/65 p-6 shadow-xl backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-white">Frequently Booked Sessions</h2>
              <div className="mt-4 grid gap-3">
                <Link
                  href="/book?type=SESSION"
                  className="rounded-2xl border border-white/25 px-4 py-4 text-left transition hover:bg-white/10 focus:ring-2 focus:ring-white focus:outline-none"
                >
                  <span className="block text-sm font-semibold text-white">Book a session</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-200">
                    One-to-one appointments with secure deposit or bank transfer.
                  </span>
                </Link>
                <Link
                  href="/book?type=EVENT"
                  className="rounded-2xl border border-white/25 px-4 py-4 text-left transition hover:bg-white/10 focus:ring-2 focus:ring-white focus:outline-none"
                >
                  <span className="block text-sm font-semibold text-white">
                    Mobile or Studio Appointments
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-slate-200">
                    We book the studio or we come to you
                  </span>
                </Link>
                <Link
                  href="/book?type=RENTAL"
                  className="rounded-2xl border border-white/25 px-4 py-4 text-left transition hover:bg-white/10 focus:ring-2 focus:ring-white focus:outline-none"
                >
                  <span className="block text-sm font-semibold text-white">
                    Couples Massages Available
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-slate-200">
                    Please ask the head therapist for details
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-12 md:grid-cols-3">
        <div className="dark:bg-surface-elevated dark:ring-border rounded-2xl bg-blue-50 p-6 text-center dark:ring-1">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-200 dark:bg-blue-300">
            <span className="text-2xl">📅</span>
          </div>
          <h3 className="dark:text-foreground mb-2 font-semibold text-blue-950">
            On-Time Appointments
          </h3>
          <p className="dark:text-foreground text-sm leading-6 text-blue-900">
            Punctual professional pampering perfected for your individual needs
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
            Recent testimonial
          </h3>
          <p className="dark:text-foreground text-sm leading-6 text-green-900">
            Testimonial testimonial
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
