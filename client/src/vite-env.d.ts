/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Full API URL including /api, e.g. https://api.example.com/api. Empty means same-origin /api. */
  readonly VITE_API_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
