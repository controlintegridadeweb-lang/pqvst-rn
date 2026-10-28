import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasSubmissionReceipt } from "@/infrastructure/participation/pass";

export const metadata = { title: "Envio aceito" };

export default function SubmittedPage() {
  return (
    <Suspense fallback={<p className="px-5 py-12 text-sm text-muted">Conferindo o envio…</p>}>
      <Receipt />
    </Suspense>
  );
}

async function Receipt() {
  if (!(await hasSubmissionReceipt())) redirect("/diagnostico");

  return (
    <section className="bg-[#fff7f9] px-4 py-16">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-sm font-medium text-pine">Diagnóstico</p>
        <h1 className="mt-3 text-3xl text-ink">O envio foi aceito.</h1>
        <p className="mt-4 text-base leading-7 text-[#3f3f3f]">
          Esta credencial não pode ser usada outra vez. As respostas ficam no órgão e no ciclo, sem nome, CPF, matrícula
          ou e-mail.
        </p>
        <Link href="/" className="mt-8 inline-block rounded-full bg-pine px-6 py-2.5 text-base font-medium text-white no-underline">
          Voltar ao início
        </Link>
      </div>
    </section>
  );
}
