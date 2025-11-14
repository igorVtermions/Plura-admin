"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import AvatarPicker from "./AvatarPicker";
import {
  adaptInstructor,
  fetchInstructorProfile,
  updateInstructor,
  type UpdateInstructorPayload,
} from "@/features/instructors/api";
import type {
  InstructorCardData,
  InstructorProfile,
} from "@/features/instructors/types";

type Props = {
  open: boolean;
  tutorId: string | null;
  onClose: () => void;
  onUpdated?: (instructor: InstructorCardData) => void;
  fallbackData?: InstructorCardData | null;
};

const MAX_ABOUT_LENGTH = 150;
const MAX_PHOTO_BYTES = 1_500_000; // ~1.5MB

function formatPhoneFromDigits(digits: string): string {
  const cleaned = digits.slice(0, 11);
  if (cleaned.length === 0) return "";
  if (cleaned.length <= 2) return `(${cleaned}`;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  if (cleaned.length <= 10)
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
}

function extractDigitsFromPhone(phone?: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 12 && digits.startsWith("55")) {
    return digits.slice(digits.length - 11);
  }
  if (digits.length === 11 && digits.startsWith("55")) {
    return digits.slice(2);
  }
  return digits.slice(-11);
}

function toApiPhone(digits: string): string | null {
  const normalized = digits.replace(/\D/g, "");
  if (!normalized) return null;
  return normalized.startsWith("55") ? `+${normalized}` : `+55${normalized}`;
}

