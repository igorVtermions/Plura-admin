import React, { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { USER_JUSTIFICATION_LIMIT } from "../constants";

type Props = {
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onConfirm: (payload: { description: string }) => void;
};

const UnbanUserModal: React.FC<Props> = ({ open, pending, onClose, onConfirm }) => {
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!open) return;
    setDescription("");
    setError(undefined);
  }, [open]);

  const trimmed = description.trim();
  const confirmDisabled = pending || trimmed.length === 0;

  const handleSubmit = () => {
    if (trimmed.length === 0) {
      setError("Explique a justificativa da reativação.");
      return;
    }
    if (trimmed.length > USER_JUSTIFICATION_LIMIT) {
      setError("Use no máximo 150 caracteres.");
      return;
    }
    setError(undefined);
    onConfirm({ description: trimmed });
  };

  const handleClose = () => {
    if (pending) return;
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Desbanir usuário"
      subtitle="Explique a justificativa da reativação."
      maxWidth="max-w-xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={pending}
            className="border-[#D0D9F1] text-[#1F2A44] hover:bg-[#F4F6FF] disabled:opacity-60"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={confirmDisabled}
            className={cn(
              "h-11 rounded-[12px] px-6 text-sm font-semibold transition-colors disabled:opacity-70",
              "bg-[#256740] text-white hover:bg-[#1F5A35]"
            )}
          >
            {pending ? "Processando..." : "Desbanir usuário"}
          </Button>
        </div>
      }
    >
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#191F33]" htmlFor="unban-description">
          Descreva o motivo
        </label>
        <div
          className={cn(
            "rounded-xl border px-4 py-3",
            error ? "border-[#F5C2C7]" : "border-[#D5DDF5]"
          )}
        >
          <textarea
            id="unban-description"
            value={description}
            onChange={(event) => {
              const value = event.currentTarget.value.slice(0, USER_JUSTIFICATION_LIMIT);
              setDescription(value);
              if (value.trim().length > 0) {
                setError(undefined);
              }
            }}
            maxLength={USER_JUSTIFICATION_LIMIT}
            rows={4}
            placeholder="Escreva aqui..."
            className="w-full resize-none bg-transparent text-sm text-[#191F33] placeholder:text-[#8A94AB] focus:outline-none"
          />
          <div className="mt-2 flex items-center text-xs">
            {error && <span className="font-medium text-[#C53030]">{error}</span>}
            <span className="ml-auto text-[#8A94AB]">
              {description.length}/{USER_JUSTIFICATION_LIMIT}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default UnbanUserModal;