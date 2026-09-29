const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window Controls
  setIgnoreMouseEvents: (ignore, options) => ipcRenderer.send('set-ignore-mouse-events', ignore, options),
  setContentProtection: (enable) => ipcRenderer.invoke('set-content-protection', enable),
  getContentProtection: () => ipcRenderer.invoke('get-content-protection'),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  quitApp: () => ipcRenderer.send('app-quit'),
  toggleWindowVisibility: () => ipcRenderer.send('window-toggle-visibility'),
  setWindowOpacity: (opacity) => ipcRenderer.send('set-window-opacity', opacity),
  setWindowSize: (width, height) => ipcRenderer.send('set-window-size', width, height),
  
  // Stealth & Capture APIs
  getDesktopSources: () => ipcRenderer.invoke('get-desktop-sources'),
  captureScreenForVision: () => ipcRenderer.invoke('capture-screen-for-vision'),
  captureScreenFrame: () => ipcRenderer.invoke('capture-screen-frame'),
  
  // Network & Companion Sync
  getLocalIp: () => ipcRenderer.invoke('get-local-ip'),
  getTunnelUrl: () => ipcRenderer.invoke('get-tunnel-url'),
  startTunnelForRoom: (roomId) => ipcRenderer.invoke('start-tunnel-for-room', roomId),
  onTunnelUrl: (callback) => {
    const subscription = (event, url) => callback(url);
    ipcRenderer.on('companion-tunnel-url', subscription);
    return () => ipcRenderer.removeListener('companion-tunnel-url', subscription);
  },
  sendCompanionBroadcast: (payload) => ipcRenderer.send('companion-broadcast', payload),
  onCompanionClientMessage: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('companion-client-message', subscription);
    return () => ipcRenderer.removeListener('companion-client-message', subscription);
  },

  // Emergency Panic Key listener
  onPanicTrigger: (callback) => {
    const subscription = () => callback();
    ipcRenderer.on('panic-trigger', subscription);
    return () => ipcRenderer.removeListener('panic-trigger', subscription);
  },

  // Hotkey triggers from main process
  onHotkeyTrigger: (callback) => {
    const subscription = (event, action) => callback(action);
    ipcRenderer.on('hotkey-trigger', subscription);
    return () => ipcRenderer.removeListener('hotkey-trigger', subscription);
  },

  // External browser & Google Auth bridge
  openExternal: (url) => ipcRenderer.send('open-external', url),
  openGoogleLoginPopup: () => ipcRenderer.invoke('open-google-login-popup'),
  onGoogleAuthSuccess: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('google-auth-success', subscription);
    return () => ipcRenderer.removeListener('google-auth-success', subscription);
  }
});
