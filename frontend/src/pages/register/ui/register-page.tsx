import { redirect } from "next/navigation";

import { getCustomer } from "@entities/customer";
import { SignupForm, safeRedirect } from "@features/auth";

type Props = { searchParams: Promise<{ next?: string | string[] }> };

export async function RegisterPage({ searchParams }: Props) {
  const redirectTo = safeRedirect((await searchParams).next);
  if (await getCustomer()) redirect(redirectTo);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignupForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
