/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Send, 
  Square, 
  Paperclip, 
  Mic, 
  MicOff, 
  X, 
  Globe, 
  Image as ImageIcon 
} from 'lucide-react';
import { Attachment } from '../types/chat';

interface InputAreaProps {
  input: string;
  onInputChange: (val: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isLoading: boolean;
  attachments: Attachment[];
  onAddAttachment: (att: Attachment) => void;
  onRemoveAttachment: (id: string) => void;
  enableWebSearch: boolean;
  onToggleWebSearch: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const InputArea: React.FC<InputAreaProps> = ({
  input,
  onInputChange,
  onSubmit,
  onStop,
  isLoading,
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  enableWebSearch,
  onToggleWebSearch,
  onShowToast,
}) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);

  // Auto-resize textarea height
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  // Handle keydown Enter / Shift+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if ((input.trim() || attachments.length > 0) && !isLoading) {
        onSubmit();
      }
    }
  };

  // Handle File Upload (Drag & Drop or Manual)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      if (file.size > 15 * 1024 * 1024) {
        onShowToast('File exceeds 15MB limit', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1] || '';
        const attachment: Attachment = {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: result,
          base64Data,
          mimeType: file.type || 'image/jpeg',
        };
        onAddAttachment(attachment);
        onShowToast(`Attached ${file.name}`, 'success');
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Voice Dictation Toggle (Web Speech API)
  const handleToggleVoiceDictation = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onShowToast('Speech recognition not supported in this browser.', 'error');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        onShowToast('Listening... Speak now', 'info');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          onInputChange((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event);
        setIsRecording(false);
        onShowToast(`Voice recognition: ${event.error || 'stopped'}`, 'error');
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err: any) {
      setIsRecording(false);
      onShowToast(err.message || 'Could not start voice recording', 'error');
    }
  };

  return (
    <div id="input-area-container" className="p-3 sm:p-4 bg-neutral-950/90 border-t border-neutral-900 shrink-0 select-none">
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        {/* Attachment preview chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-1">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="relative group p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center gap-2 pr-2"
              >
                {att.mimeType.startsWith('image/') ? (
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-neutral-400" />
                  </div>
                )}
                <span className="text-xs text-neutral-300 truncate max-w-[120px]">{att.name}</span>
                <button
                  onClick={() => onRemoveAttachment(att.id)}
                  className="p-1 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded"
                  aria-label="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input box wrap */}
        <div className="relative flex flex-col rounded-2xl bg-neutral-900/90 border border-neutral-800 focus-within:border-neutral-700 shadow-xl transition-all">
          {/* Main Textarea */}
          <textarea
            id="chat-prompt-input"
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Nova or ask anything..."
            className="w-full bg-transparent px-4 py-3.5 text-sm text-neutral-100 placeholder-neutral-400 focus:outline-none resize-none max-h-44 min-h-[48px] leading-relaxed scrollbar-thin"
          />

          {/* Bottom Toolbar inside input container */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-neutral-800/40">
            {/* Left controls: Attach, Voice dictation, Web Search */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* File upload input hidden */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.json,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-attachment-input"
              />

              <button
                id="btn-attach-file"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                title="Attach image or file"
                aria-label="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <button
                id="btn-voice-dictation"
                type="button"
                onClick={handleToggleVoiceDictation}
                className={`p-2 rounded-xl transition-colors ${
                  isRecording
                    ? 'bg-rose-500/20 text-rose-400 animate-pulse border border-rose-500/40'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
                title={isRecording ? 'Stop recording' : 'Voice dictation'}
                aria-label="Voice dictation"
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Web search grounding toggle */}
              <button
                id="btn-toggle-search-grounding"
                type="button"
                onClick={onToggleWebSearch}
                className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 transition-colors ${
                  enableWebSearch
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 font-medium'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
                title="Search web grounding"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Search</span>
              </button>
            </div>

            {/* Right controls: Submit / Stop & Character estimate */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-neutral-400 hidden md:inline">
                {input.length > 0 ? `${input.length} chars` : ''}
              </span>

              {isLoading ? (
                <button
                  id="btn-stop-generating"
                  type="button"
                  onClick={onStop}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 shadow-md transition-all active:scale-95"
                  title="Stop generating"
                  aria-label="Stop generation"
                >
                  <Square className="w-4 h-4 fill-current text-rose-400" />
                </button>
              ) : (
                <button
                  id="btn-send-message"
                  type="button"
                  onClick={onSubmit}
                  disabled={!input.trim() && attachments.length === 0}
                  className={`p-2 sm:p-2.5 rounded-xl shadow-md transition-all flex items-center justify-center ${
                    input.trim() || attachments.length > 0
                      ? 'bg-sky-500 hover:bg-sky-400 text-neutral-950 font-bold active:scale-95'
                      : 'bg-neutral-800 text-neutral-400 cursor-not-allowed'
                  }`}
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Small privacy / disclaimer footer */}
        <p className="text-[10px] text-center text-neutral-400">
          Nova may produce inaccurate information about people, places, or facts.
        </p>
      </div>
    </div>
  );
};
