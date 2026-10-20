'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, QrCode } from 'lucide-react';

interface QRCodeModalProps {
  pin: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export default function QRCodeModal({
  pin,
  isOpen,
  onClose,
  title = 'Join Live Session',
}: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [joinUrl, setJoinUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/app/${pin.replace(/\s+/g, '-')}`;
      setJoinUrl(url);

      QRCode.toDataURL(url, {
        width: 360,
        margin: 2,
        color: {
          dark: '#181F1C',
          light: '#FFFFFF',
        },
      })
        .then(data => setQrDataUrl(data))
        .catch(err => console.error('QR code generation error:', err));
    }
  }, [pin]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div
        data-ui="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-sm rounded-2xl bg-[#181F1C] border border-[#283E34] p-7 flex flex-col items-center text-center overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-[#8C9188] hover:text-white rounded hover:bg-[#233B31] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Icon Badge */}
          <div className="w-11 h-11 rounded-lg bg-[#2D4A3E] text-[#c6f19d] flex items-center justify-center mb-3">
            <QrCode size={22} />
          </div>

          <h3 className="text-xl font-bold text-white tracking-tight mb-1">
            {title}
          </h3>
          <p className="text-xs text-[#8C9188] mb-5 leading-relaxed">
            Scan with any smartphone camera or navigate to the URL below
          </p>

          {/* High-Contrast QR Code Card */}
          <div className="p-3.5 bg-white rounded-xl mb-5">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Join QR code for PIN ${pin}`}
                className="w-56 h-56 block rounded"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-700 text-xs tabular-nums">
                Generating QR code...
              </div>
            )}
          </div>

          {/* PIN Display */}
          <div className="mb-5 space-y-0.5">
            <span className="text-xs font-semibold text-[#8C9188]">
              Session PIN
            </span>
            <div className="text-2xl font-bold tracking-widest text-[#c6f19d] tabular-nums">
              {pin}
            </div>
          </div>

          {/* 1-Click Copy Link */}
          <button
            onClick={handleCopy}
            className={`w-full py-3 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-colors cursor-pointer ${
              copied
                ? 'bg-[#2D4A3E] text-[#c6f19d] border-[#c6f19d]'
                : 'bg-[#233B31] hover:bg-[#2D4A3E] text-[#E6E5DC] border-[#283E34]'
            }`}
          >
            {copied ? (
              <>
                <Check size={16} className="text-[#c6f19d]" />
                <span>Link Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copy Direct Join Link</span>
              </>
            )}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
