import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { transfer } from "../../utils/handlers/transferManager"; // Adjust path if needed
import { decodePayload } from "../../utils/handlers/qr_code";       // Adjust path if needed

interface QrSenderScannerProps {
  expectedPairingId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ELEMENT_ID = "qr-reader-sender";

export default function QrSenderScanner({
  expectedPairingId,
  onSuccess,
  onCancel,
}: QrSenderScannerProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let isSubscribed = true;
    const html5Qrcode = new Html5Qrcode(ELEMENT_ID);
    scannerRef.current = html5Qrcode;

    const startScanner = async () => {
      try {
        await html5Qrcode.start(
          { facingMode: "environment" }, // Request rear/back camera
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
          },
          (scannedText: string) => {
            if (!isSubscribed) return;

            // Stop scanning immediately on detection to avoid duplicate triggers
            html5Qrcode
              .stop()
              .then(() => {
                if (isSubscribed) {
                  handleScannedAnswer(scannedText);
                }
              })
              .catch((err) => console.warn("Error stopping sender scanner:", err));
          },
          () => {
            // Noise per frame — ignore
          }
        );
      } catch (err: any) {
        if (isSubscribed) {
          console.error("Sender camera access failed:", err);
          setErrorMessage("Could not open camera. Please check permissions.");
        }
      }
    };

    // Small delay ensures DOM container element is fully mounted
    const timer = setTimeout(startScanner, 100);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [expectedPairingId]);

  const handleScannedAnswer = async (rawCode: string) => {
    setIsConnecting(true);
    setErrorMessage(null);

    try {
      // 1. Decode & validate answer payload
      const answerPayload = await decodePayload(rawCode);

      if (answerPayload.k !== "answer") {
        throw new Error("Scanned code is an Offer QR code, not an Answer code.");
      }

      // 2. Validate pairing ID match (if expectedPairingId is provided)
      if (expectedPairingId && answerPayload.id !== expectedPairingId) {
        throw new Error("Pairing ID mismatch. Please scan the Answer QR generated for this transfer session.");
      }

      // 3. Apply the answer SDP to open WebRTC DataChannel
      await transfer.applyQRAnswer(answerPayload.sdp);
      onSuccess?.();
    } catch (err: any) {
      console.error("[rtc] Failed to apply scanned QR answer:", err);
      setErrorMessage(err?.message || "Invalid or corrupt Answer QR code.");
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 w-full">
      {!isConnecting ? (
        <>
          <p className="text-xs sm:text-sm font-medium text-gray-700 text-center">
            Point your camera at the Receiver's Answer QR code
          </p>

          <div
            id={ELEMENT_ID}
            className="w-full rounded-xl overflow-hidden border border-gray-200 min-h-[250px] bg-black/10"
          />

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
              <p className="text-xs text-red-600 font-medium">{errorMessage}</p>
            </div>
          )}

          {onCancel && (
            <button
              onClick={onCancel}
              className="mt-1 px-4 py-1.5 bg-gray-200 hover:bg-gray-300 font-medium text-xs rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center py-8 gap-3 text-center">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <h3 className="font-semibold text-gray-800 text-base">Connecting Peer...</h3>
          <p className="text-xs text-gray-500">
            Applying remote description and opening WebRTC data channel.
          </p>
        </div>
      )}
    </div>
  );
}