/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_WEB_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
