// qr_payload.ts - turns one SDP into a short text code (for a QR) and back.
//
// Wire format:  "P2P1." + base64url( deflate( JSON ) )
//          or:  "P2P0." + base64url( JSON )          (browser without CompressionStream)
//
// The prefix lets a scanner ignore QR codes that belong to something else.

export type QrKind = 'offer' | 'answer';

export interface QrPayload {
  v: 1;          // format version
  k: QrKind;     // offer (sender -> receiver) or answer (receiver -> sender)
  id: string;    // pairing id: the answer repeats the offer's id so the sender can match them
  name: string;  // device name, display only
  sdp: string;   // description INCLUDING every ICE candidate (no trickle)
}

const ZIP = 'P2P1.';
const RAW = 'P2P0.';
const MAX_SDP_CHARS = 8000;

// 8 random bytes as hex. (crypto.randomUUID needs a secure context, getRandomValues does not.)
export function newPairingId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// ---- base64url ----
function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

// ---- deflate / inflate through the browser's built-in streams ----
async function run(data: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const writer = stream.writable.getWriter();
  writer.write(new Uint8Array(data)).catch(() => {}); // a bad input is reported by the read below
  writer.close().catch(() => {});
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}

// ---- public API ----
export async function encodePayload(payload: QrPayload): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(payload));
  if (typeof CompressionStream === 'undefined') return RAW + toBase64Url(json);
  return ZIP + toBase64Url(await run(json, new CompressionStream('deflate-raw')));
}

// Throws an Error with a message that is fine to show to the user
export async function decodePayload(text: string): Promise<QrPayload> {
  const t = text.trim();
  let json: Uint8Array;

  try {
    if (t.startsWith(ZIP)) {
      if (typeof DecompressionStream === 'undefined') throw new Error('unsupported');
      json = await run(fromBase64Url(t.slice(ZIP.length)), new DecompressionStream('deflate-raw'));
    } else if (t.startsWith(RAW)) {
      json = fromBase64Url(t.slice(RAW.length));
    } else {
      throw new Error('prefix');
    }
  } catch (e) {
    if (e instanceof Error && e.message === 'unsupported') {
      throw new Error('This browser cannot read compressed codes. Please use a newer browser.');
    }
    throw new Error('This is not a transfer code.');
  }

  let raw: unknown;
  try {
    raw = JSON.parse(new TextDecoder().decode(json));
  } catch {
    throw new Error('The code is damaged. Scan it again.');
  }
  return validate(raw);
}

// The code comes from another device, so check everything before it reaches WebRTC
function validate(raw: unknown): QrPayload {
  const x = raw as Partial<QrPayload> | null;
  if (!x || x.v !== 1) throw new Error('This code was made by a different version of the app.');
  if (x.k !== 'offer' && x.k !== 'answer') throw new Error('The code is damaged. Scan it again.');
  if (typeof x.id !== 'string' || x.id.length === 0 || x.id.length > 64) throw new Error('The code is damaged. Scan it again.');
  if (typeof x.sdp !== 'string' || x.sdp.length > MAX_SDP_CHARS || !x.sdp.startsWith('v=0')) {
    throw new Error('The code is damaged. Scan it again.');
  }
  return {
    v: 1,
    k: x.k,
    id: x.id,
    name: String(x.name ?? '').slice(0, 50) || 'Another device',
    sdp: x.sdp,
  };
}