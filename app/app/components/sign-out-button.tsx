"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SignOutButton({
  className,
  collapsed = false,
}: {
  className?: string;
  collapsed?: boolean;
}) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setIsSigningOut(true);
    setError(null);

    try {
      const result = await signOut({ redirect: false, callbackUrl: "/login" });
      if (!result?.url) {
        throw new Error("The sign-out request did not return a destination.");
      }

      window.location.assign(result.url);
    } catch (signOutError) {
      setIsSigningOut(false);
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : "Sign out failed. Please try again."
      );
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        aria-label="Sign out"
        title="Sign out"
        disabled={isSigningOut}
        className={cn(
          "h-10 min-w-fit justify-start gap-2 px-3 text-xs text-slate-600 hover:bg-rose-50 hover:text-rose-700 sm:text-sm",
          className
        )}
        onClick={handleSignOut}
      >
        <LogOut aria-hidden="true" />
        <span className={collapsed ? "md:sr-only" : undefined}>
          {isSigningOut ? "Signing out..." : "Sign out"}
        </span>
      </Button>
      {error && (
        <p className="mt-2 text-xs text-rose-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
