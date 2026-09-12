export function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: "red" | "brand" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold ${
          accent === "red" ? "text-red-600" : accent === "brand" ? "text-brand-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
