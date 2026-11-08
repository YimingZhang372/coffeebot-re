import { useEffect, useState } from "react";
import Tower3D from "./Tower3D";
import Tower2D from "./Tower2D";

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
  } catch {
    return false;
  }
}

export default function TowerView(props) {
  const [mode, setMode] = useState("pending");

  useEffect(() => {
    const decide = () => {
      const wide = window.innerWidth >= 768;
      setMode(wide && hasWebGL() ? "3d" : "2d");
    };
    decide();
    window.addEventListener("resize", decide);
    return () => window.removeEventListener("resize", decide);
  }, []);

  if (mode === "pending") {
    return <div className="h-[420px] w-full animate-pulse bg-[#DAD6D1] sm:h-[500px]" />;
  }
  if (mode === "2d") {
    return (
      <div>
        <Tower2D {...props} />
        <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-sub/70">
          2D view · the interactive tower needs WebGL and a wider screen
        </p>
      </div>
    );
  }
  return <Tower3D {...props} />;
}