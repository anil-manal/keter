const os = require('os');
const path = require('path');

let SetWindowDisplayAffinity = null;
let GetWindowDisplayAffinity = null;

try {
  if (process.platform === 'win32') {
    const koffi = require('koffi');
    const user32 = koffi.load('user32.dll');
    SetWindowDisplayAffinity = user32.func('bool __stdcall SetWindowDisplayAffinity(intptr_t hWnd, uint32_t dwAffinity)');
    GetWindowDisplayAffinity = user32.func('bool __stdcall GetWindowDisplayAffinity(intptr_t hWnd, _Out_ uint32_t *pdwAffinity)');
    console.log('[Stealth] Win32 SetWindowDisplayAffinity binding initialized successfully.');
  }
} catch (err) {
  console.warn('[Stealth] Win32 koffi binding notice:', err.message);
}

// Windows Display Affinity Constants:
// 0x00000000 (0)  = WDA_NONE (Window is captured normally in all recording & screen shares)
// 0x00000011 (17) = WDA_EXCLUDEFROMCAPTURE (Parakeet-AI style: Completely excluded/transparent in screen capture; desktop/apps behind show through seamlessly with ZERO black box!)
// CRITICAL NOTE: NEVER use WDA_MONITOR (0x01) or Electron's native setContentProtection(true), as both tell Windows DWM to paint a solid black box!
const WDA_NONE = 0x00000000;
const WDA_EXCLUDEFROMCAPTURE = 0x00000011;

let stealthInterval = null;

function getHwnd(win) {
  if (!win || win.isDestroyed()) return null;
  try {
    const buf = win.getNativeWindowHandle();
    if (buf.length >= 8) {
      return buf.readBigInt64LE(0);
    } else if (buf.length >= 4) {
      return BigInt(buf.readInt32LE(0));
    }
  } catch (err) {
    console.warn('[Stealth] Could not read native window handle:', err.message);
  }
  return null;
}

function applyAffinity(win, enable) {
  if (!win || win.isDestroyed()) return 0;

  // Always ensure Electron's built-in DRM content protection is disabled so it NEVER generates a black box
  try {
    win.setContentProtection(false);
  } catch (_) {}

  // Win32 DWM Display Affinity
  if (process.platform === 'win32' && SetWindowDisplayAffinity) {
    const hwnd = getHwnd(win);
    if (hwnd) {
      if (enable) {
        // Apply WDA_EXCLUDEFROMCAPTURE (17) for clean pass-through with ZERO black box
        try {
          SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE);
        } catch (_) {}
      } else {
        // Normal visibility: WDA_NONE (0)
        try {
          SetWindowDisplayAffinity(hwnd, WDA_NONE);
        } catch (_) {}
      }

      const out = [0];
      try {
        if (GetWindowDisplayAffinity) {
          GetWindowDisplayAffinity(hwnd, out);
        }
      } catch (_) {}
      return out[0];
    }
  }

  return enable ? 17 : 0;
}

function setStealthProtection(win, enable) {
  if (!win || win.isDestroyed()) return false;

  // Always clear previous loop before setting new state
  if (stealthInterval) {
    clearInterval(stealthInterval);
    stealthInterval = null;
  }

  const currentAffinity = applyAffinity(win, enable);

  // If enabled, periodically re-assert WDA_EXCLUDEFROMCAPTURE (17)
  // This ensures dynamic capture restarts (Zoom/Teams/Meet) or window opacity changes keep Keter transparent
  if (enable) {
    stealthInterval = setInterval(() => {
      if (!win || win.isDestroyed()) {
        clearInterval(stealthInterval);
        stealthInterval = null;
        return;
      }
      applyAffinity(win, true);
    }, 1500);
  } else {
    // If disabled, ensure affinity is reset to 0
    if (process.platform === 'win32' && SetWindowDisplayAffinity) {
      const hwnd = getHwnd(win);
      if (hwnd) {
        try { SetWindowDisplayAffinity(hwnd, WDA_NONE); } catch (_) {}
      }
    }
  }

  console.log(`[Stealth] Screen protection updated: enable=${enable} (Affinity: ${currentAffinity} - ${
    currentAffinity === 17 ? 'EXCLUDE FROM CAPTURE / PASS-THROUGH (No Black Box)' : 'NORMAL / VISIBLE'
  })`);

  return { success: true, enabled: enable, affinity: currentAffinity };
}

module.exports = {
  setStealthProtection,
  WDA_EXCLUDEFROMCAPTURE,
  WDA_NONE,
};
