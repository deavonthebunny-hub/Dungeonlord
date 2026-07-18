export const COUNCIL_INTERVAL = 10;
export const ESCALATION_INTERVAL = 5;

export function isCouncilDay(day = 1) {
  const safeDay = Math.max(1, Number(day) || 1);
  return safeDay % COUNCIL_INTERVAL === 0;
}

export function isEscalationDay(day = 1) {
  const safeDay = Math.max(1, Number(day) || 1);
  return safeDay > 1 && safeDay % ESCALATION_INTERVAL === 0 && !isCouncilDay(safeDay);
}

export function raidCadenceForDay(day = 1, escalationsCleared = 0) {
  if (isCouncilDay(day)) return { kind: "council", escalationLevel: 0 };
  if (isEscalationDay(day)) {
    return { kind: "escalation", escalationLevel: Math.max(1, Math.floor(escalationsCleared) + 1) };
  }
  return { kind: "choice", escalationLevel: 0 };
}
