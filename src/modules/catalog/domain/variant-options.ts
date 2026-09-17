export type VariantOption = { name: string; value: string };

/** Admin format: one `Параметр: значение` pair per line, not arbitrary JSON. */
export function parseVariantOptions(input: string): VariantOption[] | null {
  const rows = input
    .split("\n")
    .map((row) => row.trim())
    .filter(Boolean);
  if (rows.length === 0 || rows.length > 12) return null;

  const options = rows.map((row) => {
    const separator = row.indexOf(":");
    if (separator <= 0) return null;
    const name = row.slice(0, separator).trim();
    const value = row.slice(separator + 1).trim();
    if (!name || !value || name.length > 60 || value.length > 120) return null;
    return { name, value };
  });
  if (options.some((option) => option === null)) return null;

  const typedOptions = options as VariantOption[];
  return new Set(typedOptions.map((option) => option.name.toLocaleLowerCase("ru"))).size ===
    typedOptions.length
    ? typedOptions
    : null;
}

export function formatVariantOptions(options: VariantOption[]): string {
  return options.map((option) => `${option.name}: ${option.value}`).join("\n");
}
