import { SignalingClient } from './client';

const proto = location.protocol === 'https:' ? 'wss' : 'ws';
// export const signaling = new SignalingClient(`ws://${location.hostname}:8080`);
export const signaling = new SignalingClient(`${proto}://${location.host}/signal`);

if (import.meta.hot) {
  import.meta.hot.dispose(() => signaling.disconnect());
}