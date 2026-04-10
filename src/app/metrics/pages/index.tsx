import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type MetricCard = {
  value: string;
  label: string;
  description?: string;
  bg?: string;
  accent?: string;
  span?: string;
};

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

  const loadLogoPngDataUrl = async (): Promise<string | null> => {
    try {
      const response = await fetch("/LogoSmall.svg");
      if (!response.ok) return null;
      const svg = await response.text();
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const objectUrl = URL.createObjectURL(blob);

      try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = objectUrl;
        });

        const canvas = document.createElement("canvas");
        canvas.width = image.width || 240;
        canvas.height = image.height || 70;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/png");
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } catch {
      return null;
    }
  };

  const handleExportData = async () => {
    const { jsPDF } = await import("jspdf");
    const logoDataUrl = await loadLogoPngDataUrl();

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 14;

    let y = 18;

    pdf.setFillColor(23, 19, 43);
    pdf.roundedRect(margin, y, pageWidth - margin * 2, 34, 4, 4, "F");

    if (logoDataUrl) {
      pdf.addImage(logoDataUrl, "PNG", pageWidth - 66, y + 7, 42, 12);
    }

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.text("Plura Talks - Metrics Report", margin + 7, y + 13);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("Administrative Dashboard Snapshot", margin + 7, y + 20);

    const exportedAt = new Date();
    pdf.setTextColor(202, 191, 255);
    pdf.text(`Exported at: ${exportedAt.toLocaleString("pt-BR")}`, margin + 7, y + 27);
    y += 42;

    const ensureSpace = (needed: number) => {
      if (y + needed <= pageHeight - margin) return;
      pdf.addPage();
      y = 20;
    };

    const drawSection = (
      title: string,
      cards: MetricCard[],
      tone: { bg: [number, number, number]; border: [number, number, number]; value: [number, number, number] },
    ) => {
      ensureSpace(16);
      pdf.setTextColor(23, 19, 43);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text(title, margin, y);
      y += 4;

      const cardWidth = (pageWidth - margin * 2 - 6) / 2;
      const cardHeight = 18;

      cards.forEach((card, index) => {
        if (index % 2 === 0) ensureSpace(cardHeight + 6);
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = margin + col * (cardWidth + 6);
        const rowY = y + row * (cardHeight + 5);

        pdf.setFillColor(tone.bg[0], tone.bg[1], tone.bg[2]);
        pdf.setDrawColor(tone.border[0], tone.border[1], tone.border[2]);
        pdf.roundedRect(x, rowY, cardWidth, cardHeight, 3, 3, "FD");

        pdf.setTextColor(89, 97, 122);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);
        pdf.text(card.label, x + 3, rowY + 6);

        pdf.setTextColor(tone.value[0], tone.value[1], tone.value[2]);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text(card.value, x + 3, rowY + 13);
      });

      y += Math.ceil(cards.length / 2) * (cardHeight + 5) + 3;
    };

    drawSection("Revenue", revenueCards, {
      bg: [228, 243, 231],
      border: [185, 222, 194],
      value: [15, 94, 50],
    });

    drawSection("Subscriptions", subscriptionCards, {
      bg: [240, 234, 255],
      border: [217, 203, 255],
      value: [90, 54, 204],
    });

    drawSection("Sessions", sessionCards, {
      bg: [255, 233, 214],
      border: [255, 206, 168],
      value: [194, 65, 12],
    });

    drawSection("Engagement", engagementCards, {
      bg: [240, 234, 255],
      border: [217, 203, 255],
      value: [90, 54, 204],
    });

    drawSection("Demographics", demographicCards, {
      bg: [255, 233, 214],
      border: [255, 206, 168],
      value: [194, 65, 12],
    });

    ensureSpace(24);
    pdf.setTextColor(23, 19, 43);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Monthly Trend - New Signups", margin, y);
    y += 6;

    const rowH = 6;
    const colMonthW = 24;
    const colValueW = 24;

    pdf.setFillColor(245, 241, 255);
    pdf.roundedRect(margin, y, colMonthW + colValueW, rowH + 1.5, 2, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(58, 42, 106);
    pdf.text("Month", margin + 2, y + 4.2);
    pdf.text("Signups", margin + colMonthW + 2, y + 4.2);
    y += rowH + 2;

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(52, 58, 77);
    chartLabels.forEach((label, idx) => {
      ensureSpace(rowH + 1);
      if (idx % 2 === 0) {
        pdf.setFillColor(250, 249, 255);
        pdf.rect(margin, y - 4.5, colMonthW + colValueW, rowH, "F");
      }
      pdf.text(label, margin + 2, y);
      pdf.text(String(chartPoints[idx]), margin + colMonthW + 2, y);
      y += rowH;
    });

    const pad = (value: number) => String(value).padStart(2, "0");
    const filename = `plura-talks-metrics-${exportedAt.getFullYear()}${pad(exportedAt.getMonth() + 1)}${pad(exportedAt.getDate())}-${pad(exportedAt.getHours())}${pad(exportedAt.getMinutes())}.pdf`;
    pdf.save(filename);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-400">Visão geral de métricas</p>
            <h1 className="text-3xl font-semibold text-[#17132b]">Dashboard</h1>
          </div>
          <Button
            type="button"
            onClick={handleExportData}
            className="w-full sm:w-auto bg-[#17132b] hover:bg-[#221f3c] text-white px-6 rounded-full"
          >
            Exportar PDF
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