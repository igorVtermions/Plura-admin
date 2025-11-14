import React, { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BanReasonKey } from "../types";
import { BAN_REASON_OPTIONS, USER_JUSTIFICATION_LIMIT } from "../constants";

type Props = {
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onConfirm: (payload: { reason: BanReasonKey; description: string }) => void;
};

type Errors = { reason?: string; description?: string };
const defaultReason: BanReasonKey = BAN_REASON_OPTIONS[0]?.key ?? "outro";

const BanUserModal: React.FC<Props> = ({ open, pending, onClose, onConfirm }) => {
  const [reason, setReason] = useState<BanReasonKey>(defaultReason);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (!open) return;
    setReason(defaultReason);
    setDescription("");
    setErrors({});
  }, [open]);

  const trimmed = description.trim();
  const confirmDisabled = pending || trimmed.length === 0;

  const handleSubmit = () => {
    const next: Errors = {};
    if (!reason) next.reason = "Selecione um motivo.";
    if (trimmed.length === 0) next.description = "Descreva o motivo do banimento.";
    if (trimmed.length > USER_JUSTIFICATION_LIMIT) {
      next.description = "Use no máximo 150 caracteres.";
    }
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    onConfirm({ reason, description: trimmed });
  };

  const handleClose = () => {
    if (pending) return;
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Banir usuário"
      subtitle="Descreva o motivo do banimento."
      maxWidth="max-w-xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={pending}
            className={cn(
              "h-11 min-w-[160px] rounded-[12px] px-6 text-sm font-semibold transition-colors disabled:opacity-70",
              "border-[#D0D9F1] text-[#1F2A44] hover:bg-[#F4F6FF]"
            )}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={confirmDisabled}
            className={cn(
              "h-11 min-w-[160px] rounded-[12px] px-6 text-sm font-semibold transition-colors disabled:opacity-70",
              "bg-[#C53030] text-white hover:bg-[#A22727]"
            )}
          >
            {pending ? "Processando..." : "Banir usuário"}
          </Button>
        </div>
      }
    >
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-[#191F33]">
          Por qual motivo deseja banir este usuário?
        </legend>
        <div className="space-y-2">
          {BAN_REASON_OPTIONS.map((option) => {
            const selected = reason === option.key;
            return (
              <label
                key={option.key}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium text-[#2B1F58] transition-colors",
                  selected ? "border-[#977CEC] bg-[#F3F0FF]" : "border-[#E2E8F8] hover:border-[#C4CEEE]"
                )}
              >
                <input
                  type="radio"
                  name="ban-reason"
                  value={option.key}
                  checked={selected}
                  onChange={() => {
                    setReason(option.key);
                    setErrors((prev) => ({ ...prev, reason: undefined }));
                  }}
                  className="h-4 w-4 border-[#977CEC] text-[#977CEC] focus:ring-[#977CEC]"
                />
                {option.label}
              </label>
            );
          })}
        </div>
        {errors.reason && <p className="text-xs font-medium text-[#C53030]">{errors.reason}</p>}
      </fieldset>

      <div className="mt-6 space-y-2">
        <label className="text-sm font-semibold text-[#191F33]" htmlFor="ban-description">
          Descreva o motivo
        </label>
        <div
          className={cn(
            "rounded-xl border px-4 py-3",
            errors.description ? "border-[#F5C2C7]" : "border-[#D5DDF5]"
          )}
        >
          <textarea
            id="ban-description"
            value={description}
            onChange={(event) => {
              const value = event.currentTarget.value.slice(0, USER_JUSTIFICATION_LIMIT);
              setDescription(value);
              if (value.trim().length > 0) {
                setErrors((prev) => ({ ...prev, description: undefined }));
              }
            }}
            maxLength={USER_JUSTIFICATION_LIMIT}
            rows={4}
            placeholder="Escreva aqui..."
            className="w-full resize-none bg-transparent text-sm text-[#191F33] placeholder:text-[#8A94AB] focus:outline-none"
          />
          <div className="mt-2 flex items-center text-xs">
            {errors.description && (
              <span className="font-medium text-[#C53030]">{errors.description}</span>
            )}
            <span className="ml-auto text-[#8A94AB]">
              {description.length}/{USER_JUSTIFICATION_LIMIT}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default BanUserModal;