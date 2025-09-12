import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Variant = "live" | "upcoming";

type Props = {
  variant: Variant;
  title: string;
  speaker: string;
  time: string;
};

export function SessionCard({ variant, title, speaker, time }: Props) {
  const isLive = variant === "live";
  const tone = isLive
    ? { bg: "#F3F0FF", chip: "#977CEC", chipText: "#361A6D", btn: "#977CEC" }
    : { bg: "#FFF4E5", chip: "#F4A259", chipText: "#7A4E00", btn: "#F4A259" };

  return (
    <Card style={{ background: tone.bg }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{time}</span>
          <span
            className="px-2 py-0.5 rounded-full"
            style={{ background: `${tone.chip}20`, color: tone.chipText }}
          >
            {isLive ? "Ao vivo" : "Em breve"}
          </span>
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{speaker}</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-7 w-7 rounded-full ring-2 ring-white"
                style={{ background: ["#c4b5fd", "#a78bfa", "#7c3aed", "#6b21a8"][i] }}
                aria-hidden
              />
            ))}
          </div>
          <Button style={{ background: tone.btn }}>
            {isLive ? "Ingressar na sala" : "Lembre-me"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

