import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";
import { RegisterForm } from "@/features/auth/components/register-form";

export default function RegisterPage() {
  return (
    <main className="min-h-dvh w-full bg-white flex flex-col items-center justify-center px-6 py-10 gap-8">
      <div className="flex items-center gap-2">
        <Logo />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Registrar-se</CardTitle>
          <CardDescription>Crie sua conta administrativa</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
        <CardFooter className="justify-center" />
      </Card>
    </main>
  );
}
