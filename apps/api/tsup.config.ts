import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts", "src/db/migrate.ts"],
  format: ["esm"],
  outDir: "dist",
  sourcemap: true,
  clean: true,
  noExternal: ["@voice/shared"],
});
