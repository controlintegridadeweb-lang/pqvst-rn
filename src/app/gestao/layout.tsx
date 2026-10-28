import { Suspense, type ReactNode } from "react";
import { ManagementNav } from "@/app/gestao/management-nav";
import { readInstitutionalAccess } from "@/infrastructure/auth/session";

export default function ManagementLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lg:grid lg:grid-cols-[300px_1fr]">
      <aside className="bg-[#eef1f8] p-3 lg:min-h-screen lg:p-4">
        <Suspense fallback={<MenuFallback />}>
          <ManagementNavGate />
        </Suspense>
      </aside>
      <div className="min-w-0 bg-[#eef1f8]">{children}</div>
    </div>
  );
}

function MenuFallback() {
  return <div className="min-h-[28rem] rounded-[2rem] bg-white lg:h-[calc(100vh-6.5rem)]" />;
}

async function ManagementNavGate() {
  const access = await readInstitutionalAccess();
  if (access.status !== "ready") return <ManagementNav role={null} fullName={null} />;
  return <ManagementNav role={access.session.role} fullName={access.session.fullName} />;
}
