'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  duplicateRoom,
  getPollsForRoom,
  getQAQuestions,
  getDashboardMetrics,
  exportRoomData,
  subscribeToRealtime,
} from '@/lib/store';
import { Room } from '@/types';
import QRCodeModal from '@/components/QRCodeModal';
import {
  Radio,
  Plus,
  Users,
  ArrowRight,
  Monitor,
  Sparkles,
  X,
  Smartphone,
  QrCode,
  Search,
  Copy,
  Check,
  MoreVertical,
  Edit3,
  Trash2,
  CopyPlus,
  Download,
  BarChart3,
  MessageSquare,
  LayoutGrid,
  List,
  PauseCircle,
  StopCircle,
  LayoutTemplate,
  Building2,
  Zap,
  BookOpen,
} from 'lucide-react';

type FilterTab = 'all' | 'active' | 'paused' | 'ended';
type SortOption = 'newest' | 'participants' | 'title';

export default function HostSessionsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [metrics, setMetrics] = useState({
    totalRooms: 0,
    activeRooms: 0,
    pausedRooms: 0,
    endedRooms: 0,
    totalParticipants: 0,
    totalPolls: 0,
    totalResponses: 0,
    totalQA: 0,
  });

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
  const [selectedQRRoom, setSelectedQRRoom] = useState<Room | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Form Fields for Create Modal
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [customPin, setCustomPin] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<'blank' | 'townhall' | 'quiz' | 'workshop'>('blank');

  // Form Fields for Edit Modal
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'paused' | 'ended'>('active');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3000);
  };

  const refreshData = () => {
    const loadedRooms = getRooms();
    setRooms(loadedRooms);
    setMetrics(getDashboardMetrics());
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = subscribeToRealtime(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdownId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Filter & Sort Logic
  const filteredRooms = useMemo(() => {
    return rooms
      .filter(room => {
        if (activeTab !== 'all' && room.status !== activeTab) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = room.title.toLowerCase().includes(q);
          const matchDesc = room.description?.toLowerCase().includes(q);
          const matchPin = room.pin.toLowerCase().includes(q) || room.pin.replace(/-/g, '').includes(q);
          return matchTitle || matchDesc || matchPin;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'participants') {
          return (b.participantCount || 0) - (a.participantCount || 0);
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [rooms, activeTab, searchQuery, sortBy]);

  // Handler: Create Room
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = createRoom({
      title: newTitle.trim(),
      description: newDesc.trim(),
      customPin: customPin.trim() || undefined,
      template: selectedTemplate,
    });

    refreshData();
    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
    setCustomPin('');
    setSelectedTemplate('blank');
    showToast(`Session "${created.title}" created successfully.`);
    router.push(`/host/${created.pin}`);
  };

  // Quick Open Create Modal with template
  const openCreateWithTemplate = (template: 'blank' | 'townhall' | 'quiz' | 'workshop') => {
    setSelectedTemplate(template);
    if (template === 'townhall') setNewTitle('Company All-Hands & Open Townhall');
    else if (template === 'quiz') setNewTitle('Interactive Speed Quiz & Trivia');
    else if (template === 'workshop') setNewTitle('Live Workshop & Comprehension Check');
    else setNewTitle('');
    setShowCreateModal(true);
  };

  // Handler: Edit Room
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom || !editTitle.trim()) return;

    updateRoom(editingRoom.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      status: editStatus,
    });

    refreshData();
    setShowEditModal(false);
    setEditingRoom(null);
    showToast('Session updated successfully.');
  };

  // Handler: Duplicate Room
  const handleDuplicate = (roomId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveDropdownId(null);
    const duplicated = duplicateRoom(roomId);
    if (duplicated) {
      refreshData();
      showToast(`Duplicated as "${duplicated.title}".`);
    }
  };

  // Handler: Delete Room
  const confirmDelete = () => {
    if (!deletingRoom) return;
    deleteRoom(deletingRoom.id);
    refreshData();
    setShowDeleteModal(false);
    setDeletingRoom(null);
    showToast('Session deleted.');
  };

  // Handler: Export Session Data
  const handleExport = (roomId: string, title: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveDropdownId(null);
    const data = exportRoomData(roomId);
    if (!data) return;

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `surv-session-${data.room.pin}-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast(`Exported "${title}" report (JSON).`);
  };

  // Handler: Copy PIN
  const handleCopyPin = (pin: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(pin);
      setCopiedPin(pin);
      showToast(`PIN ${pin} copied to clipboard.`);
      setTimeout(() => setCopiedPin(prev => (prev === pin ? null : prev)), 2000);
    }
  };

  return (
    <div data-ui="true" className="min-h-[100svh] flex flex-col bg-[#111614] text-[#E6E5DC]">
      {/* Top Studio Navbar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-8 py-3.5 bg-[#181F1C] ">
        <div className="flex items-center gap-6">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => router.push('/')}
          >
            <div className="w-9 h-9 rounded-lg bg-[#2D4A3E] text-[#c6f19d] flex items-center justify-center">
              <Radio size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                SURV <span className="text-xs px-2 py-0.5 rounded bg-[#2D4A3E] text-[#c6f19d] font-medium">Host Studio</span>
              </span>
              <span className="text-[11px] text-[#8C9188] hidden sm:block">Live Interactive Audience Management</span>
            </div>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => router.push('/app')}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#E6E5DC] bg-[#233B31] hover:bg-[#2D4A3E] rounded-lg transition-colors cursor-pointer"
            title="Open Participant Join Portal"
          >
            <Smartphone size={14} className="text-[#c6f19d]" />
            <span>Join as Participant</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="py-2 px-4 sm:py-2.5 sm:px-5 text-xs sm:text-sm font-semibold text-[#181F1C] bg-[#c6f19d] hover:bg-[#b8e88c] rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Session</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 px-4 sm:px-8 py-6 sm:py-9 max-w-7xl mx-auto w-full flex flex-col gap-8">
        
        {/* Executive Stats Banner */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          {/* Stat 1: Total & Active Sessions */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#181F1C] border border-[#283E34] flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-[#8C9188]">
                Total sessions
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-white mt-1 tabular-nums">
                {metrics.totalRooms}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-[#c6f19d]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c6f19d] inline-block" />
                <span>{metrics.activeRooms} live</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#233B31] text-[#c6f19d] flex items-center justify-center">
              <Radio size={18} />
            </div>
          </div>

          {/* Stat 2: Total Participants */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#181F1C] border border-[#283E34] flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-[#8C9188]">
                Total participants
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-white mt-1 tabular-nums">
                {metrics.totalParticipants}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-[#8C9188]">
                <Users size={12} />
                <span>Audience members</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#233B31] text-[#E6E5DC] flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>

          {/* Stat 3: Total Polls & Responses */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#181F1C] border border-[#283E34] flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-[#8C9188]">
                Poll responses
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-white mt-1 tabular-nums">
                {metrics.totalResponses}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-[#8C9188]">
                <span>{metrics.totalPolls} polls</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#233B31] text-[#E6E5DC] flex items-center justify-center">
              <BarChart3 size={18} />
            </div>
          </div>

          {/* Stat 4: Audience Q&A */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#181F1C] border border-[#283E34] flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-[#8C9188]">
                Audience Q&A
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-white mt-1 tabular-nums">
                {metrics.totalQA}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-[#8C9188]">
                <MessageSquare size={12} />
                <span>Questions asked</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#233B31] text-[#E6E5DC] flex items-center justify-center">
              <MessageSquare size={18} />
            </div>
          </div>
        </section>

        {/* Dashboard Control Bar: Filters, Search, View Mode */}
        {rooms.length > 0 && (
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 ">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#181F1C] rounded-lg">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-[#2D4A3E] text-[#c6f19d]'
                    : 'text-[#8C9188] hover:text-white'
                }`}
              >
                All ({rooms.length})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  activeTab === 'active'
                    ? 'bg-[#2D4A3E] text-[#c6f19d]'
                    : 'text-[#8C9188] hover:text-[#c6f19d]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#c6f19d] inline-block" />
                <span>Live now ({metrics.activeRooms})</span>
              </button>
              <button
                onClick={() => setActiveTab('paused')}
                className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  activeTab === 'paused'
                    ? 'bg-[#2D4A3E] text-[#c6f19d]'
                    : 'text-[#8C9188] hover:text-white'
                }`}
              >
                Drafts ({metrics.pausedRooms})
              </button>
              <button
                onClick={() => setActiveTab('ended')}
                className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  activeTab === 'ended'
                    ? 'bg-[#2D4A3E] text-[#c6f19d]'
                    : 'text-[#8C9188] hover:text-white'
                }`}
              >
                Completed ({metrics.endedRooms})
              </button>
            </div>

            {/* Search, Sort, View Controls */}
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              {/* Search Input */}
              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C9188]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by title or PIN..."
                  className="w-full pl-9 pr-3 py-2 bg-[#181F1C] border border-[#283E34] rounded-lg text-xs text-white placeholder-[#8C9188] focus:outline-none focus:border-[#c6f19d]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C9188] hover:text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 bg-[#181F1C] border border-[#283E34] rounded-lg px-2.5 py-1.5 text-xs text-[#E6E5DC]">
                <span className="text-[#8C9188] text-[11px] hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
                >
                  <option value="newest" className="bg-[#181F1C] text-white">Newest First</option>
                  <option value="participants" className="bg-[#181F1C] text-white">Most Participants</option>
                  <option value="title" className="bg-[#181F1C] text-white">Title A-Z</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-[#181F1C] border border-[#283E34] rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded cursor-pointer ${
                    viewMode === 'grid' ? 'bg-[#2D4A3E] text-[#c6f19d]' : 'text-[#8C9188] hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded cursor-pointer ${
                    viewMode === 'list' ? 'bg-[#2D4A3E] text-[#c6f19d]' : 'text-[#8C9188] hover:text-white'
                  }`}
                  title="List View"
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Sessions Content */}
        {rooms.length === 0 ? (
          /* CLEAN ONBOARDING ZERO-STATE */
          <div className="py-14 sm:py-20 px-6 rounded-2xl bg-[#181F1C] border border-[#283E34] text-center flex flex-col items-center justify-center max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-xl bg-[#2D4A3E] text-[#c6f19d] flex items-center justify-center mb-5">
              <Radio size={24} />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
              Welcome to Your Host Studio
            </h2>
            <p className="text-sm text-[#8C9188] max-w-md mb-8 leading-relaxed">
              No sessions created yet. Launch your first interactive session to engage your audience with live polls, word clouds, speed quizzes, and crowdsourced Q&A.
            </p>

            <button
              onClick={() => setShowCreateModal(true)}
              className="py-3 px-6 text-sm font-semibold text-[#181F1C] bg-[#c6f19d] hover:bg-[#b8e88c] rounded-lg flex items-center gap-2 cursor-pointer mb-10"
            >
              <Plus size={18} />
              <span>Create Your First Session</span>
            </button>

            {/* Quick Templates Starter Cards */}
            <div className="w-full text-left pt-6 ">
              <span className="text-xs font-semibold text-[#8C9188] block mb-3 text-center">
                Or launch with a ready-made template:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => openCreateWithTemplate('townhall')}
                  className="p-4 rounded-xl bg-[#233B31] hover:bg-[#2D4A3E] text-left transition-colors cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded bg-[#181F1C] text-[#c6f19d] flex items-center justify-center mb-2.5">
                    <Building2 size={16} />
                  </div>
                  <div className="text-xs font-bold text-white group-hover:text-[#c6f19d]">
                    Company Townhall
                  </div>
                  <div className="text-[11px] text-[#8C9188] mt-1">
                    Roadmap rating, priority word cloud, and multiple choice.
                  </div>
                </button>

                <button
                  onClick={() => openCreateWithTemplate('quiz')}
                  className="p-4 rounded-xl bg-[#233B31] hover:bg-[#2D4A3E] text-left transition-colors cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded bg-[#181F1C] text-[#c6f19d] flex items-center justify-center mb-2.5">
                    <Zap size={16} />
                  </div>
                  <div className="text-xs font-bold text-white group-hover:text-[#c6f19d]">
                    Speed Quiz & Trivia
                  </div>
                  <div className="text-[11px] text-[#8C9188] mt-1">
                    Timed competitive questions with automatic scoring.
                  </div>
                </button>

                <button
                  onClick={() => openCreateWithTemplate('workshop')}
                  className="p-4 rounded-xl bg-[#233B31] hover:bg-[#2D4A3E] text-left transition-colors cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded bg-[#181F1C] text-[#c6f19d] flex items-center justify-center mb-2.5">
                    <BookOpen size={16} />
                  </div>
                  <div className="text-xs font-bold text-white group-hover:text-[#c6f19d]">
                    Workshop & Training
                  </div>
                  <div className="text-[11px] text-[#8C9188] mt-1">
                    Confidence check, challenge submission, and takeaways.
                  </div>
                </button>
              </div>
            </div>
          </div>
        ) : filteredRooms.length === 0 ? (
          /* Empty Search / Filter State */
          <div className="py-16 px-4 rounded-2xl bg-[#181F1C] border border-[#283E34] text-center flex flex-col items-center justify-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-xl bg-[#233B31] text-[#c6f19d] flex items-center justify-center mb-4">
              <Search size={20} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No matching sessions found</h3>
            <p className="text-xs text-[#8C9188] max-w-xs mb-6">
              {searchQuery
                ? `No sessions match "${searchQuery}". Try searching by another keyword or PIN.`
                : 'No sessions in this category yet.'}
            </p>
            <div className="flex gap-2">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 text-xs font-semibold text-[#E6E5DC] bg-[#233B31] hover:bg-[#2D4A3E] rounded-lg transition-colors cursor-pointer"
                >
                  Clear Search
                </button>
              )}
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 text-xs font-semibold text-[#181F1C] bg-[#c6f19d] hover:bg-[#b8e88c] rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>Create New Session</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRooms.map((room, idx) => {
              const pollsCount = getPollsForRoom(room.id).length;
              const qaCount = getQAQuestions(room.id).length;
              const isLive = room.status === 'active';
              const isPaused = room.status === 'paused';

              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  className="relative p-6 rounded-xl bg-[#181F1C] border border-[#283E34] hover:border-[#3D6655] flex flex-col justify-between transition-colors group"
                >
                  <div>
                    {/* Card Top Pill Row */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      {/* Status indicator */}
                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-[#c6f19d] bg-[#233B31]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#c6f19d] inline-block" />
                          <span>Live Now</span>
                        </span>
                      ) : isPaused ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-[#EA580C] bg-[#291e17]">
                          <PauseCircle size={12} />
                          <span>Draft</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-[#8C9188] bg-[#233B31]">
                          <StopCircle size={12} />
                          <span>Completed</span>
                        </span>
                      )}

                      {/* 1-Click Copy PIN chip */}
                      <button
                        onClick={e => handleCopyPin(room.pin, e)}
                        className={`text-xs font-medium px-2.5 py-1 rounded flex items-center gap-1.5 cursor-pointer tabular-nums tracking-wide ${
                          copiedPin === room.pin
                            ? 'text-[#c6f19d] bg-[#2D4A3E]'
                            : 'text-[#E6E5DC] bg-[#233B31] hover:bg-[#2D4A3E]'
                        }`}
                        title="Click to copy PIN"
                      >
                        {copiedPin === room.pin ? <Check size={12} /> : <Copy size={11} />}
                        <span>PIN: {room.pin}</span>
                      </button>

                      {/* Card Dropdown Menu Trigger */}
                      <div className="relative">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setActiveDropdownId(activeDropdownId === room.id ? null : room.id);
                          }}
                          className="p-1.5 rounded text-[#8C9188] hover:text-white hover:bg-[#233B31] transition-colors cursor-pointer"
                          title="Session options"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                          {activeDropdownId === room.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -5 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-0 top-8 z-30 w-48 rounded-lg bg-[#181F1C] border border-[#283E34] p-1.5 flex flex-col gap-1 "
                              onClick={e => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  setEditingRoom(room);
                                  setEditTitle(room.title);
                                  setEditDesc(room.description || '');
                                  setEditStatus(room.status);
                                  setShowEditModal(true);
                                }}
                                className="w-full px-3 py-1.5 text-xs text-left text-[#E6E5DC] hover:text-white hover:bg-[#233B31] rounded flex items-center gap-2 cursor-pointer"
                              >
                                <Edit3 size={13} className="text-[#c6f19d]" />
                                <span>Edit Session Details</span>
                              </button>

                              <button
                                onClick={e => handleDuplicate(room.id, e)}
                                className="w-full px-3 py-1.5 text-xs text-left text-[#E6E5DC] hover:text-white hover:bg-[#233B31] rounded flex items-center gap-2 cursor-pointer"
                              >
                                <CopyPlus size={13} className="text-[#c6f19d]" />
                                <span>Duplicate Session</span>
                              </button>

                              <button
                                onClick={e => handleExport(room.id, room.title, e)}
                                className="w-full px-3 py-1.5 text-xs text-left text-[#E6E5DC] hover:text-white hover:bg-[#233B31] rounded flex items-center gap-2 cursor-pointer"
                              >
                                <Download size={13} className="text-[#c6f19d]" />
                                <span>Export Report (JSON)</span>
                              </button>

                              <div className="my-1" />

                              <button
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  setDeletingRoom(room);
                                  setShowDeleteModal(true);
                                }}
                                className="w-full px-3 py-1.5 text-xs text-left text-[#EA580C] hover:bg-[#291e17] rounded flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 size={13} />
                                <span>Delete Session</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3
                      onClick={() => router.push(`/host/${room.pin}`)}
                      className="text-lg font-bold text-white mb-2 leading-snug group-hover:text-[#c6f19d] transition-colors cursor-pointer"
                    >
                      {room.title}
                    </h3>

                    <p className="text-xs text-[#8C9188] leading-relaxed mb-4 line-clamp-2 min-h-[32px]">
                      {room.description || 'No description provided.'}
                    </p>

                    {/* Metadata: Polls, QA, Participants */}
                    <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-lg bg-[#233B31] mb-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-[11px] font-medium text-[#8C9188]">Polls</span>
                        <span className="text-sm font-bold text-white mt-0.5 tabular-nums">{pollsCount}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[11px] font-medium text-[#8C9188]">Questions</span>
                        <span className="text-sm font-bold text-white mt-0.5 tabular-nums">{qaCount}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[11px] font-medium text-[#8C9188]">Audience</span>
                        <span className="text-sm font-bold text-[#c6f19d] mt-0.5 tabular-nums">{room.participantCount || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="flex items-center gap-2 pt-3 ">
                    <button
                      onClick={() => router.push(`/host/${room.pin}`)}
                      className="flex-1 py-2.5 px-4 text-xs font-semibold text-[#181F1C] bg-[#c6f19d] hover:bg-[#b8e88c] rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Manage Studio</span>
                      <ArrowRight size={14} />
                    </button>

                    <button
                      onClick={() => router.push(`/present/${room.pin}`)}
                      className="p-2.5 rounded-lg bg-[#233B31] hover:bg-[#2D4A3E] text-[#E6E5DC] transition-colors cursor-pointer"
                      title="Launch Stage Presenter View"
                    >
                      <Monitor size={16} />
                    </button>

                    <button
                      onClick={() => router.push(`/app/${room.pin}`)}
                      className="p-2.5 rounded-lg bg-[#233B31] hover:bg-[#2D4A3E] text-[#E6E5DC] transition-colors cursor-pointer"
                      title="Open Participant Mobile View"
                    >
                      <Smartphone size={16} />
                    </button>

                    <button
                      onClick={() => setSelectedQRRoom(room)}
                      className="p-2.5 rounded-lg bg-[#233B31] hover:bg-[#2D4A3E] text-[#E6E5DC] transition-colors cursor-pointer"
                      title="Show Join QR Code"
                    >
                      <QrCode size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="rounded-xl bg-[#181F1C] border border-[#283E34] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className=" bg-[#111614] text-[#8C9188] font-medium text-xs">
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Session Title</th>
                    <th className="py-3.5 px-4">PIN</th>
                    <th className="py-3.5 px-4 text-center">Polls</th>
                    <th className="py-3.5 px-4 text-center">Q&A</th>
                    <th className="py-3.5 px-4 text-center">Participants</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="">
                  {filteredRooms.map(room => {
                    const pollsCount = getPollsForRoom(room.id).length;
                    const qaCount = getQAQuestions(room.id).length;
                    return (
                      <tr
                        key={room.id}
                        className="hover:bg-[#233B31]/30 transition-colors group"
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {room.status === 'active' ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium text-[#c6f19d] bg-[#233B31]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#c6f19d] inline-block" />
                              <span>Live</span>
                            </span>
                          ) : room.status === 'paused' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-[#EA580C] bg-[#291e17]">
                              <span>Draft</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-[#8C9188] bg-[#233B31]">
                              <span>Ended</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div
                            onClick={() => router.push(`/host/${room.pin}`)}
                            className="font-bold text-white hover:text-[#c6f19d] cursor-pointer"
                          >
                            {room.title}
                          </div>
                          {room.description && (
                            <div className="text-[11px] text-[#8C9188] truncate max-w-sm mt-0.5">
                              {room.description}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <button
                            onClick={() => handleCopyPin(room.pin)}
                            className="text-xs font-medium text-[#c6f19d] bg-[#233B31] px-2 py-0.5 rounded cursor-pointer tabular-nums"
                            title="Click to copy PIN"
                          >
                            {room.pin}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-center font-medium text-[#E6E5DC] tabular-nums">
                          {pollsCount}
                        </td>

                        <td className="py-3.5 px-4 text-center font-medium text-[#E6E5DC] tabular-nums">
                          {qaCount}
                        </td>

                        <td className="py-3.5 px-4 text-center font-medium text-[#c6f19d] tabular-nums">
                          {room.participantCount || 0}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => router.push(`/host/${room.pin}`)}
                              className="px-3 py-1.5 rounded bg-[#c6f19d] hover:bg-[#b8e88c] text-[#181F1C] font-semibold cursor-pointer"
                            >
                              Manage
                            </button>
                            <button
                              onClick={() => router.push(`/present/${room.pin}`)}
                              className="p-1.5 rounded bg-[#233B31] hover:bg-[#2D4A3E] text-[#E6E5DC] cursor-pointer"
                              title="Presenter Screen"
                            >
                              <Monitor size={14} />
                            </button>
                            <button
                              onClick={() => setSelectedQRRoom(room)}
                              className="p-1.5 rounded bg-[#233B31] hover:bg-[#2D4A3E] text-[#E6E5DC] cursor-pointer"
                              title="QR Code"
                            >
                              <QrCode size={14} />
                            </button>
                            <button
                              onClick={e => handleDuplicate(room.id, e)}
                              className="p-1.5 rounded bg-[#233B31] hover:bg-[#2D4A3E] text-[#E6E5DC] cursor-pointer"
                              title="Duplicate"
                            >
                              <CopyPlus size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* CREATE SESSION MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <motion.form
              onSubmit={handleCreate}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-lg p-6 sm:p-7 rounded-2xl bg-[#181F1C] border border-[#283E34]  flex flex-col gap-4.5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 ">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#2D4A3E] text-[#c6f19d] flex items-center justify-center">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Create Interactive Session</h2>
                    <p className="text-xs text-[#8C9188]">Launch a live room with instant polling & Q&A</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 text-[#8C9188] hover:text-white rounded hover:bg-[#233B31] cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Session Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#E6E5DC]">
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Enter session title..."
                  className="w-full bg-[#111614] border border-[#283E34] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#8C9188] focus:outline-none focus:border-[#c6f19d]"
                  autoFocus
                />
              </div>

              {/* Template Presets Picker */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[#E6E5DC]">
                  Starter Template (Optional Blueprint)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('blank')}
                    className={`p-3 rounded-lg border text-left flex flex-col justify-between cursor-pointer ${
                      selectedTemplate === 'blank'
                        ? 'bg-[#2D4A3E] border-[#c6f19d] text-white'
                        : 'bg-[#111614] border-[#283E34] text-[#8C9188] hover:border-[#3D6655]'
                    }`}
                  >
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <LayoutTemplate size={14} className="text-[#c6f19d]" />
                      <span>Blank Canvas</span>
                    </span>
                    <span className="text-[11px] text-[#8C9188] mt-1">Start fresh with no pre-configured polls</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('townhall')}
                    className={`p-3 rounded-lg border text-left flex flex-col justify-between cursor-pointer ${
                      selectedTemplate === 'townhall'
                        ? 'bg-[#2D4A3E] border-[#c6f19d] text-white'
                        : 'bg-[#111614] border-[#283E34] text-[#8C9188] hover:border-[#3D6655]'
                    }`}
                  >
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Building2 size={14} className="text-[#c6f19d]" />
                      <span>All-Hands Townhall</span>
                    </span>
                    <span className="text-[11px] text-[#8C9188] mt-1">Rating, word cloud, and multiple choice</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('quiz')}
                    className={`p-3 rounded-lg border text-left flex flex-col justify-between cursor-pointer ${
                      selectedTemplate === 'quiz'
                        ? 'bg-[#2D4A3E] border-[#c6f19d] text-white'
                        : 'bg-[#111614] border-[#283E34] text-[#8C9188] hover:border-[#3D6655]'
                    }`}
                  >
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Zap size={14} className="text-[#c6f19d]" />
                      <span>Speed Quiz & Trivia</span>
                    </span>
                    <span className="text-[11px] text-[#8C9188] mt-1">Timed competitive trivia questions</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('workshop')}
                    className={`p-3 rounded-lg border text-left flex flex-col justify-between cursor-pointer ${
                      selectedTemplate === 'workshop'
                        ? 'bg-[#2D4A3E] border-[#c6f19d] text-white'
                        : 'bg-[#111614] border-[#283E34] text-[#8C9188] hover:border-[#3D6655]'
                    }`}
                  >
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <BookOpen size={14} className="text-[#c6f19d]" />
                      <span>Workshop & Training</span>
                    </span>
                    <span className="text-[11px] text-[#8C9188] mt-1">Comprehension check and open feedback</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#E6E5DC]">
                  Description
                </label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Optional description or agenda..."
                  rows={2}
                  className="w-full bg-[#111614] border border-[#283E34] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#8C9188] focus:outline-none focus:border-[#c6f19d] resize-none"
                />
              </div>

              {/* Custom PIN */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#E6E5DC]">
                  Custom 9-Digit PIN
                </label>
                <input
                  type="text"
                  value={customPin}
                  onChange={e => setCustomPin(e.target.value)}
                  placeholder="Leave blank for auto-generated PIN"
                  className="w-full bg-[#111614] border border-[#283E34] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#8C9188] focus:outline-none focus:border-[#c6f19d] tabular-nums"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 ">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-[#8C9188] hover:text-white rounded-lg hover:bg-[#233B31] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-semibold text-[#181F1C] bg-[#c6f19d] hover:bg-[#b8e88c] rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  <span>Launch Session</span>
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT SESSION MODAL */}
      <AnimatePresence>
        {showEditModal && editingRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <motion.form
              onSubmit={handleEditSubmit}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-md p-6 sm:p-7 rounded-2xl bg-[#181F1C] border border-[#283E34]  flex flex-col gap-4"
            >
              <div className="flex items-center justify-between pb-2 ">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 size={16} className="text-[#c6f19d]" />
                  <span>Edit Session Details</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="p-1.5 text-[#8C9188] hover:text-white rounded hover:bg-[#233B31] cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#E6E5DC]">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full bg-[#111614] border border-[#283E34] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c6f19d]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#E6E5DC]">
                  Description
                </label>
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-[#111614] border border-[#283E34] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c6f19d] resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#E6E5DC]">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as 'active' | 'paused' | 'ended')}
                  className="w-full bg-[#111614] border border-[#283E34] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c6f19d] cursor-pointer"
                >
                  <option value="active" className="bg-[#181F1C] text-[#c6f19d]">Live Now</option>
                  <option value="paused" className="bg-[#181F1C] text-[#EA580C]">Draft</option>
                  <option value="ended" className="bg-[#181F1C] text-[#8C9188]">Completed</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 ">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#8C9188] hover:text-white rounded-lg hover:bg-[#233B31] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-[#181F1C] bg-[#c6f19d] hover:bg-[#b8e88c] rounded-lg cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteModal && deletingRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm p-6 rounded-2xl bg-[#181F1C] border border-[#EA580C]/40  flex flex-col gap-4 text-center"
            >
              <div className="w-10 h-10 rounded-lg bg-[#291e17] text-[#EA580C] flex items-center justify-center mx-auto">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1">Delete this Session?</h3>
                <p className="text-xs text-[#8C9188] leading-relaxed">
                  Are you sure you want to delete <span className="text-white font-semibold">&ldquo;{deletingRoom.title}&rdquo;</span>? All associated polls, responses, and Q&A entries will be permanently removed.
                </p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold text-[#8C9188] hover:text-white bg-[#233B31] hover:bg-[#2D4A3E] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-[#EA580C] hover:bg-[#c2410c] rounded-lg cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR CODE MODAL */}
      {selectedQRRoom && (
        <QRCodeModal
          isOpen={!!selectedQRRoom}
          onClose={() => setSelectedQRRoom(null)}
          pin={selectedQRRoom.pin}
          title={selectedQRRoom.title}
        />
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg bg-[#181F1C] border border-[#2D4A3E] text-white text-xs font-medium "
          >
            <div className="w-5 h-5 rounded bg-[#2D4A3E] text-[#c6f19d] flex items-center justify-center">
              <Check size={12} />
            </div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
