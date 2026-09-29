const { app, BrowserWindow, ipcMain, globalShortcut, desktopCapturer, session, screen, shell } = require('electron');
const path = require('path');
const os = require('os');
const http = require('http');
const fs = require('fs');
const { WebSocketServer } = require('ws');
const { setStealthProtection } = require('./stealthManager.cjs');

// Guarantee AI API endpoints (Groq, Gemini, OpenAI) resolve cleanly across local network DNS issues
app.commandLine.appendSwitch('enable-features', 'DnsOverHttps');
app.commandLine.appendSwitch('dns-over-https-templates', 'https://dns.google/dns-query{?dns}');
app.commandLine.appendSwitch('host-resolver-rules', 'MAP api.groq.com 104.18.38.236');

// Prevent duplicate processes and port conflicts
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('[Main] Another instance is already running. Quitting secondary process...');
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.reloadIgnoringCache();
  }
});

// Global protection against modal crash dialogs
process.on('uncaughtException', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.warn('[Main] Port 5188 is already bound by an existing instance; continuing safely.');
    return;
  }
  console.error('[Main] Uncaught Exception:', err);
});

let mainWindow = null;
let isScreenProtectionEnabled = true;

function applyCurrentProtection(enable) {
  if (typeof enable === 'boolean') {
    isScreenProtectionEnabled = enable;
  }
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  return setStealthProtection(mainWindow, isScreenProtectionEnabled);
}

let authWindow = null;
let wss = null;
let httpServer = null;
const COMPANION_WS_PORT = 5188;
const connectedCompanionSockets = new Set();

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

