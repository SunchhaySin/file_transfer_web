import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { QRCodeSVG } from 'qrcode.react'
import { transfer } from "../../utils/transferManager"
import {
  decodePayload,
  encodePayload,
  compactSdp,
  validateQrCapacity,
} from "../../handlers/qr_code";
import { Modal } from "./dialog_components";

interface QrReceiverScannerProps {
  onClose?: () => void;
}

const ELEMENT_ID = "qr-reader-receiver";

export default function QrReceiverScanner({ onClose }: QrReceiverScannerProps) {
  const [step, setStep] = useState<"scanning" | "generating" | "show-answer" | "failed">("scanning");
  const [answerPayloadString, setAnswerPayloadString] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (step !== "scanning") return;

    let isSubscribed = true;
    const html5Qrcode = new Html5Qrcode(ELEMENT_ID);
    scannerRef.current = html5Qrcode;

    const startScanner = async () => {
      try {
        const html5Qrcode = new Html5Qrcode(ELEMENT_ID);
        scannerRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 260, height: 260 },
          },
          async (scannedText: string) => {
            if (!isSubscribed) return;
            console.log("[QR Receiver] Scanned offer text length:", scannedText.length);

            try {
              if (html5Qrcode && html5Qrcode.isScanning) {
                await html5Qrcode.stop();
              }
            } catch (err) {
              console.warn("Error stopping scanner safely:", err);
            }

            if (isSubscribed) {
              handleScannedOffer(scannedText);
            }
          },
          () => {}
        );
      } catch (err: any) {
        if (isSubscribed) {
          console.error("Camera access failed:", err);
          setErrorMessage("Could not access camera. Check permissions.");
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

      const rawAnswerSdp = await transfer.acceptQROffer(offerPayload.name, offerPayload.sdp);
      if (!rawAnswerSdp) {
        throw new Error("Failed to generate WebRTC answer.");
      }

      const compressedAnswerSdp = compactSdp(rawAnswerSdp);
      const answerPayload = await encodePayload({
        v: 1,
        k: "answer",
        id: offerPayload.id,
        name: "My Device",
        sdp: compressedAnswerSdp,
      });

      validateQrCapacity(answerPayload);
      setAnswerPayloadString(answerPayload);
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
          <div className="w-full flex flex-col items-center gap-3">
            <p className="text-sm font-medium text-gray-700 text-center mb-3">
              Point your camera at the Offer QR code on the sender's device
            </p>
            <div
              id={ELEMENT_ID}
              className="w-full rounded-xl overflow-hidden border border-gray-200 min-h-65 bg-black/10"
            />
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-red-500 
                  rounded-xl shadow-[0px_0px_4px_0.5px_rgba(0,0,0,0.2)] font-medium text-sm transition-colors"
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
        

        {/* QR container the receiver's SDP and ICE answer  */}
        {step === "show-answer" && (
          <Modal title="Shoe Answer QR-Code">
            <div className="flex flex-col items-center text-center gap-3">
              <h3 className="font-bold text-green-700 text-md">Offer Accepted!</h3>
              <p className="text-xs text-gray-600">
                Show this Answer QR code back to the <strong>Sender</strong> to complete the connection.
              </p>
              {/* Rendered cleanly via qrcode.react SVG */}
              <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-200">
                <QRCodeSVG
                  value={answerPayloadString}
                  size={320}
                  level="Q"
                  bgColor="#ffffff"
                  fgColor="#022c22"
                  marginSize={2}
                />
              </div>
              <button onClick={onClose} 
                className="text-xs px-5 py-2 bg-gray-200 hover:bg-gray-300 text-red-500 
                  rounded-xl shadow-[0px_0px_4px_0.5px_rgba(0,0,0,0.2)] cursor-pointer font-semibold"
                >
                Close
              </button>
            </div>
          </Modal>
        )}

        {step === "failed" && (
          <div className="flex flex-col items-center text-center gap-3 py-4">
            <h3 className="font-semibold text-gray-800">Connection Failed</h3>
            <p className="text-xs text-red-500">{errorMessage}</p>
            <button
              onClick={() => setStep("scanning")}
              className="px-5 py-2 bg-green-500 hover:bg-green-600 font-medium rounded-xl text-xs shadow-[0px_0px_4px_0.5px_rgba(0,0,0,0.2)] transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}