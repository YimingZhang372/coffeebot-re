function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function prng(seed) {
  let a = seed;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic verification matrix for a certificate id (same pattern as the PDF). */
export default function VerifyMatrix({ value, size = 78, className = "" }) {
  const cells = 21;
  const cell = size / cells;
  const rand = prng(hash(`verify-${value}`));
  const squares = [];
  for (let r = 0; r < cells; r += 1) {
    for (let c = 0; c < cells; c += 1) {
      const finder = (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7);
      if (finder) continue;
      if (rand() > 0.52) squares.push(<rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#141414" />);
    }
  }
  const eye = (ox, oy, key) => (
    <g key={key}>
      <rect x={ox} y={oy} width={cell * 7} height={cell * 7} fill="#141414" />
      <rect x={ox + cell} y={oy + cell} width={cell * 5} height={cell * 5} fill="#fff" />
      <rect x={ox + cell * 2} y={oy + cell * 2} width={cell * 3} height={cell * 3} fill="#141414" />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} role="img" aria-label={`Verification code for ${value}`}>
      <rect width={size} height={size} fill="#fff" />
      {squares}
      {eye(0, 0, "tl")}
      {eye(cell * (cells - 7), 0, "tr")}
      {eye(0, cell * (cells - 7), "bl")}
    </svg>
  );
}