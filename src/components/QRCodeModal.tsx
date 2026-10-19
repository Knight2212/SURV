'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, QrCode, Sparkles } from 'lucide-react';

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
          dark: '#07090E',
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-sm rounded-3xl bg-slate-900/90 border border-white/10 p-7 flex flex-col items-center text-center shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Icon Badge */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center mb-3 shadow-lg shadow-indigo-600/30">
            <QrCode size={24} />
          </div>

          <h3 className="text-xl font-black text-white tracking-tight mb-1">
            {title}
          </h3>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            Scan with any smartphone camera or navigate to the URL below
          </p>

          {/* High-Contrast QR Code Card */}
          <div className="p-3.5 bg-white rounded-2xl shadow-xl shadow-black/40 mb-5 ring-4 ring-white/10">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Join QR code for PIN ${pin}`}
                className="w-56 h-56 block rounded-xl"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-700 text-xs font-mono">
                Generating QR code...
              </div>
            )}
          </div>

          {/* PIN Display */}
          <div className="mb-5 space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Session PIN
            </span>
            <div className="text-2xl font-black font-mono tracking-widest text-cyan-400">
              {pin}
            </div>
          </div>

          {/* 1-Click Copy Link */}
          <button
            onClick={handleCopy}
            className={`w-full py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 shadow-md shadow-emerald-950/30'
                : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10 hover:border-white/20'
            }`}
          >
            {copied ? (
              <>
                <Check size={16} className="text-emerald-400" />
                <span>Link Copied to Clipboard!</span>
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
