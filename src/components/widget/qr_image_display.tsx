import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Modal } from "../dialog/dialog_components";
import QrSenderScanner from "../dialog/qrSenderScanner";

interface QrTransferCardProps {
  pairingId: string;
  payloadString: string | null;
  qrError: string | null;

  setShowQr: (state: boolean) => void;
  isDesktop: boolean;
  isTablet: boolean;
  isMobile: boolean;
}

export const QrCodeDisplay: React.FC<QrTransferCardProps> = ({
  pairingId,
  payloadString,
  qrError,
  isDesktop,
  isTablet,
  isMobile,
  setShowQr,
}) => {

  const [expandModal, setExpandModal] = useState(false);
  const [showAnswerScanner, setShowAnswerScanner] = useState(false);

  return (
    <div className="bg-blue-50 w-full rounded-2xl p-4 flex flex-col items-center justify-center gap-3">
      <div className="flex flex-col items-center w-full gap-3">
        {qrError ? (
          <p className="text-xs text-red-500 text-center font-medium">
            {qrError}
          </p>
        ) : payloadString ? (
          <div className="flex flex-col md:flex-row gap-4 items-center justify-around bg-white p-3 rounded-2xl shadow-md border border-gray-200 w-full">
            <div className="bg-white p-2 rounded-xl border border-gray-100 shrink-0">
              <QRCodeSVG
                value={payloadString}
                size={180}
                level="Q"
                bgColor="#ffffff"
                fgColor="#022c22"
                marginSize={1}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap md:flex-col gap-2 items-center justify-center w-full">
              <button
                onClick={() => setExpandModal(true)}
                className="text-xs bg-blue-400/80 hover:bg-blue-400 font-medium px-3 py-1.5 rounded-lg transition-colors w-full cursor-pointer"
              >
                Expand QR
              </button>
              <button
                onClick={() => setShowAnswerScanner(true)}
                className="text-xs bg-green-400 hover:bg-green-500/90 font-semibold px-3 py-1.5 rounded-lg transition-colors w-full cursor-pointer"
              >
                Scan Answer
              </button>
              <button
                onClick={() => setShowQr(false)}
                className="text-xs bg-red-500/80 hover:bg-red-500 font-semibold px-3 py-1.5 rounded-lg transition-colors w-full cursor-pointer"
              >
                Hide QR
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Expanded QR: the initial QR container the offer (on the sender side) */}
      {expandModal && payloadString && (
        <Modal title="Scan Offer QR Code">
          <div className="flex flex-col items-center justify-center gap-4 text-center mx-auto">
            <p className="text-xs sm:text-sm text-gray-600 font-medium">
              Point the receiving device's camera at this QR code to initiate
              the transfer.
            </p>

            <div className="bg-white p-2 rounded-2xl shadow-md border border-gray-200">
              <QRCodeSVG
                value={payloadString}
                size={
                  isDesktop ? 360 : isTablet ? 320 : isMobile ? 280 : undefined
                }
                level="Q"
                bgColor="#ffffff"
                fgColor="#022c22"
                marginSize={2}
              />
            </div>

            <button
              onClick={() => setExpandModal(false)}
              className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-red-500
                font-semibold rounded-xl text-xs shadow-[0px_0px_4px_0.5px_rgba(0,0,0,0.2)] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Scan Answer QR Modal (qrSenderScanner)*/}
      {showAnswerScanner && (
        <Modal title="Scan Receiver's Answer">
          <div className="p-2 max-w-sm mx-auto">
            <QrSenderScanner
              expectedPairingId={pairingId}
              onSuccess={() => setShowAnswerScanner(false)}
              onCancel={() => setShowAnswerScanner(false)}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};