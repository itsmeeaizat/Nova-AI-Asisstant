/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MapPin, Navigation, ExternalLink, Copy, Check, Compass, Radio } from 'lucide-react';
import { GeoLocationData } from '../types/chat';

interface LocationCardProps {
  location: GeoLocationData;
  isCompact?: boolean;
  onRemove?: () => void;
  onRefresh?: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  isCompact = false,
  onRemove,
  onRefresh,
  onShowToast,
}) => {
  const [copied, setCopied] = React.useState(false);

  const formattedCoords = `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;

  const handleCopyCoords = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(formattedCoords);
    setCopied(true);
    if (onShowToast) onShowToast('Coordinates copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isCompact) {
    return (
      <div
        id="location-preview-chip"
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs shadow-sm max-w-full"
      >
        <div className="relative flex items-center justify-center">
          <MapPin className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        </div>

        <div className="flex flex-col min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-emerald-200 truncate max-w-[200px] sm:max-w-[320px]">
              {location.city || location.state || 'GPS Location'}
            </span>
            {location.accuracy && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-900/60 text-emerald-400 font-mono">
                ±{location.accuracy}m
              </span>
            )}
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono truncate max-w-[220px]">
            {formattedCoords}
          </span>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 rounded hover:bg-emerald-900/50 text-emerald-400 transition-colors"
              title="Refresh GPS position"
              aria-label="Refresh GPS"
            >
              <Navigation className="w-3 h-3" />
            </button>
          )}
          {onRemove && (
            <button
              onClick={onRemove}
              className="p-1 rounded hover:bg-rose-950 hover:text-rose-400 text-emerald-400/80 transition-colors"
              title="Remove location"
              aria-label="Remove location"
            >
              &times;
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      id={`location-card-${location.timestamp}`}
      className="rounded-2xl overflow-hidden bg-neutral-900/90 border border-emerald-900/60 shadow-lg text-xs text-neutral-200 my-2 max-w-md"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-emerald-950/50 border-b border-emerald-900/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-emerald-300 block text-xs">
              {location.city ? `${location.city}, ${location.country || ''}` : 'Active GPS Location'}
            </span>
            <span className="text-[10px] text-emerald-400/70 font-mono flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
              Live GPS Fixed
            </span>
          </div>
        </div>

        {location.accuracy && (
          <span className="px-2 py-0.5 rounded-full bg-emerald-900/40 border border-emerald-800/60 text-emerald-300 text-[10px] font-mono">
            Accurate ±{location.accuracy}m
          </span>
        )}
      </div>

      {/* Address & Coordinates Details */}
      <div className="p-3.5 space-y-2.5 bg-neutral-900/40">
        {location.address && (
          <div className="text-neutral-300 text-xs leading-relaxed">
            <span className="text-neutral-500 font-medium block text-[10px] uppercase tracking-wider mb-0.5">
              Address / Place
            </span>
            {location.address}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2 rounded-xl bg-neutral-950/80 border border-neutral-800/80">
            <span className="text-[10px] text-neutral-400 block font-mono uppercase">Latitude</span>
            <span className="font-mono text-emerald-400 font-medium">{location.latitude.toFixed(6)}°</span>
          </div>
          <div className="p-2 rounded-xl bg-neutral-950/80 border border-neutral-800/80">
            <span className="text-[10px] text-neutral-400 block font-mono uppercase">Longitude</span>
            <span className="font-mono text-emerald-400 font-medium">{location.longitude.toFixed(6)}°</span>
          </div>
        </div>

        {/* Altitude & Speed if available */}
        {(location.altitude !== null && location.altitude !== undefined || location.speed !== null && location.speed !== undefined) && (
          <div className="flex items-center gap-4 text-[11px] text-neutral-400 font-mono pt-0.5">
            {location.altitude !== null && location.altitude !== undefined && (
              <span className="flex items-center gap-1">
                <Compass className="w-3 h-3 text-sky-400" />
                Altitude: {location.altitude}m
              </span>
            )}
            {location.speed !== null && location.speed !== undefined && (
              <span>Speed: {location.speed} km/h</span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-800/80">
          <a
            href={location.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-700/50 flex items-center justify-center gap-1.5 transition-colors font-medium text-xs"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            onClick={handleCopyCoords}
            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 flex items-center gap-1.5 transition-colors text-xs"
            title="Copy coordinates"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy Coords'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
