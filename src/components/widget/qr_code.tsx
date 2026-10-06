import { useEffect, useState } from "react";
import QRCode from "qrcode";

// A version-40 QR holds 2953 bytes at level L.
// Keep it around 1800-2000 characters so camera scanning remains fast and reliable.
const MAX_QR_CHARS = 2300;

/**
 * Strips non-essential WebRTC SDP metadata to drastically compress the QR payload size.
 */
export function compactSdp(sdp: string): string {
  return sdp
    .split("\r\n")
    .filter((line) => {
      // Remove unnecessary bandwidth, group, and extended feedback attributes
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

export async function payloadToQrDataUrl(text: string, size = 420): Promise<string> {
  if (text.length > MAX_QR_CHARS) {
    throw new Error(
      `The connection code is too large for one QR code (${text.length} characters).`
    );
  }
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "L", // Lowest error correction = larger, easier-to-scan modules
    margin: 3,                 // Quiet zone for webcam scanners
    width: size,
    color: { dark: "#000000", light: "#ffffff" }, // High-contrast black on white
  });
}

export function QrCodeImage({ text, size = 320 }: { text: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setSrc(null);
    setError(null);

    // Render at 2x resolution so it stays crisp on Retina/high-DPI screens
    payloadToQrDataUrl(text, size * 2)
      .then((url) => {
        if (alive) setSrc(url);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Could not draw the QR code.");
      });

    return () => {
      alive = false;
    };
  }, [text, size]);

  if (error) {
    return <p className="p-4 text-center text-sm font-medium text-red-600">{error}</p>;
  }

  if (!src) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-xl bg-white/60 animate-pulse"
      />
    );
  }

  return (
    <img
      src={src}
      width={size}
      height={size}
      alt="Connection QR code"
      className="rounded-xl bg-white shadow-md p-2"
    />
  );
}