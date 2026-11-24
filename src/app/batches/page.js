"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { canAccess } from "@/lib/roleAccess";

const statusLabels = {
  created: "Created",
  processing: "Processing",
  quality_check: "Quality Check",
  ready_for_pickup: "Ready for Pickup",
  completed: "Completed",
};

const nextStatus = {
  created: "processing",
  processing: "quality_check",
};

const statusColors = {
  created:
    "bg-blue-400/20 text-blue-100 border-blue-200/30",
  processing:
    "bg-yellow-400/20 text-yellow-100 border-yellow-200/30",
  quality_check:
    "bg-orange-400/20 text-orange-100 border-orange-200/30",
  ready_for_pickup:
    "bg-green-400/20 text-green-100 border-green-200/30",
  completed:
    "bg-white/10 text-white border-white/20",
};

const laundryStatusLabels = {
  batched: "Batched",
  processing: "Processing",
  quality_check: "Quality Check",
  ready_for_pickup: "Ready for Pickup",
  picked_up: "Picked Up",
  completed: "Completed",
};

export default function BatchesPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [laundry, setLaundry] = useState([]);
  const [batches, setBatches] = useState([]);

  const [selectedLaundry, setSelectedLaundry] = useState([]);
  const [remarks, setRemarks] = useState("");

  const [qualityRemarks, setQualityRemarks] = useState({});

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updatingBatch, setUpdatingBatch] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.push("/auth");
      return;
    }

    const currentUser = JSON.parse(storedUser);

    if (!canAccess(currentUser.role, "/batches")) {
      router.push("/dashboard");
      return;
    }

    setUser(currentUser);
    loadData();
  }, [router]);

  async function loadData() {
    try {
      const token = localStorage.getItem("token");

      const [laundryResponse, batchResponse] =
        await Promise.all([
          fetch("/api/laundry", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),

          fetch("/api/batches", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

      const laundryData = await laundryResponse.json();
      const batchData = await batchResponse.json();

      if (laundryResponse.ok) {
        setLaundry(laundryData.laundry || []);
      } else {
        setMessage(laundryData.message);
      }

      if (batchResponse.ok) {
        setBatches(batchData.batches || []);
      } else {
        setMessage(batchData.message);
      }
    } catch (error) {
      setMessage("Failed to load batch data.");
    } finally {
      setLoading(false);
    }
  }

  function toggleLaundry(laundryId) {
    setSelectedLaundry((current) =>
      current.includes(laundryId)
        ? current.filter((id) => id !== laundryId)
        : [...current, laundryId]
    );
  }

  async function createBatch() {
    if (selectedLaundry.length === 0) {
      setMessage("Select at least one laundry.");
      return;
    }

    setCreating(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/batches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          laundryIds: selectedLaundry,
          remarks,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setMessage("Batch created successfully.");

      setSelectedLaundry([]);
      setRemarks("");

      await loadData();
    } catch (error) {
      setMessage("Failed to create batch.");
    } finally {
      setCreating(false);
    }
  }

  async function updateBatchStatus(batch, status, batchRemarks = "") {
    setUpdatingBatch(batch._id);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/batches/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          batchId: batch._id,
          status,
          remarks: batchRemarks,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setMessage(
        `Batch ${batch.batchNumber} moved to ${statusLabels[status]}.`
      );

      if (status === "ready_for_pickup") {
        setQualityRemarks((current) => {
          const updated = { ...current };
          delete updated[batch._id];
          return updated;
        });
      }

      await loadData();
    } catch (error) {
      setMessage("Failed to update batch status.");
    } finally {
      setUpdatingBatch(null);
    }
  }

  function getBatchLaundry(batchId) {
    return laundry.filter(
      (item) =>
        item.batch &&
        item.batch._id === batchId
    );
  }

  function getTotalItems(batchLaundry) {
    return batchLaundry.reduce(
      (total, laundryItem) =>
        total +
        laundryItem.items.reduce(
          (itemTotal, item) =>
            itemTotal + Number(item.quantity || 0),
          0
        ),
      0
    );
  }

  function updateQualityRemarks(batchId, value) {
    setQualityRemarks((current) => ({
      ...current,
      [batchId]: value,
    }));
  }

  async function passQualityCheck(batch) {
    const remarksText =
      qualityRemarks[batch._id]?.trim() || "";

    if (!remarksText) {
      setMessage(
        "Please enter quality check remarks before passing the batch."
      );
      return;
    }

    await updateBatchStatus(
      batch,
      "ready_for_pickup",
      `Quality check passed: ${remarksText}`
    );
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

  const availableLaundry = laundry.filter(
    (item) =>
      item.status === "tag_verified" &&
      !item.batch
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-400 via-blue-500 to-indigo-700 text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-10">
          <p className="mb-3 text-sm font-medium tracking-[0.25em] text-white/60">
            OPERATIONS
          </p>

          <h2 className="text-4xl font-black tracking-tight md:text-5xl">
            Laundry Batches
          </h2>

          <p className="mt-3 text-lg text-white/70">
            Create batches, process laundry and complete quality checks.
          </p>
        </section>

        {message && (
          <div className="mb-6 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-sm text-white backdrop-blur-md">
            {message}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
            <div className="mb-6">
              <p className="text-sm text-white/60">
                TAG VERIFIED LAUNDRY
              </p>

              <h3 className="mt-2 text-2xl font-bold">
                Create New Batch
              </h3>

              <p className="mt-2 text-white/60">
                Only tag-verified laundry can be added.
              </p>
            </div>

            {availableLaundry.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/60">
                No tag-verified laundry is waiting for batching.
              </div>
            ) : (
              <div className="space-y-3">
                {availableLaundry.map((item) => (
                  <label
                    key={item._id}
                    className="flex cursor-pointer items-center gap-4 rounded-2xl border border-white/15 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLaundry.includes(item._id)}
                      onChange={() =>
                        toggleLaundry(item._id)
                      }
                      className="h-5 w-5"
                    />

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">
                          {item.tagId}
                        </p>

                        <span className="rounded-full bg-green-400/20 px-3 py-1 text-xs text-green-100">
                          Tag Verified
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-white/60">
                        Student:{" "}
                        {item.student?.name || "Unknown"}
                      </p>

                      <p className="mt-1 text-xs text-white/50">
                        {item.items?.length || 0} item type(s)
                        {" • "}
                        {item.items?.reduce(
                          (total, laundryItem) =>
                            total +
                            Number(
                              laundryItem.quantity || 0
                            ),
                          0
                        )}{" "}
                        clothes
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="mt-6">
              <label className="mb-2 block text-sm text-white/70">
                Batch Remarks
              </label>

              <textarea
                value={remarks}
                onChange={(e) =>
                  setRemarks(e.target.value)
                }
                placeholder="Optional batch remarks"
                rows={3}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-white/50"
              />
            </div>

            <button
              type="button"
              onClick={createBatch}
              disabled={
                creating ||
                selectedLaundry.length === 0
              }
              className="mt-5 w-full rounded-xl bg-white px-6 py-3 font-semibold text-indigo-700 shadow-lg transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating
                ? "Creating Batch..."
                : `Create Batch${
                    selectedLaundry.length > 0
                      ? ` (${selectedLaundry.length})`
                      : ""
                  }`}
            </button>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
            <div className="mb-6">
              <p className="text-sm text-white/60">
                BATCH WORKFLOW
              </p>

              <h3 className="mt-2 text-2xl font-bold">
                Processing Stages
              </h3>
            </div>

            <div className="space-y-4">
              {[
                "created",
                "processing",
                "quality_check",
                "ready_for_pickup",
                "completed",
              ].map((status, index) => (
                <div
                  key={status}
                  className="flex items-center gap-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold">
                    {index + 1}
                  </div>

                  <div>
                    <p className="font-semibold">
                      {statusLabels[status]}
                    </p>

                    {status === "quality_check" && (
                      <p className="mt-1 text-xs text-white/50">
                        Staff verifies laundry quality before pickup.
                      </p>
                    )}

                    {status === "ready_for_pickup" && (
                      <p className="mt-1 text-xs text-green-100/70">
                        Students can confirm pickup.
                      </p>
                    )}

                    {index < 4 && (
                      <div className="mt-2 h-4 w-px bg-white/20" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
          <div className="mb-6">
            <p className="text-sm text-white/60">
              ACTIVE BATCHES
            </p>

            <h3 className="mt-2 text-2xl font-bold">
              Batch Management
            </h3>
          </div>

          {batches.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/60">
              No batches created yet.
            </div>
          ) : (
            <div className="space-y-6">
              {batches.map((batch) => {
                const next = nextStatus[batch.status];

                const batchLaundry = getBatchLaundry(
                  batch._id
                );

                const totalItems =
                  getTotalItems(batchLaundry);

                const pickedUpCount =
                  batchLaundry.filter(
                    (item) =>
                      item.status === "picked_up" ||
                      item.status === "completed"
                  ).length;

                return (
                  <div
                    key={batch._id}
                    className="rounded-3xl border border-white/15 bg-white/5 p-6"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="text-2xl font-bold">
                            {batch.batchNumber}
                          </h4>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${
                              statusColors[batch.status] ||
                              "border-white/20 bg-white/10"
                            }`}
                          >
                            {statusLabels[batch.status] ||
                              batch.status}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-white/50">
                          Created by{" "}
                          {batch.createdBy?.name ||
                            "Unknown"}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:min-w-64">
                        <div className="rounded-xl bg-white/5 p-3">
                          <p className="text-xs text-white/50">
                            Requests
                          </p>

                          <p className="mt-1 text-xl font-bold">
                            {batch.laundryCount}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white/5 p-3">
                          <p className="text-xs text-white/50">
                            Clothes
                          </p>

                          <p className="mt-1 text-xl font-bold">
                            {totalItems}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h5 className="text-lg font-bold">
                            Laundry in This Batch
                          </h5>

                          <p className="text-sm text-white/50">
                            {pickedUpCount} of{" "}
                            {batchLaundry.length} requests
                            picked up
                          </p>
                        </div>
                      </div>

                      {batchLaundry.length === 0 ? (
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/50">
                          Laundry details are not available
                          for this batch.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {batchLaundry.map(
                            (laundryItem) => (
                              <div
                                key={laundryItem._id}
                                className="rounded-2xl border border-white/10 bg-white/5 p-4"
                              >
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="font-semibold">
                                        {
                                          laundryItem.tagId
                                        }
                                      </p>

                                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs">
                                        {laundryStatusLabels[
                                          laundryItem.status
                                        ] ||
                                          laundryItem.status}
                                      </span>
                                    </div>

                                    <p className="mt-1 text-sm text-white/50">
                                      Student:{" "}
                                      {laundryItem
                                        .student
                                        ?.name ||
                                        "Unknown"}
                                    </p>

                                    <p className="mt-1 text-xs text-white/40">
                                      {
                                        laundryItem
                                          .student
                                          ?.email
                                      }
                                    </p>
                                  </div>

                                  <p className="text-xs text-white/40">
                                    Submitted{" "}
                                    {new Date(
                                      laundryItem.createdAt
                                    ).toLocaleDateString()}
                                  </p>
                                </div>

                                <div className="mt-4 grid gap-2 md:grid-cols-2">
                                  {laundryItem.items.map(
                                    (item) => (
                                      <div
                                        key={item._id}
                                        className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
                                      >
                                        <div>
                                          <p className="text-sm font-medium">
                                            {item.name}
                                          </p>

                                          {item.description && (
                                            <p className="mt-1 text-xs text-white/40">
                                              {
                                                item.description
                                              }
                                            </p>
                                          )}
                                        </div>

                                        <span className="rounded-lg bg-white/10 px-3 py-1 text-xs font-semibold">
                                          ×{" "}
                                          {item.quantity}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    {batch.remarks && (
                      <div className="mt-5 rounded-xl bg-white/5 p-4">
                        <p className="text-xs text-white/50">
                          Batch Remarks
                        </p>

                        <p className="mt-1 text-sm text-white/80">
                          {batch.remarks}
                        </p>
                      </div>
                    )}

                    {batch.status === "quality_check" && (
                      <div className="mt-5 rounded-2xl border border-orange-200/20 bg-orange-400/10 p-5">
                        <p className="font-semibold text-orange-100">
                          Quality Check Required
                        </p>

                        <p className="mt-1 text-sm text-orange-100/60">
                          Verify that the laundry is clean,
                          complete and ready for student pickup.
                        </p>

                        <textarea
                          value={
                            qualityRemarks[batch._id] || ""
                          }
                          onChange={(e) =>
                            updateQualityRemarks(
                              batch._id,
                              e.target.value
                            )
                          }
                          placeholder="Enter quality check remarks..."
                          rows={3}
                          className="mt-4 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-white/50"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            passQualityCheck(batch)
                          }
                          disabled={
                            updatingBatch === batch._id
                          }
                          className="mt-4 w-full rounded-xl bg-green-300 px-5 py-3 font-semibold text-green-950 transition hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updatingBatch === batch._id
                            ? "Completing Quality Check..."
                            : "Pass Quality Check & Ready for Pickup"}
                        </button>
                      </div>
                    )}

                    {next && (
                      <button
                        type="button"
                        onClick={() =>
                          updateBatchStatus(
                            batch,
                            next
                          )
                        }
                        disabled={
                          updatingBatch === batch._id
                        }
                        className="mt-5 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updatingBatch === batch._id
                          ? "Updating..."
                          : `Move to ${statusLabels[next]}`}
                      </button>
                    )}

                    {batch.status ===
                      "ready_for_pickup" && (
                      <div className="mt-5 rounded-xl border border-green-200/20 bg-green-400/10 px-4 py-4">
                        <p className="font-semibold text-green-100">
                          Ready for Student Pickup
                        </p>

                        <p className="mt-1 text-sm text-green-100/60">
                          {pickedUpCount} of{" "}
                          {batchLaundry.length} laundry
                          requests have been picked up.
                        </p>

                        <p className="mt-1 text-sm text-green-100/60">
                          Students must confirm pickup before
                          the batch can be completed.
                        </p>
                      </div>
                    )}

                    {batch.status === "completed" && (
                      <div className="mt-5 rounded-xl border border-green-200/20 bg-green-400/10 px-4 py-3 text-center text-sm text-green-100">
                        Batch workflow completed
                      </div>
                    )}
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