export function formatDateTime(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value ?? null;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(minutes?: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}h ${rest}min` : `${hours}h`;
}

const ACCENT_REMOVAL_REGEX = /[\u0300-\u036f]/g;

const TOPIC_ACRONYM_OVERRIDES: Record<string, string> = {
  ia: "IA",
  ui: "UI",
  ux: "UX",
  ti: "TI",
  rh: "RH",
};

const TOPIC_WORD_OVERRIDES: Record<string, string> = {
  depressao: "Depressão",
  desanimo: "Desânimo",
  saude: "Saúde",
  prevencao: "Prevenção",
  inovacao: "Inovação",
  gestao: "Gestão",
  educacao: "Educação",
  comunicacao: "Comunicação",
  relacao: "Relação",
  relacoes: "Relações",
  emocao: "Emoção",
  emocional: "Emocional",
  ansiedade: "Ansiedade",
};

const TOPIC_PHRASE_OVERRIDES: Record<string, string> = {
  "saude mental": "Saúde Mental",
  "inteligencia artificial": "Inteligência Artificial",
  "gestao de pessoas": "Gestão de Pessoas",
  "educacao financeira": "Educação Financeira",
};

const LOWERCASE_CONNECTORS = new Set([
  "de",
  "do",
  "da",
  "dos",
  "das",
  "e",
  "em",
  "no",
  "na",
  "nos",
  "nas",
  "para",
  "por",
  "com",
  "a",
  "o",
  "as",
  "os",
  "ao",
  "aos",
]);

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(ACCENT_REMOVAL_REGEX, "");
}

export function formatProfileTopic(value?: string | null): string {
  if (typeof value !== "string") return "Tópico";
  const normalized = value.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (normalized.length === 0) return "Tópico";

  const sanitized = stripDiacritics(normalized).toLowerCase();
  const fullOverride = TOPIC_PHRASE_OVERRIDES[sanitized];
  if (fullOverride) return fullOverride;

  const words = normalized.split(" ");
  const sanitizedWords = words.map((word) => stripDiacritics(word).toLowerCase());

  const formatted = words.map((word, index) => {
    const sanitizedWord = sanitizedWords[index];
    const acronymOverride = TOPIC_ACRONYM_OVERRIDES[sanitizedWord];
    if (acronymOverride) return acronymOverride;

    if (/^[a-z0-9]{1,2}$/.test(sanitizedWord)) return sanitizedWord.toUpperCase();

    const wordOverride = TOPIC_WORD_OVERRIDES[sanitizedWord];
    if (wordOverride) return wordOverride;

    if (LOWERCASE_CONNECTORS.has(sanitizedWord) && index !== 0) return sanitizedWord;

    const base = word.toLowerCase();
    return base.charAt(0).toUpperCase() + base.slice(1);
  });

  return formatted.join(" ");
}