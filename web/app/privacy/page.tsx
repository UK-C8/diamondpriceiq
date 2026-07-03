import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Notice — DiamondPrice IQ",
  description: "How DiamondPrice IQ collects, uses, and protects your data. DPDP, GDPR, and CCPA compliant.",
  robots: { index: false },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-base font-bold text-gray-900">{title}</h2>
      <div className="text-sm text-gray-700 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded"
      >
        ← Back to estimator
      </Link>

      <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900">Privacy Notice</h1>
      <p className="mb-2 text-sm text-gray-500">
        Effective date: 3 July 2026 · Last updated: 3 July 2026
      </p>
      <p className="mb-8 text-sm text-gray-500">
        This notice explains how <strong>Centr8 LLP</strong> (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;),
        operator of <strong>DiamondPrice IQ</strong> (diamondpriceiq.com), collects, uses, and
        protects your personal data. We comply with India&apos;s <strong>Digital Personal Data
        Protection Act 2023 (DPDP)</strong>, the EU/UK <strong>General Data Protection Regulation
        (GDPR)</strong>, and the <strong>California Consumer Privacy Act (CCPA)</strong>.
      </p>

      <Section title="1. What data we collect">
        <p>
          <strong>Anonymised usage data (always):</strong> When you use the price estimator, we log the
          diamond parameters you enter (carat, cut, color, clarity, and optional fields), the price
          band returned, response latency, and a random session identifier. <em>This log contains no
          personally identifiable information.</em>
        </p>
        <p>
          <strong>Email address (only with your explicit consent):</strong> If you choose to download a
          branded PDF report, we ask for your email address and display a clear consent checkbox.
          We store your email address solely to fulfil that request and, if you tick the optional
          updates checkbox, to send occasional product news. We never sell your email address.
        </p>
      </Section>

      <Section title="2. Legal basis for processing">
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li><strong>Anonymised query logs:</strong> Legitimate interests (model accuracy monitoring, abuse prevention, analytics).</li>
          <li><strong>Email address:</strong> Your explicit, freely-given consent (DPDP §6; GDPR Art. 6(1)(a); CCPA §1798.100).</li>
        </ul>
      </Section>

      <Section title="3. How we use your data">
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li>Deliver the PDF report to your email inbox.</li>
          <li>Send occasional DiamondPrice IQ product updates (only if you consented).</li>
          <li>Aggregate and anonymised analytics to improve model accuracy and site performance.</li>
          <li>Detect and prevent abuse of our free API.</li>
        </ul>
        <p>
          We do <strong>not</strong> use your data for advertising, profiling, or re-sale to third parties.
        </p>
      </Section>

      <Section title="4. Data retention">
        <p>
          <strong>Anonymised query logs</strong> are retained for up to 24 months for model
          retraining and then deleted or aggregated into summary statistics.
        </p>
        <p>
          <strong>Email addresses</strong> are retained until you withdraw consent or request deletion,
          whichever comes first.
        </p>
      </Section>

      <Section title="5. Your rights">
        <p>You have the right to:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li><strong>Access</strong> the personal data we hold about you.</li>
          <li><strong>Correct</strong> inaccurate data.</li>
          <li><strong>Delete</strong> your data (&quot;right to erasure&quot; / &quot;right to be forgotten&quot;).</li>
          <li><strong>Withdraw consent</strong> for email communications at any time (unsubscribe link in every email).</li>
          <li><strong>Opt out of sale</strong> (we do not sell data, but CCPA requires we state this).</li>
          <li><strong>Lodge a complaint</strong> with your local data protection authority.</li>
        </ul>
        <p>
          To exercise any of these rights, email us at{" "}
          <a href="mailto:privacy@centr8.in" className="underline text-amber-700 hover:text-amber-800">
            privacy@centr8.in
          </a>{" "}
          with the subject line <em>&quot;Data request&quot;</em>. We will respond within 30 days.
        </p>
      </Section>

      <Section title="6. Deletion-on-request">
        <p>
          To have your email address and any associated records permanently deleted, email{" "}
          <a href="mailto:privacy@centr8.in" className="underline text-amber-700 hover:text-amber-800">
            privacy@centr8.in
          </a>{" "}
          with subject <em>&quot;Delete my data&quot;</em>. We will confirm deletion within 30 days.
          Anonymised aggregate logs (which contain no identifying information) are not subject to deletion requests.
        </p>
      </Section>

      <Section title="7. Cookies and local storage">
        <p>
          DiamondPrice IQ does not use tracking cookies. We use <strong>Google Analytics 4</strong> for
          anonymous page-view and event analytics. GA4 may set cookies in your browser; you can opt
          out via your browser settings or the{" "}
          <a
            href="https://tools.google.com/dlpage/gaoptout"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-amber-700 hover:text-amber-800"
          >
            Google Analytics opt-out browser add-on
          </a>.
        </p>
      </Section>

      <Section title="8. Third-party services">
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li><strong>Google Analytics 4</strong> — anonymised usage analytics (data processed in the EU/US per Google&apos;s DPA).</li>
          <li><strong>Vercel</strong> — web hosting (data processed in accordance with Vercel&apos;s DPA).</li>
          <li><strong>CRM webhook</strong> — if configured, consented email leads are forwarded to Centr8&apos;s internal CRM. No third-party marketing platforms receive your data without separate consent.</li>
        </ul>
      </Section>

      <Section title="9. Security">
        <p>
          All data is transmitted over HTTPS. Our API enforces rate limiting and input validation.
          We do not store payment information. Anonymised logs are stored in a private database
          accessible only to authorised Centr8 engineers.
        </p>
      </Section>

      <Section title="10. Contact">
        <p>
          <strong>Centr8 LLP</strong><br />
          Surat, Gujarat, India<br />
          Email:{" "}
          <a href="mailto:privacy@centr8.in" className="underline text-amber-700 hover:text-amber-800">
            privacy@centr8.in
          </a>
        </p>
      </Section>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
        >
          Back to estimator →
        </Link>
      </div>
    </div>
  );
}
