import { SignalingClient } from './client';

const SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL || "ws://localhost:8080";
export const signaling = new SignalingClient(SIGNALING_URL);

if (import.meta.hot) {
  import.meta.hot.dispose(() => signaling.disconnect());
} 