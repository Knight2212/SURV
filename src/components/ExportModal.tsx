'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileSpreadsheet, Table, FileCode, Download, Check } from 'lucide-react';
import {
  SessionExportData,
  exportSessionToExcel,
  exportSessionToCSV,
  exportSessionToJSON,
} from '@/lib/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SessionExportData;
  onExportSuccess?: (format: string) => void;
}

export default function ExportModal({
  isOpen,
  onClose,
  data,
  onExportSuccess,
}: ExportModalProps) {
  if (!isOpen) return null;

  const handleExport = (format: 'xlsx' | 'csv' | 'json') => {
    if (format === 'xlsx') {
      exportSessionToExcel(data);
      onExportSuccess?.('Excel (.xlsx)');
    } else if (format === 'csv') {
      exportSessionToCSV(data);
      onExportSuccess?.('Spreadsheet (.csv)');
    } else {
      exportSessionToJSON(data);
      onExportSuccess?.('JSON (.json)');
    }
    onClose();
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
          className="relative w-full max-w-md rounded-2xl bg-[#E6E5DC] border border-[#D0CEC4] p-6 text-[#181F1C] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-3">
            <div>
              <span className="text-xs font-semibold text-[#2D4A3E] block">
                Session Data Export
              </span>
              <h3 className="text-xl font-bold text-[#181F1C] leading-snug">
                Export Session Report
              </h3>
              <p className="text-xs text-[#5F665E] mt-0.5">
                {data.room.title} &bull; PIN: <strong className="tabular-nums text-[#181F1C]">{data.room.pin}</strong>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#5F665E] hover:text-[#181F1C] bg-[#DFDDD3] cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 my-4 p-3 bg-[#DFDDD3] rounded-xl text-center text-xs">
            <div>
              <span className="block font-bold text-[#181F1C] tabular-nums text-sm">
                {data.polls.length}
              </span>
              <span className="text-[11px] text-[#5F665E]">Polls</span>
            </div>
            <div>
              <span className="block font-bold text-[#181F1C] tabular-nums text-sm">
                {data.qaQuestions.length}
              </span>
              <span className="text-[11px] text-[#5F665E]">Q&amp;A Items</span>
            </div>
            <div>
              <span className="block font-bold text-[#181F1C] tabular-nums text-sm">
                {data.surveys.length}
              </span>
              <span className="text-[11px] text-[#5F665E]">Surveys</span>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-2.5">
            {/* 1. EXCEL WORKBOOK */}
            <button
              type="button"
              onClick={() => handleExport('xlsx')}
              className="w-full p-4 rounded-xl bg-white hover:bg-[#F5F4EE] border border-[#D0CEC4] hover:border-[#2D4A3E] flex items-center justify-between text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#181F1C]">
                      Microsoft Excel Workbook
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      .XLSX
                    </span>
                  </div>
                  <p className="text-xs text-[#5F665E] mt-0.5">
                    Multi-tab workbook with Overview, Poll Votes, Q&amp;A, and Survey tabs
                  </p>
                </div>
              </div>
              <Download size={16} className="text-[#8C9188] group-hover:text-[#2D4A3E] shrink-0" />
            </button>

            {/* 2. SPREADSHEET CSV */}
            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="w-full p-4 rounded-xl bg-white hover:bg-[#F5F4EE] border border-[#D0CEC4] hover:border-[#2D4A3E] flex items-center justify-between text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                  <Table size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#181F1C]">
                      Spreadsheet CSV
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      .CSV
                    </span>
                  </div>
                  <p className="text-xs text-[#5F665E] mt-0.5">
                    Standard format compatible with Google Sheets, Apple Numbers, and Calc
                  </p>
                </div>
              </div>
              <Download size={16} className="text-[#8C9188] group-hover:text-[#2D4A3E] shrink-0" />
            </button>

            {/* 3. STRUCTURED JSON */}
            <button
              type="button"
              onClick={() => handleExport('json')}
              className="w-full p-4 rounded-xl bg-white hover:bg-[#F5F4EE] border border-[#D0CEC4] hover:border-[#2D4A3E] flex items-center justify-between text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <FileCode size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#181F1C]">
                      Structured JSON Backup
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      .JSON
                    </span>
                  </div>
                  <p className="text-xs text-[#5F665E] mt-0.5">
                    Complete raw payload for developers and system backups
                  </p>
                </div>
              </div>
              <Download size={16} className="text-[#8C9188] group-hover:text-[#2D4A3E] shrink-0" />
            </button>
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-4 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#5F665E] hover:text-[#181F1C] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
