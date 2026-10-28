export function PageHeader({
  kicker,
  title,
  lede,
}: {
  kicker: string;
  title: string;
  lede: string;
}) {
  return (
    <header className="mx-auto max-w-6xl px-5 pt-12 pb-6">
      <p className="text-sm font-medium text-pine">{kicker}</p>
      <h1 className="mt-2 max-w-3xl text-3xl text-ink md:text-4xl">{title}</h1>
      <p className="mt-4 max-w-3xl text-base text-[#3f3f3f]">{lede}</p>
    </header>
  );
}
