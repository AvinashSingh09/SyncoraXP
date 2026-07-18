import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const lanCertificatePath = fileURLToPath(
  new URL("../../certificates/voicemeet-lan-dev.pfx", import.meta.url),
);

export default defineConfig(({ mode }) => {
  const lanHttps = mode === "lan";
  if (lanHttps && !existsSync(lanCertificatePath)) {
    throw new Error(
      "LAN HTTPS certificate is missing. Run: powershell -ExecutionPolicy Bypass -File scripts/setup-lan-https.ps1 -LanIp <this-PC-IP>",
    );
  }

  return {
    plugins: [react(), tailwindcss()],
    build: {
      // The lazy-loaded LiveKit media SDK is intentionally isolated from the initial application bundle.
      chunkSizeWarningLimit: 700,
    },
    server: {
      host: lanHttps ? "0.0.0.0" : undefined,
      port: 5173,
      https: lanHttps
        ? {
            pfx: readFileSync(lanCertificatePath),
            passphrase: process.env.VOICEMEET_LAN_CERT_PASSWORD ?? "voicemeet-lan-dev",
          }
        : undefined,
      proxy: {
        // SyncoraXP API
        "/api": "http://localhost:3000",
        // Virtual Events Platform API
        "/ve-api": {
          target: "http://localhost:5000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ve-api/, "/api"),
        },
        // Virtual Events Socket.IO
        "/socket.io": {
          target: "http://localhost:5000",
          ws: true,
          changeOrigin: true,
        },
      },
    },
  };
});
