import { useState, useEffect } from 'react';
import { getLatestDrivers } from '../services/openf1';
import { DRIVER_STATICS_2026 } from '../utils/driverStatics2026';

const LS_KEY = 'gf1_driver_photos_v4';
let memCache = null;
let fetchAttempted = false;

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return new Map(JSON.parse(raw));
  } catch { return null; }
}

function saveToStorage(map) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...map]));
  } catch {}
}

// Merge static fallback with live data (live data takes priority)
function buildMap(liveData) {
  const merged = new Map(DRIVER_STATICS_2026);
  for (const [k, v] of liveData) {
    merged.set(k, { ...merged.get(k), ...v });
  }
  return merged;
}

export const useDriverPhotos = () => {
  const [photoMap, setPhotoMap] = useState(() => {
    // Always start from static map so photos show immediately
    if (memCache) return memCache;
    const stored = loadFromStorage();
    if (stored?.size > 0) {
      memCache = buildMap(stored);
      return memCache;
    }
    // No cache yet — use static map immediately
    return DRIVER_STATICS_2026;
  });

  useEffect(() => {
    // Skip if already fetched live data (success or failure) in this session
    if (fetchAttempted) return;
    fetchAttempted = true;
    let cancelled = false;
    getLatestDrivers()
      .then(drivers => {
        if (cancelled || drivers.length === 0) return;
        const live = new Map(drivers.map(d => [d.name_acronym, d]));
        const merged = buildMap(live);
        memCache = merged;
        saveToStorage(live);
        setPhotoMap(merged);
      })
      .catch(() => {
        // OpenF1 failed — static map already showing, nothing to do
      });
    return () => { cancelled = true; };
  }, []);

  return photoMap;
};
