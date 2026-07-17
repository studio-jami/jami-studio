import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "Privacy Policy - Jami Studio hosted applications",
  description:
    "Privacy policy for Jami Studio hosted applications, apps, and browser extensions.",
  openGraph: {
    title: "Privacy Policy - Jami Studio hosted applications",
    description:
      "How Jami Studio hosted applications collect, use, share, and retain data.",
  },
};

const UPDATED_AT = "June 23, 2026";

function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border py-10">
      <h2 className="mb-4 font-serif text-2xl text-foreground">{title}</h2>
      <div className="space-y-4 text-base leading-7 text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

function ScopeCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-border bg-card p-5">
      <h3 className="mb-2 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-foreground">
        {title}
      </h3>
      <p className="m-0 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

const linkClassName =
  "font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-rose";

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-[820px] px-6 md:px-10 pt-32 pb-24">
        <header className="mb-10">
          <p className="mb-3 font-mono text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground">
            Privacy Policy
          </p>
          <h1 className="mb-5 font-serif text-[clamp(2.2rem,4.5vw,3.2rem)] leading-[0.98] tracking-tight text-foreground">
            Jami Studio hosted applications
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            This policy explains how Jami Studio collects, uses, shares, and
            retains data when it operates its hosted applications, hosted apps,
            demos, and official browser extensions.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Last updated: {UPDATED_AT}
          </p>
        </header>

        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <ScopeCard
            title="Hosted apps"
            body="Covered when Jami Studio operates a hosted service or app for you."
          />
          <ScopeCard
            title="Open source"
            body="Not covered for your use of the MIT-licensed source code itself."
          />
          <ScopeCard
            title="Self-hosted"
            body="Not covered for forks, customizations, or deployments operated by someone else."
          />
        </div>

        <Section title="Scope">
          <p>
            Jami Studio is open source, and the source code is available under
            the MIT license. This policy applies only to hosted applications and
            services operated by Jami Studio for its users. It does not apply to
            someone else&rsquo;s use of the code, including forks, customized
            apps, private deployments, or self-hosted versions. If you operate
            your own deployment, you are responsible for your own data practices
            and privacy policy.
          </p>
          <p>
            This policy is intended to supplement Jami Studio&rsquo;s broader{" "}
            <a
              href="https://www.jami.studio/legal/privacy"
              className={linkClassName}
            >
              Privacy Policy
            </a>{" "}
            for hosted application behavior.
          </p>
        </Section>

        <Section title="Information we collect">
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="border border-border p-5">
              <h3 className="mb-2 text-base font-semibold text-foreground">
                Account
              </h3>
              <p className="m-0 text-sm leading-6">
                Basic account details such as name, email, and authentication
                identifiers needed to sign in and use hosted apps.
              </p>
            </article>
            <article className="border border-border p-5">
              <h3 className="mb-2 text-base font-semibold text-foreground">
                Hosted content
              </h3>
              <p className="m-0 text-sm leading-6">
                Content you create or upload in hosted Jami Studio apps, such as
                recordings, transcripts, documents, comments, tasks, prompts,
                agent responses, files, and configuration.
              </p>
            </article>
            <article className="border border-border p-5">
              <h3 className="mb-2 text-base font-semibold text-foreground">
                Integrations
              </h3>
              <p className="m-0 text-sm leading-6">
                Data exchanged with providers you connect, according to your
                configuration and the provider&rsquo;s own terms.
              </p>
            </article>
            <article className="border border-border p-5">
              <h3 className="mb-2 text-base font-semibold text-foreground">
                Usage
              </h3>
              <p className="m-0 text-sm leading-6">
                Operational and diagnostic data used to run, secure, and improve
                the hosted service.
              </p>
            </article>
          </div>
        </Section>

        <Section
          id="clips-chrome-extension"
          title="Jami Studio Clips Chrome extension"
        >
          <p>
            The Jami Studio Clips Chrome extension helps you start browser-based
            recordings and, when enabled, attach browser diagnostics to a clip.
            It may collect the selected capture source, camera and microphone
            media you choose to include, the active tab title and URL, and
            authentication state needed to connect the extension to hosted
            Clips.
          </p>
          <p>
            Developer logs are optional. When enabled, the extension may collect
            redacted console messages, JavaScript exceptions, and fetch/XHR
            metadata such as method, URL, status, timing, and failure details
            from the selected tab while a recording is active. The extension is
            not designed to collect request bodies, response bodies, cookies, or
            authorization headers.
          </p>
          <p>
            For Chrome Web Store disclosures, use this section as the extension
            privacy-policy anchor:{" "}
            <code className="border border-border bg-background px-1.5 py-0.5 text-sm text-foreground">
              https://www.jami.studio/privacy#clips-chrome-extension
            </code>
            .
          </p>
        </Section>

        <Section title="How we use information">
          <ul className="m-0 list-disc space-y-2 pl-5">
            <li>
              Provide, sync, and operate hosted applications and their agent
              workflows.
            </li>
            <li>
              Transform, process, and store content you provide so features work
              as expected.
            </li>
            <li>
              Authenticate accounts, workspaces, and connected integrations.
            </li>
            <li>Support users and respond to requests.</li>
            <li>Comply with legal, security, and operational obligations.</li>
          </ul>
        </Section>

        <Section title="Sharing and third parties">
          <p>
            We do not sell hosted application data or use it for third-party
            advertising. We share data with service providers that help operate
            the hosted service, such as cloud infrastructure, storage,
            authentication, email, observability, AI, and transcription
            providers, when those services are needed for the feature you use.
          </p>
          <p>
            When you connect an integration, the hosted app may send data to or
            receive data from that provider according to your configuration and
            the provider&rsquo;s own terms. We may also disclose information
            when required for security, abuse prevention, legal compliance, or
            to protect users and the service.
          </p>
        </Section>

        <Section title="Chrome Web Store limited use">
          <p>
            For the Jami Studio Clips Chrome extension, our use of information
            received from Chrome extension APIs adheres to the Chrome Web Store
            User Data Policy, including the Limited Use requirements. Browser
            activity collected by the extension is used to provide the
            user-facing recording and diagnostics workflow, not for advertising,
            resale, credit-worthiness, or unrelated profiling.
          </p>
        </Section>

        <Section title="Retention and deletion">
          <p>
            We retain hosted application data for as long as needed to provide
            the service, maintain workspace history, comply with obligations,
            resolve disputes, or improve reliability and security. Users can
            delete clips, documents, resources, and other hosted app content
            through the relevant application controls where available.
          </p>
          <p>
            Deleted content may remain in backups, logs, or audit records for a
            limited period before it is removed according to operational
            retention schedules.
          </p>
        </Section>

        <Section title="Security">
          <p>
            We use reasonable administrative, technical, and organizational
            safeguards designed to protect hosted application data, including
            access controls, transport encryption, monitoring, and operational
            security practices. No online service can guarantee perfect
            security, so users should avoid including secrets or sensitive
            information in recordings or prompts unless they intend to share
            that information with the hosted application.
          </p>
        </Section>

        <Section title="Changes and contact">
          <p>
            We may update this policy as Jami Studio&rsquo;s hosted applications
            change. The updated date at the top of the page shows when the
            policy was last revised.
          </p>
          <p>
            For privacy requests or questions, contact Jami Studio through the
            support and privacy channels listed in the{" "}
            <a
              href="https://www.jami.studio/legal/privacy"
              className={linkClassName}
            >
              Jami Studio Privacy Policy
            </a>
            .
          </p>
        </Section>
      </main>
      <Footer />
    </>
  );
}
