"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Home, LayoutList, PanelLeftClose, PanelLeftOpen, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

import { SignOutButton } from "./sign-out-button";

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
      className={`w-full shrink-0 border-b border-sky-200 bg-sky-100/90 backdrop-blur-sm md:border-r md:border-b-0 md:transition-[width] md:duration-200 ${isCollapsed ? "md:w-16" : "md:w-64"}`}
    >
      <div className={`flex h-auto flex-col gap-3 p-3 md:h-full ${isCollapsed ? "md:items-center" : ""}`}>
        <div className={`flex w-full items-center justify-between gap-3 px-1 md:mb-6 ${isCollapsed ? "md:flex-col md:gap-3" : ""}`}>
          <div className={isCollapsed ? "md:hidden" : ""}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
              Household
            </p>
            <h1 className="mt-1 text-xl font-bold text-slate-900">Split</h1>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            onClick={() => setIsCollapsed((collapsed) => !collapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
          </Button>
        </div>

        <nav className="flex w-full gap-2 md:flex-col md:space-y-2">
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
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors md:flex-row md:flex-none md:justify-start md:gap-3 md:px-3 md:py-2.5 md:text-sm",
                  isCollapsed ? "md:justify-center md:px-0" : "",
                  isActive
                    ? "bg-sky-700 text-white shadow-sm ring-1 ring-sky-800"
                    : "text-slate-700 hover:bg-white/80 hover:text-sky-900",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className={isCollapsed ? "md:sr-only" : ""}>{label}</span>
              </Link>
            );
          })}
          <SignOutButton
            collapsed={isCollapsed}
            className={`h-auto min-w-0 flex-1 flex-col gap-1 px-1 py-2 text-[11px] md:h-10 md:flex-none md:flex-row md:gap-3 md:px-3 md:py-2.5 md:text-sm ${isCollapsed ? "md:size-8 md:justify-center md:px-0 md:py-0" : ""}`}
          />
        </nav>

      </div>
    </aside>
  );
}