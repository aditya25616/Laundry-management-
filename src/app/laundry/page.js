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

export default function LaundryPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [laundry, setLaundry] = useState([]);

  const [items, setItems] = useState([
    {
      name: "",
      quantity: 1,
      description: "",
    },
  ]);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [pickupLoading, setPickupLoading] = useState(null);

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
      setMessage("Failed to load laundry.");
    }
  }

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.push("/auth");
      return;
    }

    const currentUser = JSON.parse(storedUser);

    if (!canAccess(currentUser.role, "/laundry")) {
      router.push("/dashboard");
      return;
    }

    setUser(currentUser);
    loadLaundry();
  }, [router]);

  function updateItem(index, field, value) {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  function addItem() {
    setItems((currentItems) => [
      ...currentItems,
      {
        name: "",
        quantity: 1,
        description: "",
      },
    ]);
  }

  function removeItem(index) {
    setItems((currentItems) =>
      currentItems.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  async function submitLaundry(e) {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/laundry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setMessage("Laundry submitted successfully.");

      setItems([
        {
          name: "",
          quantity: 1,
          description: "",
        },
      ]);

      await loadLaundry();
    } catch (error) {
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmPickup(laundryId) {
    setPickupLoading(laundryId);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/laundry/pickup", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          laundryId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setMessage(
        data.batchCompleted
          ? "Pickup confirmed. All laundry in the batch has been picked up."
          : "Pickup confirmed successfully."
      );

      await loadLaundry();
    } catch (error) {
      setMessage("Failed to confirm pickup.");
    } finally {
      setPickupLoading(null);
    }
  }

  function getTotalQuantity(item) {
    return item.items?.reduce(
      (total, laundryItem) =>
        total + Number(laundryItem.quantity || 0),
      0
    );
  }

  function getPickupMessage(status) {
    if (status === "ready_for_pickup") {
      return {
        title: "Your Laundry Is Ready",
        description:
          "Your laundry has passed the quality check. Please collect it from the laundry counter and confirm the pickup below.",
      };
    }

    if (status === "picked_up") {
      return {
        title: "Pickup Confirmed",
        description:
          "You have confirmed that you received this laundry.",
      };
    }

    if (status === "completed") {
      return {
        title: "Laundry Completed",
        description:
          "This laundry request has been completely processed.",
      };
    }

    return null;
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
            LAUNDRY SERVICES
          </p>

          <h2 className="text-4xl font-black tracking-tight md:text-5xl">
            My Laundry
          </h2>

          <p className="mt-3 text-lg text-white/70">
            Submit your clothes, track their status and confirm pickup.
          </p>
        </section>

        <section className="mb-10 overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-md">
          <div className="border-b border-white/15 px-6 py-6 md:px-8">
            <p className="text-sm text-white/60">
              NEW REQUEST
            </p>

            <h3 className="mt-2 text-2xl font-bold">
              Submit New Laundry
            </h3>

            <p className="mt-2 text-white/65">
              Add the clothes you want to send to the laundry.
            </p>
          </div>

          <form
            onSubmit={submitLaundry}
            className="space-y-5 p-6 md:p-8"
          >
            {items.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/15 bg-white/10 p-5"
              >
                <div className="mb-5 flex items-center justify-between">
                  <h4 className="font-semibold">
                    Item {index + 1}
                  </h4>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="rounded-lg px-3 py-1 text-sm font-medium text-red-200 transition hover:bg-red-400/20 hover:text-white"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm text-white/80">
                      Item Name
                    </label>

                    <input
                      type="text"
                      placeholder="e.g. Shirt"
                      value={item.name}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "name",
                          e.target.value
                        )
                      }
                      required
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-white/50 focus:bg-white/15"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-white/80">
                      Quantity
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "quantity",
                          Number(e.target.value)
                        )
                      }
                      required
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-white/50 focus:bg-white/15"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-white/80">
                      Description
                    </label>

                    <input
                      type="text"
                      placeholder="Optional"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-white/50 focus:bg-white/15"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={addItem}
                className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 font-medium transition hover:bg-white/20"
              >
                + Add Another Item
              </button>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-white px-6 py-3 font-semibold text-indigo-700 shadow-lg transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Submitting..."
                  : "Submit Laundry"}
              </button>
            </div>

            {message && (
              <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white/90">
                {message}
              </div>
            )}
          </form>
        </section>

        <section>
          <div className="mb-5">
            <h3 className="text-2xl font-bold">
              Laundry History
            </h3>

            <p className="mt-1 text-white/65">
              Track your laundry from submission to pickup.
            </p>
          </div>

          {laundry.length === 0 ? (
            <div className="rounded-3xl border border-white/20 bg-white/10 p-10 text-center backdrop-blur-md">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl">
                👕
              </div>

              <h4 className="text-xl font-semibold">
                No laundry yet
              </h4>

              <p className="mt-2 text-white/60">
                Your laundry requests will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {laundry.map((item) => {
                const pickupInfo = getPickupMessage(
                  item.status
                );

                return (
                  <div
                    key={item._id}
                    className="overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-xl backdrop-blur-md"
                  >
                    <div className="border-b border-white/15 p-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h4 className="text-xl font-bold">
                              Laundry Request
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
                            Tag ID:
                            <span className="ml-1 font-semibold text-white/90">
                              {item.tagId}
                            </span>
                          </p>

                          {item.batch && (
                            <p className="mt-1 text-sm text-white/60">
                              Batch:
                              <span className="ml-1 font-semibold text-white/90">
                                {item.batch.batchNumber}
                              </span>
                            </p>
                          )}

                          <p className="mt-1 text-sm text-white/60">
                            Total clothes:
                            <span className="ml-1 font-semibold text-white/90">
                              {getTotalQuantity(item)}
                            </span>
                          </p>
                        </div>

                        {item.status ===
                          "ready_for_pickup" && (
                          <button
                            type="button"
                            disabled={
                              pickupLoading === item._id
                            }
                            onClick={() =>
                              confirmPickup(item._id)
                            }
                            className="rounded-xl bg-green-300 px-5 py-3 font-semibold text-green-950 shadow-lg transition hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {pickupLoading === item._id
                              ? "Confirming..."
                              : "Confirm Pickup"}
                          </button>
                        )}
                      </div>
                    </div>

                    {pickupInfo && (
                      <div
                        className={`mx-6 mt-6 rounded-2xl border p-5 ${
                          item.status ===
                          "ready_for_pickup"
                            ? "border-green-200/20 bg-green-400/10"
                            : "border-emerald-200/20 bg-emerald-400/10"
                        }`}
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-bold">
                              {pickupInfo.title}
                            </p>

                            <p className="mt-1 text-sm text-white/65">
                              {pickupInfo.description}
                            </p>
                          </div>

                          {item.pickupConfirmedAt && (
                            <div className="rounded-xl bg-white/10 px-4 py-3 text-sm">
                              <p className="text-xs text-white/50">
                                Pickup Confirmed
                              </p>

                              <p className="mt-1 font-medium">
                                {new Date(
                                  item.pickupConfirmedAt
                                ).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="p-6">
                      <h5 className="mb-4 font-semibold">
                        Laundry Items
                      </h5>

                      <div className="space-y-3">
                        {item.items.map((laundryItem) => (
                          <div
                            key={laundryItem._id}
                            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/10 px-4 py-3"
                          >
                            <div>
                              <p className="font-medium">
                                {laundryItem.name}
                              </p>

                              {laundryItem.description && (
                                <p className="mt-1 text-xs text-white/55">
                                  {laundryItem.description}
                                </p>
                              )}
                            </div>

                            <span className="rounded-lg bg-white/10 px-3 py-1 text-sm font-medium">
                              × {laundryItem.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-white/15 p-6">
                      <h5 className="mb-5 font-semibold">
                        Status Timeline
                      </h5>

                      {item.statusHistory?.length === 0 ? (
                        <p className="text-sm text-white/50">
                          No status history available.
                        </p>
                      ) : (
                        <div className="space-y-5">
                          {item.statusHistory.map(
                            (history, index) => (
                              <div
                                key={index}
                                className="flex gap-4"
                              >
                                <div className="flex flex-col items-center">
                                  <div
                                    className={`h-3 w-3 rounded-full ${
                                      index ===
                                      item.statusHistory
                                        .length -
                                        1
                                        ? "bg-green-300"
                                        : "bg-white"
                                    } shadow-lg`}
                                  />

                                  {index <
                                    item.statusHistory.length -
                                      1 && (
                                    <div className="mt-2 h-full min-h-8 w-px bg-white/20" />
                                  )}
                                </div>

                                <div className="pb-2">
                                  <p className="font-medium">
                                    {statusLabels[
                                      history.status
                                    ] ||
                                      history.status}
                                  </p>

                                  <p className="mt-1 text-xs text-white/50">
                                    {new Date(
                                      history.changedAt
                                    ).toLocaleString()}
                                  </p>

                                  {history.remarks && (
                                    <p className="mt-1 text-sm text-white/65">
                                      {history.remarks}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}