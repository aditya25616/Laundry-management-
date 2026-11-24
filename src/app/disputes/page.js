"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

const disputeTypes = [
  {
    value: "missing_item",
    label: "Missing Item",
  },
  {
    value: "damaged_item",
    label: "Damaged Item",
  },
  {
    value: "wrong_item",
    label: "Wrong Item",
  },
  {
    value: "wrong_quantity",
    label: "Wrong Quantity",
  },
  {
    value: "other",
    label: "Other",
  },
];

const disputeStatusLabels = {
  open: "Open",
  under_review: "Under Review",
  resolved: "Resolved",
  rejected: "Rejected",
};

const disputeStatusColors = {
  open: "bg-yellow-400/20 text-yellow-100 border-yellow-200/30",
  under_review: "bg-blue-400/20 text-blue-100 border-blue-200/30",
  resolved: "bg-green-400/20 text-green-100 border-green-200/30",
  rejected: "bg-red-400/20 text-red-100 border-red-200/30",
};

export default function DisputesPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [laundry, setLaundry] = useState([]);
  const [disputes, setDisputes] = useState([]);

  const [laundryId, setLaundryId] = useState("");
  const [type, setType] = useState("missing_item");
  const [description, setDescription] = useState("");

  const [resolutionText, setResolutionText] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.push("/auth");
      return;
    }

    const currentUser = JSON.parse(storedUser);

    if (
      currentUser.role !== "student" &&
      currentUser.role !== "staff" &&
      currentUser.role !== "admin"
    ) {
      router.push("/dashboard");
      return;
    }

    setUser(currentUser);
    loadData(currentUser.role);
  }, [router]);

  async function loadData(role) {
    try {
      const token = localStorage.getItem("token");

      const disputeResponse = await fetch("/api/disputes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const disputeData = await disputeResponse.json();

      if (disputeResponse.ok) {
        setDisputes(disputeData.disputes || []);
      } else {
        setMessage(disputeData.message);
      }

      if (role === "student") {
        const laundryResponse = await fetch("/api/laundry", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const laundryData = await laundryResponse.json();

        if (laundryResponse.ok) {
          setLaundry(laundryData.laundry || []);
        } else {
          setMessage(laundryData.message);
        }
      }
    } catch (error) {
      setMessage("Failed to load dispute data.");
    } finally {
      setLoading(false);
    }
  }

  async function submitDispute(e) {
    e.preventDefault();

    if (!laundryId) {
      setMessage("Please select a laundry request.");
      return;
    }

    if (!description.trim()) {
      setMessage("Please describe the problem.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/disputes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          laundryId,
          type,
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setMessage("Dispute submitted successfully.");

      setLaundryId("");
      setType("missing_item");
      setDescription("");

      await loadData("student");
    } catch (error) {
      setMessage("Failed to submit dispute.");
    } finally {
      setSubmitting(false);
    }
  }

  function updateResolutionText(disputeId, value) {
    setResolutionText((current) => ({
      ...current,
      [disputeId]: value,
    }));
  }

  async function updateDispute(disputeId, status) {
    if (
      (status === "resolved" || status === "rejected") &&
      !resolutionText[disputeId]?.trim()
    ) {
      setMessage(
        "Please enter a resolution before completing the dispute."
      );
      return;
    }

    setUpdatingId(disputeId);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/disputes", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          disputeId,
          status,
          resolution: resolutionText[disputeId] || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setMessage("Dispute updated successfully.");

      await loadData(user.role);
    } catch (error) {
      setMessage("Failed to update dispute.");
    } finally {
      setUpdatingId(null);
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

  const isStudent = user.role === "student";
  const isStaff = user.role === "staff";
  const isAdmin = user.role === "admin";

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-400 via-blue-500 to-indigo-700 text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-10">
          <p className="mb-3 text-sm font-medium tracking-[0.25em] text-white/60">
            DISPUTE MANAGEMENT
          </p>

          <h2 className="text-4xl font-black tracking-tight md:text-5xl">
            {isStudent ? "My Disputes" : "Dispute Management"}
          </h2>

          <p className="mt-3 text-lg text-white/70">
            {isStudent
              ? "Report laundry problems and track their resolution."
              : "Review student disputes and manage their resolution."}
          </p>
        </section>

        {message && (
          <div className="mb-6 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-sm backdrop-blur-md">
            {message}
          </div>
        )}

        {isStudent && (
          <section className="mb-10 overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-md">
            <div className="border-b border-white/15 px-6 py-6 md:px-8">
              <p className="text-sm text-white/60">
                REPORT A PROBLEM
              </p>

              <h3 className="mt-2 text-2xl font-bold">
                Raise a Dispute
              </h3>

              <p className="mt-2 text-white/65">
                Select the laundry request and explain the issue.
              </p>
            </div>

            <form
              onSubmit={submitDispute}
              className="space-y-6 p-6 md:p-8"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Laundry Request
                </label>

                <select
                  value={laundryId}
                  onChange={(e) => setLaundryId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/20 bg-indigo-500/30 px-4 py-3 text-white outline-none focus:border-white/50"
                >
                  <option value="" className="text-black">
                    Select laundry request
                  </option>

                  {laundry.map((item) => (
                    <option
                      key={item._id}
                      value={item._id}
                      className="text-black"
                    >
                      {item.tagId} -{" "}
                      {item.status.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Problem Type
                </label>

                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-indigo-500/30 px-4 py-3 text-white outline-none focus:border-white/50"
                >
                  {disputeTypes.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                      className="text-black"
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Describe the Problem
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Explain what happened..."
                  rows={5}
                  required
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-white/50"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-white px-6 py-3 font-semibold text-indigo-700 shadow-lg transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Submitting Dispute..."
                  : "Submit Dispute"}
              </button>
            </form>
          </section>
        )}

        <section>
          <div className="mb-5">
            <h3 className="text-2xl font-bold">
              {isStudent
                ? "Dispute History"
                : "Student Disputes"}
            </h3>

            <p className="mt-1 text-white/65">
              {isStudent
                ? "Track the status of your reported problems."
                : "Review and resolve reported laundry problems."}
            </p>
          </div>

          {disputes.length === 0 ? (
            <div className="rounded-3xl border border-white/20 bg-white/10 p-10 text-center backdrop-blur-md">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl">
                !
              </div>

              <h4 className="text-xl font-semibold">
                No disputes
              </h4>

              <p className="mt-2 text-white/60">
                {isStudent
                  ? "Your submitted disputes will appear here."
                  : "Student disputes will appear here."}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {disputes.map((dispute) => (
                <div
                  key={dispute._id}
                  className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-md"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-xl font-bold">
                          {dispute.type
                            .replaceAll("_", " ")
                            .replace(/^./, (letter) =>
                              letter.toUpperCase()
                            )}
                        </h4>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${
                            disputeStatusColors[
                              dispute.status
                            ] ||
                            "border-white/20 bg-white/10"
                          }`}
                        >
                          {disputeStatusLabels[
                            dispute.status
                          ] || dispute.status}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-white/60">
                        Tag ID:{" "}
                        <span className="font-semibold text-white/90">
                          {dispute.laundry?.tagId ||
                            "Unknown"}
                        </span>
                      </p>

                      {!isStudent && (
                        <>
                          <p className="mt-1 text-sm text-white/60">
                            Student:{" "}
                            <span className="font-semibold text-white/90">
                              {dispute.student?.name ||
                                "Unknown"}
                            </span>
                          </p>

                          <p className="mt-1 text-sm text-white/60">
                            Email:{" "}
                            <span className="font-semibold text-white/90">
                              {dispute.student?.email ||
                                "Unknown"}
                            </span>
                          </p>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-white/50">
                      {new Date(
                        dispute.createdAt
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-white/50">
                      Problem
                    </p>

                    <p className="mt-2 text-white/85">
                      {dispute.description}
                    </p>
                  </div>

                  {isStaff || isAdmin ? (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="text-sm font-semibold">
                        Dispute Actions
                      </p>

                      <textarea
                        value={
                          resolutionText[dispute._id] || ""
                        }
                        onChange={(e) =>
                          updateResolutionText(
                            dispute._id,
                            e.target.value
                          )
                        }
                        placeholder="Enter review or resolution remarks..."
                        rows={3}
                        className="mt-4 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-white/50"
                      />

                      <div className="mt-4 flex flex-wrap gap-3">
                        {dispute.status === "open" && (
                          <button
                            type="button"
                            disabled={
                              updatingId === dispute._id
                            }
                            onClick={() =>
                              updateDispute(
                                dispute._id,
                                "under_review"
                              )
                            }
                            className="rounded-xl bg-blue-300 px-5 py-3 font-semibold text-blue-950 transition hover:bg-blue-200 disabled:opacity-50"
                          >
                            {updatingId === dispute._id
                              ? "Updating..."
                              : "Start Review"}
                          </button>
                        )}

                        {dispute.status !== "resolved" &&
                          dispute.status !== "rejected" && (
                            <>
                              <button
                                type="button"
                                disabled={
                                  updatingId ===
                                  dispute._id
                                }
                                onClick={() =>
                                  updateDispute(
                                    dispute._id,
                                    "resolved"
                                  )
                                }
                                className="rounded-xl bg-green-300 px-5 py-3 font-semibold text-green-950 transition hover:bg-green-200 disabled:opacity-50"
                              >
                                Resolve
                              </button>

                              <button
                                type="button"
                                disabled={
                                  updatingId ===
                                  dispute._id
                                }
                                onClick={() =>
                                  updateDispute(
                                    dispute._id,
                                    "rejected"
                                  )
                                }
                                className="rounded-xl bg-red-300 px-5 py-3 font-semibold text-red-950 transition hover:bg-red-200 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                      </div>
                    </div>
                  ) : null}

                  {dispute.resolution && (
                    <div className="mt-4 rounded-2xl border border-green-200/20 bg-green-400/10 p-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-green-100/60">
                        Resolution
                      </p>

                      <p className="mt-2 text-green-50">
                        {dispute.resolution}
                      </p>

                      {dispute.handledBy?.name && (
                        <p className="mt-2 text-xs text-green-100/50">
                          Handled by{" "}
                          {dispute.handledBy.name}
                        </p>
                      )}

                      {dispute.resolvedAt && (
                        <p className="mt-1 text-xs text-green-100/50">
                          Updated{" "}
                          {new Date(
                            dispute.resolvedAt
                          ).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}