"use client";

import { useState } from "react";
import { Bell, UserRound } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function AppTopBar({
  userName,
  userImage,
}: {
  userName?: string | null;
  userImage?: string | null;
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const initials =
    userName
      ?.trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || <UserRound className="size-4" aria-hidden="true" />;

  return (
    <header className="sticky top-0 z-30 -mx-4 -mt-6 mb-6 flex h-16 items-center justify-end gap-3 border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur-sm sm:-mx-8 sm:-mt-10 sm:px-8">
      <div className="relative">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          aria-expanded={showNotifications}
          aria-controls="notifications-message"
          title="Notifications"
          className="relative size-10 rounded-xl text-slate-600 hover:bg-sky-50 hover:text-sky-800"
          onClick={() => setShowNotifications((show) => !show)}
        >
          <Bell aria-hidden="true" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-sky-600 ring-2 ring-white" />
        </Button>
        {showNotifications && (
          <div
            id="notifications-message"
            role="status"
            className="absolute right-0 top-12 z-40 w-64 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 shadow-lg sm:w-72"
          >
            Notifications are coming in a future release.
          </div>
        )}
      </div>
      <Link
        href="/profile"
        aria-label="Open profile settings"
        title="Profile settings"
        className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-700"
      >
        <Avatar className="size-10 ring-2 ring-sky-100" aria-label={userName ?? "User profile"}>
          {userImage && <AvatarImage src={userImage} alt="" />}
          <AvatarFallback className="bg-sky-100 text-sm font-semibold text-sky-800">
            {initials}
          </AvatarFallback>
        </Avatar>
      </Link>
    </header>
  );
}
