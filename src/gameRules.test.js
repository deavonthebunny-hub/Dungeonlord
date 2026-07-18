import { describe, expect, it } from "vitest";
import { isCouncilDay, isEscalationDay, raidCadenceForDay } from "./gameRules";

describe("raid cadence", () => {
  it("offers a choice on ordinary days", () => {
    expect(raidCadenceForDay(1, 0)).toEqual({ kind: "choice", escalationLevel: 0 });
  });

  it("forces escalation on fifth non-Council days", () => {
    expect(isEscalationDay(5)).toBe(true);
    expect(raidCadenceForDay(5, 0)).toEqual({ kind: "escalation", escalationLevel: 1 });
    expect(raidCadenceForDay(15, 1)).toEqual({ kind: "escalation", escalationLevel: 2 });
  });

  it("lets Council override escalation", () => {
    expect(isCouncilDay(10)).toBe(true);
    expect(isEscalationDay(10)).toBe(false);
    expect(raidCadenceForDay(10, 1)).toEqual({ kind: "council", escalationLevel: 0 });
  });
});
