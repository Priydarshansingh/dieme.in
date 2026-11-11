'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Bot,
  Send,
  Sparkles,
  User,
  Shield,
  RefreshCw,
  Search,
  CheckCircle2,
  Trash2,
  Plus,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
  ExternalLink,
  Coins,
  Check,
} from 'lucide-react';

interface TelegramChat {
  id: string;
  chatId: string;
  chatTitle: string;
  chatType?: string;
  username?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  isAiEnabled?: boolean;
  userEmail?: string;
  userId?: string;
  workspaceName?: string;
  planName?: string;
}

interface ChatMessage {
  id: string;
  chatId: string;
  text: string;
  sender: 'user' | 'bot' | 'admin';
  senderName?: string;
  username?: string;
  timestamp: string;
  isCommand?: boolean;
}

interface TrainingItem {
  id: string;
  questionOrTopic: string;
  answerOrDirective: string;
  category: string;
  active: boolean;
  createdAt?: string;
}

export default function TelegramSupportCenter() {
  const [subTab, setSubTab] = useState<'chats' | 'training'>('chats');
  
  // Chat list state
  const [chats, setChats] = useState<TelegramChat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingChats, setIsLoadingChats] = useState(false);

  // Active chat state
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [activeChat, setActiveChat] = useState<TelegramChat | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Training state
  const [trainingItems, setTrainingItems] = useState<TrainingItem[]>([]);
  const [isLoadingTraining, setIsLoadingTraining] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newCategory, setNewCategory] = useState('Pricing & Passes');
  const [isSavingTraining, setIsSavingTraining] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);

  // Toast / Feedback
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // 1. Fetch all chats
  const fetchChats = async () => {
    setIsLoadingChats(true);
    try {
      const res = await fetch('/api/godpanel/telegram/chats');
      const data = await res.json();
      if (data.success) {
        setChats(data.chats || []);
        if (!selectedChatId && data.chats?.length > 0) {
          setSelectedChatId(data.chats[0].chatId);
        }
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setIsLoadingChats(false);
    }
  };

  // 2. Fetch messages for selected chat
  const fetchMessages = async (chatId: string) => {
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/godpanel/telegram/chats?chatId=${chatId}`);
      const data = await res.json();
      if (data.success) {
        setActiveMessages(data.messages || []);
        setActiveChat(data.chat || null);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // 3. Fetch training knowledge base
  const fetchTrainingItems = async () => {
    setIsLoadingTraining(true);
    try {
      const res = await fetch('/api/godpanel/telegram/training');
      const data = await res.json();
      if (data.success) {
        setTrainingItems(data.items || []);
      }
    } catch (err) {
      console.error('Failed to load training items:', err);
    } finally {
      setIsLoadingTraining(false);
    }
  };

  useEffect(() => {
    fetchChats();
    fetchTrainingItems();
  }, []);

  useEffect(() => {
    if (selectedChatId) {
      fetchMessages(selectedChatId);
    }
  }, [selectedChatId]);

  // Send Admin Reply
  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChatId || !adminReplyText.trim()) return;

    setIsSendingReply(true);
    try {
      const res = await fetch('/api/godpanel/telegram/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: selectedChatId,
          text: adminReplyText.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminReplyText('');
        showToast('Reply dispatched to user Telegram successfully!');
        fetchMessages(selectedChatId);
        fetchChats();
      } else {
        showToast(data.error || 'Failed to dispatch reply', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Toggle AI Auto-Pilot Mode
  const handleToggleAi = async () => {
    if (!selectedChatId) return;
    const nextState = activeChat?.isAiEnabled === false ? true : false;
    try {
      const res = await fetch('/api/godpanel/telegram/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: selectedChatId,
          action: 'toggle_ai',
          isAiEnabled: nextState,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveChat(prev => prev ? { ...prev, isAiEnabled: nextState } : null);
        showToast(`AI Assistant is now ${nextState ? 'Enabled (Auto-Pilot)' : 'Paused (Manual Mode)'}`);
        fetchChats();
      }
    } catch (err: any) {
      showToast('Failed to toggle AI mode', 'error');
    }
  };

  // Add / Save Training Rule
  const handleSaveTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim() || !newAnswer.trim()) {
      showToast('Question/Topic and Answer are required', 'error');
      return;
    }

    setIsSavingTraining(true);
    try {
      const res = await fetch('/api/godpanel/telegram/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionOrTopic: newTopic.trim(),
          answerOrDirective: newAnswer.trim(),
          category: newCategory,
          active: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Knowledge item added! Bot is now trained on this response.');
        setNewTopic('');
        setNewAnswer('');
        setShowTrainingModal(false);
        fetchTrainingItems();
      } else {
        showToast(data.error || 'Failed to save training item', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSavingTraining(false);
    }
  };

  // Delete Training Rule
  const handleDeleteTraining = async (id: string) => {
    if (!confirm('Are you sure you want to remove this training rule from the bot?')) return;
    try {
      const res = await fetch('/api/godpanel/telegram/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Training rule deleted');
        setTrainingItems(prev => prev.filter(item => item.id !== id));
      }
    } catch (err: any) {
      showToast('Failed to delete item', 'error');
    }
  };

  // Toggle Training Active
  const handleToggleTrainingActive = async (item: TrainingItem) => {
    try {
      const res = await fetch('/api/godpanel/telegram/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_active',
          id: item.id,
          active: !item.active,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTrainingItems(prev =>
          prev.map(i => (i.id === item.id ? { ...i, active: !item.active } : i))
        );
      }
    } catch (err) {
      showToast('Failed to toggle status', 'error');
    }
  };

  // 1-Click Train from User Message
  const handleQuickTrainFromMessage = (msgText: string) => {
    setNewTopic(msgText);
    setNewAnswer('');
    setShowTrainingModal(true);
    setSubTab('training');
  };

  const filteredChats = chats.filter(c =>
    (c.chatTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.chatId || '').includes(searchQuery)
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Toast Notification */}
      {alertMsg && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            alertMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {alertMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <HelpCircle className="h-4 w-4" />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="rounded-3xl border border-white/5 bg-[#0E1118] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Telegram AI Live Support & Training Engine</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30">
                  @YT_digicast
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Groq LLaMA 3.3 70B
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitor user Telegram chats live, takeover manually, verify account links, and train the bot Q&A knowledge base.
              </p>
            </div>
          </div>
        </div>

        {/* Sub-tab Pill Switcher */}
        <div className="flex items-center gap-2 bg-[#12151D] p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => setSubTab('chats')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              subTab === 'chats'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Live Chat Monitor</span>
            {chats.filter(c => (c.unreadCount || 0) > 0).length > 0 && (
              <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                {chats.filter(c => (c.unreadCount || 0) > 0).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('training')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              subTab === 'training'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Bot Training Studio</span>
            <span className="text-[10px] bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full font-bold">
              {trainingItems.length} RULES
            </span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SUB-TAB 1: LIVE CHAT MONITOR
      ══════════════════════════════════════════════════════════════════════ */}
      {subTab === 'chats' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Chat List Panel */}
          <div className="lg:col-span-4 rounded-3xl border border-white/5 bg-[#0E1118] p-4 flex flex-col h-[700px]">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Conversations</h3>
              <button
                onClick={fetchChats}
                disabled={isLoadingChats}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingChats ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search username, email, ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#12151D] border border-white/5 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
              />
            </div>

            {/* Chat List Items */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredChats.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  {isLoadingChats ? 'Loading conversations...' : 'No conversations found.'}
                </div>
              ) : (
                filteredChats.map(c => {
                  const isSelected = selectedChatId === c.chatId;
                  const isLinked = Boolean(c.userEmail);

                  return (
                    <button
                      key={c.chatId}
                      onClick={() => setSelectedChatId(c.chatId)}
                      className={`w-full text-left p-3 rounded-2xl border transition flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600/10 border-blue-500/40'
                          : 'bg-[#12151D] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white truncate max-w-[170px]">
                          {c.chatTitle || `User ${c.chatId}`}
                        </span>
                        <div className="flex items-center gap-1">
                          {isLinked && (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold border border-emerald-500/30">
                              LINKED
                            </span>
                          )}
                          {(c.unreadCount || 0) > 0 && (
                            <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                              {c.unreadCount} NEW
                            </span>
                          )}
                        </div>
                      </div>

                      {c.userEmail && (
                        <div className="text-[10px] text-cyan-400 font-mono truncate">
                          {c.userEmail}
                        </div>
                      )}

                      <div className="text-[11px] text-slate-400 truncate">
                        {c.lastMessage || 'No messages yet'}
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5">
                        <span>ID: {c.chatId}</span>
                        <span>
                          {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Active Chat Conversation & Admin Control */}
          <div className="lg:col-span-8 rounded-3xl border border-white/5 bg-[#0E1118] p-5 flex flex-col h-[700px]">
            {activeChat ? (
              <>
                {/* Active Chat Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-white/5 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-white">{activeChat.chatTitle}</h3>
                      {activeChat.username && (
                        <span className="text-xs text-blue-400 font-mono">@{activeChat.username}</span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400 font-mono">
                        Chat ID: {activeChat.chatId}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                      {activeChat.userEmail ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                          <Check className="h-3 w-3" /> {activeChat.userEmail}
                        </span>
                      ) : (
                        <span className="text-amber-400/90 text-[11px]">
                          ⚠️ Not Linked Yet (User will be prompted for email on query)
                        </span>
                      )}
                      {activeChat.planName && (
                        <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-[10px] font-bold">
                          {activeChat.planName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* AI Mode Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleAi}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                        activeChat.isAiEnabled !== false
                          ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                          : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      }`}
                    >
                      {activeChat.isAiEnabled !== false ? (
                        <>
                          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                          <span>AI Auto-Pilot ON</span>
                        </>
                      ) : (
                        <>
                          <Shield className="h-3.5 w-3.5 text-amber-400" />
                          <span>Manual Admin Mode</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2">
                  {isLoadingMessages ? (
                    <div className="text-center py-20 text-slate-500 text-xs">
                      Loading conversation history...
                    </div>
                  ) : activeMessages.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 text-xs">
                      No messages recorded in this chat yet.
                    </div>
                  ) : (
                    activeMessages.map(msg => {
                      const isUser = msg.sender === 'user';
                      const isAdmin = msg.sender === 'admin';
                      const isBot = msg.sender === 'bot';

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${
                            isUser ? 'items-start' : 'items-end'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-slate-500">
                              {isUser ? msg.senderName || 'User' : isAdmin ? 'Support Admin' : 'Digicast AI Assistant'}
                            </span>
                            <span className="text-[9px] text-slate-600">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div
                            className={`group relative max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                              isUser
                                ? 'bg-[#12151D] text-slate-200 border border-white/5'
                                : isAdmin
                                ? 'bg-emerald-600/20 text-emerald-100 border border-emerald-500/30'
                                : 'bg-blue-600/20 text-blue-100 border border-blue-500/30'
                            }`}
                          >
                            <div
                              dangerouslySetInnerHTML={{
                                __html: msg.text.replace(/\n/g, '<br/>'),
                              }}
                            />

                            {/* Quick Action: Train AI on user's question */}
                            {isUser && (
                              <button
                                onClick={() => handleQuickTrainFromMessage(msg.text)}
                                title="Train Bot on this Question"
                                className="opacity-0 group-hover:opacity-100 transition absolute -right-24 top-2 text-[10px] bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 px-2 py-1 rounded-lg flex items-center gap-1 font-semibold whitespace-nowrap shadow-sm"
                              >
                                <Sparkles className="h-3 w-3" />
                                <span>Train AI</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Admin Manual Reply Bar */}
                <form onSubmit={handleSendAdminReply} className="pt-3 border-t border-white/5 flex gap-2">
                  <input
                    type="text"
                    placeholder={`Reply to ${activeChat.chatTitle} as Admin on Telegram...`}
                    value={adminReplyText}
                    onChange={e => setAdminReplyText(e.target.value)}
                    className="flex-1 bg-[#12151D] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                  <button
                    type="submit"
                    disabled={isSendingReply || !adminReplyText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{isSendingReply ? 'Sending...' : 'Send to Telegram'}</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
                <MessageSquare className="h-8 w-8 mb-2 text-slate-600" />
                <span>Select a conversation from the left to view messages and reply.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SUB-TAB 2: AI BOT TRAINING STUDIO & KNOWLEDGE BASE
      ══════════════════════════════════════════════════════════════════════ */}
      {subTab === 'training' && (
        <div className="space-y-6">
          {/* Add / Edit Training Form */}
          <div className="rounded-3xl border border-white/5 bg-[#0E1118] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span>Teach & Train Bot with Custom Q&A Rules</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Any question or directive saved here is dynamically injected into the Groq LLaMA 3.3 70B AI engine in real-time.
                </p>
              </div>

              <div className="text-xs font-mono text-purple-300 bg-purple-500/10 px-3 py-1 rounded-xl border border-purple-500/20">
                Active In-Context RAG
              </div>
            </div>

            <form onSubmit={handleSaveTraining} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    User Question / Topic to Recognize
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. How do I get 24-hour pass without paying?"
                    value={newTopic}
                    onChange={e => setNewTopic(e.target.value)}
                    className="w-full bg-[#12151D] border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full bg-[#12151D] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="Pricing & Passes">Pricing & Passes</option>
                    <option value="Live Streaming & Nightbot">Live Streaming & Nightbot</option>
                    <option value="AI Clipping & Editors">AI Clipping & Editors</option>
                    <option value="Creator Wallet & D-Coins">Creator Wallet & D-Coins</option>
                    <option value="UPI Payments & Verification">UPI Payments & Verification</option>
                    <option value="Troubleshooting & Bugs">Troubleshooting & Bugs</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Official AI Directive / Answer (What the Bot Must Tell The Creator)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Free users receive a 14-day free trial. Afterwards, you can watch 1 AdMob rewarded video ad in the Digicast Android app once every 24 hours to unlock full studio features and earn +50 D-Coins for free."
                  value={newAnswer}
                  onChange={e => setNewAnswer(e.target.value)}
                  className="w-full bg-[#12151D] border border-white/5 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSavingTraining || !newTopic.trim() || !newAnswer.trim()}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-purple-500/20"
                >
                  <Plus className="h-4 w-4" />
                  <span>{isSavingTraining ? 'Training Bot...' : 'Add Knowledge Rule'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Trained Rules */}
          <div className="rounded-3xl border border-white/5 bg-[#0E1118] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Active Training Knowledge Base ({trainingItems.length} Items)
              </h3>
              <button
                onClick={fetchTrainingItems}
                disabled={isLoadingTraining}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingTraining ? 'animate-spin' : ''}`} />
                <span>Refresh Knowledge Base</span>
              </button>
            </div>

            {trainingItems.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                {isLoadingTraining
                  ? 'Loading knowledge base...'
                  : 'No custom training rules added yet. Add one above!'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trainingItems.map(item => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                      item.active
                        ? 'bg-[#12151D] border-white/5'
                        : 'bg-[#12151D]/40 border-white/5 opacity-60'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {item.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleTrainingActive(item)}
                            className="text-xs text-slate-400 hover:text-white"
                            title={item.active ? 'Active Rule (Click to Pause)' : 'Paused Rule (Click to Activate)'}
                          >
                            {item.active ? (
                              <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                ACTIVE
                              </span>
                            ) : (
                              <span className="text-slate-500 font-bold text-[10px] bg-white/5 px-2 py-0.5 rounded">
                                PAUSED
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteTraining(item.id)}
                            className="text-slate-500 hover:text-red-400 transition"
                            title="Delete Rule"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs font-bold text-white">
                        {item.questionOrTopic}
                      </div>

                      <div className="text-xs text-slate-300 leading-relaxed bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                        {item.answerOrDirective}
                      </div>
                    </div>

                    <div className="text-[9px] text-slate-500 font-mono">
                      Rule ID: {item.id.slice(0, 10)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
