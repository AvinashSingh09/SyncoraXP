import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/main.ts"],
  format: ["esm"],
  outDir: "dist",
  sourcemap: true,
  clean: true,
  noExternal: ["@voice/shared"],
});
