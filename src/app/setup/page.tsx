import { setupAdminAction } from "@/app/auth-actions";
import { FloatingField } from "@/components/floating-field";
import { hasAdminUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SetupPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await hasAdminUser()) {
    redirect("/login");
  }

  const params = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6 dark:bg-slate-950">
      <form action={setupAdminAction} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl dark:bg-slate-900">
        <h1 className="text-2xl font-black">Create admin account</h1>
        <p className="mt-2 text-sm text-slate-500">
          This first-run setup creates the only admin account. No default credentials are shipped.
        </p>
        {params.error ? (
          <p className="mt-4 text-sm font-semibold text-red-600">
            Enter a valid email and a password with at least 8 characters.
          </p>
        ) : null}
        <FloatingField label="Email" className="mt-6">
          <input className="field" name="email" type="email" placeholder="Email" required />
        </FloatingField>
        <FloatingField label="Password" className="mt-4">
          <input className="field" name="password" type="password" placeholder="Password" minLength={8} required />
        </FloatingField>
        <button className="btn mt-6 w-full" type="submit">
          Create account
        </button>
      </form>
    </main>
  );
}
