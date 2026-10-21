import { defineConfig } from "vite"

import react from "@vitejs/plugin-react"

import tailwindcss from "@tailwindcss/vite"

import path from "node:path"

// Vite config - https://vitejs.dev/config/

// Site metadata (title, description, robots policy) lives directly in

// index.html; robots.txt is served statically from public/robots.txt.

export default defineConfig(({ mode }) => {
  const emitSourcemaps = mode === "development"

  return {
    base: "/",

    build: {
      sourcemap: emitSourcemaps ? "inline" : false,

      minify: !emitSourcemaps,
    },

    plugins: [react(), tailwindcss()],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    server: {
      host: "0.0.0.0",

      port: parseInt(process.env.PORT || "8443"),

      strictPort: true,
    },

    preview: {
      host: "0.0.0.0",

      port: parseInt(process.env.PORT || "8443"),
    },
  }
})