function startCompanionWebSocketServer() {
  try {
    const distDir = path.join(__dirname, '../dist');

    let activeAuthSession = {
      email: 'anilmanal992115@gmail.com',
      name: 'Anil Manal',
      isAuthenticated: false
    };

    // Helper to safely bring Keter desktop window to front
    const bringKeterToFront = () => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      try {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        const b = mainWindow.getBounds();
        if (!b || b.width < 500 || b.height < 300) {
          mainWindow.setBounds({ width: 1080, height: 650 });
          mainWindow.center();
        }
        mainWindow.show();
        mainWindow.focus();
        mainWindow.setAlwaysOnTop(true);
      } catch (err) {
        console.warn('[Window] bringKeterToFront error:', err);
      }
    };

    // Create built-in HTTP server to serve the Companion Teleprompter app to mobile devices
    httpServer = http.createServer((req, res) => {
      const parsedUrl = new URL(req.url || '/', 'http://localhost:5188');
      let reqUrl = parsedUrl.pathname;
      const isReauth = parsedUrl.searchParams.get('reauth') === '1';

      // Focus Desktop App Endpoint
      if (req.method === 'POST' && reqUrl === '/auth/google/focus-app') {
        bringKeterToFront();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
      }

      // Sign Out / Reset Session Endpoint
      if (req.method === 'POST' && reqUrl === '/auth/google/signout') {
        activeAuthSession.isAuthenticated = false;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
      }

      // Google Sign-In Bridge
      if (reqUrl === '/auth/google') {
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        });

        const isAlreadyLoggedIn = activeAuthSession.isAuthenticated && !isReauth;

        res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Google Sign-In - Keter Copilot</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, sans-serif;
      background: #18191c;
      color: #e8eaed;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px 16px;
    }
    .card {
      background: #242529;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 38px 32px;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.55);
      text-align: center;
      position: relative;
    }
    .logo { width: 44px; height: 44px; margin-bottom: 14px; }
    h1 { font-size: 22px; font-weight: 500; margin: 0 0 6px; color: #fff; }
    .sub { font-size: 14px; color: #9aa0a6; margin: 0 0 22px; }
    
    .account-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      background: #1c1d21;
      border: 1px solid #3c4043;
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.15s ease;
      margin-bottom: 10px;
      text-align: left;
    }
    .account-card:hover {
      background: #2a2c31;
      border-color: #8ab4f8;
      transform: translateY(-1px);
    }
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #1a73e8;
      color: #fff;
      font-size: 17px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .avatar.other {
      background: #3c4043;
      color: #9aa0a6;
    }
    .acc-details { flex: 1; min-width: 0; }
    .acc-name { font-size: 14px; font-weight: 500; color: #e8eaed; }
    .acc-email { font-size: 12px; color: #9aa0a6; }
    
    /* Confirmation Consent Screen */
    .confirm-box {
      display: none;
      text-align: left;
    }
    .user-pill {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      background: #1c1d21;
      border: 1px solid #3c4043;
      border-radius: 30px;
      margin-bottom: 18px;
    }
    .pill-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #1a73e8;
      color: #fff;
      font-size: 15px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .pill-info { flex: 1; min-width: 0; font-size: 13px; }
    .pill-name { font-weight: 600; color: #fff; font-size: 13px; }
    .pill-email { color: #9aa0a6; font-size: 12px; }
    .notice {
      font-size: 13px;
      color: #bdc1c6;
      line-height: 1.5;
      margin-bottom: 24px;
      padding: 0 4px;
    }
    .action-row {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      align-items: center;
    }
    .btn-secondary {
      padding: 10px 20px;
      background: transparent;
      border: 1px solid #5f6368;
      border-radius: 20px;
      color: #8ab4f8;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-secondary:hover {
      background: rgba(138, 180, 248, 0.08);
    }
    .btn-primary {
      padding: 11px 24px;
      background: #8ab4f8;
      border: none;
      border-radius: 20px;
      color: #18191c;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-primary:hover {
      background: #aecbfa;
    }

    .custom-box { display: none; margin-top: 12px; text-align: left; }
    input {
      width: 100%;
      padding: 11px 14px;
      background: #1c1d21;
      border: 1px solid #5f6368;
      border-radius: 10px;
      color: #fff;
      font-size: 14px;
      margin-bottom: 10px;
      outline: none;
    }
    input:focus { border-color: #8ab4f8; }

    /* Success Screen */
    .success-box {
      display: ${isAlreadyLoggedIn ? 'block' : 'none'};
      text-align: center;
      padding: 10px 0;
    }
    .check-badge {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: rgba(52, 211, 153, 0.16);
      border: 2px solid #34d399;
      color: #34d399;
      font-size: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      animation: pop 0.3s ease;
    }
    @keyframes pop {
      0% { transform: scale(0.6); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
  </style>
</head>
<body>
  <div class="card">
    <svg class="logo" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"/>
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
    </svg>

    <!-- STEP 1: Account Selection -->
    <div id="selectionView" style="display: ${isAlreadyLoggedIn ? 'none' : 'block'};">
      <h1>Choose an account</h1>
      <div class="sub">to continue to <strong>Keter Copilot</strong></div>

      <div class="account-card" onclick="selectAccount('anilmanal992115@gmail.com', 'Anil Manal')">
        <div class="avatar">A</div>
        <div class="acc-details">
          <div class="acc-name">Anil Manal</div>
          <div class="acc-email">anilmanal992115@gmail.com</div>
        </div>
      </div>

      <div class="account-card" onclick="toggleCustom()">
        <div class="avatar other">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7.5" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
        </div>
        <div class="acc-details">
          <div class="acc-name" style="font-size: 14px;">Use another account</div>
        </div>
      </div>

      <div id="customBox" class="custom-box">
        <input type="email" id="customEmail" placeholder="Enter your Google email..." />
        <button class="btn-primary" style="width: 100%; border-radius: 10px;" onclick="submitCustom()">Next</button>
      </div>
    </div>

    <!-- STEP 2: Standard Google Confirmation Consent -->
    <div id="confirmView" class="confirm-box">
      <h1 style="text-align: center; margin-bottom: 4px;">Sign in to Keter</h1>
      <div class="sub" style="text-align: center; margin-bottom: 20px;">Google Identity Services</div>

      <div class="user-pill">
        <div class="pill-avatar" id="pillAvatar">A</div>
        <div class="pill-info">
          <div class="pill-name" id="pillName">Anil Manal</div>
          <div class="pill-email" id="pillEmail">anilmanal992115@gmail.com</div>
        </div>
      </div>

      <div class="notice">
        To continue, Google will share your name and email address with <strong>Keter</strong>.<br><br>
        Before using Keter, you can review its privacy policy and terms of service.
      </div>

      <div class="action-row">
        <button class="btn-secondary" onclick="backToSelection()">Cancel</button>
        <button class="btn-primary" onclick="proceedAuth()">Continue</button>
      </div>
    </div>

    <!-- STEP 3 / Already Logged In: Success -->
    <div id="successView" class="success-box">
      <div class="check-badge">✓</div>
      <h1 style="color: #8ab4f8; margin-bottom: 4px;">Authentication Successful!</h1>
      <div class="sub" style="margin-bottom: 18px;">
        Signed in as <strong id="confirmedEmail" style="color: #fff;">${activeAuthSession.email}</strong>
      </div>

      <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px; padding: 12px; font-size: 13px; color: #7dd3fc; margin-bottom: 22px; line-height: 1.4;">
        🚀 <strong>Keter Copilot is unlocked and active!</strong><br>
        10 Free Technical Assessment Solves ready.
      </div>

      <button class="btn-primary" style="width: 100%; border-radius: 12px; padding: 13px; font-size: 14px; margin-bottom: 16px;" onclick="focusKeter()">
        Open Keter Desktop App
      </button>

      <div style="display: flex; justify-content: center; gap: 16px; font-size: 12px; color: #9aa0a6;">
        <a href="/auth/google?reauth=1" style="color: #9aa0a6; text-decoration: underline;">Switch Account</a>
        <span>•</span>
        <span style="color: #6b7280;">You may safely close this tab</span>
      </div>
    </div>
  </div>

  <script>
    let selectedEmail = 'anilmanal992115@gmail.com';
    let selectedName = 'Anil Manal';

    function selectAccount(email, name) {
      selectedEmail = email;
      selectedName = name;
      document.getElementById('pillAvatar').innerText = (name || email)[0].toUpperCase();
      document.getElementById('pillName').innerText = name || email.split('@')[0];
      document.getElementById('pillEmail').innerText = email;

      document.getElementById('selectionView').style.display = 'none';
      document.getElementById('confirmView').style.display = 'block';
    }

    function backToSelection() {
      document.getElementById('confirmView').style.display = 'none';
      document.getElementById('selectionView').style.display = 'block';
    }

    function toggleCustom() {
      const box = document.getElementById('customBox');
      box.style.display = box.style.display === 'block' ? 'none' : 'block';
      if (box.style.display === 'block') document.getElementById('customEmail').focus();
    }

    function submitCustom() {
      const email = document.getElementById('customEmail').value.trim();
      if (!email || !email.includes('@')) {
        alert('Please enter a valid Google email address');
        return;
      }
      selectAccount(email, email.split('@')[0]);
    }

    function focusKeter() {
      fetch('/auth/google/focus-app', { method: 'POST' }).finally(() => {
        try { window.close(); } catch (_) {}
      });
    }

    function proceedAuth() {
      document.getElementById('confirmView').style.display = 'none';
      document.getElementById('confirmedEmail').innerText = selectedEmail;
      document.getElementById('successView').style.display = 'block';

      fetch('/auth/google/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: selectedEmail, name: selectedName })
      }).then(() => {
        setTimeout(() => {
          try { window.close(); } catch (_) {}
        }, 1200);
      }).catch(err => {
        console.error(err);
      });
    }

    document.getElementById('customEmail')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitCustom();
    });
  </script>
</body>
</html>`);
        return;
      }

      if (req.method === 'POST' && reqUrl === '/auth/google/callback') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const payload = JSON.parse(body);
            if (payload.email) {
              activeAuthSession.email = payload.email.trim();
              activeAuthSession.name = payload.name || activeAuthSession.email.split('@')[0];
              activeAuthSession.isAuthenticated = true;

              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('google-auth-success', {
                  email: activeAuthSession.email,
                  name: activeAuthSession.name
                });
                bringKeterToFront();
              }
            }
            if (authWindow && !authWindow.isDestroyed()) {
              setTimeout(() => {
                try { authWindow.close(); } catch (_) {}
                authWindow = null;
              }, 400);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (e) {
            res.writeHead(400);
            res.end('Invalid JSON');
          }
        });
        return;
      }

      if (reqUrl === '/' || reqUrl === '') {
        reqUrl = '/index.html';
      }

      const filePath = path.join(distDir, reqUrl);
      if (!filePath.startsWith(distDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          // SPA fallback to dist/index.html
          fs.readFile(path.join(distDir, 'index.html'), (err2, indexData) => {
            if (err2) {
              res.writeHead(404);
              res.end('Not Found');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(indexData);
            }
          });
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
          '.html': 'text/html; charset=utf-8',
          '.js': 'application/javascript; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.svg': 'image/svg+xml',
          '.ico': 'image/x-icon',
          '.webp': 'image/webp'
        };

        res.writeHead(200, {
          'Content-Type': mimeTypes[ext] || 'application/octet-stream',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(data);
      });
    });

    // Handle HTTP server errors before listening
    httpServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[Companion] Port ${COMPANION_WS_PORT} is already in use by another instance. Skipping server bind.`);
      } else {
        console.error('[Companion] HTTP Server error:', err);
      }
    });

    try {
      // Attach WebSocket server to the same HTTP server on port 5188
      wss = new WebSocketServer({ server: httpServer });
      wss.on('error', (err) => {
        console.warn('[Companion] WebSocket server warning:', err.message);
      });
    } catch (e) {
      console.warn('[Companion] Could not initialize WebSocketServer:', e.message);
    }

    try {
      httpServer.listen(COMPANION_WS_PORT, '0.0.0.0', () => {
        console.log(`[Companion] Web & WebSocket Server running on http://0.0.0.0:${COMPANION_WS_PORT}`);
      });
    } catch (err) {
      console.warn('[Companion] httpServer.listen failed gracefully:', err.message);
    }

    wss.on('connection', (ws) => {
      connectedCompanionSockets.add(ws);
      console.log('[Companion] Client connected. Total:', connectedCompanionSockets.size);

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('companion-client-message', { action: 'client_connected' });
        try {
          ws.send(JSON.stringify({ type: 'window_visibility', isVisible: mainWindow.isVisible() }));
        } catch (_) {}
      }

      ws.on('message', (message) => {
        try {
          const parsed = JSON.parse(message.toString());
          if (parsed && parsed.action === 'reload' && mainWindow && !mainWindow.isDestroyed()) {
            console.log('[Window] Triggering hot reload from socket command (bypassing cache)');
            mainWindow.webContents.reloadIgnoringCache();
          }
          if (parsed && parsed.action === 'toggle_window_visibility' && mainWindow && !mainWindow.isDestroyed()) {
            if (mainWindow.isVisible()) {
              mainWindow.hide();
              broadcastToCompanions({ type: 'window_visibility', isVisible: false });
            } else {
              mainWindow.show();
              broadcastToCompanions({ type: 'window_visibility', isVisible: true });
            }
          }
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('companion-client-message', parsed);
          }
        } catch (e) {
          console.error('[Companion] Message error:', e);
        }
      });

      ws.on('close', () => {
        connectedCompanionSockets.delete(ws);
        console.log('[Companion] Client disconnected');
      });
    });
  } catch (err) {
    console.error('[Companion] Server error:', err);
  }
}

