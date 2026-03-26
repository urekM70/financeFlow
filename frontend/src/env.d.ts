/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  // Add other env variables here if you have any
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
