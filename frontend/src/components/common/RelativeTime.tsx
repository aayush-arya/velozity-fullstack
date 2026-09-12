import { useEffect, useState } from "react";
import { formatRelativeTime } from "../../utils/formatRelativeTime";

// Re-renders every 30s so "2 minutes ago" quietly becomes "3 minutes ago"
// as time passes, instead of freezing at whatever it read on first render.
export function RelativeTime({ date, className }: { date: string; className?: string }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <time dateTime={date} className={className} title={new Date(date).toLocaleString()}>
      {formatRelativeTime(date)}
    </time>
  );
}
