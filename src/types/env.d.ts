interface RuntimeEnv {
  VITE_API_URL?: string;
  VITE_ENABLE_DEMO_LOGIN?: string;
  VITE_PUBLIC_BOOKING_BASE_URL?: string;
  VITE_META_APP_ID?: string;
  VITE_META_CONFIG_ID?: string;
  VITE_META_EMBEDDED_REDIRECT_URI?: string;
  NEXT_PUBLIC_APP_URL?: string;
}

interface Window {
  __ENV__?: RuntimeEnv;
}