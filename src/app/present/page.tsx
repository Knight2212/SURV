'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Monitor, ArrowRight, ArrowLeft, Plus } from 'lucide-react';
import { getRooms, getPollsForRoom, initializeStore } from '@/lib/store';
import { Room } from '@/types';

export default function PresenterIndexPage() {
  const router = useRouter();
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    initializeStore();
    const loaded = getRooms();
    setRooms(loaded);
  }, []);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 9);
    let formatted = raw;
    if (raw.length > 6) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3, 6)}`;
      if (raw.length > 6) {
        formatted = `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6)}`;
      }
    } else if (raw.length > 3) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    }
    setPinInput(formatted);
    if (errorMsg) setErrorMsg('');
  };

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pinInput.replace(/[^0-9]/g, '');
    if (clean.length < 6) {
      setErrorMsg('Please enter a valid session PIN (e.g. 123-456-789)');
      return;
    }
    router.push(`/present/${pinInput}`);
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/host')}
              className="px-3.5 py-1.5 text-xs font-medium text-[#181F1C] bg-white hover:bg-[#F5F4EE] rounded-lg border border-[#D0CEC4] transition-colors cursor-pointer"
            >
              Host Dashboard
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#5F665E] hover:text-[#181F1C] rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Home</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-xl mx-auto w-full text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#DFDDD3] border border-[#D0CEC4] flex items-center justify-center mb-5 text-[#2D4A3E]">
            <Monitor size={24} />
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#181F1C] mb-3">
            Presenter Stage Mode
          </h1>
          <p className="text-sm text-[#5F665E] leading-relaxed mb-8 max-w-md">
            Broadcast full-screen live bar charts, animated word clouds, and crowdsourced Q&amp;A on the keynote auditorium projector.
          </p>

          {/* Quick Select from existing rooms */}
          {rooms.length > 0 ? (
            <div className="w-full space-y-4 mb-8">
              <div className="text-left">
                <span className="text-xs font-semibold text-[#181F1C] block mb-2">
                  Select a session to project:
                </span>
                <div className="space-y-2">
                  {rooms.map(r => (
                    <div
                      key={r.id}
                      onClick={() => router.push(`/present/${r.pin}`)}
                      className="p-4 rounded-xl bg-[#DFDDD3] hover:bg-[#D7D5CB] border border-[#D0CEC4] flex items-center justify-between transition-colors cursor-pointer text-left"
                    >
                      <div>
                        <h3 className="text-sm font-semibold text-[#181F1C]">{r.title}</h3>
                        <p className="text-xs text-[#5F665E] tabular-nums mt-0.5">
                          PIN: <strong className="text-[#2D4A3E]">{r.pin}</strong> &bull; {getPollsForRoom(r.id).length} polls
                        </p>
                      </div>
                      <button
                        type="button"
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2D4A3E] hover:bg-[#233B31] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Project</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 text-center">
                <span className="text-xs text-[#8C9188]">Or enter another session PIN manually:</span>
              </div>
            </div>
          ) : (
            <div className="w-full mb-8 p-6 rounded-2xl bg-[#DFDDD3] border border-[#D0CEC4] text-center space-y-3">
              <p className="text-xs text-[#5F665E]">
                No sessions created yet on this device.
              </p>
              <button
                onClick={() => router.push('/host')}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2D4A3E] hover:bg-[#233B31] rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus size={14} />
                <span>Create session in Dashboard</span>
              </button>
            </div>
          )}

          {/* Manual PIN Form */}
          <form onSubmit={handleLaunch} className="w-full bg-[#DFDDD3] p-5 rounded-2xl border border-[#D0CEC4] flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={pinInput}
              onChange={handlePinChange}
              placeholder="Enter PIN (e.g. 123-456-789)"
              className="flex-1 bg-[#EBEAE3] border border-[#D0CEC4] rounded-lg px-3.5 py-2.5 text-sm tabular-nums text-[#181F1C] placeholder-[#8C9188] focus:outline-none focus:border-[#2D4A3E] transition-colors"
            />
            <button
              type="submit"
              className="px-4 py-2.5 text-xs font-semibold text-white bg-[#2D4A3E] hover:bg-[#233B31] rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>Launch</span>
              <ArrowRight size={13} />
            </button>
          </form>

          {errorMsg && (
            <p className="text-xs text-rose-600 font-medium mt-2">{errorMsg}</p>
          )}
        </main>

        {/* Footer */}
        <footer className="py-6 px-6 sm:px-10 border-t border-[#D5D4CB]/60 text-xs text-[#5F665E] text-center"> {/* taste-skill-ignore */}
          <span>surv. stage projection &bull; Full keyboard navigation (Space, Arrows, C, R, F)</span>
        </footer>
      </div>
    </div>
  );
}
