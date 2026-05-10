# AI Operations & Workflow

Auto-injected every session. Contains agent dispatch, effort calibration, and workflow rules.

## Agent Dispatch & Suitability Check

**Rule:** Before executing any complex, architectural, or multi-step request, analyze whether the current AI (Gemini vs. Claude) is the best tool for the job. If the other agent is significantly better suited, **pause and prompt the user** with a recommendation to switch before making any changes.

**Heuristics for Dispatch:**
- **Prefer Gemini CLI (Stay here) for:**
  - Large-scale batch refactoring, multi-file edits, or tedious migrations.
  - Tasks requiring heavy parallel tool usage, extensive file searching (`grep`), or shell executions (running tests, builds, linting).
  - Strict, iterative "Plan -> Act -> Validate" execution loops.
  - Interactive debugging that requires running the dev server, executing Vitest tests, and repeatedly tweaking code.
- **Suggest Claude (Switch) for:**
  - Deep architectural brainstorming, system design, or drafting initial specifications.
  - Complex creative writing, extensive documentation generation, or translating nuanced financial/regulatory requirements into logic.
  - "Fuzzy" conceptual debugging where the issue is a logical or architectural flaw rather than a clear syntax/execution error.

**Handoff Protocol:** If you recommend switching to the other agent and the user agrees, immediately summarize the current state, context, and the exact objective into the daily `.agents/handoffs/YYYY-MM-DD.md` file so the next agent can resume seamlessly.

## Effort Level Guidance

**Rule:** At session start or when the task type shifts significantly, suggest `/effort <level>` if the current effort seems mismatched.

| Effort | When to use |
|---|---|
| **low** | Typo/rename, formatting, simple lookup ("what does X return?"), boilerplate generation, single-line fixes |
| **medium** | Standard bug fix with known root cause, writing tests to clear specs, feature addition with explicit requirements, documentation edits |
| **high** | Multi-file refactors, unclear-root-cause debugging, SCSS/design iteration, adding new financial features, anything touching `LoanCalculatorService` |
| **max** | Architecture decisions, amortization formula changes, debugging stuck after 2+ attempts, security review, new overpayment/prowizja logic from requirements |

**Financial override:** Any task involving `LoanCalculatorService` methods, amortization formulas, prowizja calculations, or overpayment effects defaults to **high** minimum — never low/medium. Formula errors produce wrong loan costs shown to users.

**Escalation signal:** If you need to re-prompt or the response misses edge cases, suggest stepping up one level before rephrasing.

**Cost awareness:** low→max is ~10x token cost. Don't burn max on grunt work, but don't under-think financial correctness to save tokens.

## General Workflow Rules

1. **Plan before building:** If a task has more than two steps, use plan mode or create `.agents/PLAN.md` before coding. Execute only after approval.
2. **MCP Sync:** At the start of every session, compare the root `.mcp.json` with the `enabledMcpjsonServers` list in `.claude/settings.local.json`. If new servers exist in `.mcp.json` that are not enabled, prompt the user to enable them.
3. **Capture corrections:** When the user corrects you, save it immediately. Update `CLAUDE.md` for project rules.
4. **Session handoffs:** On wrap-up, write one file per date in `.agents/handoffs/`, named `YYYY-MM-DD.md`. If one already exists for today, update it — do not create per-agent or per-task splits. Include: context, completed work, pending items, and learnings.
5. **Delegate grunt work:** Use sub-agents for research, batch refactoring, and test running to keep the main conversation focused on decisions.
6. **Pointers over copies:** Reference `file:line` or file paths instead of pasting code snippets into prompts or docs. Keeps instructions concise and prevents staleness.
7. **Verify, don't trust:** Always run tests (`npm test`) after service changes. The `calc-reviewer` agent verifies financial math — run it before shipping any `LoanCalculatorService` change.
8. **Scoped test hook:** A PostToolUse hook (`scripts/test-on-edit.js`) automatically runs `npx vitest run <spec>` whenever a `.ts` file is edited. Output appears in the Claude turn. Always exits 0. Skips `.scss`, `.html`, and `.spec.ts` files.
9. **Interview for complex features:** For large features, start with: "Interview me about requirements, edge cases, and tradeoffs." Use `/add-feature` skill. Execute in a fresh session.
10. **Formatting via tools, not instructions:** Do not spend CLAUDE.md lines on code formatting rules. Use linters (Prettier/ESLint) and hooks for deterministic enforcement — cheaper and 100% reliable.
11. **Context Hygiene:** When moving to a completely new, unrelated task, **remind the user** to refresh the session (e.g., via `/clear` or starting a new session). This prevents "context rot" where stale history interferes with new logic and optimizes token consumption.
12. **Cross-Agent Design Synthesis:** When restyling components, create mockup variants with dev-only routes for A/B comparison. Compare all variants and synthesize the best elements. Delete mockups after finalizing.
13. **Gemini Revert Watch:** After Gemini edits files that Claude previously modified, always diff the result against your intended state. Gemini frequently reverts changes silently — especially typography sizes, `overflow` properties, class names, and structural patterns. Run a targeted check after every Gemini session on shared files.
14. **Destructive Action Protocol:** NEVER delete a component folder (even mockups or temporary versions) without explicit user confirmation. During redesigns, keep candidate versions active until the user explicitly selects one to merge.
