import type { Metadata } from "next";
import { Suspense } from "react";

import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { SignupForm } from "@/components/signup-form";

export const metadata: Metadata = {
  title: "Sign up — Jami Studio",
  description:
    "Get early access, join the community, or stay informed with the latest Jami Studio releases.",
  openGraph: {
    title: "Sign up — Jami Studio",
    description:
      "Get early access, join the community, or stay informed with the latest releases.",
  },
};

export default function SignupPage() {
  return (
    <>
      <Nav />
      <main className="pt-32 pb-24">
        <div className="mx-auto max-w-2xl px-6 md:px-10">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground mb-6">
            Sign up
          </p>
          <h1 className="font-serif text-[clamp(2.2rem,4.5vw,3.2rem)] leading-[0.98] tracking-tight text-foreground mb-6">
            Join Jami Studio
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-xl mb-14">
            Get early access, join the community, or stay informed with the
            latest releases. One form, your lanes — no account required.
          </p>

          <Suspense>
            <SignupForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
