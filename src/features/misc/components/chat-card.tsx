import { Button } from "@/components/ui/button";
import Image from "@/components/ui/Image";
import { LogIn } from "lucide-react";

interface ChatCardProps {
  title: string;
  instructor: string;
  onlineCount: number;
}

// /* Card/Room */

// /* Auto layout */
// display: flex;
// flex-direction: column;
// align-items: flex-start;
// padding: 0px;
// gap: 12px;

// width: 362px;
// height: 180px;


// /* Inside auto layout */
// flex: none;
// order: 0;
// align-self: stretch;
// flex-grow: 1;


export function ChatCard({ title, instructor, onlineCount }: ChatCardProps) {
  return (
    <div className="flex flex-col flex-start p-4 gap-1 rounded-xl bg-[#f3ebff] border border-[#D4C7FF]">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-[#341257]">{title}</h3>
        <p className="text-sm text-[#361A6D]">{instructor}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          <Image
            src="/UserCircle.svg"
            alt="Participante"
            width={36}
            height={36}
            className="rounded-full border-2 border-[#F3EBFF]"
          />
          <Image
            src="/UserCircle.svg"
            alt="Participante"
            width={36}
            height={36}
            className="rounded-full border-2 border-[#F3EBFF]"
          />
          <Image
            src="/UserCircle.svg"
            alt="Participante"
            width={36}
            height={36}
            className="rounded-full border-2 border-[#F3EBFF]"
          />
        </div>
        <span className="text-sm font-medium text-black">
          +{onlineCount} online
        </span>
      </div>
      <Button className="mt-auto flex w-full items-center justify-center gap-3 rounded-2xl bg-[#A874F7] py-6 px-[16px] text-base font-semibold text-white hover:bg-[#9c68ea] border border-[#977CEC] active:scale-95 transition-all duration-100">
        <LogIn className="size-6" />
        Ingressar na sala
      </Button>
    </div>
  );
}
