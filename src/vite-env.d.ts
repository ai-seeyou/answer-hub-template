/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BUSINESS_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}