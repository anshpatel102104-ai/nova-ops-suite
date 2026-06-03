# Phase 8 — Billing, plans & usage limits

Scope: introduce plan tiers with monthly usage limits enforced server-side. No real payment provider yet — upgrades happen via a self-serve "switch plan" UI that records the choice. This sets the foundation; Stripe/Paddle wiring can come in a later phase.

## Plans

| Plan | Monthly tool runs | Monthly workflow runs | Members | Custom playbooks |
|------|---|---|---|---|
| starter (default) | 50 | 10 | 2 | 3 |
| pro | 1,000 | 200 | 10 | unlimited |
| business | 10,000 | 2,000 | unlimited | unlimited |

## Database

- Reuse existing `workspaces.plan` enum (already `starter`); add `pro`, `business` values.
- New table `workspace_usage`: `workspace_id`, `period_start` (date, first of month), `tool_runs`, `workflow_runs`. Unique on (workspace_id, period_start). RLS: members read, service_role writes.
- DB function `increment_usage(_workspace_id, _kind)` (security definer) — upserts current-month row and increments counter. Called from `runTool` and `runWorkflow`.
- DB function `get_plan_limits(_plan)` returns jsonb of caps.
- DB function `check_and_increment_usage(_workspace_id, _kind)` — atomically checks the cap and increments; returns `{ allowed, usage, limit }`. Used by server fns before executing.

## Server functions (`src/lib/billing.functions.ts`)

- `getBillingOverview()` → current plan, limits, current-period usage, member count, custom playbook count.
- `setWorkspacePlan({ plan })` (owner only) → updates `workspaces.plan`. No payment.
- Wire `check_and_increment_usage` into existing `runTool` and `runWorkflow`; throw a friendly error when over cap.
- Enforce member cap in `inviteMember` and custom-playbook cap in `createWorkflow`.

## UI

- New route `/_app.billing.tsx`: current plan card, usage bars (tool runs / workflow runs / members / playbooks), plan comparison grid with "Switch to X" buttons (owner only).
- Sidebar: add "Billing" entry under workspace section.
- Settings page: link to Billing.
- When a run is blocked by cap, surface toast "Monthly limit reached — upgrade plan" with link to billing.

## Out of scope

Real Stripe/Paddle checkout, prorated billing, annual plans, invoices, per-seat pricing, hard member-cap enforcement on existing members (only enforced on new invites).