export default function EditInstructorModal({
  open,
  tutorId,
  onClose,
  onUpdated,
  fallbackData = null,
}: Props) {
  const [profile, setProfile] = useState<InstructorProfile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [about, setAbout] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const baseline = useMemo(() => {
    const seed = profile ?? fallbackData ?? null;
    return {
      name: seed?.name ?? "",
      email: seed?.email ?? "",
      phone: seed?.phone ?? "",
      role: seed?.role ?? "",
      about: seed?.bio ?? "",
      avatarUrl: seed?.avatarUrl ?? null,
    };
  }, [profile, fallbackData]);

  function applySeed(seed?: InstructorProfile | InstructorCardData | null) {
    const target = seed ?? null;
    setName(target?.name ?? "");
    setEmail(target?.email ?? "");
    const digits = extractDigitsFromPhone(target?.phone ?? "");
    setPhone(formatPhoneFromDigits(digits));
    setRole(target?.role ?? "");
    setAbout(target && "bio" in target ? target.bio ?? "" : "");
  }

  function resetState() {
    setProfile(null);
    setFile(null);
    setSaving(false);
    setLoadingProfile(false);
    setLoadError(null);
    applySeed(null);
  }

  useEffect(() => {
    if (!open) {
      resetState();
      return;
    }

    applySeed(fallbackData ?? null);

    if (!tutorId) return;

    let cancelled = false;
    setLoadingProfile(true);
    setLoadError(null);

    fetchInstructorProfile(tutorId)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setLoadError("Não foi possível carregar os dados do instrutor.");
          return;
        }
        setProfile(result);
        applySeed(result);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("fetchInstructorProfile error", err);
        setLoadError("Não foi possível carregar os dados do instrutor.");
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, tutorId, fallbackData]);

  const baselinePhoneDigits = extractDigitsFromPhone(baseline.phone);
  const currentPhoneDigits = phone.replace(/\D/g, "");

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedRole = role.trim();
  const trimmedAbout = about.trim();

  const hasDataUpdates =
    trimmedName !== baseline.name.trim() ||
    trimmedEmail !== baseline.email.trim() ||
    trimmedRole !== baseline.role.trim() ||
    trimmedAbout !== baseline.about.trim() ||
    currentPhoneDigits !== baselinePhoneDigits;

  const hasChanges = hasDataUpdates || file !== null;

  function handlePhoneChange(event: React.ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 11);
    setPhone(formatPhoneFromDigits(digits));
  }

  function handlePhoneKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const allowedKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
      "Tab",
    ];
    if (allowedKeys.includes(event.key)) return;
    if (!/^[0-9]$/.test(event.key)) event.preventDefault();
  }

  function handleAboutChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = event.currentTarget.value;
    if (value.length <= MAX_ABOUT_LENGTH) {
      setAbout(value);
    }
  }

  async function handleSubmit() {
    if (!tutorId) return;
    if (!trimmedName || !trimmedEmail) {
      toast.error("Informe ao menos o nome e e-mail do instrutor.");
      return;
    }

    if (!hasChanges) {
      toast("Nenhuma alteração para salvar.");
      return;
    }

    const digits = currentPhoneDigits;
    if (!digits) {
      toast.error("Informe um telefone válido.");
      return;
    }
    if (digits.length < 10) {
      toast.error("Informe um telefone completo (DDD + número).");
      return;
    }

    const updates: UpdateInstructorPayload = {};

    if (trimmedName !== baseline.name.trim()) updates.name = trimmedName;
    if (trimmedEmail !== baseline.email.trim()) updates.email = trimmedEmail;

    const apiPhone = toApiPhone(digits);
    const baselineApiPhone = toApiPhone(baselinePhoneDigits);
    if (apiPhone && apiPhone !== baselineApiPhone) updates.phone = apiPhone;

    if (trimmedRole !== baseline.role.trim()) updates.role = trimmedRole;
    if (trimmedAbout !== baseline.about.trim()) updates.about = trimmedAbout;

    if (file && file.size > MAX_PHOTO_BYTES) {
      toast.error("A imagem deve ter no máximo 1.5MB.");
      return;
    }

    setSaving(true);

    try {
      const updatedProfile = await updateInstructor(tutorId, updates, {
        photoFile: file,
      });

      const refreshed =
        updatedProfile ?? (await fetchInstructorProfile(tutorId).catch(() => null));

      if (refreshed) {
        setProfile(refreshed);
        const normalized = adaptInstructor(refreshed);
        if (normalized) onUpdated?.(normalized);
        applySeed(refreshed);
      } else {
        const fallback = {
          ...(profile ?? fallbackData ?? {}),
          ...updates,
          about: updates.about ?? trimmedAbout,
          bio: updates.about ?? trimmedAbout,
          phone: updates.phone ?? apiPhone ?? baselineApiPhone ?? baseline.phone,
        };
        const normalized = adaptInstructor(fallback);
        if (normalized) onUpdated?.(normalized);
      }

      setFile(null);
      toast.success("Instrutor atualizado com sucesso.");
      onClose();
    } catch (err) {
      console.error("updateInstructor error", err);
      toast.error("Não foi possível atualizar o instrutor. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  const disableSave = saving || loadingProfile || !hasChanges;

  return (
    <Modal
      open={open}
      onClose={() => {
        if (saving) return;
        onClose();
      }}
      title="Editar instrutor"
      subtitle="Atualize as informações deste instrutor"
      maxWidth="max-w-[520px]"
      footer={
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="border-[#D0D9F1] text-[#1F2A44] hover:bg-[#F4F6FF]"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={disableSave}
            className="bg-[#977CEC] text-white hover:bg-[#8464e1] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      }
    >
      {loadingProfile ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-sm text-[#5A6480]">
          <Loader2 className="h-6 w-6 animate-spin text-[#977CEC]" />
          Carregando dados do instrutor...
        </div>
      ) : loadError ? (
        <div className="flex flex-col gap-4 rounded-xl border border-[#F5C2C7] bg-[#FFF5F5] p-4 text-sm text-[#842029]">
          <p>{loadError}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (!tutorId) return;
              setLoadingProfile(true);
              setLoadError(null);
              fetchInstructorProfile(tutorId)
                .then((result) => {
                  if (!result) {
                    setLoadError("Não foi possível carregar os dados do instrutor.");
                    return;
                  }
                  setProfile(result);
                  applySeed(result);
                })
                .catch((err) => {
                  console.error("retry fetchInstructorProfile error", err);
                  setLoadError("Não foi possível carregar os dados do instrutor.");
                })
                .finally(() => setLoadingProfile(false));
            }}
            className="border-[#842029] text-[#842029] hover:bg-[#FDEAEA]"
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <form
          className="mt-6 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <div className="flex justify-center">
            <AvatarPicker
              file={file}
              onChange={setFile}
              initialImageUrl={baseline.avatarUrl}
              ariaLabel="Alterar foto do instrutor"
            />
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-instructor-name">
                Nome <span className="text-red-600">*</span>
              </Label>
              <Input
                id="edit-instructor-name"
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                placeholder="Nome do instrutor"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="edit-instructor-email">
                  E-mail <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="edit-instructor-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  placeholder="nome@email.com"
                />
              </div>
              <div>
                <Label htmlFor="edit-instructor-phone">
                  Telefone <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="edit-instructor-phone"
                  value={phone}
                  onChange={handlePhoneChange}
                  onKeyDown={handlePhoneKeyDown}
                  placeholder="(11) 91234-5678"
                  inputMode="numeric"
                  maxLength={15}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-instructor-role">
                Cargo / Função <span className="text-red-600">*</span>
              </Label>
              <Input
                id="edit-instructor-role"
                value={role}
                onChange={(event) => setRole(event.currentTarget.value)}
                placeholder="Ex: Psicólogo, Neurocientista"
              />
            </div>

            <div>
              <Label htmlFor="edit-instructor-about">Sobre</Label>
              <textarea
                id="edit-instructor-about"
                value={about}
                onChange={handleAboutChange}
                placeholder="Adicione uma descrição sobre este instrutor"
                className="min-h-[96px] w-full rounded-md border px-3 py-2 text-sm"
              />
              <div className="mt-1 text-right text-xs text-muted-foreground">
                {about.length}/{MAX_ABOUT_LENGTH}
              </div>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}