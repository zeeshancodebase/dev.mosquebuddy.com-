"use client";

import { useState } from "react";

const SUPPORT_EMAIL = "support@mosquebuddy.app"; // TODO: replace with your real inbox
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; // TODO: point at your existing API config if you already have one (e.g. src/lib/api.js)

export default function DeleteAccountPage() {
  const [identifier, setIdentifier] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  async function handleSubmit(e) {
    e.preventDefault();
    if (!identifier.trim()) return;

    setStatus("sending");
    try {
      const res = await fetch(`${API_BASE_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "other",
          message: `ACCOUNT DELETION REQUEST\nRegistered email/phone: ${identifier}\nReason: ${reason || "Not provided"}`,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Delete Your Account</h1>
      <p className="text-sm text-gray-500 mb-10">
        You can request deletion of your MosqueBuddy account and all
        associated data at any time.
      </p>

      <Section title="Option 1 — In the app(Coming soon)">
        <p>Open MosqueBuddy → Profile → Account Settings → Delete Account.</p>
      </Section>

      <Section title="Option 2 — From this page">
        <p className="mb-4">
          If you no longer have the app installed, submit a request below
          instead.
        </p>

        {status === "sent" ? (
          <p className="rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3">
            Request received. We'll process your deletion request within 30
            days and confirm by email if you provided one.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Email or phone number used on your account
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="you@example.com or +91XXXXXXXXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Reason (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                rows={3}
              />
            </div>
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-md bg-emerald-700 text-white px-5 py-2 font-medium disabled:opacity-50"
            >
              {status === "sending" ? "Submitting..." : "Submit Deletion Request"}
            </button>
            {status === "error" && (
              <p className="text-red-600 text-sm">
                Something went wrong — please email{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
                  {SUPPORT_EMAIL}
                </a>{" "}
                directly instead.
              </p>
            )}
          </form>
        )}
      </Section>

      <Section title="What gets deleted">
        <p>
          We permanently delete your account, profile information, and any
          reports or suggestions tied to your identity. Processing takes up
          to 30 days.
        </p>
      </Section>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}