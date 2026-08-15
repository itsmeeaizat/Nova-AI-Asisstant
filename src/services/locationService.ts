/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GeoLocationData } from '../types/chat';

export class LocationService {
  /**
   * Check if geolocation is supported in the browser environment
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'geolocation' in navigator;
  }

  /**
   * Fetch current GPS location with high precision and reverse geocoded address
   */
  public async getCurrentLocation(): Promise<GeoLocationData> {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported by your browser.');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy || 0);
          const altitude = position.coords.altitude ? Math.round(position.coords.altitude) : null;
          const speed = position.coords.speed ? Math.round(position.coords.speed * 3.6) : null; // km/h
          const heading = position.coords.heading ? Math.round(position.coords.heading) : null;
          const timestamp = position.timestamp || Date.now();
          const mapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;

          let address = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
          let city = '';
          let state = '';
          let country = '';

          // Reverse geocode via OpenStreetMap Nominatim API (free, open, privacy friendly)
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
              {
                signal: controller.signal,
                headers: {
                  'Accept-Language': 'id,en;q=0.9',
                  'User-Agent': 'NovaAIAssistant/1.0',
                },
              }
            );
            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              if (data) {
                address = data.display_name || address;
                city =
                  data.address?.city ||
                  data.address?.town ||
                  data.address?.municipality ||
                  data.address?.village ||
                  data.address?.suburb ||
                  '';
                state = data.address?.state || data.address?.province || '';
                country = data.address?.country || '';
              }
            }
          } catch (e) {
            console.warn('Reverse geocoding timed out or failed, using raw coordinates:', e);
          }

          resolve({
            latitude: lat,
            longitude: lon,
            accuracy,
            altitude,
            speed,
            heading,
            timestamp,
            address,
            city,
            state,
            country,
            mapsUrl,
          });
        },
        (error) => {
          let msg = 'Failed to acquire GPS location.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              msg = 'GPS location permission denied. Please allow location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              msg = 'GPS position is currently unavailable. Please check your device location services.';
              break;
            case error.TIMEOUT:
              msg = 'GPS location request timed out. Please try again.';
              break;
          }
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        }
      );
    });
  }

  /**
   * Format GPS coordinates into human-readable representation
   */
  public formatCoordinates(lat: number, lon: number): string {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
  }
}

export const locationService = new LocationService();
