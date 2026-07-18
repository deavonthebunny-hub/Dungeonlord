const DEFAULT_SEED = "DL-00000000";

let activeSeed = DEFAULT_SEED;
let activeSeedHash = 0;
let activeCursor = 0;

function hashText(value) {
  let hash = 2166136261;
  const text = String(value || DEFAULT_SEED);
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomAt(seedHash, cursor) {
  let value = (seedHash + Math.imul((cursor + 1) >>> 0, 0x9e3779b1)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x21f0aaad);
  value ^= value >>> 15;
  value = Math.imul(value, 0x735a2d97);
  value ^= value >>> 15;
  return (value >>> 0) / 4294967296;
}

export function normalizeRunSeed(seed) {
  const cleaned = String(seed || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 24);
  return cleaned || DEFAULT_SEED;
}

export function createRunSeed() {
  let entropy = Date.now() >>> 0;
  if (globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    entropy ^= values[0];
  }
  return `DL-${entropy.toString(16).toUpperCase().padStart(8, "0")}`;
}

export function setRunRandomState(seed, cursor = 0) {
  activeSeed = normalizeRunSeed(seed);
  activeSeedHash = hashText(activeSeed);
  activeCursor = Number.isFinite(cursor) ? Math.max(0, Math.floor(cursor)) : 0;
  return { seed: activeSeed, cursor: activeCursor };
}

export function randomFloat() {
  const value = randomAt(activeSeedHash, activeCursor);
  activeCursor += 1;
  return value;
}

export function getRunRandomState() {
  return { seed: activeSeed, cursor: activeCursor };
}

setRunRandomState(DEFAULT_SEED, 0);
