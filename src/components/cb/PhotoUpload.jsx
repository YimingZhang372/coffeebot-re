import { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

const MAX_SIDE = 1600;
const TARGET_BYTES = 500 * 1024;

function compress(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      let quality = 0.86;
      const attempt = () => {
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size > TARGET_BYTES && quality > 0.4) {
              quality -= 0.12;
              attempt();
            } else {
              resolve(new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }));
            }
          },
          "image/jpeg",
          quality
        );
      };
      attempt();
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
}

/**
 * Camera-first photo input (rear camera on mobile, file picker on desktop),
 * with client-side compression, preview, retake and upload progress.
 */
export default function PhotoUpload({
  value,
  onChange,
  visibility = "public",
  label = "take photo",
  hint = "container on the scale, display readable",
  onError,
}) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const shown = preview || (value && value.startsWith("http") ? value : "");

  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Photos must be under 5 MB.");
      onError?.("Photos must be under 5 MB.");
      return;
    }
    setError("");
    setBusy(true);
    setProgress(15);
    try {
      const compressed = await compress(file);
      const localUrl = URL.createObjectURL(compressed);
      setPreview(localUrl);
      setProgress(55);
      const res =
        visibility === "private"
          ? await base44.integrations.Core.UploadPrivateFile({ file: compressed })
          : await base44.integrations.Core.UploadPublicFile({ file: compressed });
      setProgress(100);
      onChange(res.file_uri || res.file_url || "");
    } catch (err) {
      setError("Upload failed. Check your connection and try again.");
      setPreview("");
      onError?.("Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const retake = () => {
    setPreview("");
    onChange("");
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.click();
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handle}
        className="hidden"
      />
      {shown ? (
        <div className="relative overflow-hidden rounded-[2px] border border-rule bg-white">
          <img src={shown} alt="Upload preview" className="h-48 w-full object-cover" />
          {busy && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-rule">
              <div className="h-1 bg-caramel transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          <div className="flex items-center justify-between px-3 py-2 text-[12px]">
            <span className="text-sub">{busy ? `uploading ${progress}%` : "photo attached"}</span>
            <button type="button" onClick={retake} className="text-ink underline decoration-rule underline-offset-4 hover:text-caramel">
              retake
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-start gap-1 rounded-[2px] border border-dashed border-rule bg-white/60 px-4 py-5 text-left transition-colors hover:border-ink"
        >
          <span className="text-[14px] text-ink">{label}</span>
          <span className="text-[12px] text-sub">{hint}</span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.12em] text-sub/70">
            compressed to 1600 px · max 500 kb
          </span>
        </button>
      )}
      {error && <p className="mt-2 text-[12px] text-[#A44A3F]">{error}</p>}
    </div>
  );
}