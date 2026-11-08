import Barcode from "./Barcode";

/**
 * White "ticket" card: soft shadow, dashed perforation, barcode strip on the right.
 */
export default function Ticket({
  id,
  rotate = -2.4,
  children,
  footer,
  className = "",
  barcode = true,
}) {
  return (
    <div
      className={`relative flex overflow-hidden rounded-[3px] bg-paper shadow-[0_18px_50px_-24px_rgba(20,20,20,0.45)] ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <div className="min-w-0 flex-1 p-6 sm:p-8">{children}</div>
      {barcode && (
        <>
          <div className="relative w-0 shrink-0">
            <span className="absolute inset-y-4 left-0 border-l border-dashed border-rule" />
          </div>
          <div className="flex w-[74px] shrink-0 flex-col items-center justify-between bg-[#F7F5F3] px-3 py-6">
            <div className="h-[1px] w-full bg-rule" />
            <Barcode value={id} height={120} className="rotate-90" showValue={false} />
            <div className="text-[8px] uppercase tracking-[0.16em] text-sub">scan</div>
          </div>
        </>
      )}
      {footer && (
        <div className="absolute inset-x-0 bottom-0 border-t border-dashed border-rule bg-[#FBFAF9] px-6 py-3 text-[12px] text-sub">
          {footer}
        </div>
      )}
    </div>
  );
}