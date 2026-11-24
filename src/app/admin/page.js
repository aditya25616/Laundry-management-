"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { canAccess } from "@/lib/roleAccess";

export default function AdminPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.push("/auth");
      return;
    }

    const currentUser = JSON.parse(storedUser);

    if (!canAccess(currentUser.role, "/admin")) {
      router.push("/dashboard");
      return;
    }

    setUser(currentUser);
  }, [router]);

  async function createStaff(e) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setMessage("Staff account created successfully.");

      setName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      setMessage("Failed to create staff account.");
    } finally {
      setLoading(false);
    }
  }

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
            ADMINISTRATION
          </p>

          <h2 className="text-4xl font-black tracking-tight md:text-5xl">
            Admin Panel
          </h2>

          <p className="mt-3 text-lg text-white/70">
            Manage hostel laundry system administration.
          </p>
        </section>

        {message && (
          <div className="mb-6 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-sm backdrop-blur-md">
            {message}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
            <p className="text-sm text-white/60">
              STAFF MANAGEMENT
            </p>

            <h3 className="mt-2 text-2xl font-bold">
              Create Staff Account
            </h3>

            <p className="mt-2 text-white/60">
              Create an account that can manage laundry operations.
            </p>

            <form
              onSubmit={createStaff}
              className="mt-6 space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm text-white/80">
                  Staff Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter staff name"
                  required
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-white/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/80">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@example.com"
                  required
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-white/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/80">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  required
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-white/50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-white px-6 py-3 font-semibold text-indigo-700 shadow-lg transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Creating Staff..."
                  : "Create Staff Account"}
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
            <p className="text-sm text-white/60">
              ADMIN ACCOUNT
            </p>

            <h3 className="mt-2 text-2xl font-bold">
              Current Administrator
            </h3>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                <p className="text-xs text-white/50">
                  Name
                </p>

                <p className="mt-1 font-semibold">
                  {user.name}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                <p className="text-xs text-white/50">
                  Email
                </p>

                <p className="mt-1 break-all font-semibold">
                  {user.email}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                <p className="text-xs text-white/50">
                  Role
                </p>

                <p className="mt-1 font-semibold capitalize">
                  {user.role}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}