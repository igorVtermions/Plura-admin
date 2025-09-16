import Image from "next/image";
import { Sidebar } from "@/components/layout/sidebar";
import { RoomsControl } from "@/features/home/components/rooms-control";

export default function HomePage() {
  return (
    <div className="min-h-screen flex bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="p-8">
          <div className="max-w-5xl mx-auto w-full">
            <h1
              className="text-[32px] mb-6"
              style={{ fontFamily: "var(--font-rubik)" }}
            >
              Início
            </h1>

            <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
              <section className="p-1 rounded-lg">
                <h2 className="font-medium text-[20px] mb-4">Ações rápidas</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    className="rounded-md flex flex-col justify-center items-start gap-3 p-5 cursor-pointer w-full flex-1 min-w-0 bg-[#F7F9FF]"
                    style={{ border: "1px solid #D4C7FF" }}
                  >
                    <Image src="/Megaphone.svg" alt="Criar sessão" width={32} height={32} />
                    <span className="text-[16px] font-medium text-[#361A6D]">Criar sessão</span>
                  </button>

                  <button
                    type="button"
                    className="rounded-md flex flex-col justify-center items-start gap-3 p-5 cursor-pointer w-full flex-1 min-w-0 bg-[#F7F9FF]"
                    style={{ border: "1px solid #D4C7FF" }}
                  >
                    <Image src="/UserPlus.svg" alt="Cadastrar instrutor" width={32} height={32} />
                    <span className="text-[16px] font-medium text-[#361A6D]">Cadastrar instrutor</span>
                  </button>
                </div>
              </section>

              <section className="p-1 rounded-lg">
                <h2 className="font-medium text-[20px] mb-4">Visualizações</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    className="rounded-md flex flex-col justify-center items-start gap-3 p-5 cursor-pointer w-full flex-1 min-w-0 bg-[#FFF6EB]"
                    style={{ border: "1px solid #FFD7AD" }}
                  >
                    <Image src="/UsersThree.svg" alt="Ver todos usuários" width={32} height={32} />
                    <span className="text-[16px] font-medium text-[#582F01]">Ver todos usuários</span>
                  </button>

                  <button
                    type="button"
                    className="rounded-md flex flex-col justify-center items-start gap-3 p-5 cursor-pointer w-full flex-1 min-w-0 bg-[#FFF6EB]"
                    style={{ border: "1px solid #FFD7AD" }}
                  >
                    <Image src="/UserSound.svg" alt="Ver todos instrutores" width={32} height={32} />
                    <span className="text-[16px] font-medium text-[#582F01]">Ver todos instrutores</span>
                  </button>
                </div>
              </section>
            </div>
            <RoomsControl />
          </div>
        </main>
      </div>
    </div>
  );
}