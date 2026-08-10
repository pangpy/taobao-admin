/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_ACCOUNT: string
  readonly VITE_TOTP_SECRET: string
  readonly VITE_ACCESS_TOKEN: string
  readonly VITE_WS_SALT: string  // ← 新增
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
