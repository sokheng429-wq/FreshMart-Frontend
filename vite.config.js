import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Always run on 5173 (fail instead of silently switching to 5174).
    port: 5173,
    strictPort: true,
    // Allow the ngrok tunnel host (and other non-localhost origins) to reach the
    // dev server — needed for testing Telegram login through a tunnel.
    allowedHosts: true,
  },
})