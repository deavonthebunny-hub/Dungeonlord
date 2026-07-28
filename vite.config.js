import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/Dungeonlord/",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll("\\", "/");
          if (normalizedId.includes("/node_modules/react")) return "react-vendor";
          if (normalizedId.includes("/src/systems/")) return "game-systems";
          if (normalizedId.includes("/src/components/")) return "game-ui";
        },
      },
    },
  },
});
