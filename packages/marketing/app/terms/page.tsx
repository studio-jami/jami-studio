import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "Terms of Service - Jami Studio hosted applications",
  description:
    "Terms of Service for Jami Studio hosted applications, apps, demos, and official hosted services.",
  openGraph: {
    title: "Terms of Service - Jami Studio hosted applications",
    description:
      "The terms that apply when Jami Studio operates its hosted applications and app services.",
  },
};

const UPDATED_AT = "June 24, 2026";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-border py-10">
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

function InlineLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-rose"
    >
      {children}
    </a>
  );
}

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-[820px] px-6 md:px-10 pt-32 pb-24">
        <header className="mb-10">
          <p className="mb-3 font-mono text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground">
            Terms of Service
          </p>
          <h1 className="mb-5 font-serif text-[clamp(2.2rem,4.5vw,3.2rem)] leading-[0.98] tracking-tight text-foreground">
            Jami Studio hosted applications
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            These terms apply when Jami Studio operates its hosted applications,
            hosted apps, demos, and official hosted services for you.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Last updated: {UPDATED_AT}
          </p>
        </header>

        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <ScopeCard
            title="Hosted apps"
            body="Covered when you use a Jami Studio app or template operated by Jami Studio."
          />
          <ScopeCard
            title="Open source"
            body="The MIT-licensed source code remains available under its open-source license."
          />
          <ScopeCard
            title="Self-hosted"
            body="Separate deployments operated by you or someone else are not Jami Studio hosted services."
          />
        </div>

        <Section title="Scope and related terms">
          <p>
            Jami Studio is open source, and its source code is available under
            the MIT license. These terms apply only to hosted applications and
            services operated by Jami Studio for its users. They do not govern
            forks, custom apps, private deployments, or self-hosted versions
            operated outside Jami Studio.
          </p>
          <p>
            These terms supplement Jami Studio&rsquo;s broader{" "}
            <InlineLink href="https://www.jami.studio/legal/terms">
              Terms of Service
            </InlineLink>{" "}
            and the Jami Studio{" "}
            <InlineLink href="/privacy">Privacy Policy</InlineLink>. If you use
            a hosted Jami Studio app on behalf of a company or organization, you
            represent that you have authority to accept these terms for that
            organization.
          </p>
        </Section>

        <Section title="Hosted service">
          <p>
            Jami Studio may provide hosted applications, apps, demos, shared
            workspaces, browser extensions, and related agent workflows. The
            hosted service may be updated, limited, suspended, or discontinued
            as the product evolves.
          </p>
          <ul className="m-0 list-disc space-y-2 pl-5">
            <li>Create and operate hosted Jami Studio workspaces and apps.</li>
            <li>
              Run agent workflows, actions, automations, and integrations you
              choose to use.
            </li>
            <li>
              Store hosted app content, settings, organization data, and
              connected-account state needed to provide the service.
            </li>
            <li>Measure, secure, debug, and improve hosted services.</li>
          </ul>
        </Section>

        <Section title="Accounts and workspaces">
          <p>
            You are responsible for the accuracy of account information,
            activity under your account, and keeping credentials secure. Hosted
            apps may include organization features, invitations, shared
            resources, connected integrations, and app-specific access controls.
            Only invite users and connect services you are authorized to use.
          </p>
          <p>
            If you believe an account, workspace, integration, or shared
            resource has been compromised or misused, contact Jami Studio
            support promptly.
          </p>
        </Section>

        <Section title="Your content and permissions">
          <p>
            You retain ownership of content you create, upload, record, import,
            or connect to hosted apps. You grant Jami Studio the limited
            permission needed to host, process, transmit, display, transform,
            analyze, and store that content so the hosted app and its agent
            workflows can operate.
          </p>
          <p>
            You are responsible for having the rights and permissions needed for
            content, recordings, prompts, files, credentials, and connected
            integration data you provide to the service.
          </p>
        </Section>

        <Section title="Agents, AI outputs, and integrations">
          <p>
            Hosted apps can run AI agents, tools, automations, and provider
            integrations at your request. AI-generated output may be incomplete,
            inaccurate, or unsuitable for a particular use. Review important
            outputs, actions, exports, and messages before relying on them.
          </p>
          <p>
            When you connect third-party services, your use of those services
            remains subject to their own terms, limits, permissions, and privacy
            practices.
          </p>
        </Section>

        <Section title="Acceptable use">
          <ul className="m-0 list-disc space-y-2 pl-5">
            <li>
              Do not use hosted apps to violate laws, infringe rights, or harm
              people or systems.
            </li>
            <li>
              Do not attempt to bypass access controls, rate limits, security
              boundaries, or tenant isolation.
            </li>
            <li>
              Do not upload malware, credential theft material, or content
              designed to disrupt the service.
            </li>
            <li>
              Do not use the service to send spam, scrape without authorization,
              or abuse connected providers.
            </li>
            <li>
              Do not put secrets or sensitive regulated data into hosted apps
              unless you are authorized and the app is appropriate for that use.
            </li>
          </ul>
        </Section>

        <Section title="Open source and self-hosting">
          <p>
            These terms do not change the open-source license for Jami
            Studio&rsquo;s code. If you download, fork, modify, or self-host it,
            the MIT license and the terms you set for your own deployment govern
            that use. You are responsible for security, privacy, compliance,
            operations, and user support for deployments you operate.
          </p>
        </Section>

        <Section title="Suspension and termination">
          <p>
            Jami Studio may suspend or restrict access to hosted services when
            needed to protect users, comply with law, prevent abuse, address
            security risk, or operate the service. You may stop using the hosted
            service at any time. Some data may remain in backups, logs, or audit
            records for a limited period as described in the{" "}
            <InlineLink href="/privacy">Privacy Policy</InlineLink>.
          </p>
        </Section>

        <Section title="Disclaimers and liability">
          <p>
            Hosted services are provided on an as-is and as-available basis,
            subject to applicable law and any separate written agreement you
            have with Jami Studio. Jami Studio does not guarantee that hosted
            apps, integrations, automations, or AI outputs will be
            uninterrupted, error-free, or meet every requirement.
          </p>
          <p>
            To the maximum extent permitted by law, Jami Studio&rsquo;s
            liability for its hosted services is limited as described in Jami
            Studio&rsquo;s broader{" "}
            <InlineLink href="https://www.jami.studio/legal/terms">
              Terms of Service
            </InlineLink>{" "}
            or another written agreement that applies to your use.
          </p>
        </Section>

        <Section title="Changes and contact">
          <p>
            We may update these terms as Jami Studio&rsquo;s hosted applications
            change. The updated date at the top of the page shows when the terms
            were last revised.
          </p>
          <p>
            For questions about these terms, contact Jami Studio through the
            support channels listed in its{" "}
            <InlineLink href="https://www.jami.studio/legal/terms">
              Terms of Service
            </InlineLink>
            .
          </p>
        </Section>
      </main>
      <Footer />
    </>
  );
}
