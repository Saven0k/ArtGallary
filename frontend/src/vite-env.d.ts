/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Базовый URL API. dev: http://localhost:5000, prod: /api */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