let companionTunnel = null;
let companionTunnelUrl = null;

async function startCompanionTunnel(roomId) {
  try {
    const localtunnel = require('localtunnel');
    if (companionTunnel) {
      try { companionTunnel.close(); } catch (_) {}
      companionTunnel = null;
    }
    const cleanRoom = (roomId || 'default').toLowerCase().replace(/[^a-z0-9]/g, '');
    const subdomain = `keter-${cleanRoom}`;
    console.log(`[Companion Tunnel] Requesting Global 5G/Cloud Tunnel: ${subdomain}...`);

    const tunnel = await localtunnel({ port: COMPANION_WS_PORT, subdomain });
    companionTunnel = tunnel;
    companionTunnelUrl = tunnel.url;
    console.log(`[Companion Tunnel] Global 5G/Cloud Tunnel Online: ${tunnel.url}`);

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('companion-tunnel-url', tunnel.url);
    }

    tunnel.on('close', () => {
      console.log('[Companion Tunnel] Tunnel closed.');
      companionTunnel = null;
      companionTunnelUrl = null;
    });

    tunnel.on('error', (err) => {
      console.warn('[Companion Tunnel] Tunnel notice:', err?.message || err);
    });

    return tunnel.url;
  } catch (err) {
    console.warn('[Companion Tunnel] Could not initialize tunnel:', err?.message || err);
    return null;
  }
}

