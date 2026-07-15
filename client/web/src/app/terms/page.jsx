export const metadata = {
  title: "Terms of Use — MosqueBuddy",
};

const SUPPORT_EMAIL = "support@mosquebuddy.app"; // TODO: replace with your real inbox
const LAST_UPDATED = "July 14, 2026";

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Terms of Use</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: {LAST_UPDATED}</p>

      <Section title="Using MosqueBuddy">
        <p>
          MosqueBuddy provides mosque and prayer venue information, including
          community- and admin-submitted timings. By using the app, you agree
          to these terms.
        </p>
      </Section>

      <Section title="Accuracy of Timings">
        <p>
          Prayer and Jumu'ah timings are sourced from mosque admins, trusted
          volunteers, and community reports, and are marked with a
          verification status to reflect their reliability. We do our best to
          keep this accurate, but timings can change without notice — for
          anything time-critical, especially Jumu'ah, please confirm directly
          with the mosque where possible.
        </p>
      </Section>

      <Section title="Your Submissions">
        <p>
          When you report a timing correction or suggest a mosque, you
          confirm the information is accurate to your knowledge. We review
          submissions before they affect public data.
        </p>
      </Section>

      <Section title="Limitation of Liability">
        <p>
          MosqueBuddy is provided as-is. We are not liable for missed prayers
          or inconvenience arising from inaccurate or outdated information
          submitted by third parties.
        </p>
      </Section>

      <Section title="Changes">
        <p>We may update these terms as the app evolves.</p>
      </Section>

      <Section title="Contact">
        <p>
          Questions? Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-emerald-700 underline">
            {SUPPORT_EMAIL}
          </a>.
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