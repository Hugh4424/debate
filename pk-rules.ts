// pk-rules.ts — MR-2 分类、pk 触发/退出判定规则
// 供测试和 orchestrator 共同引用，保证判定逻辑单一权威源

export type Mr2Category =
  | "problem_change" // 问题改变 — 方向级
  | "scope_priority" // 范围/优先级 — 方向级
  | "requirement_interpretation" // 对需求的解释 — 方向级
  | "implementation_only"; // 仅实现层 — 非方向级

export interface Finding {
  id: string;
  description: string;
  category: Mr2Category;
}

export interface TriggerDecision {
  triggered: boolean;
  reason: string;
  retention: { oppose: string; decision: string; basis: string };
}

const DIRECTION_LEVEL_CATEGORIES: Mr2Category[] = [
  "problem_change",
  "scope_priority",
  "requirement_interpretation",
];

// MR-2 分类判定：根据 finding 描述判定类别
export function classifyByMr2(description: string): Mr2Category {
  const k = description.toLowerCase();
  if (
    k.includes("problem") || k.includes("痛点") || k.includes("方向") ||
    k.includes("问题改变")
  ) {
    return "problem_change";
  }
  if (k.includes("scope") || k.includes("优先级") || k.includes("时机")) {
    return "scope_priority";
  }
  if (k.includes("理解") || k.includes("解释") || k.includes("需求分歧")) {
    return "requirement_interpretation";
  }
  return "implementation_only";
}

// 判断是否触发 pk
export function shouldTriggerPK(findings: Finding[]): TriggerDecision {
  const dl = findings.filter((f) =>
    DIRECTION_LEVEL_CATEGORIES.includes(f.category),
  );
  if (dl.length > 0) {
    return {
      triggered: true,
      reason: `${dl.length} direction-level disagreement(s)`,
      retention: {
        oppose: dl.map((f) => f.description).join("; "),
        decision: "enter pk",
        basis: "MR-2 top 3 categories have unresolved direction-level disagreements",
      },
    };
  }
  return {
    triggered: false,
    reason: "All findings are implementation-level only",
    retention: {
      oppose: "No direction-level disagreements found",
      decision: "do not enter pk",
      basis:
        "MR-2 fourth category — implementation-level disputes do not trigger pk",
    },
  };
}

export type PkExitReason =
  | "verdict_produced"
  | "max_rounds_reached"
  | "all_proposals_resolved";

// D25: hitting the round cap without a verdict and with unresolved proposals
// must surface unresolved items for human arbitration rather than stop silently.
export function shouldExitPK(
  round: number,
  verdictProduced: boolean,
  allResolved: boolean,
): { exit: boolean; reason: PkExitReason | null; requiresHumanArbitration: boolean } {
  if (round >= 2) {
    return {
      exit: true,
      reason: "max_rounds_reached",
      // Capped out with no verdict and unresolved proposals → escalate to human.
      requiresHumanArbitration: !verdictProduced && !allResolved,
    };
  }
  if (verdictProduced) return { exit: true, reason: "verdict_produced", requiresHumanArbitration: false };
  if (allResolved) return { exit: true, reason: "all_proposals_resolved", requiresHumanArbitration: false };
  return { exit: false, reason: null, requiresHumanArbitration: false };
}
