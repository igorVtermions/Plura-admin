import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function MetricsPage() {
  const revenueCards = [
    {
      value: "R$ 1.950,00",
      label: "Receita líquida",
      bg: "bg-[#e4f3e7]",
      accent: "text-[#0f5e32]",
    },
    {
      value: "R$ 1.560,00",
      label: "Receita bruta",
      bg: "bg-[#e4f3e7]",
      accent: "text-[#0f5e32]",
    },
  ];

  const subscriptionCards = [
    {
      value: "11",
      label: "Novos cadastros",
      description: "Cadastros que estão em período de teste",
      bg: "bg-[#f0eaff]",
      accent: "text-[#5a36cc]",
      span: "md:col-span-2",
    },
    {
      value: "55",
      label: "Novos assinantes",
      bg: "bg-[#f0eaff]",
      accent: "text-[#5a36cc]",
    },
    {
      value: "5",
      label: "Canceladas",
      bg: "bg-[#f0eaff]",
      accent: "text-[#5a36cc]",
    },
  ];

  const sessionCards = [
    {
      value: "67%",
      label: "Conclusão por sessão",
      description: "Média de conclusão de sessões por usuários",
      bg: "bg-[#ffe9d6]",
      accent: "text-[#c2410c]",
      span: "md:col-span-2",
    },
    {
      value: "55 min.",
      label: "Média de duração",
      bg: "bg-[#ffe9d6]",
      accent: "text-[#c2410c]",
    },
  ];

  const engagementCards = [
    {
      value: "44",
      label: "Usuários ativos",
      bg: "bg-[#f0eaff]",
      accent: "text-[#5a36cc]",
    },
    {
      value: "89%",
      label: "Ativos nos chats",
      bg: "bg-[#f0eaff]",
      accent: "text-[#5a36cc]",
    },
    {
      value: "90%",
      label: "Ativos na salas",
      bg: "bg-[#f0eaff]",
      accent: "text-[#5a36cc]",
    },
  ];

  const demographicCards = [
    {
      value: "50%",
      label: "Mulheres",
      bg: "bg-[#ffe9d6]",
      accent: "text-[#c2410c]",
    },
    {
      value: "40%",
      label: "Homens",
      bg: "bg-[#ffe9d6]",
      accent: "text-[#c2410c]",
    },
    {
      value: "10%",
      label: "Outro",
      bg: "bg-[#ffe9d6]",
      accent: "text-[#c2410c]",
    },
  ];

  const chartPoints = [20, 45, 35, 80, 50, 70, 60, 65, 55, 58, 52, 57];
  const chartLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const chartPath = chartPoints
    .map((value, index) => {
      const x = (index / (chartPoints.length - 1)) * 600;
      const y = 200 - (value / 100) * 160 - 20;
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-400">Visão geral de métricas</p>
            <h1 className="text-3xl font-semibold text-[#17132b]">Dashboard</h1>
          </div>
          <Button className="w-full sm:w-auto bg-[#17132b] hover:bg-[#221f3c] text-white px-6 rounded-full">
            Exportar dados
          </Button>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          {revenueCards.map((card, index) => (
            <Card key={index} className={`${card.bg} rounded-3xl border-none shadow-sm p-6 flex flex-col gap-1 h-full`}>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className={`text-4xl font-semibold ${card.accent}`}>{card.value}</p>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card className="rounded-3xl border-none shadow-md p-6 bg-white">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <p className="text-sm uppercase text-gray-400">Tendência</p>
                <h2 className="text-xl font-semibold text-[#17132b]">Novos cadastros</h2>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-2xl font-semibold text-[#17132b]">1.045</p>
                <p className="text-sm text-gray-500">+45 vs mês anterior</p>
              </div>
            </div>
            <div className="relative h-64">
              <svg viewBox="0 0 600 240" className="w-full h-full">
                <defs>
                  <linearGradient id="lineGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#5a36cc" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#9d71ff" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                <path
                  d={`${chartPath}`}
                  fill="none"
                  stroke="#5a36cc"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d={`${chartPath} L600,220 L0,220 Z`}
                  fill="url(#lineGradient)"
                  opacity="0.3"
                />
                {chartPoints.map((value, index) => {
                  const x = (index / (chartPoints.length - 1)) * 600;
                  const y = 200 - (value / 100) * 160 - 20;
                  return <circle key={index} cx={x} cy={y} r={5} fill="#5a36cc" />;
                })}
                {chartLabels.map((label, index) => (
                  <text
                    key={label}
                    x={(index / (chartLabels.length - 1)) * 600}
                    y={230}
                    textAnchor="middle"
                    className="text-xs fill-gray-400"
                  >
                    {label}
                  </text>
                ))}
              </svg>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {subscriptionCards.map((card, index) => (
              <Card
                key={index}
                className={`${card.bg} rounded-3xl border-none shadow-sm p-6 flex flex-col gap-1 h-full`}
              >
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className={`text-4xl font-semibold ${card.accent}`}>{card.value}</p>
                {card.description && <p className="text-sm text-gray-500">{card.description}</p>}
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessionCards.map((card, index) => (
            <Card
              key={index}
              className={`${card.bg} rounded-3xl border-none shadow-sm p-6 flex flex-col gap-1 h-full ${card.span ?? ""}`}
            >
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className={`text-4xl font-semibold ${card.accent}`}>{card.value}</p>
              {card.description && <p className="text-sm text-gray-500">{card.description}</p>}
            </Card>
          ))}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {engagementCards.map((card, index) => (
            <Card key={index} className={`${card.bg} rounded-3xl border-none shadow-sm p-6 flex flex-col gap-1 h-full`}>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className={`text-4xl font-semibold ${card.accent}`}>{card.value}</p>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-4">
          {demographicCards.map((card, index) => (
            <Card key={index} className={`${card.bg} rounded-3xl border-none shadow-sm p-6 flex flex-col gap-1 h-full`}>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className={`text-4xl font-semibold ${card.accent}`}>{card.value}</p>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
}