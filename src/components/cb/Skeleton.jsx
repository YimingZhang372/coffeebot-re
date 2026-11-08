export default function Skeleton({ rows = 3, className = "" }) {
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 w-full bg-[#DAD6D1]" style={{ opacity: 1 - i * 0.12 }} />
      ))}
    </div>
  );
}