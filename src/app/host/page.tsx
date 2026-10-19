'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getRooms, createRoom } from '@/lib/store';
import { Room } from '@/types';
import { Radio, Plus, Users, ArrowRight, Monitor, Play, Sparkles, X, Smartphone, QrCode } from 'lucide-react';

export default function HostSessionsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [customPin, setCustomPin] = useState('');

  useEffect(() => {
    setRooms(getRooms());
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = createRoom({
      title: newTitle.trim(),
      description: newDesc.trim(),
      customPin: customPin.trim() || undefined,
    });

    setRooms(getRooms());
    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
    setCustomPin('');
    router.push(`/host/${created.pin}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07090E] text-slate-100">
      {/* Top Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 sm:px-10 py-4.5 border-b border-white/10 bg-[#07090E]/80 backdrop-blur-xl">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => router.push('/')}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <Radio size={20} className="text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">
            SURV <span className="text-slate-400 font-semibold text-sm">Host Dashboard</span>
          </span>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="py-2.5 px-4.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Create New Session</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 px-4 sm:px-8 py-8 sm:py-12 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1.5">
              Your Sessions & Rooms
            </h1>
            <p className="text-sm text-slate-400">
              Manage polls, trigger live presentations, and review audience feedback.
            </p>
          </div>
        </div>

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rooms.map((room, idx) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="p-6 rounded-2xl bg-slate-900/50 border border-white/10 hover:border-indigo-500/40 backdrop-blur-md shadow-xl flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Active Session</span>
                  </span>

                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                    PIN: {room.pin}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 leading-snug group-hover:text-indigo-200 transition-colors">
                  {room.title}
                </h3>

                {room.description && (
                  <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2">
                    {room.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-white/5 mt-4">
                <button
                  onClick={() => router.push(`/host/${room.pin}`)}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Manage</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  onClick={() => router.push(`/present/${room.pin}`)}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                  title="Open Presenter View"
                >
                  <Monitor size={16} />
                </button>

                <button
                  onClick={() => router.push(`/app/${room.pin}`)}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                  title="Open Participant View"
                >
                  <Smartphone size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.form
              onSubmit={handleCreate}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-white/10 shadow-2xl flex flex-col gap-4.5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">
                  Create New Interactive Session
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Session Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Q4 Company Town Hall & Strategy"
                  className="w-full bg-slate-950/80 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Description (Optional)
                </label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Brief context or goals for this session..."
                  rows={2}
                  className="w-full bg-slate-950/80 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Custom 9-Digit PIN (Optional)
                </label>
                <input
                  type="text"
                  value={customPin}
                  onChange={e => setCustomPin(e.target.value)}
                  placeholder="Leave blank for auto-generated PIN"
                  className="w-full bg-slate-950/80 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  Create Session
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
