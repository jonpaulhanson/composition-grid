/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Web3Forms access key for the feedback form. Set it in `.env.local` for local dev and
   * in Vercel's project environment variables for production. Left unset, the feedback form
   * still opens but submitting reports that it isn't configured. Safe to expose publicly —
   * Web3Forms access keys are designed to live in client-side code. */
  readonly VITE_WEB3FORMS_ACCESS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
