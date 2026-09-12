import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2 bg-slate-50">
      <p className="text-4xl font-bold text-slate-300">404</p>
      <p className="text-sm text-slate-500">This page doesn't exist.</p>
      <Link to="/" className="mt-2 text-sm font-medium text-brand-600 hover:underline">
        Go home
      </Link>
    </div>
  );
}
