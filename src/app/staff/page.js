"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { canAccess } from "@/lib/roleAccess";

const statusLabels = {
  submitted: "Submitted",
  tag_verified: "Tag Verified",
  batched: "Batched",
  processing: "Processing",
  quality_check: "Quality Check",
  ready_for_pickup: "Ready for Pickup",
  picked_up: "Picked Up",
  completed: "Completed",
  disputed: "Disputed",
};

const statusColors = {
  submitted:
    "bg-blue-400/20 text-blue-100 border-blue-200/30",
  tag_verified:
    "bg-indigo-400/20 text-indigo-100 border-indigo-200/30",
  batched:
    "bg-purple-400/20 text-purple-100 border-purple-200/30",
  processing:
    "bg-yellow-400/20 text-yellow-100 border-yellow-200/30",
  quality_check:
    "bg-orange-400/20 text-orange-100 border-orange-200/30",
  ready_for_pickup:
    "bg-green-400/20 text-green-100 border-green-200/30",
  picked_up:
    "bg-emerald-400/20 text-emerald-100 border-emerald-200/30",
  completed:
    "bg-white/10 text-white border-white/20",
  disputed:
    "bg-red-400/20 text-red-100 border-red-200/30",
};

export default function StaffPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [laundry, setLaundry] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadLaundry() {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/auth");
      return;
    }

    try {
      const response = await fetch("/api/laundry", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setLaundry(data.laundry || []);
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage("Failed to load laundry");
    }
  }

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.push("/auth");
      return;
    }

    const currentUser = JSON.parse(storedUser);

    if (!canAccess(currentUser.role, "/staff")) {
      router.push("/dashboard");
      return;
    }

    setUser(currentUser);
    loadLaundry();
  }, [router]);

  async function verifyTag(laundryId) {
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/laundry/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          laundryId,
          status: "tag_verified",
          remarks: "Laundry tag verified by staff",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setMessage("Laundry tag verified successfully.");

      await loadLaundry();
    } catch (error) {
      setMessage("Failed to verify laundry tag.");
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

  const submittedLaundry = laundry.filter(
    (item) => item.status === "submitted"
  );

  const verifiedLaundry = laundry.filter(
    (item) => item.status === "tag_verified"
  );

  const activeLaundry = laundry.filter(
    (item) =>
      item.status !== "completed" &&
      item.status !== "picked_up"
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-400 via-blue-500 to-indigo-700 text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-10">
          <p className="mb-3 text-sm font-medium tracking-[0.25em] text-white/60">
            STAFF OPERATIONS
          </p>

          <h2 className="text-4xl font-black tracking-tight md:text-5xl">
            Staff Dashboard
          </h2>

          <p className="mt-3 text-lg text-white/70">
            Verify tags and manage laundry batches.
          </p>
        </section>

        <section className="mb-10 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-md">
            <p className="text-sm text-white/60">
              New Submissions
            </p>

            <p className="mt-2 text-4xl font-black">
              {submittedLaundry.length}
            </p>

            <p className="mt-2 text-sm text-white/60">
              Waiting for tag verification
            </p>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-md">
            <p className="text-sm text-white/60">
              Tag Verified
            </p>

            <p className="mt-2 text-4xl font-black">
              {verifiedLaundry.length}
            </p>

            <p className="mt-2 text-sm text-white/60">
              Ready for batch creation
            </p>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-md">
            <p className="text-sm text-white/60">
              Active Laundry
            </p>

            <p className="mt-2 text-4xl font-black">
              {activeLaundry.length}
            </p>

            <p className="mt-2 text-sm text-white/60">
              Currently in workflow
            </p>
          </div>
        </section>

        {message && (
          <div className="mb-6 rounded-xl border border-white/20 bg-white/10 px-5 py-4 text-sm backdrop-blur-md">
            {message}
          </div>
        )}

        <section>
          <div className="mb-5">
            <h3 className="text-2xl font-bold">
              Laundry Requests
            </h3>

            <p className="mt-1 text-white/65">
              Verify submitted laundry before creating a batch.
            </p>
          </div>

          {laundry.length === 0 ? (
            <div className="rounded-3xl border border-white/20 bg-white/10 p-10 text-center backdrop-blur-md">
              <h4 className="text-xl font-semibold">
                No laundry requests
              </h4>

              <p className="mt-2 text-white/60">
                Student laundry requests will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {laundry.map((item) => (
                <div
                  key={item._id}
                  className="overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-xl backdrop-blur-md"
                >
                  <div className="border-b border-white/15 p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="text-xl font-bold">
                            {item.student?.name || "Student"}
                          </h4>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${
                              statusColors[item.status] ||
                              "border-white/20 bg-white/10 text-white"
                            }`}
                          >
                            {statusLabels[item.status] ||
                              item.status}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-white/60">
                          {item.student?.email}
                        </p>

                        <p className="mt-1 text-sm text-white/60">
                          Tag ID:
                          <span className="ml-1 font-semibold text-white">
                            {item.tagId}
                          </span>
                        </p>

                        {item.batch && (
                          <p className="mt-1 text-sm text-white/60">
                            Batch:
                            <span className="ml-1 font-semibold text-white">
                              {item.batch.batchNumber}
                            </span>
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {item.status === "submitted" && (
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() =>
                              verifyTag(item._id)
                            }
                            className="rounded-xl bg-indigo-300 px-5 py-3 font-semibold text-indigo-950 transition hover:bg-indigo-200 disabled:opacity-50"
                          >
                            {loading
                              ? "Verifying..."
                              : "Verify Tag"}
                          </button>
                        )}

                        {item.status === "tag_verified" && (
                          <button
                            type="button"
                            onClick={() =>
                              router.push("/batches")
                            }
                            className="rounded-xl bg-purple-300 px-5 py-3 font-semibold text-purple-950 transition hover:bg-purple-200"
                          >
                            Add to Batch
                          </button>
                        )}

                        {item.status === "batched" && (
                          <span className="rounded-xl border border-purple-200/20 bg-purple-400/10 px-5 py-3 text-sm font-medium text-purple-100">
                            Managed by Batch
                          </span>
                        )}

                        {item.status === "processing" && (
                          <span className="rounded-xl border border-yellow-200/20 bg-yellow-400/10 px-5 py-3 text-sm font-medium text-yellow-100">
                            Managed by Batch
                          </span>
                        )}

                        {item.status === "quality_check" && (
                          <span className="rounded-xl border border-orange-200/20 bg-orange-400/10 px-5 py-3 text-sm font-medium text-orange-100">
                            Managed by Batch
                          </span>
                        )}

                        {item.status === "ready_for_pickup" && (
                          <span className="rounded-xl border border-green-200/20 bg-green-400/10 px-5 py-3 text-sm font-medium text-green-100">
                            Waiting for Student Pickup
                          </span>
                        )}

                        {item.status === "picked_up" && (
                          <span className="rounded-xl border border-emerald-200/20 bg-emerald-400/10 px-5 py-3 text-sm font-medium text-emerald-100">
                            Pickup Confirmed
                          </span>
                        )}

                        {item.status === "completed" && (
                          <span className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <h5 className="mb-4 font-semibold">
                      Laundry Items
                    </h5>

                    <div className="grid gap-3 md:grid-cols-2">
                      {item.items.map((laundryItem) => (
                        <div
                          key={laundryItem._id}
                          className="rounded-xl border border-white/10 bg-white/10 px-4 py-3"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium">
                              {laundryItem.name}
                            </p>

                            <span className="rounded-lg bg-white/10 px-3 py-1 text-sm">
                              × {laundryItem.quantity}
                            </span>
                          </div>

                          {laundryItem.description && (
                            <p className="mt-1 text-xs text-white/55">
                              {laundryItem.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/15 p-6">
                    <h5 className="mb-5 font-semibold">
                      Status History
                    </h5>

                    <div className="space-y-4">
                      {item.statusHistory?.map(
                        (history, index) => (
                          <div
                            key={index}
                            className="flex gap-4"
                          >
                            <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-white" />

                            <div>
                              <p className="font-medium">
                                {statusLabels[
                                  history.status
                                ] || history.status}
                              </p>

                              <p className="text-xs text-white/50">
                                {new Date(
                                  history.changedAt
                                ).toLocaleString()}
                              </p>

                              {history.remarks && (
                                <p className="mt-1 text-sm text-white/60">
                                  {history.remarks}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}