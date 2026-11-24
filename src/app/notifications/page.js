"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { canAccess } from "@/lib/roleAccess";

const typeLabels = {
  laundry: "Laundry",
  pickup: "Pickup",
  dispute: "Dispute",
  system: "System",
};

const typeColors = {
  laundry:
    "bg-blue-400/20 text-blue-100 border-blue-200/30",
  pickup:
    "bg-green-400/20 text-green-100 border-green-200/30",
  dispute:
    "bg-red-400/20 text-red-100 border-red-200/30",
  system:
    "bg-purple-400/20 text-purple-100 border-purple-200/30",
};

export default function NotificationsPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.push("/auth");
      return;
    }

    const currentUser = JSON.parse(storedUser);

    if (!canAccess(currentUser.role, "/notifications")) {
      router.push("/dashboard");
      return;
    }

    setUser(currentUser);
    loadNotifications();
  }, [router]);

  async function loadNotifications() {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "/api/notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      setMessage("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId) {
    setUpdatingId(notificationId);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "/api/notifications",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            notificationId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId
            ? {
                ...notification,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : notification
        )
      );

      setUnreadCount((current) =>
        Math.max(current - 1, 0)
      );
    } catch (error) {
      setMessage(
        "Failed to mark notification as read."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function openLaundry(notification) {
    if (notification.laundry?._id) {
      router.push("/laundry");
    }
  }

  if (!user || loading) {
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

      <div className="mx-auto max-w-5xl px-6 py-10">
        <section className="mb-10">
          <p className="mb-3 text-sm font-medium tracking-[0.25em] text-white/60">
            UPDATES
          </p>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-4xl font-black tracking-tight md:text-5xl">
                Notifications
              </h2>

              <p className="mt-3 text-lg text-white/70">
                Stay updated about your laundry and important system events.
              </p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-md">
              <p className="text-xs uppercase tracking-wider text-white/50">
                Unread
              </p>

              <p className="mt-1 text-3xl font-black">
                {unreadCount}
              </p>
            </div>
          </div>
        </section>

        {message && (
          <div className="mb-6 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-sm backdrop-blur-md">
            {message}
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="rounded-3xl border border-white/20 bg-white/10 p-12 text-center shadow-2xl backdrop-blur-md">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl">
              🔔
            </div>

            <h3 className="text-2xl font-bold">
              No notifications
            </h3>

            <p className="mt-2 text-white/60">
              New laundry updates will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`rounded-3xl border shadow-xl backdrop-blur-md transition ${
                  notification.isRead
                    ? "border-white/15 bg-white/5"
                    : "border-white/30 bg-white/15 shadow-2xl"
                }`}
              >
                <div className="p-6">
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="flex gap-4">
                      <div
                        className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                          typeColors[
                            notification.type
                          ] ||
                          "border-white/20 bg-white/10"
                        }`}
                      >
                        {notification.type ===
                          "laundry" && "👕"}

                        {notification.type ===
                          "pickup" && "✓"}

                        {notification.type ===
                          "dispute" && "!"}

                        {notification.type ===
                          "system" && "ℹ"}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-bold">
                            {notification.title}
                          </h3>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${
                              typeColors[
                                notification.type
                              ] ||
                              "border-white/20 bg-white/10"
                            }`}
                          >
                            {typeLabels[
                              notification.type
                            ] ||
                              notification.type}
                          </span>

                          {!notification.isRead && (
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-indigo-700">
                              NEW
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-white/75">
                          {notification.message}
                        </p>

                        <p className="mt-3 text-xs text-white/45">
                          {new Date(
                            notification.createdAt
                          ).toLocaleString()}
                        </p>

                        {notification.laundry?.tagId && (
                          <p className="mt-2 text-xs text-white/50">
                            Tag ID:{" "}
                            <span className="font-semibold text-white/80">
                              {notification.laundry.tagId}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {notification.laundry && (
                        <button
                          type="button"
                          onClick={() =>
                            openLaundry(notification)
                          }
                          className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium transition hover:bg-white/20"
                        >
                          View Laundry
                        </button>
                      )}

                      {!notification.isRead && (
                        <button
                          type="button"
                          disabled={
                            updatingId ===
                            notification._id
                          }
                          onClick={() =>
                            markAsRead(
                              notification._id
                            )
                          }
                          className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updatingId ===
                          notification._id
                            ? "Updating..."
                            : "Mark as Read"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}