import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <section className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-4xl text-center">
          <div className="mb-6 inline-block rounded-full border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-gray-300">
            Hostel Laundry Management System
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Manage Your Laundry
            <span className="block text-blue-500">
              Easily & Transparently
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-400">
            Submit laundry, track its status, verify tags, receive pickup
            notifications, and raise disputes when needed.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/auth"
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-700"
            >
              Login / Register
            </Link>

            <Link
              href="/auth"
              className="rounded-lg border border-gray-700 bg-gray-900 px-6 py-3 font-semibold transition hover:bg-gray-800"
            >
              Get Started
            </Link>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
              <h2 className="text-lg font-semibold">Track Laundry</h2>
              <p className="mt-2 text-sm text-gray-400">
                Follow your laundry through every processing stage.
              </p>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
              <h2 className="text-lg font-semibold">Pickup Alerts</h2>
              <p className="mt-2 text-sm text-gray-400">
                Get notified when your laundry is ready for pickup.
              </p>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
              <h2 className="text-lg font-semibold">Dispute Handling</h2>
              <p className="mt-2 text-sm text-gray-400">
                Report missing, damaged, or incorrect laundry items.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}