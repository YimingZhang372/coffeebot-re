import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

/** Resolves a private storage uri to a short-lived signed URL. */
export default function PrivatePhoto({ uri, alt = "Proof photo", className = "" }) {
  const [url, setUrl] = useState(uri && uri.startsWith("http") ? uri : "");

  useEffect(() => {
    let alive = true;
    if (!uri || uri.startsWith("http")) {
      setUrl(uri || "");
      return;
    }
    (async () => {
      try {
        const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri });
        if (alive) setUrl(res.signed_url || "");
      } catch {
        if (alive) setUrl("");
      }
    })();
    return () => {
      alive = false;
    };
  }, [uri]);

  if (!url) return <div className={`animate-pulse bg-[#DAD6D1] ${className}`} />;
  return <img src={url} alt={alt} className={className} />;
}