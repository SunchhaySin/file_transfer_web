import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    basicSsl(), // run the server over https (secure browser context)
  ],
  server: {
    host: true, // host the app on the local network
    proxy: {
      "/signal": { target: "ws://127.0.0.1:8080", ws: true },
    }, // route the broswer https traffic to the signaling server
  }, 
});
