"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: isLogin ? "login" : "register",
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      if (isLogin) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        router.push("/dashboard");
      } else {
        setMessage("Account created successfully. Please login.");

        setIsLogin(true);

        setForm({
          name: "",
          email: form.email,
          password: "",
        });
      }
    } catch (error) {
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#101a3a] text-white">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#7db7ff] via-[#566cf5] to-[#26145f]" />

      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-purple-500/40 blur-3xl" />

      <div className="absolute -bottom-40 -right-32 h-[500px] w-[500px] rounded-full bg-blue-400/30 blur-3xl" />

      <div className="absolute left-[10%] top-[20%] h-20 w-20 rotate-12 rounded-3xl bg-white/10 backdrop-blur-sm" />

      <div className="absolute right-[15%] top-[15%] h-28 w-28 rounded-full bg-purple-400/20 blur-xl" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <div>
          <h1 className="text-lg font-black tracking-tight">
            LAUNDRY
          </h1>

          <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">
            Hostel Management
          </p>
        </div>

        <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs backdrop-blur-md">
          {isLogin ? "Student Portal" : "Create Account"}
        </div>
      </header>

      {/* Main */}
      <div className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-5 py-10">
        <div className="grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2">
          {/* Left visual section */}
          <div className="hidden lg:block">
            <div className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur-md">
              Smart Hostel Laundry
            </div>

            <h2 className="max-w-xl text-6xl font-black leading-[0.95] tracking-tight">
              Track your
              <span className="block text-[#d6c7ff]">
                laundry.
              </span>
              Stay stress free.
            </h2>

            <p className="mt-6 max-w-lg text-lg leading-8 text-white/70">
              Submit clothes, track every laundry stage, verify
              pickup and report issues from one simple system.
            </p>

            {/* Simple 3D-style laundry visual */}
            <div className="relative mt-12 h-48 w-full">
              <div className="absolute bottom-5 left-10 h-24 w-52 rounded-[35px] bg-white/20 shadow-2xl backdrop-blur-md" />

              <div className="absolute bottom-12 left-24 h-28 w-28 rotate-12 rounded-3xl bg-gradient-to-br from-white/80 to-blue-200/30 shadow-2xl" />

              <div className="absolute bottom-4 left-64 h-20 w-20 -rotate-12 rounded-2xl bg-purple-400/60 shadow-xl" />

              <div className="absolute bottom-16 right-24 h-28 w-28 rounded-full bg-blue-300/30 blur-xl" />
            </div>
          </div>

          {/* Auth card */}
          <div className="w-full max-w-md justify-self-center">
            <div className="rounded-[32px] border border-white/20 bg-white/10 p-2 shadow-2xl backdrop-blur-xl">
              <div className="rounded-[26px] bg-[#111a3b]/90 p-7 md:p-9">
                <div className="mb-8">
                  <p className="mb-2 text-sm font-medium text-blue-300">
                    {isLogin ? "WELCOME BACK" : "GET STARTED"}
                  </p>

                  <h2 className="text-3xl font-bold">
                    {isLogin ? "Login to your account" : "Create your account"}
                  </h2>

                  <p className="mt-2 text-sm text-white/50">
                    {isLogin
                      ? "Continue managing your laundry."
                      : "Join the hostel laundry management system."}
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  {!isLogin && (
                    <div>
                      <label className="mb-2 block text-sm text-white/60">
                        Name
                      </label>

                      <input
                        type="text"
                        name="name"
                        placeholder="Enter your name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition placeholder:text-white/30 focus:border-blue-400 focus:bg-white/10"
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm text-white/60">
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition placeholder:text-white/30 focus:border-blue-400 focus:bg-white/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-white/60">
                      Password
                    </label>

                    <input
                      type="password"
                      name="password"
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition placeholder:text-white/30 focus:border-blue-400 focus:bg-white/10"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-3 w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-4 font-semibold shadow-lg shadow-blue-500/20 transition hover:scale-[1.01] hover:from-blue-400 hover:to-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading
                      ? "Please wait..."
                      : isLogin
                      ? "Login"
                      : "Create Account"}
                  </button>
                </form>

                {message && (
                  <p className="mt-4 rounded-xl bg-white/5 px-4 py-3 text-center text-sm text-blue-200">
                    {message}
                  </p>
                )}

                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs text-white/30">
                    OR
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setMessage("");
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-blue-300 transition hover:bg-white/10"
                >
                  {isLogin
                    ? "Create a new account"
                    : "Already have an account? Login"}
                </button>
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-white/40">
              Laundry Management System • Hostel Portal
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}