export {};

// Minimal Cloudflare env typing for future bindings; safe for JS-only builds.
declare global {
  interface CloudflareEnv {
    DB: any;
    UPLOADS: any;
    SITE_URL?: string;
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
    TWILIO_ACCOUNT_SID?: string;
    TWILIO_AUTH_TOKEN?: string;
    TWILIO_FROM_NUMBER?: string;
  }
}
