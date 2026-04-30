import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/auth-actions";
import { FloatingField } from "@/components/floating-field";
import { getCurrentAdmin, hasAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await hasAdminUser())) {
    redirect("/setup");
  }

  if (await getCurrentAdmin()) {
    redirect("/admin");
  }

  const params = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6 dark:bg-slate-950">
      <form action={loginAction} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl dark:bg-slate-900">
        <h1 className="text-2xl font-black">Admin login</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in to manage grid settings.</p>
        {params.error ? <p className="mt-4 text-sm font-semibold text-red-600">Invalid login.</p> : null}
        <FloatingField label="Email" className="mt-6">
          <input className="field" name="email" type="email" placeholder="Email" required />
        </FloatingField>
        <FloatingField label="Password" className="mt-4">
          <input className="field" name="password" type="password" placeholder="Password" required />
        </FloatingField>
        <button className="btn mt-6 w-full" type="submit">
          Sign in
        </button>
        <Link href="/" className="mt-4 block text-center text-sm text-slate-500">
          Back to grid
        </Link>
      </form>
    </main>
  );
}
