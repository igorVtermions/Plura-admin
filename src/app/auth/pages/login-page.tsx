import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";
import { LoginForm } from "@/app/auth/components/login-form";
import Link from "@/router/Link";
import { SuccessBanner } from "@/app/home/components/success-banner";
import { useRouter } from "@/lib/router";
import { getClientToken } from "@/services/api";

export function LoginPage() {
  const router = useRouter();

  React.useEffect(() => {
    const token = getClientToken();
    if (token) router.push("/home");
  }, [router]);

  return (
    <main className="min-h-dvh w-full bg-white flex flex-col items-center justify-center px-6 py-10 gap-8">
      <SuccessBanner />
      <div className="flex items-center gap-2">
        <Logo />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>Acesse sua conta administrativa</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
        <CardFooter className="flex-col gap-2 items-center">
          <p className="text-sm text-muted-foreground">Não tem conta?</p>
          <Link href="/register" className="text-sm font-medium text-primary hover:underline">
            Registrar-se
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
