type StatCard = {
  label: string;
  value: number;
  hint?: string;
};

export function PipelineStats({
  todayLabel,
  cards,
}: {
  todayLabel: string;
  cards: StatCard[];
}) {
  return (
    <section aria-label="Pipeline statistics">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-text-secondary">
          Stats
        </h2>
        <p className="text-[0.65rem] text-text-secondary">Today · {todayLabel} (Stockholm)</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <div key={card.label} className="border border-border p-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-text-secondary">
              {card.label}
            </p>
            <p className="mt-2 font-display text-3xl font-bold tracking-[-0.03em] tabular-nums">
              {card.value}
            </p>
            {card.hint ? <p className="mt-1 text-[0.65rem] text-text-secondary">{card.hint}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
