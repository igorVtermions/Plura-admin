import SupportChatPage from "@/features/support/pages/support-chat-page";

export const metadata = { title: "Chat de Suporte | Plura Talks - Administrador" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SupportChatPage id={id} />;
}
