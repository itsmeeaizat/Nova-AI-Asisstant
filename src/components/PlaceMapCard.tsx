/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  MapPin, 
  ExternalLink, 
  Navigation, 
  Copy, 
  Check, 
  Map as MapIcon, 
  ChevronDown, 
  ChevronUp, 
  Compass,
  Sparkles
} from 'lucide-react';
import { DetectedPlace } from '../utils/placeExtractor';

interface PlaceMapCardProps {
  place: DetectedPlace;
  defaultExpanded?: boolean;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const PlaceMapCard: React.FC<PlaceMapCardProps> = ({
  place,
  defaultExpanded = true,
  onShowToast,
}) => {
  const [showMap, setShowMap] = React.useState(defaultExpanded);
  const [copied, setCopied] = React.useState(false);
  const [mapLoaded, setMapLoaded] = React.useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${place.name} - ${place.mapsUrl}`);
    setCopied(true);
    if (onShowToast) {
      onShowToast(`Lokasi "${place.name}" disalin ke clipboard`, 'success');
    }
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id={`place-card-${place.id}`}
      className="my-3 rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 hover:border-sky-500/40 transition-all shadow-md max-w-xl group"
    >
      {/* Header bar */}
      <div className="p-3 sm:p-3.5 bg-gradient-to-r from-neutral-900/90 via-neutral-900/60 to-neutral-950 flex items-center justify-between gap-2 border-b border-neutral-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs sm:text-sm text-neutral-100 truncate">
                {place.name}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-medium flex items-center gap-1 shrink-0">
                <Compass className="w-3 h-3" />
                <span>Google Maps</span>
              </span>
            </div>
            {place.locationHint && (
              <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                📍 {place.locationHint}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Toggle Map Preview Button */}
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 flex items-center gap-1 transition-colors"
            title={showMap ? 'Sembunyikan Peta' : 'Tampilkan Peta'}
          >
            <MapIcon className="w-3 h-3 text-sky-400" />
            <span className="hidden sm:inline">{showMap ? 'Tutup Peta' : 'Lihat Peta'}</span>
            {showMap ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Embedded Google Maps Live Preview */}
      {showMap && (
        <div className="relative w-full h-44 sm:h-52 bg-neutral-900 overflow-hidden border-b border-neutral-800">
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/80 z-10 text-xs text-neutral-400 gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
              <span>Memuat preview Google Maps...</span>
            </div>
          )}
          <iframe
            title={`Peta Lokasi ${place.name}`}
            src={place.embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => setMapLoaded(true)}
            className="w-full h-full grayscale-[15%] contrast-[105%]"
          />
        </div>
      )}

      {/* Action Footer with direct Google Maps launch links */}
      <div className="p-2.5 sm:p-3 bg-neutral-950/90 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          {/* Main Action: Open in Google Maps */}
          <a
            href={place.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-neutral-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
            title={`Buka ${place.name} di aplikasi Google Maps`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Buka di Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          {/* Navigation / Directions Button */}
          <a
            href={place.directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            title={`Petunjuk arah / rute ke ${place.name}`}
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Rute</span>
          </a>
        </div>

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 px-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs flex items-center gap-1 transition-colors"
          title="Salin tautan lokasi"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span className="text-[11px]">{copied ? 'Tersalin' : 'Salin'}</span>
        </button>
      </div>
    </div>
  );
};

interface PlaceMapListProps {
  places: DetectedPlace[];
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const PlaceMapList: React.FC<PlaceMapListProps> = ({ places, onShowToast }) => {
  if (!places || places.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-neutral-800/80 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <MapIcon className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
              <span>Preview Google Maps Lokasi Wisata</span>
              <span className="px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-mono font-semibold">
                {places.length} Lokasi
              </span>
            </h4>
            <p className="text-[10px] text-neutral-400">
              Klik &quot;Buka di Google Maps&quot; untuk langsung menuju titik lokasi pada aplikasi Google Maps
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {places.map((place, idx) => (
          <PlaceMapCard
            key={place.id || idx}
            place={place}
            defaultExpanded={idx < 2} // expand first 2 maps by default for fast rendering
            onShowToast={onShowToast}
          />
        ))}
      </div>
    </div>
  );
};
