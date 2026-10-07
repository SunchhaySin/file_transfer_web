// qr_payload.ts - Handles SDP compression, payload serialization, and QR DataURL generation.
import QRCode from "qrcode";

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

// A version-40 QR holds 2953 bytes at level L.
// Keep it around 1800-2300 characters so camera scanning remains fast and reliable.
const MAX_QR_CHARS = 2300;

// 8 random bytes as hex.
export function newPairingId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// ---- Base64Url Helpers ----
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

// ---- Deflate / Inflate Browser Streams ----
async function run(data: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const writer = stream.writable.getWriter();
  writer.write(new Uint8Array(data)).catch(() => {});
  writer.close().catch(() => {});
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}

// ---- Public Payload Serialization API ----
export async function encodePayload(payload: QrPayload): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(payload));
  if (typeof CompressionStream === 'undefined') return RAW + toBase64Url(json);
  return ZIP + toBase64Url(await run(json, new CompressionStream('deflate-raw')));
}

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
    throw new Error('This is not a valid transfer code.');
  }

  let raw: unknown;
  try {
    raw = JSON.parse(new TextDecoder().decode(json));
  } catch {
    throw new Error('The code is damaged. Scan it again.');
  }
  return validate(raw);
}

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

// ---- SDP Compression & Rendering ----
export function compactSdp(sdp: string): string {
  return sdp
    .split("\r\n")
    .filter((line) => {
      if (line.startsWith("b=")) return false;
      if (line.startsWith("a=rtcp-fb:")) return false;
      if (line.startsWith("a=fmtp:")) return false;
      if (line.startsWith("a=extmap:")) return false;
      if (line.startsWith("a=msid:")) return false;
      if (line.startsWith("a=ssrc:")) return false;
      return true;
    })
    .join("\r\n");
}

export async function payloadToQrDataUrl(text: string, size = 600): Promise<string> {
  if (text.length > MAX_QR_CHARS) {
    throw new Error(`The connection code is too large for one QR code (${text.length} characters).`);
  }
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "L",
    margin: 3,
    width: size,
    color: { dark: "#000000", light: "#ffffff" },
  });
}