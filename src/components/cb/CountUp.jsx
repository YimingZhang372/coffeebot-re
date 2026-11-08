import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

export default function CountUp({ value = 0, decimals = 0, duration = 900, className = "" }) {
  const [display, setDisplay] = useState(0);
  const reduce = useReducedMotion();
  const from = useRef(0);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const initial = from.current;
    let frame;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(initial + (value - initial) * eased);
      if (p < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, reduce]);

  return <span className={`tabular ${className}`}>{Number(display).toFixed(decimals)}</span>;
}