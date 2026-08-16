/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DetectedPlace {
  id: string;
  name: string;
  locationHint?: string;
  searchQuery: string;
  mapsUrl: string;
  directionsUrl: string;
  embedUrl: string;
  description?: string;
}

// Common Indonesian & international tourist place keywords and indicators
const PLACE_KEYWORDS = [
  'candi', 'pantai', 'gunung', 'taman', 'museum', 'curug', 'air terjun', 
  'danau', 'bukit', 'goa', 'gua', 'pulau', 'wisata', 'desa', 'masjid', 
  'kawah', 'benteng', 'hutan', 'kebun', 'waterpark', 'resort', 'puncak',
  'monas', 'ancol', 'dufan', 'borobudur', 'prambanan', 'bromo', 'rinjani',
  'labuan bajo', 'komodo', 'raja ampat', 'lembang', 'malioboro', 'tanah lot',
  'uluwatu', 'ubud', 'kuta', 'sanur', 'nusa penida', 'toba', 'tmii',
  'alun-alun', 'keraton', 'istana', 'zoo', 'safari', 'aquarium', 'batur',
  'dieng', 'derawan', 'belitung', 'maratua', 'wakatobi', 'bunaken', 'toraja',
  'pantai', 'beach', 'temple', 'waterfall', 'mountain', 'island', 'park'
];

/**
 * Extract detected tourist spots and places from AI markdown message content
 */
export function extractPlacesFromMessage(content: string): DetectedPlace[] {
  if (!content || typeof content !== 'string') return [];

  const detected: DetectedPlace[] = [];
  const seenQueries = new Set<string>();

  // Helper to add unique place
  const addPlace = (rawName: string, rawLocation?: string, desc?: string) => {
    let cleanName = rawName
      .replace(/^[\d+.)\-*•\s]+/, '')
      .replace(/[*#_`~]/g, '')
      .trim();

    // Check if name is too short or too long to be a place title
    if (cleanName.length < 3 || cleanName.length > 80) return;

    // Remove trailing colons or dashes
    cleanName = cleanName.replace(/[:\-–—]+$/, '').trim();

    // Check if it matches place keywords or is clearly formatted as a landmark/destination
    const lowerName = cleanName.toLowerCase();
    const lowerDesc = (desc || '').toLowerCase();
    const lowerContent = content.toLowerCase();

    const isTravelContext = 
      lowerContent.includes('wisata') || 
      lowerContent.includes('tempat') || 
      lowerContent.includes('liburan') || 
      lowerContent.includes('destinasi') || 
      lowerContent.includes('kunjungi') || 
      lowerContent.includes('lokasi') || 
      lowerContent.includes('tour') || 
      lowerContent.includes('travel');

    const hasPlaceKeyword = PLACE_KEYWORDS.some(kw => 
      lowerName.includes(kw) || lowerDesc.includes(kw)
    );

    // If not in travel context and no place keyword, skip
    if (!isTravelContext && !hasPlaceKeyword) return;

    // Filter out common non-place headers like "Tips Liburan", "Kesimpulan", "Biaya", etc.
    const nonPlaceWords = ['tips', 'kesimpulan', 'catatan', 'biaya', 'rekomendasi', 'transportasi', 'kuliner', 'akomodasi', 'penginapan', 'waktu terbaik', 'itinerary', 'rute', 'perlengkapan', 'budget'];
    if (nonPlaceWords.some(w => lowerName.startsWith(w) || lowerName === w)) return;

    // Extract location in parentheses e.g. "Candi Prambanan (Sleman, Yogyakarta)"
    let locationHint = rawLocation?.trim();
    const parenMatch = cleanName.match(/\(([^)]+)\)$/);
    if (parenMatch) {
      locationHint = locationHint || parenMatch[1];
      cleanName = cleanName.replace(/\s*\([^)]+\)$/, '').trim();
    }

    const searchQuery = locationHint 
      ? `${cleanName}, ${locationHint}` 
      : cleanName;

    const normalizedKey = searchQuery.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seenQueries.has(normalizedKey)) return;
    seenQueries.add(normalizedKey);

    const encodedQuery = encodeURIComponent(searchQuery);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedQuery}`;
    const embedUrl = `https://maps.google.com/maps?q=${encodedQuery}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

    detected.push({
      id: `place-${detected.length}-${Math.random().toString(36).substring(7)}`,
      name: cleanName,
      locationHint,
      searchQuery,
      mapsUrl,
      directionsUrl,
      embedUrl,
      description: desc?.slice(0, 160),
    });
  };

  // Pattern 1: Numbered or Bullet list with bold titles: e.g. "1. **Candi Borobudur** (Magelang) - Deskripsi..."
  const listRegex = /(?:^|\n)(?:[\d]+\.|\*|\-|\•)\s+\*\*([^*]+)\*\*(?:\s*\(([^)]+)\))?(?:\s*[:\-–—]\s*([^\n]+))?/g;
  let match: RegExpExecArray | null;
  while ((match = listRegex.exec(content)) !== null) {
    addPlace(match[1], match[2], match[3]);
  }

  // Pattern 2: Markdown headers: e.g. "### 1. Pantai Kuta, Bali" or "## Candi Borobudur"
  const headerRegex = /(?:^|\n)#{1,4}\s+(?:[\d]+\.\s*)?([^\n]+)/g;
  while ((match = headerRegex.exec(content)) !== null) {
    const rawHeader = match[1];
    if (rawHeader.includes('**')) {
      const boldInside = rawHeader.match(/\*\*([^*]+)\*\*/);
      if (boldInside) {
        addPlace(boldInside[1]);
        continue;
      }
    }
    addPlace(rawHeader);
  }

  // Pattern 3: Standalone bold titles with location in brackets: e.g. "**Kawah Putih** (Bandung)"
  const boldRegex = /\*\*([A-Z][a-zA-Z0-9\s'’-]{2,50})\*\*(?:\s*\(([^)]+)\))?/g;
  while ((match = boldRegex.exec(content)) !== null) {
    addPlace(match[1], match[2]);
  }

  return detected;
}
