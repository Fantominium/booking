import Link from "next/link";

const Home = (): JSX.Element => {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-6 bg-slate-50 px-6 text-center">
      <h1 className="text-4xl font-bold text-slate-900">TruFlow Booking</h1>
      <p className="text-slate-700">Book your next massage in minutes.</p>
      <Link
        href="/book"
        className="rounded-md bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
      >
        Start booking
      </Link>
    </main>
  );
};

export default Home;
