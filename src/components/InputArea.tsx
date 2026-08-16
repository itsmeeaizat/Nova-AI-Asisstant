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
  Image as ImageIcon,
  Camera,
  MapPin,
  FileText,
  Loader2,
  UploadCloud,
  Volume2,
  Terminal,
  Code
} from 'lucide-react';
import { Attachment, GeoLocationData } from '../types/chat';
import { LocationCard } from './LocationCard';
import { ImageLightbox } from './ImageLightbox';
import { useTheme } from '../context/ThemeContext';

interface InputAreaProps {
  input: string;
  onInputChange: (val: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isLoading: boolean;
  attachments: Attachment[];
  onAddAttachment: (att: Attachment) => void;
  onRemoveAttachment: (id: string) => void;
  location: GeoLocationData | null;
  onToggleLocation: () => void;
  onRemoveLocation: () => void;
  isLocating: boolean;
  enableWebSearch: boolean;
  onToggleWebSearch: () => void;
  enableCodingMode?: boolean;
  onToggleCodingMode?: () => void;
  enableDeepWeb?: boolean;
  onToggleDeepWeb?: () => void;
  autoPlaySpeech?: boolean;
  onToggleAutoPlaySpeech?: () => void;
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
  location,
  onToggleLocation,
  onRemoveLocation,
  isLocating,
  enableWebSearch,
  onToggleWebSearch,
  enableCodingMode,
  onToggleCodingMode,
  enableDeepWeb,
  onToggleDeepWeb,
  autoPlaySpeech,
  onToggleAutoPlaySpeech,
  onShowToast,
}) => {
  const { theme } = useTheme();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = React.useState(false);
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);
  const [previewAttachment, setPreviewAttachment] = React.useState<Attachment | null>(null);
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
      if ((input.trim() || attachments.length > 0 || location) && !isLoading) {
        onSubmit();
      }
    }
  };

  // Process File(s) for attachment (Images, PDFs, Text, Code, etc.)
  const processUploadedFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file: File) => {
      if (file.size > 20 * 1024 * 1024) {
        onShowToast(`"${file.name}" exceeds the 20MB limit`, 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.includes(',') ? result.split(',')[1] : result;
        const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'text/plain');

        const attachment: Attachment = {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl: result,
          base64Data,
          mimeType,
        };
        onAddAttachment(attachment);
        onShowToast(`Uploaded "${file.name}"`, 'success');
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle standard file upload change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFiles(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFiles(e.dataTransfer.files);
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
      onShowToast('Speech recognition is not supported in this browser.', 'error');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'id-ID'; // Supports Indonesian and multilingual dictation

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
    <>
      {/* Full-Screen Image Lightbox Preview */}
      <ImageLightbox
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />

      <div
        id="input-area-container"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-3 sm:p-4 border-t shrink-0 select-none relative ${
          theme === 'light'
            ? 'bg-neutral-50 border-neutral-200 text-neutral-900'
            : 'bg-neutral-950/95 border-neutral-900 text-neutral-100'
        }`}
      >
        {/* Drag & Drop Visual Overlay */}
        {isDraggingOver && (
          <div className="absolute inset-0 z-30 bg-sky-950/90 border-2 border-dashed border-sky-400 backdrop-blur-xs flex items-center justify-center gap-3 text-sky-200">
            <UploadCloud className="w-8 h-8 animate-bounce text-sky-400" />
            <div className="text-center">
              <span className="font-bold text-sm block">Drop images or files here</span>
              <span className="text-xs text-sky-300">Images, PDFs, documents, code, logs supported</span>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto flex flex-col gap-2">
          {/* Active Context Chips: GPS Location & Uploaded Attachments */}
          {(attachments.length > 0 || location || isLocating) && (
            <div className="flex flex-wrap items-center gap-2 px-1">
              {/* Active GPS Location Chip */}
              {isLocating && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs shadow-xs animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Acquiring high-accuracy GPS position...</span>
                </div>
              )}

              {location && !isLocating && (
                <LocationCard
                  location={location}
                  isCompact={true}
                  onRemove={onRemoveLocation}
                  onRefresh={onToggleLocation}
                  onShowToast={onShowToast}
                />
              )}

              {/* Uploaded File / Image Preview Chips */}
              {attachments.map((att) => {
                const isImage = att.mimeType.startsWith('image/');
                return (
                  <div
                    key={att.id}
                    className="relative group p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center gap-2 pr-2 shadow-xs transition-all hover:border-neutral-700"
                  >
                    {isImage ? (
                      <button
                        type="button"
                        onClick={() => setPreviewAttachment(att)}
                        className="cursor-pointer overflow-hidden rounded-lg group-hover:opacity-90"
                        title="Click to view full image"
                      >
                        <img
                          src={att.dataUrl}
                          alt={att.name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      </button>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-neutral-800 text-sky-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-neutral-200 font-medium truncate max-w-[130px] sm:max-w-[180px]">
                        {att.name}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {(att.size / 1024).toFixed(0)} KB
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveAttachment(att.id)}
                      className="p-1 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors"
                      aria-label="Remove attachment"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Input Box Wrapper */}
          <div className={`relative flex flex-col rounded-2xl border transition-all ${
            theme === 'light'
              ? 'bg-white border-neutral-300 focus-within:border-sky-500 shadow-sm'
              : 'bg-neutral-900/90 border-neutral-800 focus-within:border-neutral-700 shadow-xl'
          }`}>
            {/* Main Textarea */}
            <textarea
              id="chat-prompt-input"
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                location
                  ? `Tanyakan info seputar lokasi Anda di ${location.city || 'sekitar Anda'} atau apa saja...`
                  : attachments.length > 0
                  ? 'Tanyakan sesuatu tentang berkas / gambar yang dilampirkan...'
                  : 'Ketik pesan untuk Nova atau tanyakan apa saja...'
              }
              className={`w-full bg-transparent px-4 py-3.5 text-sm focus:outline-none resize-none max-h-44 min-h-[48px] leading-relaxed scrollbar-thin ${
                theme === 'light' ? 'text-neutral-900 placeholder:text-neutral-400' : 'text-neutral-100 placeholder:text-neutral-400'
              }`}
            />

            {/* Bottom Toolbar inside input container */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-neutral-800/40">
              {/* Left controls: Images, Camera, Files, Active GPS, Voice, Search */}
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                {/* 1. All Files Upload (Hidden input) */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="*/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-attachment-input"
                />

                {/* 2. Images Only Upload (Hidden input) */}
                <input
                  ref={imageInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="image-attachment-input"
                />

                {/* 3. Camera Capture (Hidden input) */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                  id="camera-capture-input"
                />

                {/* Button: Upload File / Document */}
                <button
                  id="btn-attach-file"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                  title="Upload any file (PDF, Doc, TXT, Code, Data)"
                  aria-label="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Button: Upload Image / Photo */}
                <button
                  id="btn-attach-image"
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                  title="Upload Image (PNG, JPG, WEBP, GIF)"
                  aria-label="Attach image"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                {/* Button: Take Photo / Camera */}
                <button
                  id="btn-camera-capture"
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                  title="Take Photo with Camera"
                  aria-label="Camera capture"
                >
                  <Camera className="w-4 h-4" />
                </button>

                {/* Button: Active GPS Location Toggle */}
                <button
                  id="btn-toggle-gps-location"
                  type="button"
                  onClick={onToggleLocation}
                  disabled={isLocating}
                  className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 transition-all ${
                    location
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-medium'
                      : isLocating
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800 animate-pulse'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                  }`}
                  title={
                    location
                      ? `GPS Active: ${location.city || 'Coordinates attached'} (Click to update)`
                      : 'Check and share active GPS location'
                  }
                  aria-label="Toggle GPS location"
                >
                  {isLocating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <MapPin className={`w-3.5 h-3.5 ${location ? 'text-emerald-400' : ''}`} />
                  )}
                  <span className="text-[11px] hidden sm:inline">
                    {isLocating ? 'Locating...' : location ? 'GPS Active' : 'GPS Location'}
                  </span>
                </button>

                {/* Button: Voice Dictation */}
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

                {/* Button: Auto-Read Replies (Mode Baca Suara) */}
                {onToggleAutoPlaySpeech && (
                  <button
                    id="btn-input-toggle-autoread"
                    type="button"
                    onClick={onToggleAutoPlaySpeech}
                    className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 transition-colors ${
                      autoPlaySpeech
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-medium'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                    }`}
                    title={
                      autoPlaySpeech
                        ? 'Mode Baca Suara: AKTIF (AI otomatis membaca balasan). Klik untuk menonaktifkan.'
                        : 'Mode Baca Suara: NONAKTIF. Klik untuk mengaktifkan baca suara otomatis.'
                    }
                    aria-label="Toggle Auto-Read Audio"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span className="text-[11px] hidden sm:inline">
                      {autoPlaySpeech ? 'Baca Suara' : 'Baca Suara'}
                    </span>
                  </button>
                )}

                {/* Button: Web search grounding (Browser) */}
                <button
                  id="btn-toggle-search-grounding"
                  type="button"
                  onClick={onToggleWebSearch}
                  className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 transition-colors ${
                    enableWebSearch
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 font-medium'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                  }`}
                  title="Search Web / Live Internet Grounding"
                  aria-label="Toggle web search"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Search</span>
                </button>

                {/* Button: Coding Mode Toggle */}
                {onToggleCodingMode && (
                  <button
                    id="btn-toggle-coding-mode"
                    type="button"
                    onClick={onToggleCodingMode}
                    className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 transition-all ${
                      enableCodingMode
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-medium shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                    }`}
                    title={
                      enableCodingMode
                        ? 'Mode Coding: AKTIF (AI membuat project lengkap sampai selesai, bukan hanya 1 baris kode). Klik untuk menonaktifkan.'
                        : 'Mode Coding: NONAKTIF. Klik untuk mengaktifkan mode pembuat project lengkap.'
                    }
                    aria-label="Toggle Coding Mode"
                  >
                    <Code className={`w-3.5 h-3.5 ${enableCodingMode ? 'text-emerald-400' : ''}`} />
                    <span className="text-[11px] hidden sm:inline">Coding</span>
                  </button>
                )}

                {/* Button: Deep Mode Toggle */}
                {onToggleDeepWeb && (
                  <button
                    id="btn-toggle-deep-web"
                    type="button"
                    onClick={onToggleDeepWeb}
                    className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 transition-all ${
                      enableDeepWeb
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 font-medium shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                    }`}
                    title={
                      enableDeepWeb
                        ? 'Mode Deep: AKTIF (Analisis mendalam & riset tingkat lanjut). Klik untuk menonaktifkan.'
                        : 'Mode Deep: NONAKTIF. Klik untuk mengaktifkan mode Deep.'
                    }
                    aria-label="Toggle Deep mode"
                  >
                    <Terminal className={`w-3.5 h-3.5 ${enableDeepWeb ? 'text-purple-400' : ''}`} />
                    <span className="text-[11px] hidden sm:inline">Deep</span>
                  </button>
                )}
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
                    disabled={!input.trim() && attachments.length === 0 && !location}
                    className={`p-2 sm:p-2.5 rounded-xl shadow-md transition-all flex items-center justify-center ${
                      input.trim() || attachments.length > 0 || location
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

          {/* Privacy footer */}
          <p className="text-[10px] text-center text-neutral-400">
            Nova AI supports vision, document analysis, voice, and real-time GPS location context.
          </p>
        </div>
      </div>
    </>
  );
};
