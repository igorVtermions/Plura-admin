import type { BanReasonKey } from "./types";

export const USER_JUSTIFICATION_LIMIT = 150;

export const BAN_REASON_OPTIONS: Array<{ key: BanReasonKey; label: string }> = [
  { key: "conteudo_improprio", label: "Conteúdo impróprio" },
  { key: "assedio_ou_bullying", label: "Assédio ou bullying" },
  { key: "spam_ou_fraude", label: "Spam ou fraude" },
  { key: "discurso_de_odio", label: "Discurso de ódio ou discriminação" },
  { key: "outro", label: "Outro" },
];