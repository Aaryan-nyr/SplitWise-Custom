"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

//remove background later
export function Navbar() {
  return (
    <div className="w-full rounded-lg bg-slate-100 p-4 shadow-md ring-1 ring-slate-200">
      <div className="flex w-full items-end justify-between gap-4 sm:flex-row">
        <div className="flex-1">
          <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-sky-600 uppercase">Household workspace</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Weekly ToDos</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Keep the small things moving, together.</p>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => signOut({ callbackUrl: "/login" })}>Sign Out</Button>
        </div>
      </div>
    </div>
  );
}
