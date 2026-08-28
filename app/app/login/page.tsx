"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main>
      <h1>Sign in</h1>
      <button type="button" onClick={() => signIn("google")}>
        Continue with Google
      </button>
    </main>
  );
}
