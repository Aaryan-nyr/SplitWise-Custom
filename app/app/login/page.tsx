"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, House, LoaderCircle, UsersRound } from "lucide-react";
import { getSession, signIn } from "next-auth/react";

export default function LoginPage() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<
    "checking" | "active" | "none" | "error"
  >("checking");
  const [activeSessionEmail, setActiveSessionEmail] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      setSessionStatus("checking");

      try {
        const session = await getSession();
        if (!isMounted) return;

        setActiveSessionEmail(session?.user?.email ?? null);
        setSessionStatus(session ? "active" : "none");
      } catch {
        if (isMounted) setSessionStatus("error");
      }
    }

    void checkSession();
    window.addEventListener("focus", checkSession);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", checkSession);
    };
  }, []);

  async function handleSignIn() {
    setError(null);

    try {
      const requestedCallbackUrl = new URLSearchParams(window.location.search).get(
        "callbackUrl"
      );
      const callbackUrl =
        requestedCallbackUrl &&
        /^\/join\/[A-Za-z0-9_-]{43}$/.test(requestedCallbackUrl)
          ? requestedCallbackUrl
          : "/";

      setSessionStatus("checking");
      const currentSession = await getSession();
      if (currentSession) {
        setActiveSessionEmail(currentSession.user?.email ?? null);
        setSessionStatus("active");
        return;
      }

      setActiveSessionEmail(null);
      setSessionStatus("none");
      setIsSigningIn(true);
      await signIn("google", { callbackUrl });
    } catch (signInError) {
      setIsSigningIn(false);
      setError(
        signInError instanceof Error
          ? signInError.message
          : "We couldn't start sign-in. Please try again."
      );
      setSessionStatus("error");
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f9fc] px-4 py-6 sm:px-6 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 right-[-8rem] h-96 w-96 rounded-full bg-sky-100/70 blur-3xl" />
        <div className="absolute -bottom-48 left-[-8rem] h-96 w-96 rounded-full bg-indigo-100/60 blur-3xl" />
      </div>

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-white bg-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.22)] md:min-h-[620px] md:grid-cols-[1.05fr_0.95fr] md:rounded-[2rem]">
        <section className="flex flex-col justify-between p-6 sm:p-10 lg:p-14">
          <div className="inline-flex w-fit items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
              <House size={20} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <span className="text-base font-bold tracking-tight text-slate-900">Household Split</span>
          </div>

          <div className="py-8 md:py-10">
            <p className="mb-4 text-sm font-semibold tracking-wide text-sky-700">A calmer way to share the load</p>
            <h1 className="max-w-lg text-4xl font-bold leading-[1.1] tracking-tight text-slate-950 sm:text-5xl">
              Make home life <span className="text-sky-600">easier together.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
              Keep household tasks in one place, see what needs doing, and stay in sync with the people you live with.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <Check size={16} strokeWidth={2.5} aria-hidden="true" />
                </span>
                Shared tasks that are easy to keep up with
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <Check size={16} strokeWidth={2.5} aria-hidden="true" />
                </span>
                One clear view of what&apos;s next
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500">Sign in to get back to your household workspace.</p>
        </section>

        <section className="flex items-center justify-center bg-gradient-to-br from-sky-50 via-slate-50 to-indigo-50 p-6 sm:p-10 md:p-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm ring-1 ring-slate-200/70">
                <UsersRound size={22} aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Continue with your Google account to open your shared workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSignIn}
              disabled={
                isSigningIn ||
                sessionStatus === "checking" ||
                sessionStatus === "active" ||
                sessionStatus === "error"
              }
              aria-busy={isSigningIn || sessionStatus === "checking"}
              className="group flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:cursor-wait disabled:opacity-70"
            >
              {sessionStatus === "active" ? (
                <span>User already signed in</span>
              ) : (
                <>
                  {isSigningIn || sessionStatus === "checking" ? (
                    <LoaderCircle
                      size={19}
                      className="animate-spin text-slate-600"
                      aria-hidden="true"
                    />
                  ) : (
                    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.74 7.18l7.64 5.93c4.46-4.12 7.14-10.2 7.14-17.58Z" />
                      <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.87l-7.64-5.93c-2.12 1.42-4.84 2.27-8.27 2.27-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
                    </svg>
                  )}
                  <span>
                    {isSigningIn
                      ? "Connecting to Google..."
                      : sessionStatus === "checking"
                        ? "Checking current session..."
                        : "Continue with Google"}
                  </span>
                  {!isSigningIn && sessionStatus !== "checking" && (
                    <ArrowRight
                      size={17}
                      className="ml-auto text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-600"
                      aria-hidden="true"
                    />
                  )}
                </>
              )}
            </button>

            <p
              className={`mt-4 min-h-5 text-center text-xs leading-5 ${
                sessionStatus === "active" || sessionStatus === "error" || error
                  ? "text-rose-700"
                  : "text-slate-500"
              }`}
              aria-live="polite"
              role={sessionStatus === "active" || sessionStatus === "error" || error ? "alert" : undefined}
            >
              {sessionStatus === "active"
                ? `A user is already signed in in this browser. Use a different browser profile or a private window to sign in as another user.`
                : sessionStatus === "error"
                  ? error ?? "We couldn't verify the current session. Refresh this page before signing in."
                  : error ?? "Secure sign-in provided by Google."}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
