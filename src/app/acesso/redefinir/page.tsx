import { AccessCard } from "@/app/acesso/access-card";
import { ResetPasswordForm } from "@/app/acesso/redefinir/reset-password-form";

export const metadata = { title: "Redefinir senha" };

export default function ResetPasswordPage() {
  return (
    <section className="bg-[#fff7f9] px-4 py-10 md:py-16">
      <AccessCard>
        <ResetPasswordForm />
      </AccessCard>
    </section>
  );
}
