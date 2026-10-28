export const metadata = { title: "Privacidade" };

export default function PrivacyPage() {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-12 lg:grid-cols-2 lg:py-16">
        <div>
          <p className="text-sm font-medium text-pine">LGPD</p>
          <h1 className="mt-3 max-w-xl text-4xl text-ink md:text-5xl">A escuta precisa proteger quem respondeu.</h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-[#3f3f3f]">
            As respostas podem tratar de saúde, relações de trabalho e condições institucionais. A plataforma aplica
            minimização, finalidade e separação entre elegibilidade e análise.
          </p>
        </div>
        <img
          src="/privacidade-notebook.jpg"
          alt="Notebook aberto com um cadeado de metal à frente, sobre uma forma rosa."
          className="h-auto w-full object-contain"
        />
      </div>
      <div className="h-1 bg-[#d12d6c]" />
    </section>
  );
}
