## Phase 7 — Agents & multi-step workflows

Turn the existing single-shot LaunchPad tools into chainable workflows that can be saved, re-run, and executed in the background. Agents become the "owners" of workflows so each one feels like a true mentor running a real playbook.

### What we ship

1. **Workflow Builder** — a new page where the user assembles 2–10 steps. Each step is a tool from the existing catalog, with an inline prompt template that can reference outputs of previous steps via `{{step_N}}` placeholders.
2. **Workflow Runner** — server-side sequential execution of every step. Each step writes a `tool_runs` row (so the existing dashboard/activity feed lights up for free), and the full run is tracked end-to-end with status, durations, and per-step outputs.
3. **Workflow Library** — list of saved workflows per workspace, plus 6 built-in starter templates aligned to each agent (Strategos: "Idea → Pitch → GTM", Compass: "ICP → Offer → Messaging", Scribe: "Landing → Content plan → Lead magnet", Closer: "Sales script → Cold email sequence", Forge: "SOP → Automation plan", Nova: "Full launch sprint").
4. **Agents page wiring** — each agent card shows its workflows and a one-click "Run playbook" button.
5. **Run detail view** — modal/page showing live step-by-step progress, with "Save step output to Assets" on each completed step.

### Database

Two new tables:

- `workflows` — `name`, `description`, `agent_slug`, `steps` (jsonb array of `{tool_slug, prompt_template, label}`), `is_template` (boolean), `workspace_id`, `created_by`.
- `workflow_runs` — `workflow_id`, `workspace_id`, `user_id`, `input` (initial user input), `status` (`pending|running|succeeded|failed`), `current_step`, `steps` (jsonb array of `{tool_slug, status, output, error, run_id, duration_ms}`), `total_duration_ms`, `error`.

Both tables get standard workspace-member RLS + GRANTs matching the existing pattern (member read/insert, owner update/delete).

### Server functions (`src/lib/workflows.functions.ts`)

- `listWorkflows`, `getWorkflow`, `createWorkflow`, `updateWorkflow`, `deleteWorkflow`
- `runWorkflow({ workflowId, input })` — orchestrator that loops through steps, calls the existing `runTool` AI handler per step with `{{step_N}}` substituted, writes a `tool_runs` row per step (so dashboard stats stay coherent), and updates the `workflow_runs` row after each step.
- `listWorkflowRuns`, `getWorkflowRun` — for history and live polling.

### UI changes

- New routes:
  - `src/routes/_app.workflows.tsx` — library + create button
  - `src/routes/_app.workflows.$id.tsx` — editor (drag/reorder steps, pick tool per step, edit prompt template with placeholder hints)
  - `src/routes/_app.workflows.$id.run.tsx` — run view with live polling and per-step output cards
- `src/routes/_app.agents.tsx` — add "Playbooks" section per agent linking to workflows filtered by `agent_slug`.
- Sidebar nav: add "Workflows" entry between LaunchPad and Nova OS.

### Out of scope (deferred)

- Scheduled/triggered runs (cron, webhook triggers) — keeping this phase focused on manual + chained execution. Can be Phase 8 alongside notifications.
- Branching/conditional steps — sequential only for now.
- Streaming partial output mid-step — each step completes atomically.

### Technical notes

- Reuse the existing `runTool` AI logic from `src/lib/ai.functions.ts` rather than duplicating provider/model resolution.
- Workflow execution runs inside a single `createServerFn` call. With ~3–6 steps at a few seconds each this fits well within the Worker request budget; no queue needed for v1.
- Templates seeded via a migration that inserts rows with `is_template = true` and `workspace_id = null` (visible to all workspaces via an additional RLS policy `is_template = true`).
