import { globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// ---------------------------------------------------------------------------
// ESLint flat config. Next 16 exports native flat configurations; linting runs
// through the ESLint CLI because Next no longer runs it during `next build`.
// ---------------------------------------------------------------------------
const config = [
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "db/migrations/**",
  ]),
];

export default config;
