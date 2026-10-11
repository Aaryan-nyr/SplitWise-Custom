import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "../auth";
import { ExpenseForm } from "../components/expense-form";
import { Sidebar } from "../components/sidebar";
import { validateUserSession } from "../lib/auth-helpers";

export default async function ExpensesPage() {
  const session = await validateUserSession();

  return (
    <div className="flex min-h-screen bg-[#f7f9fc]">
      <Sidebar />

      <main className="flex-1 px-4 py-6 sm:px-8 sm:py-10">
        <ExpenseForm />
      </main>
    </div>
  );
}