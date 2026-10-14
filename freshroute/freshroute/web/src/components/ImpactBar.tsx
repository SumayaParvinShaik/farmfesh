import type { Impact } from "../core/impact";

export default function ImpactBar({ impact, t }: { impact: Impact; t: (k: string) => string }) {
  const items = [
    { icon: "🥕", value: impact.kgRescued.toLocaleString("en-IN"), label: t("kgRescued") },
    { icon: "₹", value: impact.incomeRecovered.toLocaleString("en-IN"), label: t("incomeRecovered") },
    { icon: "🌍", value: impact.co2AvoidedKg.toLocaleString("en-IN"), label: t("co2") },
  ];
  return (
    <section className="mb-4 grid grid-cols-3 gap-3" aria-label={t("impact")}>
      {items.map((i) => (
        <div key={i.label} className="rounded-xl bg-leaf-900 p-3 text-center text-white shadow-sm">
          <div className="text-xl font-bold">
            {i.icon} {i.value}
          </div>
          <div className="text-xs opacity-80">{i.label}</div>
        </div>
      ))}
    </section>
  );
}
