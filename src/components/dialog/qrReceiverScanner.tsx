import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { transfer } from "../../utils/handlers/transferManager";
import {
  decodePayload,
  encodePayload,
  compactSdp,
  payloadToQrDataUrl,
} from "../../utils/handlers/qr_code";
import { Modal } from "./dialog_components";

interface QrReceiverScannerProps {
  onClose?: () => void;
}

const ELEMENT_ID = "qr-reader-receiver";

export default function QrReceiverScanner({ onClose }: QrReceiverScannerProps) {
  const [step, setStep] = useState<"scanning" | "generating" | "show-answer" | "failed">("scanning");
  const [answerQrUrl, setAnswerQrUrl] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (step !== "scanning") return;

    let isSubscribed = true;
    const html5Qrcode = new Html5Qrcode(ELEMENT_ID);
    scannerRef.current = html5Qrcode;

    const startScanner = async () => {
      try {
        await html5Qrcode.start(
          { facingMode: "environment" }, // Explicitly request rear/back camera
          {
            fps: 15, // Higher frame rate for faster detection
            qrbox: { width: 260, height: 260 },
          },
          (scannedText: string) => {
            if (!isSubscribed) return;

            // Stop scanner safely before processing payload
            html5Qrcode
              .stop()
              .then(() => {
                if (isSubscribed) {
                  handleScannedOffer(scannedText);
                }
              })
              .catch((err) => console.warn("Error stopping scanner", err));
          },
          () => {
            // Frame scan failure - ignore noise
          }
        );
      } catch (err: any) {
        if (isSubscribed) {
          console.error("Camera access failed", err);
          setErrorMessage("Could not access rear camera. Check permissions or camera selection.");
          setStep("failed");
        }
      }
    };

    // Small delay to allow DOM element to fully mount
    const timer = setTimeout(startScanner, 100);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [step]);

  const handleScannedOffer = async (rawCode: string) => {
    setStep("generating");

    try {
      // 1. Decode & validate scanned QR payload
      const offerPayload = await decodePayload(rawCode);
      if (offerPayload.k !== "offer") {
        throw new Error("Scanned code is not an offer code.");
      }

      // 2. Pass offer SDP to TransferManager to gather answer SDP
      const rawAnswerSdp = await transfer.acceptQROffer(offerPayload.name, offerPayload.sdp);
      if (!rawAnswerSdp) {
        throw new Error("Failed to generate WebRTC answer.");
      }

      // 3. Compact & encode answer payload
      const compressedAnswerSdp = compactSdp(rawAnswerSdp);
      const answerPayload = await encodePayload({
        v: 1,
        k: "answer",
        id: offerPayload.id,
        name: "My Device",
        sdp: compressedAnswerSdp,
      });

      // 4. Render Answer QR DataURL
      const qrUrl = await payloadToQrDataUrl(answerPayload);
      setAnswerQrUrl(qrUrl);
      setStep("show-answer");
    } catch (err: any) {
      console.error("[rtc] QR Accept Error:", err);
      setErrorMessage(err?.message || "Failed to process QR offer code");
      setStep("failed");
    }
  };

  return (
    <Modal title="Receive via QR Code">
      <div className="flex flex-col items-center justify-center p-4 gap-4 max-w-sm mx-auto">
        {step === "scanning" && (
          <div className="w-full flex flex-col items-center">
            <p className="text-sm font-medium text-gray-700 text-center mb-3">
              Point your camera at the Offer QR code on the sender's device
            </p>
            <div
              id={ELEMENT_ID}
              className="w-full rounded-xl overflow-hidden border border-gray-200 min-h-[260px] bg-black/10"
            />
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {step === "generating" && (
          <div className="flex flex-col items-center py-8 gap-3 text-center">
            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            <h3 className="font-semibold text-gray-800 text-lg">Preparing Answer...</h3>
            <p className="text-xs text-gray-500">Gathering local ICE network candidates.</p>
          </div>
        )}

        {step === "show-answer" && (
          <div className="flex flex-col items-center text-center gap-3">
            <h3 className="font-semibold text-green-700 text-md">Offer Accepted!</h3>
            <p className="text-xs text-gray-600">
              Show this Answer QR code back to the <strong>Sender</strong> to complete the connection.
            </p>
            <img
              src={answerQrUrl}
              alt="Answer QR Code"
              className="rounded-xl bg-white shadow-md p-2 w-64 h-64"
            />
            <button onClick={onClose} className="mt-2 text-xs text-red-500 hover:underline">
              Close
            </button>
          </div>
        )}

        {step === "failed" && (
          <div className="flex flex-col items-center text-center gap-3 py-4">
            <h3 className="font-semibold text-gray-800">Connection Failed</h3>
            <p className="text-xs text-red-500">{errorMessage}</p>
            <button
              onClick={() => setStep("scanning")}
              className="mt-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}