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
    <aside
      className={`w-full shrink-0 border-b border-slate-200 bg-white/90 backdrop-blur-sm min-[431px]:border-r min-[431px]:border-b-0 min-[431px]:transition-[width] min-[431px]:duration-200 ${isCollapsed ? "min-[431px]:w-16" : "min-[431px]:w-64"}`}
    >
      <div className={`flex h-auto flex-col gap-3 p-3 min-[431px]:h-full ${isCollapsed ? "min-[431px]:items-center" : ""}`}>
        <div className={`flex w-full items-center justify-between gap-3 px-1 min-[431px]:mb-6 ${isCollapsed ? "min-[431px]:flex-col min-[431px]:gap-3" : ""}`}>
          <div className={isCollapsed ? "min-[431px]:hidden" : ""}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
              Household
            </p>
            <h1 className="mt-1 text-xl font-bold text-slate-900">Split</h1>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden min-[431px]:inline-flex"
            onClick={() => setIsCollapsed((collapsed) => !collapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
          </Button>
        </div>

        <nav className="flex w-full gap-2 min-[431px]:flex-col min-[431px]:space-y-2">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors min-[431px]:flex-row min-[431px]:flex-none min-[431px]:justify-start min-[431px]:gap-3 min-[431px]:px-3 min-[431px]:py-2.5 min-[431px]:text-sm",
                  isCollapsed ? "min-[431px]:justify-center min-[431px]:px-0" : "",
                  isActive
                    ? "bg-sky-50 text-sky-700 ring-1 ring-sky-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className={isCollapsed ? "min-[431px]:sr-only" : ""}>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}