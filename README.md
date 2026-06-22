<div align="center">

# ⚖️ debate

### 5 roles · 4 independent agents · judge silenced.

**The verdict your AI can't grade its own homework on.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Claude Code Skill](https://img.shields.io/badge/Claude_Code-Skill-blue)](https://github.com/Hugh4424/debate)
[![Tests](https://img.shields.io/badge/tests-14%20passing-brightgreen)](./pk-rules.test.ts)
[![Agent Teams](https://img.shields.io/badge/Agent_Teams-optional-yellow)](https://github.com/Hugh4424/debate)

[English](./README.md) · [简体中文](./README.zh-CN.md)

</div>

---

## The problem, in 10 seconds

Your AI reviews code. It finds issues. Then the *same* AI decides which findings to adopt.

> **AI reviewer:** Finding #3 — this approach is risky.
> **AI author:** ✅ Nah, my design is fine.

Of course it dismisses it. It's judging its own work — with the same blind spots it had when writing. That green checkmark is **theater.**

`debate` fixes this with one rule:

> **The thing that made the decision is never the thing that approves it.**

Every contested finding goes to a five-role adversarial court. Independent sub-agents argue *for* and *against* both sides. The judge (Claude) is **silenced** — no lobbying, no picking favorites, only synthesizing the surviving arguments.

---

## See it in action

> *"We're building a public API. Claude proposed long-lived keys with no expiry. The reviewer pushed back on security posture. Who's right?"*

**Input** → [`examples/sample-input.md`](examples/sample-input.md) — three Claude decisions, three reviewer findings, MR-2 classification included.

**Output** → [`examples/sample-verdict.md`](examples/sample-verdict.md) — the verdict table after one full debate round:

| Proposal | Verdict | What decided it |
|---|---|---|
| Long-lived keys, no expiry | **Partial adopt** | 丁's third path (90-day auto-renew) survived; "Stripe never rotates" argument defeated by 丙 |
| Trust internal header, no re-validation | **Adopt with condition** | ADR required before merge — 乙's concern was about the undocumented assumption, not the mechanism |
| No scope column yet | **Adopt** | 丙 and 丁 both confirmed YAGNI; 乙 raised no objection |
| Add `last_used_at` column | **Open — user decides** | Both sides survived; 丁 flagged future policy implications |

Full transcript saved to `debate/round-1/` for audit. [See full example →](examples/sample-verdict.md)

---

## What you get

| Your situation | What usually happens | With debate |
|---|---|---|
| AI reviews its own decisions | It defends itself, blind spots intact | **5 independent agents** argue both sides |
| A biased "pass" on your own design | Nobody notices | Claude is **forbidden from advocating** |
| A rubber-stamp adoption | Findings dismissed without scrutiny | Every finding must **survive cross-examination** |
| No Agent Teams available | Review collapses | **Auto-degrades** to single-agent three-tier verdict |
| Tiny disagreement, not worth a trial | Full five-party overhead | Only **direction-level conflicts** trigger a session |

---

## Quick start

`debate` works standalone — give it two proposals and let it run. No pipeline required.

**1. Install:**

```bash
git clone https://github.com/Hugh4424/debate ~/.claude/skills/debate
```

**2. Invoke in Claude Code:**

```
/debate
```

Provide your proposals or review findings. The skill handles the rest.

**The output** is a verdict table — one row per contested proposal, each with a ruling (adopt / partial / reject) and the surviving argument that determined it. Full debate transcripts are saved to disk; you never need to read them.

**Optional — enable full five-party mode:**

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

Without this, the skill auto-degrades to a single-agent three-tier verdict (same output format, no multi-agent overhead). The standalone mode is the recommended starting point.

---

## Why you can trust the verdict

A ruling is easy to fake. Three constraints make this one mean something:

- **Claude's decisions are defendants, not judges.** Claude's original design choices go on trial alongside the reviewer's findings. Neither side is the default baseline.

- **The judge is silenced.** Claude acts only as the synthesizing judge in Phase 3 — it cannot advocate for either side during the debate. The moment it picks up a pen to defend its own work, the whole point collapses.

- **Every ruling must cite surviving arguments.** A verdict of "adopt" or "reject" must reference which arguments survived cross-examination and which were refuted. No surviving argument → no valid ruling.

---

## The court

Five roles, four of them independent sub-agents:

| Role | Stance | Played by |
|---|---|---|
| **Team A** — Proposal A advocate | Argues *for* every A-side decision | Independent sub-agent |
| **Team B** — Proposal B advocate | Argues *for* every B-side finding | Independent sub-agent |
| **Team C** — Devil's advocate | Argues *against* everything, both sides | Independent sub-agent |
| **Team D** — Impact analyst | Cost/benefit + surfaces hidden assumptions and false consensus | Independent sub-agent |
| **Lead judge** | Silenced during debate; synthesizes surviving arguments into final rulings | Claude |

**The iron rule:** Teams A and B are equals — neither side is the default baseline. Teams C and D attack both sides equally.

---

## What triggers a debate session

Not every disagreement needs a full trial. `debate` only triggers on **direction-level conflicts** — the MR-2 classification:

| Type | Examples | Triggers debate? |
|---|---|---|
| Problem definition | "Are we solving the right problem?" | ✅ Yes |
| Scope / priority | "Should we even do this now?" | ✅ Yes |
| Requirements interpretation | "What did the spec actually say?" | ✅ Yes |
| Implementation details | "Which library, which variable name?" | ❌ No |

Implementation-only disagreements are handled directly. Only direction-level conflicts go to court.

---

## The four phases

```
Phase 0  Case preparation    Judge assembles the docket; assigns proposals to A/B sides
Phase 1  Opening statements  All four teams write independently, in parallel, no cross-talk
Phase 2  Cross-examination   C and D challenge everything; A and B respond (≤200 words each); max 2 rounds
Phase 3  Verdict             Judge synthesizes surviving arguments; rules on each proposal
```

Full protocol: [references/arbitration-protocol.md](references/arbitration-protocol.md)  
Output format: [references/output-template.md](references/output-template.md)

---

## Hard lessons baked in

- **The judge silencing rule.** Tested: without it, Claude consistently dismissed findings that challenged its own design in Phase 3 ("the approach is sound because I designed it this way"). Adding the prohibition on Phase 2 advocacy dropped that pattern to near-zero.

- **Symmetric defendants.** Early versions treated one side as the baseline — the court argued *against* the findings, not *about* both sides equally. That just shifted the rubber-stamp from adoption to rejection. Making both sides equal defendants was the fix.

- **Two-round cap.** A three-round debate added almost no new surviving arguments but cost 40% more tokens. The cap is at two rounds.

---

## Repository layout

```
SKILL.md                          # The skill the orchestrating AI reads
pk-rules.ts                       # Trigger/exit logic (shouldTriggerPK / shouldExitPK)
pk-rules.test.ts                  # Tests (14 passing)
examples/
  sample-input.md                 # Sample debate input (API auth scheme dispute)
  sample-verdict.md               # Sample verdict table output
references/
  arbitration-protocol.md         # Full four-phase protocol
  output-template.md              # Verdict table and audit archive format
  role-spawn-templates.md         # Sub-agent spawn prompts for all four teams
  anti-bias-guardrails.md         # Judge's anti-bias checklist (Phase 3)
assets/                           # Screenshots and badges (pending first real run)
```

---

## When to skip it

**Don't invoke if:**
- All disagreements are implementation-level (naming, library choice, style)
- You don't have proposals or findings yet — `debate` takes existing positions as input
- One side is unambiguously correct with no reasonable counterargument

This earns its keep when **direction-level conflicts** exist and you want an impartial ruling that doesn't just reflect whose context wrote the most tokens.

---

## License

MIT.
