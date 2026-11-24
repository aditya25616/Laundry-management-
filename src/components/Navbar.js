"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [pathname]);

  useEffect(() => {
    if (!user) {
      return;
    }

    loadUnreadNotifications();

    const interval = setInterval(() => {
      loadUnreadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, pathname]);

  async function loadUnreadNotifications() {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      const response = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error(
        "Failed to load notification count:",
        error
      );
    }
  }

  if (!user || pathname === "/auth") {
    return null;
  }

  const navigationItems = [];

  if (user.role === "student") {
    navigationItems.push(
      { label: "Home", path: "/dashboard" },
      { label: "My Laundry", path: "/laundry" },
      { label: "Notifications", path: "/notifications" },
      { label: "Disputes", path: "/disputes" }
    );
  }

  if (user.role === "staff") {
    navigationItems.push(
      { label: "Home", path: "/dashboard" },
      { label: "Laundry Requests", path: "/staff" },
      { label: "Batches", path: "/batches" },
      { label: "Notifications", path: "/notifications" },
      { label: "Disputes", path: "/disputes" }
    );
  }

  if (user.role === "admin") {
    navigationItems.push(
      { label: "Home", path: "/dashboard" },
      { label: "Admin Panel", path: "/admin" },
      { label: "Laundry Requests", path: "/staff" },
      { label: "Batches", path: "/batches" },
      { label: "Notifications", path: "/notifications" },
      { label: "Disputes", path: "/disputes" }
    );
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth");
  }

  function navigate(path) {
    setMenuOpen(false);
    router.push(path);
  }

  function isActive(path) {
    return (
      pathname === path ||
      pathname.startsWith(`${path}/`)
    );
  }

  function notificationLabel() {
    if (unreadCount > 99) {
      return "Notifications 99+";
    }

    if (unreadCount > 0) {
      return `Notifications ${unreadCount}`;
    }

    return "Notifications";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/20 bg-indigo-600/50 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="shrink-0 text-left"
          >
            <h1 className="text-xl font-black tracking-tight">
              LAUNDRY
            </h1>

            <p className="text-[10px] font-medium tracking-[0.2em] text-white/60">
              HOSTEL MANAGEMENT
            </p>
          </button>

          <nav className="hidden flex-1 items-center justify-center gap-2 lg:flex">
            {navigationItems.map((item) => {
              const isNotification =
                item.path === "/notifications";

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`relative whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive(item.path)
                      ? "bg-white text-indigo-700 shadow-lg"
                      : "bg-white/10 text-white/85 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {isNotification
                    ? notificationLabel()
                    : item.label}

                  {isNotification &&
                    unreadCount > 0 && (
                      <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {unreadCount > 99
                          ? "99+"
                          : unreadCount}
                      </span>
                    )}
                </button>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <div className="max-w-36 rounded-xl border border-white/15 bg-white/10 px-4 py-2">
              <p className="truncate text-sm font-semibold">
                {user.name}
              </p>

              <p className="text-xs capitalize text-white/50">
                {user.role}
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-medium transition hover:bg-white/20"
            >
              Logout
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              setMenuOpen((current) => !current)
            }
            className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-medium transition hover:bg-white/20 lg:hidden"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>

        {menuOpen && (
          <div className="mt-3 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-xl lg:hidden">
            <div className="mb-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="font-semibold">
                {user.name}
              </p>

              <p className="text-xs capitalize text-white/50">
                {user.role}
              </p>
            </div>

            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const isNotification =
                  item.path === "/notifications";

                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                      isActive(item.path)
                        ? "bg-white text-indigo-700"
                        : "bg-white/10 text-white/85 hover:bg-white/20"
                    }`}
                  >
                    <span>
                      {item.label}
                    </span>

                    {isNotification &&
                      unreadCount > 0 && (
                        <span className="rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold text-white">
                          {unreadCount > 99
                            ? "99+"
                            : unreadCount}
                        </span>
                      )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={logout}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-left text-sm font-medium text-white transition hover:bg-white/20"
              >
                Logout
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}