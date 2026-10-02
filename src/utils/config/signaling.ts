import { SignalingClient } from './client';

export const signaling = new SignalingClient(`ws://${location.hostname}:8080`);

if (import.meta.hot) {
  import.meta.hot.dispose(() => signaling.disconnect());
}