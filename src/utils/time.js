import { format, parseISO, isAfter, isBefore, differenceInSeconds } from 'date-fns';
import { it } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';

const ITALY_TZ = 'Europe/Rome';

/** Parse an OpenF1 UTC date string and return a Date object */
export const parseDate = (str) => {
  if (!str) return null;
  return parseISO(str.endsWith('Z') ? str : str + 'Z');
};

/** Format a UTC date string as Italian local time */
export const toItalianTime = (utcStr, fmt = 'HH:mm') => {
  if (!utcStr) return '';
  try {
    return formatInTimeZone(parseDate(utcStr), ITALY_TZ, fmt, { locale: it });
  } catch {
    return '';
  }
};

/** Format date in Italian (e.g. "dom 6 lug 2025") */
export const toItalianDate = (utcStr, fmt = 'EEE d MMM yyyy') => {
  if (!utcStr) return '';
  try {
    return formatInTimeZone(parseDate(utcStr), ITALY_TZ, fmt, { locale: it });
  } catch {
    return '';
  }
};

/** Format race time for display: "dom 6 lug · 15:00" */
export const formatRaceTime = (utcStr) => {
  if (!utcStr) return '';
  const date = toItalianDate(utcStr, 'EEE d MMM');
  const time = toItalianTime(utcStr, 'HH:mm');
  return `${date} · ${time}`;
};

/** Format date range for a GP weekend */
export const formatGPWeekend = (startUtc, endUtc) => {
  if (!startUtc) return '';
  try {
    const start = formatInTimeZone(parseDate(startUtc), ITALY_TZ, 'd', { locale: it });
    const end = formatInTimeZone(parseDate(endUtc), ITALY_TZ, 'd MMM yyyy', { locale: it });
    return `${start} – ${end}`;
  } catch {
    return '';
  }
};

/** Returns true if the date is in the past */
export const isPast = (utcStr) => {
  if (!utcStr) return false;
  return isBefore(parseDate(utcStr), new Date());
};

/** Returns true if the date is in the future */
export const isFuture = (utcStr) => {
  if (!utcStr) return true;
  return isAfter(parseDate(utcStr), new Date());
};

/** Countdown: returns { days, hours, minutes, seconds } until a UTC date */
export const getCountdown = (utcStr) => {
  if (!utcStr) return null;
  const target = parseDate(utcStr);
  const now = new Date();
  let diff = differenceInSeconds(target, now);
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400);
  diff -= days * 86400;
  const hours = Math.floor(diff / 3600);
  diff -= hours * 3600;
  const minutes = Math.floor(diff / 60);
  const seconds = diff - minutes * 60;
  return { days, hours, minutes, seconds };
};

/** Format a session name for display */
export const formatSessionName = (name) => {
  const map = {
    'Practice 1': 'P1',
    'Practice 2': 'P2',
    'Practice 3': 'P3',
    'Qualifying': 'Qualifiche',
    'Sprint Qualifying': 'Sprint Q',
    'Sprint': 'Sprint',
    'Race': 'Gara',
  };
  return map[name] ?? name;
};
