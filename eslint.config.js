import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import security from "eslint-plugin-security";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.node,
    },
    plugins: {
      js,
      security,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...security.configs.recommended.rules,

      //Reglas comunes útiles
      "no-eval": "error", // Evitar eval()
      "no-new-func": "error", // Evitar new Function()
      "no-console": "warn", // Opcional, avisa si usas console.log en producción
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }], // Ignora args como (_, res)
      "security/detect-object-injection": "warn", // Detecta inyección en objetos
    },
  },
]);
