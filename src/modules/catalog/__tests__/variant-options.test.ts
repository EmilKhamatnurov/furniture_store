import { describe, expect, it } from "vitest";
import { formatVariantOptions, parseVariantOptions } from "../domain/variant-options";

describe("variant options admin format", () => {
  it("parses one named option per line", () => {
    expect(parseVariantOptions("Цвет: Орех\nМатериал: Шпон дуба")).toEqual([
      { name: "Цвет", value: "Орех" },
      { name: "Материал", value: "Шпон дуба" },
    ]);
  });

  it("rejects incomplete entries and duplicate option names", () => {
    expect(parseVariantOptions("Цвет Орех")).toBeNull();
    expect(parseVariantOptions("Цвет: Орех\nцвет: Чёрный")).toBeNull();
    expect(parseVariantOptions("Размер: ")).toBeNull();
  });

  it("formats options back into the editable admin representation", () => {
    expect(
      formatVariantOptions([
        { name: "Размер", value: "1800×800 мм" },
        { name: "Цвет", value: "Натуральный" },
      ])
    ).toBe("Размер: 1800×800 мм\nЦвет: Натуральный");
  });
});
