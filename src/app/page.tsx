import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Plura Talks - Administrador
      </h1>
      <p className="text-muted-foreground text-center max-w-prose">
        Bem-vindo ao painel administrativo. Este é o esqueleto inicial já com
        Tailwind e componentes base prontos para evoluir rapidamente.
      </p>
      <div className="flex gap-3">
        <Button>Primário</Button>
        <Button variant="secondary">Secundário</Button>
        <Button variant="outline">Outline</Button>
      </div>
    </main>
  );
}
