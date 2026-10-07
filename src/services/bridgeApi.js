import { APPS_SCRIPT_URL } from '../config/api.js';

function endpointUrl(params = {}) {
  if (!APPS_SCRIPT_URL) throw new Error('Apps Script URL is not configured.');
  const url = new URL(APPS_SCRIPT_URL);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

async function request(params = {}) {
  const response = await fetch(endpointUrl(params), { method: 'GET', cache: 'no-store' });
  if (!response.ok) throw new Error(`Sensor API returned HTTP ${response.status}.`);
  const payload = await response.json();
  if (!payload || payload.success !== true) throw new Error(payload?.error || 'Sensor API returned an unsuccessful response.');
  return payload;
}

export async function getLatestReading() {
  const payload = await request();
  if (!payload.latest || typeof payload.latest !== 'object') throw new Error('Sensor API did not return a latest reading.');
  return normalizeReading(payload.latest);
}

export async function getHistory() {
  const payload = await request({ history: 'true' });
  if (!Array.isArray(payload.history)) throw new Error('Sensor API did not return sensor history.');
  return payload.history.map(normalizeReading).sort((a, b) => timestampOrder(b.timestamp) - timestampOrder(a.timestamp));
}

function normalizeReading(reading) {
  const numericFields = ['distance_mm', 'hx711_raw', 'accel_x_g', 'accel_y_g', 'accel_z_g'];
  const normalized = { ...reading };
  for (const field of numericFields) {
    const value = Number(reading[field]);
    if (reading[field] === null || reading[field] === undefined || !Number.isFinite(value)) {
      throw new Error(`Sensor API returned an invalid ${field} value.`);
    }
    normalized[field] = value;
  }
  normalized.timestamp = formatTimestamp(reading.timestamp);
  return normalized;
}

function formatTimestamp(value) {
  const raw = String(value || '').trim();
  if (/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/.test(raw)) return raw;
  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return raw;
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function timestampOrder(value) {
  const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);
  if (match) return Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1]), Number(match[4]), Number(match[5]), Number(match[6]));
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
