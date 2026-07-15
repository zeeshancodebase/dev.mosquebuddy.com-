export const metadata = {
  title: "Privacy Policy — MosqueBuddy",
  description: "How MosqueBuddy collects, uses, and protects your data.",
};

const SUPPORT_EMAIL = "support@mosquebuddy.app"; // TODO: replace with your real inbox
const LAST_UPDATED = "July 14, 2026";

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: {LAST_UPDATED}</p>

      <Section title="Overview">
        <p>
          MosqueBuddy ("we", "us", "our") helps Muslims find nearby mosques and
          prayer venues, along with daily prayer and Jumu'ah timings. This
          policy explains what information we collect through the MosqueBuddy
          mobile app and this website, and how we use it.
        </p>
      </Section>

      <Section title="Information We Collect">
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Account information:</strong> your name, and either your
            email address or phone number, when you create an account.
            Your password is stored in encrypted (hashed) form — we never
            store or have access to your plain-text password.
          </li>
          <li>
            <strong>Location:</strong> if you grant location permission, we
            use your device's location to show you nearby mosques and sort
            results by distance. This is used live, on request, and is not
            permanently stored linked to your account.
          </li>
          <li>
            <strong>Content you submit:</strong> timing correction reports,
            missing-mosque suggestions, and any optional notes you include
            with them.
          </li>
          <li>
            <strong>Basic technical information:</strong> standard
            information needed to operate the app securely, such as device
            platform (Android/iOS).
          </li>
        </ul>
      </Section>

      <Section title="How We Use Your Information">
        <ul className="list-disc pl-6 space-y-2">
          <li>To create and secure your account, and let you log in.</li>
          <li>To show you nearby mosques and relevant prayer timings.</li>
          <li>
            To review and act on timing reports and mosque suggestions you
            submit.
          </li>
          <li>To respond if you contact us for support.</li>
        </ul>
        <p className="mt-2">
          We do not sell your data, and we do not use it for advertising.
        </p>
      </Section>

      <Section title="Where Your Data Is Stored">
        <p>
          Your data is stored on Supabase's managed PostgreSQL infrastructure,
          which we use as our database and file storage provider. Supabase
          processes data on our behalf and does not use it for its own
          purposes.
        </p>
      </Section>

      <Section title="Your Rights, Including Account Deletion">
        <p>
          You can request deletion of your account and associated data at any
          time. See our{" "}
          <a href="/delete-account" className="text-emerald-700 underline">
            Account Deletion
          </a>{" "}
          page for how to do this, both in the app and on the web.
        </p>
      </Section>

      <Section title="Children's Privacy">
        <p>
          MosqueBuddy is not directed at children under 13, and we do not
          knowingly collect data from children under 13.
        </p>
      </Section>

      <Section title="Security">
        <p>
          We take reasonable technical measures to protect your data,
          including encrypted password storage and access controls on our
          backend. No system is perfectly secure, and we continue improving
          these protections as MosqueBuddy grows.
        </p>
      </Section>

      <Section title="Changes to This Policy">
        <p>
          We may update this policy as MosqueBuddy adds features. Material
          changes will be reflected by updating the "Last updated" date above.
        </p>
      </Section>

      <Section title="Contact Us">
        <p>
          Questions about this policy or your data? Reach us at{" "}
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