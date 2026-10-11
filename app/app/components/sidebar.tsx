"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Home, LayoutList, PanelLeftClose, PanelLeftOpen, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/todo", label: "Todo", icon: LayoutList },
  { href: "/expenses", label: "Expenses", icon: Wallet },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`shrink-0 border-r border-slate-200 bg-white/90 backdrop-blur-sm transition-[width] duration-200 ${isCollapsed ? "w-16" : "w-64"}`}>
      <div className={`flex h-full flex-col p-3 ${isCollapsed ? "items-center" : ""}`}>
        <div className={`mb-6 flex w-full items-center ${isCollapsed ? "flex-col gap-3" : "justify-between px-1"}`}>
          {!isCollapsed && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
                Household
              </p>
              <h1 className="mt-2 text-xl font-bold text-slate-900">Split</h1>
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed((collapsed) => !collapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
          </Button>
        </div>

        <nav className="w-full space-y-2">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex items-center rounded-xl py-2.5 text-sm font-medium transition-colors",
                  isCollapsed ? "justify-center px-0" : "gap-3 px-3",
                  isActive
                    ? "bg-sky-50 text-sky-700 ring-1 ring-sky-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {!isCollapsed && <span>{label}</span>}
                {isCollapsed && <span className="sr-only">{label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}