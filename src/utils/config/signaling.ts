import { SignalingClient } from './client';

const proto = location.protocol === 'https:' ? 'wss' : 'ws';
export const signaling = new SignalingClient(`${proto}://${location.host}/signal`);

if (import.meta.hot) {
  import.meta.hot.dispose(() => signaling.disconnect());
}