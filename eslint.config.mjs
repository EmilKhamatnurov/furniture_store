import { FlatCompat } from "@eslint/eslintrc";

// ---------------------------------------------------------------------------
// ESLint flat config (ESLint 9). `next lint` is deprecated and its interactive
// setup breaks CI — we run `eslint .` directly, reusing Next's shareable
// configs through FlatCompat.
// ---------------------------------------------------------------------------

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "db/migrations/**",
    ],
  },
];

export default config;
