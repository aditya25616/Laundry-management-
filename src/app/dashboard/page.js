"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { canAccess } from "@/lib/roleAccess";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.push("/auth");
      return;
    }

    const currentUser = JSON.parse(storedUser);

    if (!canAccess(currentUser.role, "/dashboard")) {
      router.push("/auth");
      return;
    }

    setUser(currentUser);
  }, [router]);

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-400 via-blue-500 to-indigo-700">
        <div className="flex min-h-screen items-center justify-center text-xl font-semibold text-white">
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-400 via-blue-500 to-indigo-700 text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-10">
          <p className="mb-3 text-sm font-medium tracking-[0.25em] text-white/60">
            DASHBOARD
          </p>

          <h2 className="text-4xl font-black tracking-tight md:text-5xl">
            Welcome, {user.name}
          </h2>

          <p className="mt-3 text-lg text-white/70">
            Manage your hostel laundry from one place.
          </p>
        </section>

        <section className="mb-10 rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
          <p className="text-sm text-white/60">
            Account Information
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
              <p className="text-xs text-white/50">
                Name
              </p>

              <p className="mt-2 font-semibold">
                {user.name}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
              <p className="text-xs text-white/50">
                Email
              </p>

              <p className="mt-2 break-all font-semibold">
                {user.email}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
              <p className="text-xs text-white/50">
                Role
              </p>

              <p className="mt-2 font-semibold capitalize">
                {user.role}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-md">
          <p className="text-sm font-medium tracking-[0.2em] text-white/50">
            QUICK ACCESS
          </p>

          <h3 className="mt-2 text-2xl font-bold">
            Use the navigation bar
          </h3>

          <p className="mt-3 max-w-2xl text-white/65">
            All available services and management sections for your
            role are available from the navigation bar above.
          </p>
        </section>
      </div>
    </main>
  );
}