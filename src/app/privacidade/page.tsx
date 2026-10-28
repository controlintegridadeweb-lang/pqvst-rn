import { DISCLOSURE_THRESHOLD } from "@/domain/privacy/disclosure";

export const metadata = { title: "Privacidade" };

const PRINCIPLES = [
  "O nome da pessoa não é publicado junto da resposta.",
  "CPF, matrícula e e-mail não são guardados no questionário.",
  "O painel não mostra resposta individual nem comentário aberto.",
  "Grupo pequeno fica de fora da divulgação.",
  "A credencial de participação não fica ligada à resposta armazenada.",
  "Endereço IP não é usado para acompanhar participante.",
  "Logs administrativos não recebem o conteúdo sensível da resposta.",
];

export default function PrivacyPage() {
  return (
    <>
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-12 lg:grid-cols-2 lg:py-16">
          <div>
            <p className="text-sm font-medium text-pine">LGPD</p>
            <h1 className="mt-3 max-w-xl text-4xl text-ink md:text-5xl">A escuta precisa proteger quem respondeu.</h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-[#3f3f3f]">
              As respostas podem tratar de saúde, relações de trabalho e condições institucionais. A plataforma aplica
              minimização, finalidade e separação entre elegibilidade e análise.
            </p>
            <a
              href="#limite"
              className="mt-8 inline-block rounded-full bg-pine px-6 py-2.5 text-base font-medium text-white no-underline"
            >
              Ver o limite
            </a>
          </div>
          <img
            src="/privacidade-notebook.jpg"
            alt="Notebook aberto com um cadeado de metal à frente, sobre uma forma rosa."
            className="h-auto w-full object-contain"
          />
        </div>
        <div className="h-1 bg-[#d12d6c]" />
      </section>

      <section className="bg-[#fde7f0]">
        <div className="mx-auto grid max-w-6xl gap-5 px-5 py-12 lg:grid-cols-2">
          <article className="rounded-3xl bg-[#fff7f9] p-6">
            <span className="grid size-12 place-items-center rounded-full bg-pine text-white">
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
              </svg>
            </span>
            <h2 className="mt-4 text-xl text-ink">O que não entra na divulgação</h2>
            <ul className="mt-4 space-y-2 text-base leading-7 text-[#3f3f3f]">
              {PRINCIPLES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article id="limite" className="scroll-mt-8 rounded-3xl bg-[#fff7f9] p-6">
            <span className="grid size-12 place-items-center rounded-full bg-pine text-white">
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M12 3 5 6v6c0 4.2 2.9 7.4 7 9 4.1-1.6 7-4.8 7-9V6z" strokeLinejoin="round" />
              </svg>
            </span>
            <h2 className="mt-4 text-xl text-ink">Limite de divulgação</h2>
            <div className="mt-4 space-y-3 text-base leading-7 text-[#3f3f3f]">
              <p>{DISCLOSURE_THRESHOLD.statement}</p>
              <p>
                O anonimato absoluto não é prometido. Quem administra o banco pode, em tese, correlacionar horários de
                consumo da credencial e de envio da resposta. Por isso a credencial não guarda o identificador do envio,
                e o acesso às respostas brutas não é concedido aos perfis da aplicação.
              </p>
              <p>
                O prazo de retenção e o procedimento de incidente ainda dependem de decisão institucional. Nenhum
                descarte automático foi inventado.
              </p>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
