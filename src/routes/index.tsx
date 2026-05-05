import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Cpu, Rocket, Sparkles, Zap } from "lucide-react";
import { LAUNCHPAD_TOOLS, NOVA_SYSTEMS } from "@/lib/catalog";
import { PLANS, PLAN_ORDER } from "@/lib/plan";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nova OPS — AI operations for founders & operators" },
      { name: "description", content: "10 AI founder tools and 6 business automation systems. Activate, operate, and scale your business with one platform." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Hero />
      <ProductSection />
      <PricingTeaser />
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <Link to="/demo" className="hover:text-foreground">How it works</Link>
          <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/signup">Start free <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 nova-grid-bg opacity-60" />
      <div className="absolute inset-x-0 -top-40 h-[400px] bg-[radial-gradient(ellipse_at_top,oklch(0.82_0.14_200/0.18),transparent_60%)]" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-20 sm:py-28 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          New: Nova OS automation systems are live
        </div>
        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
          AI operations for <br className="hidden sm:inline" />
          <span className="text-primary">founders who ship.</span>
        </h1>
        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          10 founder tools to launch your offer. 6 automation systems to run the business.
          One operator-grade platform.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/signup">Start free <ArrowRight className="h-4 w-4 ml-1" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/demo">See how it works</Link>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">No credit card required · 2-minute setup</p>
      </div>
    </section>
  );
}

function ProductSection() {
  return (
    <section className="py-20 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="nova-card p-8">
            <div className="flex items-center gap-2 text-xs text-primary font-medium uppercase tracking-wider mb-3">
              <Rocket className="h-3.5 w-3.5" /> LaunchPad
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">10 AI founder tools</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              From offer to outreach to proposal — generate the assets that move revenue.
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-2">
              {LAUNCHPAD_TOOLS.map((t) => (
                <li key={t.slug} className="flex items-center gap-2 text-sm">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">{t.name}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="nova-card p-8">
            <div className="flex items-center gap-2 text-xs text-primary font-medium uppercase tracking-wider mb-3">
              <Cpu className="h-3.5 w-3.5" /> Nova OS
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">6 automation systems</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Production-ready workflows that capture leads, book calls, and follow up — without you.
            </p>
            <ul className="mt-6 space-y-2.5">
              {NOVA_SYSTEMS.map((s) => (
                <li key={s.slug} className="flex items-start gap-3 text-sm">
                  <s.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingTeaser() {
  return (
    <section className="py-20 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-10">
          <p className="text-[11px] font-medium uppercase tracking-wider text-primary mb-2">Pricing</p>
          <h2 className="text-3xl font-semibold tracking-tight">Pick a tier. Grow into the next.</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLAN_ORDER.map((p) => {
            const plan = PLANS[p];
            const featured = p === "operate";
            return (
              <div key={p} className={`nova-card p-6 ${featured ? "border-primary/50" : ""}`}>
                {featured && (
                  <div className="inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary text-[10px] font-medium px-2 py-0.5 mb-3">
                    <Sparkles className="h-3 w-3" /> Most popular
                  </div>
                )}
                <h3 className="text-sm font-semibold">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight">${plan.price}</span>
                  <span className="text-xs text-muted-foreground">/mo</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{plan.tagline}</p>
                <Button asChild className="w-full mt-5" variant={featured ? "default" : "outline"} size="sm">
                  <Link to="/signup">{plan.price === 0 ? "Start free" : "Choose plan"}</Link>
                </Button>
                <ul className="mt-5 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="mt-8 text-center">
          <Button asChild variant="ghost" size="sm">
            <Link to="/pricing">Compare all features <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo />
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Nova OPS. All rights reserved.</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link to="/demo" className="hover:text-foreground">How it works</Link>
          <Link to="/login" className="hover:text-foreground">Log in</Link>
        </div>
      </div>
    </footer>
  );
}
