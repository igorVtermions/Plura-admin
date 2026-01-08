import Image from "@/components/ui/Image";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { MicOff, UserRound, Users, VenetianMask } from "lucide-react";
import { type ReactNode } from "react";

type OnlineUser = {
  name: string;
  handle: string;
  avatar: string;
};

type RoomDetailModalProps = {
  open: boolean;
  onClose: () => void;
  about?: string;
  ageRange?: string;
  audience?: string;
  onlineCount?: number;
  users?: OnlineUser[];
  onDelete?: () => void;
};

const defaultUsers: OnlineUser[] = [
  {
    name: "Marta Silveira",
    handle: "@marta.silveira",
    avatar: "/UserCircle.svg",
  },
  {
    name: "Vanda Silva",
    handle: "@vanda.silva",
    avatar: "/UserCircle.svg",
  },
  {
    name: "Marli Bueno",
    handle: "@marli.bueno",
    avatar: "/UserCircle.svg",
  },
];

export function ModalDetail({
  open,
  onClose,
  about =
    "A ansiedade é uma resposta natural do corpo a situações estressantes, mas quando se torna excessiva ou interfere no dia a dia, é importante adotar estratégias para gerenciá-la. Aqui estão algumas abordagens para lidar com a ansiedade.",
  ageRange = "20 a 45 anos",
  audience = "65% homens",
  onlineCount = 32,
  users = defaultUsers,
  onDelete,
}: RoomDetailModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalhes da sala"
      maxWidth="max-w-md"
    >
      <div className="space-y-6 text-[#1F2339]">
        <section>
          <h3 className="text-base font-semibold text-[#0F1A3A]">Sobre</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#5A6480]">{about}</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-semibold text-[#0F1A3A]">Informações</h3>
          <div className="space-y-3">
            <InfoItem
              icon={<VenetianMask className="h-5 w-5 text-[#6C4FD9]" />}
              label="Faixa de idade"
              value={ageRange}
            />
            <InfoItem
              icon={<UserRound className="h-5 w-5 text-[#6C4FD9]" />}
              label="Gênero"
              value={audience}
            />
            <InfoItem
              icon={<Users className="h-5 w-5 text-[#6C4FD9]" />}
              label="Pessoas Online"
              value={String(onlineCount)}
            />
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-[#0F1A3A]">Usuários online</h3>
          <div className="divide-y divide-[#EEF1F7]">
            {users.map((user) => (
              <div key={user.handle} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#0F1A3A]">{user.name}</p>
                    <p className="text-xs text-[#7A819C]">{user.handle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    className="cursor-pointer rounded-full p-2 text-[#9AA0B8] hover:bg-[#F5F6FB]"
                    aria-label={`Mutar ${user.name}`}
                  >
                    <MicOff className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="cursor-pointer text-sm font-semibold text-[#D84040] hover:underline"
                  >
                    Remover do chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6">
        <Button
          className="h-12 w-full rounded-xl bg-[#F04747] text-base font-semibold text-white hover:bg-[#dc3b3b]"
          onClick={onDelete}
        >
          Deletar sala
        </Button>
      </div>
    </Modal>
  );
}

type InfoItemProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

const InfoItem = ({ icon, label, value }: InfoItemProps) => (
  <div className="flex items-center gap-3 text-sm text-[#5A6480]">
    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E3E6F0] bg-white">
      {icon}
    </span>
    <div>
      <p className="font-semibold text-[#0F1A3A]">{label}</p>
      <p className="text-xs text-[#7A819C]">{value}</p>
    </div>
  </div>
);

