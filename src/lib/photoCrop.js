/** Deterministic crop for library photos, so two posts never frame the same image alike. */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function cropFor(seed) {
  const h = hash(String(seed || ""));
  const x = 18 + (h % 65);
  const y = 18 + ((h >> 7) % 65);
  const scale = 1 + ((h >> 15) % 41) / 100;
  return {
    style: {
      objectPosition: `${x}% ${y}%`,
      transform: `scale(${scale.toFixed(2)})`,
      transformOrigin: `${x}% ${y}%`,
    },
  };
}