function broadcastToCompanions(payload) {
  const data = JSON.stringify(payload);
  for (const client of connectedCompanionSockets) {
    if (client.readyState === 1) { // OPEN
      client.send(data);
    }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 650,
    x: undefined, // center horizontally
    y: 30,        // near top (webcam level)
    frame: false,
    transparent: false,
    backgroundColor: '#0a0d14', // Solid dark background ensuring 100% visibility to user
    alwaysOnTop: true,
    hasShadow: true,
    resizable: true,
    icon: path.join(__dirname, 'service_host.ico'),
    skipTaskbar: true, // Stealth feature: completely hides icon from Windows Taskbar & Alt+Tab
    title: 'Audio Core Host',
    minWidth: 480,
    minHeight: 180,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  // Stealth Screen Protection (Parakeet-AI style: 100% invisible in screen shares, NO black box!)
  // Uses Windows DWM WDA_EXCLUDEFROMCAPTURE (17) so interviewers see the desktop/apps behind Keter seamlessly.
  mainWindow.once('ready-to-show', () => {
    applyCurrentProtection();
  });
  mainWindow.on('show', () => {
    applyCurrentProtection();
  });
  mainWindow.on('focus', () => {
    applyCurrentProtection();
  });

  // Auto-grant media and audio capture permissions, including system audio loopback
  if (session.defaultSession) {
    session.defaultSession.setPermissionCheckHandler(() => true);
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      callback(true);
    });

    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
      desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
        if (sources && sources.length > 0) {
          // Pass audio: 'loopback' to enable native Windows system audio loopback capture
          callback({ video: sources[0], audio: 'loopback' });
        } else {
          callback({});
        }
      }).catch(err => {
        console.warn('[Session] getDisplayMedia error:', err);
        callback({});
      });
    });
  }

  // Load built app directly from dist/index.html for instant, 100% reliable startup
  const distPath = path.join(__dirname, '../dist/index.html');
  mainWindow.loadFile(distPath).catch(err => {
    console.warn('[Window] loadFile error, falling back to devUrl:', err);
    mainWindow.loadURL('http://localhost:5173');
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer Console] ${message} (${sourceId}:${line})`);
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`[Renderer Fail] ${errorCode}: ${errorDescription}`);
  });

  // Open external links in default browser, but allow Razorpay authentication popups
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes('razorpay.com') || url.includes('checkout') || url.includes('api.razorpay')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 500,
          height: 700,
          title: 'Razorpay Secure Checkout',
          alwaysOnTop: true,
          autoHideMenuBar: true,
        },
      };
    }
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow.webContents.getURL() && (url.startsWith('http:') || url.startsWith('https:'))) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Click-through pass-through events
  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      win.setIgnoreMouseEvents(ignore, { forward: true, ...(options || {}) });
    }
  });

  // Window sizing IPC (for Mini Teleprompter Mode vs Full Mode)
  ipcMain.on('set-window-size', (event, width, height) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setSize(width, height);
    }
  });

  // Window visibility toggles
  ipcMain.on('window-minimize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.minimize();
    }
  });

  ipcMain.on('window-close', () => {
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.destroy();
      }
    } catch (_) {}
    app.quit();
  });

  ipcMain.on('app-quit', () => {
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.destroy();
      }
    } catch (_) {}
    app.quit();
  });

  ipcMain.on('window-toggle-visibility', () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
      broadcastToCompanions({ type: 'window_visibility', isVisible: false });
    } else {
      mainWindow.show();
      broadcastToCompanions({ type: 'window_visibility', isVisible: true });
    }
  });

  // OS-level Window Opacity adjustment (allows 0.0 to 1.0)
  ipcMain.on('set-window-opacity', (event, opacity) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const val = Math.max(0.0, Math.min(1.0, parseFloat(opacity) ?? 0.95));
      mainWindow.setOpacity(val);
      // Re-assert current protection state so Windows composition layer preserves affinity
      applyCurrentProtection();
      console.log(`[Window] Opacity set to: ${val}`);
    }
  });

  // Broadcast data to mobile companion devices
  ipcMain.on('companion-broadcast', (event, payload) => {
    broadcastToCompanions(payload);
  });

  // Global 5G/Cloud Tunnel IPC Handlers
  ipcMain.handle('get-tunnel-url', () => {
    return companionTunnelUrl;
  });

  ipcMain.handle('start-tunnel-for-room', (event, roomId) => {
    return startCompanionTunnel(roomId);
  });

  // Open URL in system browser
  ipcMain.on('open-external', (event, url) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      shell.openExternal(url);
    }
  });

  // Dedicated Google Sign-In Popup Window
  ipcMain.handle('open-google-login-popup', () => {
    if (authWindow && !authWindow.isDestroyed()) {
      authWindow.show();
      authWindow.focus();
      return true;
    }

    authWindow = new BrowserWindow({
      width: 440,
      height: 560,
      center: true,
      title: 'Sign in with Google - Keter',
      autoHideMenuBar: true,
      alwaysOnTop: true,
      resizable: false,
      backgroundColor: '#0b0f19',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      }
    });

    authWindow.loadURL('http://localhost:5188/auth/google');

    authWindow.on('closed', () => {
      authWindow = null;
    });

    return true;
  });

  // Register Global Hotkeys
  try {
    const toggleWindowVis = () => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
        const b = mainWindow.getBounds();
        if (!b || b.width < 500 || b.height < 300) {
          mainWindow.setBounds({ width: 1080, height: 650 });
          mainWindow.center();
        }
        mainWindow.show();
        mainWindow.focus();
        mainWindow.setAlwaysOnTop(true);
      } else if (mainWindow.isVisible()) {
        mainWindow.hide();
        broadcastToCompanions({ type: 'window_visibility', isVisible: false });
      } else {
        const b = mainWindow.getBounds();
        if (!b || b.width < 500 || b.height < 300) {
          mainWindow.setBounds({ width: 1080, height: 650 });
          mainWindow.center();
        }
        mainWindow.show();
        mainWindow.focus();
        mainWindow.setAlwaysOnTop(true);
        broadcastToCompanions({ type: 'window_visibility', isVisible: true });
      }
    };
    globalShortcut.register('CommandOrControl+Shift+H', toggleWindowVis);
    globalShortcut.register('Alt+K', toggleWindowVis);

    // Clear Chat
    const triggerClearChat = () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('hotkey-trigger', 'clear-chat');
      }
    };
    globalShortcut.register('Alt+C', triggerClearChat);
    globalShortcut.register('CommandOrControl+Shift+C', triggerClearChat);

    // Toggle Microphone / Voice Listening
    globalShortcut.register('Alt+M', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('hotkey-trigger', 'toggle-listening');
      }
    });

    globalShortcut.register('CommandOrControl+Shift+T', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('hotkey-trigger', 'toggle-clickthrough');
      }
    });

    globalShortcut.register('CommandOrControl+Shift+Up', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        const next = Math.min(1.0, parseFloat((mainWindow.getOpacity() + 0.1).toFixed(2)));
        mainWindow.setOpacity(next);
        mainWindow.webContents.send('hotkey-trigger', `opacity:${next}`);
      }
    });

    globalShortcut.register('CommandOrControl+Shift+Down', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        const next = Math.max(0.0, parseFloat((mainWindow.getOpacity() - 0.1).toFixed(2)));
        mainWindow.setOpacity(next);
        mainWindow.webContents.send('hotkey-trigger', `opacity:${next}`);
      }
    });

    globalShortcut.register('CommandOrControl+Shift+Space', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('hotkey-trigger', 'trigger-generate');
      }
    });

    globalShortcut.register('CommandOrControl+Shift+X', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('panic-trigger');
        mainWindow.hide();
      }
    });

    // Auto-Camouflage Screenshot Mode: Instantly vanishes for 3 seconds so you can take a 100% clean screenshot, then automatically restores
    const triggerCamouflage = () => {
      if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
        mainWindow.hide();
        setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.show();
          }
        }, 3000);
      }
    };
    globalShortcut.register('F9', triggerCamouflage);
    globalShortcut.register('CommandOrControl+Alt+S', triggerCamouflage);

    // Hotkey for One-Touch Screen Auto-Read & Solve (MCQs, LeetCode, Code Review)
    globalShortcut.register('Alt+S', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('hotkey-trigger', 'read-screen');
      }
    });
    globalShortcut.register('CommandOrControl+Shift+S', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('hotkey-trigger', 'read-screen');
      }
    });
  } catch (err) {
    console.warn('Shortcut registration error:', err);
  }
}

// IPC Handlers
ipcMain.handle('set-content-protection', (event, enable) => {
  return applyCurrentProtection(!!enable);
});

ipcMain.handle('get-content-protection', () => {
  return isScreenProtectionEnabled;
});

ipcMain.handle('get-desktop-sources', async () => {
  return await desktopCapturer.getSources({ types: ['window', 'screen'] });
});

const { recognizeTextFromImage } = require('./ocrHelper.cjs');

ipcMain.handle('capture-screen-for-vision', async () => {
  if (!mainWindow || mainWindow.isDestroyed()) return null;
  const wasVisible = mainWindow.isVisible();
  try {
    // Hide keter window for ~120ms so it doesn't obstruct the test question or coding problem
    if (wasVisible) {
      mainWindow.hide();
      await new Promise(r => setTimeout(r, 120));
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const scaleFactor = primaryDisplay.scaleFactor || 1;
    const width = Math.round(primaryDisplay.size.width * scaleFactor);
    const height = Math.round(primaryDisplay.size.height * scaleFactor);

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width, height }
    });

    if (sources && sources.length > 0) {
      let img = sources[0].thumbnail;
      const size = img.getSize();

      // Exclude top browser tabs/title bar (~85px) and bottom Windows taskbar (~48px)
      if (size.height > 400 && size.width > 400) {
        const topBarHeight = Math.min(Math.round(85 * scaleFactor), Math.round(size.height * 0.12));
        const taskbarHeight = Math.min(Math.round(48 * scaleFactor), Math.round(size.height * 0.08));
        const croppedHeight = size.height - topBarHeight - taskbarHeight;
        if (croppedHeight > 200) {
          img = img.crop({
            x: 0,
            y: topBarHeight,
            width: size.width,
            height: croppedHeight,
          });
        }
      }

      const jpegBuffer = img.toJPEG(92);
      const base64Data = jpegBuffer.toString('base64');
      const dataUri = `data:image/jpeg;base64,${base64Data}`;

      // Write temp file and run local offline Windows WinRT OCR
      let ocrText = '';
      try {
        const tempPath = path.join(os.tmpdir(), 'keter_screen_capture.jpg');
        await fs.promises.writeFile(tempPath, jpegBuffer);
        ocrText = await recognizeTextFromImage(tempPath);
      } catch (ocrErr) {
        console.warn('[OCR] Extraction error:', ocrErr.message);
      }

      return {
        imageBase64: dataUri,
        ocrText: ocrText || '',
      };
    }
    return null;
  } catch (err) {
    console.error('[Capture] Screen capture for vision failed:', err);
    return null;
  } finally {
    if (wasVisible && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
    }
  }
});

ipcMain.handle('capture-screen-frame', async () => {
  try {
    const primaryDisplay = screen.getPrimaryDisplay();
    const scaleFactor = primaryDisplay.scaleFactor || 1;
    const width = Math.min(960, Math.round(primaryDisplay.size.width * scaleFactor));
    const height = Math.min(540, Math.round(primaryDisplay.size.height * scaleFactor));

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width, height }
    });

    if (sources && sources.length > 0) {
      const jpegBuffer = sources[0].thumbnail.toJPEG(50);
      return `data:image/jpeg;base64,${jpegBuffer.toString('base64')}`;
    }
  } catch (err) {
    console.warn('[Screen Frame Error]', err.message);
  }
  return null;
});

ipcMain.handle('get-local-ip', () => {
  return getLocalIpAddress();
});

app.whenReady().then(() => {
  app.setName('Audio Core Host');
  startCompanionWebSocketServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (wss) {
    wss.close();
  }
  if (httpServer) {
    httpServer.close();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
