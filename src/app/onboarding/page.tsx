import { redirect } from "next/navigation";
import { ensureUser } from "@/lib/auth";
import { Onboarding } from "@/features/hogar/Onboarding";

export default async function OnboardingPage() {
  const user = await ensureUser();
  // Si ya tiene hogar, no hay nada que hacer acá.
  if (user.hogar_id) redirect("/dashboard");
  return <Onboarding />;
}
