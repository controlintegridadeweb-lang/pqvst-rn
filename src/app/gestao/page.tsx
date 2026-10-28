import { Suspense } from "react";
import { HomeDashboard } from "@/app/gestao/home-dashboard";
import { readDeskAccess } from "@/app/gestao/coleta/load";

export const metadata = { title: "Gestão" };

export default function ManagementHomePage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4.5rem)] bg-[#eef1f8]" />}>
      <ManagementHome />
    </Suspense>
  );
}

async function ManagementHome() {
  const access = await readDeskAccess();
  if (access.status === "ready") {
    return <HomeDashboard desk={access.desk} notice={null} />;
  }
  if (access.status === "error") {
    return <HomeDashboard desk={null} notice={access.message} />;
  }
  if (access.status === "closed") {
    return (
      <HomeDashboard
        desk={null}
        notice="Enquanto a configuração do servidor estiver incompleta, os números da gestão não são exibidos."
      />
    );
  }
  return (
    <HomeDashboard
      desk={null}
      notice="Entre em Acesso de gestores para ver órgãos, ciclos, credenciais e respostas desta instalação."
    />
  );
}
