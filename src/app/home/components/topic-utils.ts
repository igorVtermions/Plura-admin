export function extractTopicNames(payload: unknown): string[] {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object") {
          const data = item as Record<string, unknown>;
          const value =
            typeof data.name === "string"
              ? data.name
              : typeof data.title === "string"
              ? data.title
              : typeof data.label === "string"
              ? data.label
              : null;
          return value ? value.trim() : null;
        }
        return null;
      })
      .filter((topic): topic is string => !!topic && topic.length > 0);
  }

  if (typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    const keys = ["topics", "data", "items", "list", "results"];
    for (const key of keys) {
      if (key in data) {
        const nested = data[key];
        const extracted = extractTopicNames(nested);
        if (extracted.length > 0) return extracted;
      }
    }
  }

  return [];
}
