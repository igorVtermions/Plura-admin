// src/features/users/components/profile/UserDetailsModal.tsx
import React from "react";
import Modal from "@/components/ui/Modal";
import type { UserProfile } from "../../types";

type Props = {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
};

const safeText = (value?: string | null, fallback = "Não informado") => {
  const resolved = typeof value === "string" ? value.trim() : "";
  return resolved.length > 0 ? resolved : fallback;
};

const getProfileGender = (profile: UserProfile): string => {
  const data = profile as unknown as { gender?: string | null; genero?: string | null };
  const raw = data.gender ?? data.genero ?? null;
  if (!raw || typeof raw !== "string") return "Não informado";
  const normalized = raw.trim();
  if (!normalized) return "Não informado";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const formatPhoneDisplay = (value?: string | null): string | null => {
  if (!value) return null;
  const digits = value.replace(/\D+/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 9) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="space-y-1">
    <span className="text-sm font-semibold text-[#191F33]">{label}</span>
    <p className="text-sm font-semibold text-[#5A6480]">{value}</p>
  </div>
);

const UserDetailsModal: React.FC<Props> = ({ open, onClose, profile }) => (
  <Modal
    open={open}
    onClose={onClose}
    title="Dados cadastrais do usuário"
    subtitle="Visualize os dados deste usuário"
    maxWidth="max-w-lg"
  >
    <div className="rounded-3xl border-2 border-[#754bff] bg-[#F5F0FF] p-6 shadow-[0px_12px_30px_rgba(120,109,210,0.12)]">
      <div className="space-y-5">
        <InfoRow label="Nome completo" value={safeText(profile.name, "Usuário sem nome")} />
        <InfoRow label="Gênero" value={getProfileGender(profile)} />
        <InfoRow label="Telefone" value={safeText(formatPhoneDisplay(profile.phone))} />
        <InfoRow label="E-mail" value={safeText(profile.email)} />
      </div>
    </div>
  </Modal>
);

export default UserDetailsModal;