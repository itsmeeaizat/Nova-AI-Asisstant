/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Trash2, 
  Pin, 
  Edit3, 
  Check, 
  X, 
  Sparkles
} from 'lucide-react';
import { ChatSession } from '../types/chat';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onTogglePin: (id: string) => void;
  onSelectPreset?: (promptText: string) => void;
  onOpenSettings: (tab?: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onTogglePin,
  onSelectPreset,
  onOpenSettings,
}) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState('');

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pinnedSessions = filteredSessions.filter(s => s.isPinned);
  const regularSessions = filteredSessions.filter(s => !s.isPinned);

  const handleStartRename = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          id="sidebar-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-label="Close sidebar backdrop"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        id="app-sidebar"
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-76 sm:w-80 flex flex-col transition-transform duration-300 ease-in-out shrink-0 select-none ${
          theme === 'light' 
            ? 'bg-neutral-50 border-r border-neutral-200 text-neutral-900' 
            : 'bg-neutral-950 border-r border-neutral-850 text-neutral-100'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top brand & New Chat Button */}
        <div className={`p-4 border-b flex flex-col gap-3 ${theme === 'light' ? 'border-neutral-200' : 'border-neutral-900'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-bold tracking-tight leading-none ${theme === 'light' ? 'text-neutral-900' : 'text-neutral-100'}`}>Nova AI</span>
                <span className="text-[10px] font-mono text-neutral-400">Assistant & Workspace</span>
              </div>
            </div>

            <button
              id="btn-close-sidebar-mobile"
              onClick={onClose}
              className={`lg:hidden p-2 rounded-xl text-neutral-400 hover:text-neutral-200 ${theme === 'light' ? 'hover:bg-neutral-200' : 'hover:bg-neutral-900'}`}
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            id="btn-new-chat-sidebar"
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full py-2.5 px-3.5 rounded-xl flex items-center justify-between font-medium text-xs sm:text-sm transition-all shadow-xs group ${
              theme === 'light'
                ? 'bg-white hover:bg-neutral-100 active:bg-neutral-200 border border-neutral-300 text-neutral-900'
                : 'bg-neutral-900 hover:bg-neutral-850 active:bg-neutral-800 border border-neutral-800 text-neutral-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-500 group-hover:rotate-90 transition-transform" />
              <span>Obrolan Baru</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${theme === 'light' ? 'bg-neutral-100 text-neutral-600 border border-neutral-300' : 'bg-neutral-800 text-neutral-400 border border-neutral-700/50'}`}>
              ⌘K
            </span>
          </button>
        </div>

        {/* Search input */}
        <div className="px-3 pt-3 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="sidebar-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari riwayat obrolan..."
              className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs placeholder-neutral-400 focus:outline-none transition-colors ${
                theme === 'light'
                  ? 'bg-white border border-neutral-300 text-neutral-900 focus:border-sky-500'
                  : 'bg-neutral-900/80 border border-neutral-800/80 text-neutral-200 focus:border-sky-500/50'
              }`}
            />
            {searchQuery && (
              <button
                id="btn-clear-search"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4 py-2 scrollbar-thin">
          {/* Pinned Section */}
          {pinnedSessions.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <Pin className="w-3 h-3 text-sky-400" />
                <span>Disematkan</span>
              </div>
              <div className="space-y-1">
                {pinnedSessions.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={session.id === activeSessionId}
                    isEditing={session.id === editingId}
                    editTitle={editTitle}
                    onSelect={() => {
                      onSelectSession(session.id);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    onStartRename={(e) => handleStartRename(e, session)}
                    onSaveRename={(e) => handleSaveRename(e, session.id)}
                    onCancelRename={handleCancelRename}
                    onTitleChange={setEditTitle}
                    onDelete={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    onTogglePin={(e) => {
                      e.stopPropagation();
                      onTogglePin(session.id);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular History Section */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
              <span>Daftar Obrolan ({regularSessions.length})</span>
            </div>

            {regularSessions.length === 0 && pinnedSessions.length === 0 ? (
              <div className="p-4 text-center text-xs text-neutral-400">
                {searchQuery ? 'Tidak ada obrolan yang cocok' : 'Belum ada obrolan'}
              </div>
            ) : (
              <div className="space-y-1">
                {regularSessions.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={session.id === activeSessionId}
                    isEditing={session.id === editingId}
                    editTitle={editTitle}
                    onSelect={() => {
                      onSelectSession(session.id);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    onStartRename={(e) => handleStartRename(e, session)}
                    onSaveRename={(e) => handleSaveRename(e, session.id)}
                    onCancelRename={handleCancelRename}
                    onTitleChange={setEditTitle}
                    onDelete={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    onTogglePin={(e) => {
                      e.stopPropagation();
                      onTogglePin(session.id);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer: Session status */}
        <div className="p-3 border-t border-neutral-900 bg-neutral-950 flex items-center justify-between text-[11px] text-neutral-400">
          <span>{sessions.length} Percakapan</span>
          <span className="text-[10px] text-neutral-400">Tersimpan</span>
        </div>
      </aside>
    </>
  );
};

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  onSelect: () => void;
  onStartRename: (e: React.MouseEvent) => void;
  onSaveRename: (e: React.MouseEvent) => void;
  onCancelRename: (e: React.MouseEvent) => void;
  onTitleChange: (val: string) => void;
  onDelete: (e: React.MouseEvent) => void;
  onTogglePin: (e: React.MouseEvent) => void;
}

const SessionItem: React.FC<SessionItemProps> = ({
  session,
  isActive,
  isEditing,
  editTitle,
  onSelect,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onTitleChange,
  onDelete,
  onTogglePin,
}) => {
  const { theme } = useTheme();

  if (isEditing) {
    return (
      <div className={`p-1.5 rounded-xl border flex items-center gap-1 ${theme === 'light' ? 'bg-white border-neutral-300 text-neutral-900' : 'bg-neutral-900 border-neutral-700 text-neutral-100'}`}>
        <input
          type="text"
          value={editTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveRename(e as any);
            if (e.key === 'Escape') onCancelRename(e as any);
          }}
          autoFocus
          className="flex-1 bg-transparent text-xs px-1 focus:outline-none"
        />
        <button
          onClick={onSaveRename}
          className={`p-1 text-emerald-500 rounded ${theme === 'light' ? 'hover:bg-neutral-100' : 'hover:bg-neutral-800'}`}
          aria-label="Save title"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onCancelRename}
          className={`p-1 text-neutral-400 rounded ${theme === 'light' ? 'hover:bg-neutral-100' : 'hover:bg-neutral-800'}`}
          aria-label="Cancel editing"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      id={`session-item-${session.id}`}
      onClick={onSelect}
      className={`group w-full p-2 rounded-xl text-left cursor-pointer transition-all flex items-center justify-between gap-2 text-xs ${
        isActive
          ? theme === 'light'
            ? 'bg-sky-50 text-sky-900 font-medium border border-sky-200 shadow-xs'
            : 'bg-neutral-850 text-white font-medium border border-neutral-750/70 shadow-xs'
          : theme === 'light'
            ? 'text-neutral-600 hover:bg-neutral-200/70 hover:text-neutral-900'
            : 'text-neutral-400 hover:bg-neutral-900/80 hover:text-neutral-200'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-sky-400' : 'text-neutral-400'}`} />
        <span className="truncate flex-1">{session.title || 'Untitled conversation'}</span>
      </div>

      {/* Action buttons (Pin, Rename, Delete) */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          id={`btn-pin-session-${session.id}`}
          onClick={onTogglePin}
          className={`p-1 rounded hover:bg-neutral-800 transition-colors ${session.isPinned ? 'text-sky-400' : 'text-neutral-400 hover:text-neutral-200'}`}
          title={session.isPinned ? 'Unpin' : 'Pin to top'}
        >
          <Pin className="w-3 h-3" />
        </button>
        <button
          id={`btn-rename-session-${session.id}`}
          onClick={onStartRename}
          className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          title="Rename conversation"
        >
          <Edit3 className="w-3 h-3" />
        </button>
        <button
          id={`btn-delete-session-${session.id}`}
          onClick={onDelete}
          className="p-1 rounded text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
          title="Delete conversation"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
