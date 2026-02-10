import Link from "next/link";
import { Header } from "@/components/Header";

const Home = (): JSX.Element => {
  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col items-center justify-center gap-8 px-6 text-center">
        <div className="space-y-4">
          <h1 className="text-foreground text-5xl font-bold">TruFlow Booking</h1>
          <p className="max-w-2xl text-xl text-neutral-600">
            Book your next massage in minutes with our calming, intuitive booking system.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/book"
            className="bg-primary hover:bg-primary-dark focus:ring-primary flex min-h-[44px] items-center justify-center rounded-lg px-8 py-4 text-lg font-semibold text-white shadow-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
          >
            Start Booking
          </Link>
          <Link
            href="/admin"
            className="bg-surface border-border text-foreground focus:ring-primary flex min-h-[44px] items-center justify-center rounded-lg border-2 px-8 py-4 text-lg font-semibold transition-colors hover:bg-neutral-100 focus:ring-2 focus:ring-offset-2 focus:outline-none"
          >
            Admin Dashboard
          </Link>
        </div>

        <div className="mt-12 grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-blue-50 p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-200">
              <span className="text-2xl">📅</span>
            </div>
            <h3 className="mb-2 font-semibold text-blue-900">Easy Scheduling</h3>
            <p className="text-sm text-blue-700">
              Pick your service and available time slot in just a few clicks.
            </p>
          </div>

          <div className="bg-gold-50 rounded-lg p-6 text-center">
            <div className="bg-gold-200 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
              <span className="text-2xl">💳</span>
            </div>
            <h3 className="text-gold-900 mb-2 font-semibold">Secure Payments</h3>
            <p className="text-gold-700 text-sm">
              Safe and secure payment processing powered by Stripe.
            </p>
          </div>

          <div className="rounded-lg bg-green-50 p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-200">
              <span className="text-2xl">✨</span>
            </div>
            <h3 className="mb-2 font-semibold text-green-900">Instant Confirmation</h3>
            <p className="text-sm text-green-700">
              Get immediate booking confirmation and calendar invites.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
