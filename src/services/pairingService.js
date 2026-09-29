import QRCode from 'qrcode';
import { subscribeToRoomChannel, broadcastToRoomChannel } from './supabaseClient';

const ROOM_STORAGE_KEY = 'keter_pairing_room_id';

// Generate or retrieve persistent 6-character room code (e.g., KTR-7821)
export function getOrCreateRoomId() {
  let roomId = localStorage.getItem(ROOM_STORAGE_KEY);
  if (!roomId || !roomId.startsWith('KTR-')) {
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    roomId = `KTR-${randomCode}`;
    localStorage.setItem(ROOM_STORAGE_KEY, roomId);
  }
  return roomId;
}

// Generate new random room code
export function regenerateRoomId() {
  const randomCode = Math.floor(1000 + Math.random() * 9000);
  const roomId = `KTR-${randomCode}`;
  localStorage.setItem(ROOM_STORAGE_KEY, roomId);
  return roomId;
}

export const PROD_URL = import.meta.env.VITE_PROD_URL || 'https://keter-ai.vercel.app';

// Build pairing URL for mobile phone
export function getPairingUrl({ roomId, localIp = 'localhost', isCloud = false, tunnelUrl = '' }) {
  if (isCloud) {
    // Cloud Relay URL (Works anywhere on 5G / Wi-Fi via production domain)
    const ipParam = localIp && localIp !== 'localhost' ? `&ip=${localIp}` : '';
    const tunnelParam = tunnelUrl ? `&tunnel=${encodeURIComponent(tunnelUrl)}` : '';
    return `${PROD_URL}/?mode=companion&room=${roomId}${ipParam}${tunnelParam}`;
  }

  // Local Wi-Fi URL (LAN mode)
  // Ensure we use the actual IP (or fallback to window.location if served via http)
  let host = localIp;
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    if (window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      host = window.location.hostname;
    }
  }
  
  return `http://${host || 'localhost'}:5188/?mode=companion&room=${roomId}`;
}

// Generate QR Code Data URL (Standard high-contrast black-on-white with High error correction)
export async function generateQrDataUrl(url) {
  try {
    return await QRCode.toDataURL(url, {
      width: 280,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
  } catch (err) {
    console.error('[QR Code Generation Error]', err);
    return null;
  }
}
