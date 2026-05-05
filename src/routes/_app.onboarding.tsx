import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/brand/Logo";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/onboarding")({
  component: OnboardingPage,
});

interface FormData {
  name: string; company: string; website: string; industry: string;
  goal: string; bottleneck: string; channels: string[]; tools: string;
  offer: string; track: "launchpad" | "novaos" | "both" | "";
}

const INDUSTRIES = ["Agency", "SaaS", "Coaching", "E-commerce", "Local services", "Other"];
const GOALS = ["Get first customers", "Increase revenue", "Reduce manual work", "Scale operations"];
const BOTTLENECKS = ["Lead generation", "Sales conversion", "Follow-ups", "Operations", "Hiring"];
const CHANNELS = ["Email", "LinkedIn", "Cold call", "Ads", "Referral", "Inbound"];
const TRACKS = [
  { id: "launchpad", title: "LaunchPad", desc: "I need to build my offer and start selling." },
  { id: "novaos",    title: "Nova OS",   desc: "I have an offer — automate my operations." },
  { id: "both",      title: "Both",      desc: "Run the whole engine on Nova OPS." },
] as const;

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>({
    name: "", company: "", website: "", industry: "",
    goal: "", bottleneck: "", channels: [], tools: "",
    offer: "", track: "",
  });

  const STEPS = [
    {
      title: "About you",
      body: (
        <div className="space-y-4">
          <Field label="Your name"><Input value={data.name} onChange={(e)=>setData({...data,name:e.target.value})} /></Field>
          <Field label="Company"><Input value={data.company} onChange={(e)=>setData({...data,company:e.target.value})} /></Field>
          <Field label="Website"><Input placeholder="https://" value={data.website} onChange={(e)=>setData({...data,website:e.target.value})} /></Field>
        </div>
      ),
    },
    {
      title: "Your business",
      body: (
        <div className="space-y-5">
          <ChoiceGroup label="Industry" options={INDUSTRIES} value={data.industry} onChange={(v)=>setData({...data,industry:v})} />
          <Field label="What do you offer?">
            <Textarea rows={3} placeholder="e.g. Done-for-you LinkedIn lead gen for B2B agencies"
              value={data.offer} onChange={(e)=>setData({...data,offer:e.target.value})} />
          </Field>
        </div>
      ),
    },
    {
      title: "Goals & bottlenecks",
      body: (
        <div className="space-y-5">
          <ChoiceGroup label="Main goal" options={GOALS} value={data.goal} onChange={(v)=>setData({...data,goal:v})} />
          <ChoiceGroup label="Biggest bottleneck" options={BOTTLENECKS} value={data.bottleneck} onChange={(v)=>setData({...data,bottleneck:v})} />
        </div>
      ),
    },
    {
      title: "Channels & stack",
      body: (
        <div className="space-y-5">
          <MultiChoice label="Preferred outreach channels" options={CHANNELS} value={data.channels}
            onChange={(v)=>setData({...data,channels:v})} />
          <Field label="Tools you currently use">
            <Textarea rows={3} placeholder="e.g. Notion, HubSpot, Slack, Calendly"
              value={data.tools} onChange={(e)=>setData({...data,tools:e.target.value})} />
          </Field>
        </div>
      ),
    },
    {
      title: "Pick your track",
      body: (
        <div className="grid sm:grid-cols-3 gap-3">
          {TRACKS.map((t) => {
            const active = data.track === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={()=>setData({...data,track:t.id as FormData["track"]})}
                className={cn("nova-card text-left p-4 nova-card-hover",
                  active && "border-primary/60 bg-primary/5")}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{t.title}</p>
                  {active && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t.desc}</p>
              </button>
            );
          })}
        </div>
      ),
    },
  ];

  const last = step === STEPS.length - 1;
  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  const finish = () => {
    // TODO: persist onboarding response to Supabase (table: onboarding_responses)
    // TODO: trigger n8n webhook for personalized recommendation
    console.log("[onboarding]", data);
    navigate({ to: "/app/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="mx-auto max-w-3xl w-full h-14 px-4 sm:px-6 flex items-center justify-between">
          <Logo />
          <button onClick={finish} className="text-xs text-muted-foreground hover:text-foreground">
            Skip for now
          </button>
        </div>
      </header>
      <div className="flex-1 mx-auto w-full max-w-2xl px-4 sm:px-6 py-10">
        <div className="mb-6">
          <p className="text-[11px] font-medium uppercase tracking-wider text-primary mb-2">
            Step {step + 1} of {STEPS.length}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{STEPS[step].title}</h1>
          <Progress value={pct} className="mt-4 h-1" />
        </div>

        <div className="nova-card p-6">{STEPS[step].body}</div>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          {last ? (
            <Button onClick={finish}>Finish setup <Check className="h-4 w-4 ml-1" /></Button>
          ) : (
            <Button onClick={() => setStep(step + 1)}>Continue <ArrowRight className="h-4 w-4 ml-1" /></Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
function ChoiceGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string)=>void }) {
  return (
    <div>
      <Label className="block mb-2">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} type="button" onClick={()=>onChange(o)}
            className={cn("text-xs rounded-full border px-3 py-1.5 transition-colors",
              value === o ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
            )}>{o}</button>
        ))}
      </div>
    </div>
  );
}
function MultiChoice({ label, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (v: string[])=>void }) {
  return (
    <div>
      <Label className="block mb-2">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value.includes(o);
          return (
            <button key={o} type="button"
              onClick={()=>onChange(active ? value.filter(v=>v!==o) : [...value, o])}
              className={cn("text-xs rounded-full border px-3 py-1.5 transition-colors",
                active ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
              )}>{o}</button>
          );
        })}
      </div>
    </div>
  );
}
