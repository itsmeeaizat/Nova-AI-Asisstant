/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, ZoomIn, ZoomOut, Download, Maximize2 } from 'lucide-react';
import { Attachment } from '../types/chat';

interface ImageLightboxProps {
  attachment: Attachment | null;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ attachment, onClose }) => {
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!attachment) return null;

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.3, 0.5));
  const handleResetZoom = () => setScale(1);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = attachment.dataUrl;
    link.download = attachment.name || 'image.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div
      id="image-lightbox-overlay"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        className="w-full max-w-5xl flex items-center justify-between px-4 py-2 bg-neutral-900/80 border border-neutral-800 rounded-2xl z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col min-w-0 pr-4">
          <span className="text-sm font-semibold text-neutral-100 truncate">{attachment.name}</span>
          <span className="text-xs text-neutral-400">
            {attachment.mimeType} &bull; {(attachment.size / 1024).toFixed(1)} KB
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
            title="Reset Zoom"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
            title="Download Image"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-rose-900/50 hover:text-rose-400 text-neutral-200 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="flex-1 flex items-center justify-center overflow-auto w-full p-4 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={attachment.dataUrl}
          alt={attachment.name}
          style={{ transform: `scale(${scale})` }}
          className="max-h-[82vh] max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-150 ease-out cursor-grab active:cursor-grabbing"
        />
      </div>

      {/* Footer Info */}
      <div className="text-xs text-neutral-400 text-center py-1">
        Press <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">Esc</kbd> to close &bull; Click anywhere outside to dismiss
      </div>
    </div>
  );
};
