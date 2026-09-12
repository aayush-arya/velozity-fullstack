import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV_BY_ROLE = {
  ADMIN: [
    { to: "/admin", label: "Overview" },
    { to: "/projects", label: "Projects" },
  ],
  PM: [
    { to: "/pm", label: "Overview" },
    { to: "/projects", label: "Projects" },
  ],
  DEVELOPER: [{ to: "/developer", label: "My Tasks" }],
} as const;

export function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;
  const links = NAV_BY_ROLE[user.role];

  return (
    <aside className="hidden w-56 flex-none border-r border-slate-200 bg-white sm:flex sm:flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-slate-100 px-5">
        <div className="h-6 w-6 rounded-md bg-brand-600" />
        <span className="text-sm font-semibold text-slate-800">Agency Dashboard</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 text-sm font-medium ${
                isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-100 p-3 text-xs text-slate-400">Role: {user.role}</div>
    </aside>
  );
}
