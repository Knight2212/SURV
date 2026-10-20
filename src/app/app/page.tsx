'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Radio, ArrowLeft } from 'lucide-react';
import { getRooms, initializeStore } from '@/lib/store';
import { Room } from '@/types';

export default function ParticipantJoinPage() {
  const router = useRouter();
  const [pinInput, setPinInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [recentRooms, setRecentRooms] = useState<Room[]>([]);

  useEffect(() => {
    initializeStore();
    const rooms = getRooms();
    setRecentRooms(rooms.slice(0, 3));
    const savedName = localStorage.getItem('surv_participant_name') || '';
    if (savedName) setNameInput(savedName);
  }, []);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 9);
    let formatted = raw;
    if (raw.length > 6) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6)}`;
    } else if (raw.length > 3) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    }
    setPinInput(formatted);
    if (errorMsg) setErrorMsg('');
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pinInput.replace(/[^0-9]/g, '');
    if (clean.length < 6) {
      setErrorMsg('Please enter a valid session PIN (e.g. 123-456-789)');
      return;
    }

    if (nameInput.trim()) {
      localStorage.setItem('surv_participant_name', nameInput.trim());
    }

    router.push(`/app/${pinInput}`);
  };

  return (
    <div className="min-h-[100svh] bg-[#283E34] p-2 sm:p-4 text-[#181F1C]">
      <div className="bg-[#E6E5DC] rounded-2xl sm:rounded-3xl min-h-[calc(100svh-1rem)] sm:min-h-[calc(100svh-2rem)] flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <header className="px-6 sm:px-10 py-5 flex items-center justify-between border-b border-[#D5D4CB]/60"> {/* taste-skill-ignore */}
          <div
            className="flex items-center gap-2 cursor-pointer bg-[#DFDDD3] hover:bg-[#D7D5CB] px-3 py-1.5 rounded-lg border border-[#D0CEC4] transition-colors"
            onClick={() => router.push('/')}
          >
            <div className="w-5 h-5 rounded bg-[#181F1C] text-[#E6E5DC] flex items-center justify-center">
              <Sparkles size={12} />
            </div>
            <span className="text-base font-semibold tracking-tight text-[#181F1C]">
              surv<span className="text-[#2D4A3E]">.</span>
            </span>
          </div>

          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#5F665E] hover:text-[#181F1C] rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-lg mx-auto w-full text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#DFDDD3] border border-[#D0CEC4] flex items-center justify-center mb-5 text-[#2D4A3E]">
            <Radio size={24} />
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#181F1C] mb-3">
            Join Live Session
          </h1>
          <p className="text-sm text-[#5F665E] leading-relaxed mb-8 max-w-sm">
            Enter the session PIN from the presenter&apos;s stage screen to participate in live polls and audience Q&amp;A.
          </p>

          <form onSubmit={handleJoin} className="w-full bg-[#DFDDD3] p-6 rounded-2xl border border-[#D0CEC4] space-y-4 text-left">
            <div>
              <label className="text-xs font-medium text-[#5F665E] block mb-1.5">
                Session PIN
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={pinInput}
                onChange={handlePinChange}
                placeholder="000-000-000"
                autoFocus
                className="w-full bg-[#EBEAE3] border border-[#D0CEC4] rounded-lg px-4 py-3 text-lg font-semibold tabular-nums text-center text-[#181F1C] placeholder-[#8C9188] focus:outline-none focus:border-[#2D4A3E] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#5F665E] block mb-1.5">
                Your Display Name (Optional)
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="e.g. Alex M."
                maxLength={24}
                className="w-full bg-[#EBEAE3] border border-[#D0CEC4] rounded-lg px-3.5 py-2.5 text-sm text-[#181F1C] placeholder-[#8C9188] focus:outline-none focus:border-[#2D4A3E] transition-colors"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 text-sm font-semibold text-white bg-[#2D4A3E] hover:bg-[#233B31] rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span>Enter Session</span>
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Active / Recent Sessions Quick Join */}
          {recentRooms.length > 0 && (
            <div className="mt-8 w-full text-left">
              <span className="text-xs font-medium text-[#8C9188] block mb-2 text-center">
                Or join an active session:
              </span>
              <div className="space-y-2">
                {recentRooms.map(r => (
                  <button
                    key={r.id}
                    onClick={() => router.push(`/app/${r.pin}`)}
                    className="w-full p-3 rounded-xl bg-white hover:bg-[#F5F4EE] border border-[#D0CEC4] flex items-center justify-between transition-colors cursor-pointer text-left"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[#181F1C]">{r.title}</p>
                      <span className="text-[11px] text-[#5F665E] tabular-nums">PIN: {r.pin}</span>
                    </div>
                    <span className="text-xs text-[#2D4A3E] font-medium flex items-center gap-1">
                      Join <ArrowRight size={12} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="py-6 px-6 sm:px-10 border-t border-[#D5D4CB]/60 text-xs text-[#5F665E] text-center"> {/* taste-skill-ignore */}
          <span>surv. &bull; Zero login required for participants</span>
        </footer>
      </div>
    </div>
  );
}
