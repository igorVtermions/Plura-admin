"use client";

import Image from "@/components/ui/Image";
import { RoomsControl } from "@/features/home/components/rooms-control";
import React, { useState } from "react";
import CreateInstructorModal from "@/components/instructor/CreateInstructorModal";
import CreateSessionModal from "@/components/session/CreateSessionModal";
import { useRouter } from "@/lib/router";

export default function HomePage() {
  const [openCreateInstructor, setOpenCreateInstructor] = useState(false);
  const [openCreateSession, setOpenCreateSession] = useState(false);
  const router = useRouter();

  function handleOpenCreate() {
    setOpenCreateInstructor(true);
  }
  function handleCloseCreate() {
    setOpenCreateInstructor(false);
  }
  function handleContinueCreate(payload: Record<string, unknown> | null) {
    setOpenCreateInstructor(false);
  }
  function handleOpenCreateSession() {
    setOpenCreateSession(true);
  }
  function handleCloseCreateSession() {
    setOpenCreateSession(false);
  }
  function handleContinueCreateSession(payload: Record<string, unknown> | null) {
    setOpenCreateSession(false);
  }

  return (
    <main className="p-8 flex-1 overflow-auto md:overflow-auto min-h-0 bg-white">
      <div className="max-w-5xl mx-auto w-full min-h-0">
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
                    onClick={handleOpenCreateSession}
                    className="rounded-md flex flex-col justify-center items-start gap-3 p-5 w-full flex-1 min-w-0 bg-[#F7F9FF] cursor-pointer transition-transform duration-150 ease-in-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#977CEC]"
                    style={{ border: "1px solid #D4C7FF" }}
                  >
                    <Image src="/Megaphone.svg" alt="Criar sessão" width={32} height={32} />
                    <span className="text-[16px] font-medium text-[#361A6D]">Criar sessão</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="rounded-md flex flex-col justify-center items-start gap-3 p-5 w-full flex-1 min-w-0 bg-[#F7F9FF] cursor-pointer transition-transform duration-150 ease-in-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#977CEC]"
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
                    onClick={() => router.push("/users")}
                    className="rounded-md flex flex-col justify-center items-start gap-3 p-5 w-full flex-1 min-w-0 bg-[#FFF6EB] cursor-pointer transition-transform duration-150 ease-in-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#FFD7AD]"
                    style={{ border: "1px solid #FFD7AD" }}
                  >
                    <Image src="/UsersThree.svg" alt="Ver todos usuários" width={32} height={32} />
                    <span className="text-[16px] font-medium text-[#582F01]">Ver todos usuários</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/instructors")}
                    className="rounded-md flex flex-col justify-center items-start gap-3 p-5 w-full flex-1 min-w-0 bg-[#FFF6EB] cursor-pointer transition-transform duration-150 ease-in-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#FFD7AD]"
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
        
      <CreateInstructorModal
        open={openCreateInstructor}
        onClose={handleCloseCreate}
        onContinue={handleContinueCreate}
        currentStep={1}
        totalSteps={7}
      />
      <CreateSessionModal
        open={openCreateSession}
        onClose={handleCloseCreateSession}
        onContinue={handleContinueCreateSession}
      />
    </main>
  );
}



