// PeerJS WebRTC Relay Service for Keter Copilot
// Enables 100% zero-configuration peer-to-peer pairing across 5G, 4G, and Wi-Fi networks worldwide.
import PeerPackage from 'peerjs';

function getPeerConstructor() {
  if (typeof window !== 'undefined' && typeof window.Peer === 'function') {
    return window.Peer;
  }
  const P = PeerPackage?.Peer || PeerPackage?.default || PeerPackage;
  if (typeof P === 'function') return P;
  if (P && typeof P.Peer === 'function') return P.Peer;
  return P;
}

function sanitizeRoomId(roomId) {
  if (!roomId) return 'ktr-default';
  return roomId.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const PEER_CONFIG = {
  debug: 1,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
    ],
    iceCandidatePoolSize: 10,
  },
};

let globalHostInstance = null;
let currentHostRoomId = null;

/**
 * Host Side (Desktop App / Web App Host): Listens for incoming phone connections & streams screen
 */
export function initHostPeer(roomId, { onClientConnect, onClientMessage, onClientDisconnect } = {}) {
  const cleanId = `keter-host-${sanitizeRoomId(roomId)}`;

  // If host already exists for this roomId and is alive, simply update callbacks and return it
  if (globalHostInstance && currentHostRoomId === roomId && !globalHostInstance.isDestroyed()) {
    globalHostInstance.updateCallbacks({ onClientConnect, onClientMessage, onClientDisconnect });
    return globalHostInstance;
  }

  // Destroy previous host if roomId changed
  if (globalHostInstance) {
    try {
      globalHostInstance.destroy();
    } catch (_) {}
    globalHostInstance = null;
  }

  currentHostRoomId = roomId;

  const activeConnections = new Set();
  const clientPeerIds = new Set();
  let peer = null;
  let activeMediaCalls = [];
  let currentScreenStream = null;
  let heartbeatTimer = null;
  let destroyed = false;
  let retryTimer = null;

  let callbacks = { onClientConnect, onClientMessage, onClientDisconnect };

  const startHeartbeat = () => {
    clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => {
      if (destroyed || !peer || peer.destroyed) return;
      for (const conn of activeConnections) {
        if (conn.open) {
          try {
            conn.send({ type: 'heartbeat', timestamp: Date.now() });
          } catch (_) {}
        }
      }
    }, 3500);
  };

  const setupPeer = () => {
    if (destroyed) return;

    try {
      const PeerClass = getPeerConstructor();
      peer = new PeerClass(cleanId, PEER_CONFIG);

      peer.on('open', (id) => {
        console.log(`[WebRTC Relay Host] Registered on PeerJS cloud broker with ID: ${id}`);
        startHeartbeat();
      });

      peer.on('connection', (conn) => {
        console.log('[WebRTC Relay Host] Phone connected via DataChannel:', conn.peer);
        activeConnections.add(conn);
        if (conn.peer) clientPeerIds.add(conn.peer);

        const handleOpen = () => {
          if (conn.peer) clientPeerIds.add(conn.peer);
          try {
            conn.send({ type: 'heartbeat', timestamp: Date.now() });
          } catch (_) {}

          if (callbacks.onClientConnect) {
            callbacks.onClientConnect(conn);
          }

          // If screen is actively streaming, automatically start media call for this new client
          if (currentScreenStream && conn.peer) {
            try {
              console.log(`[WebRTC Relay Host] Auto-calling newly connected peer ${conn.peer} with screen stream`);
              const call = peer.call(conn.peer, currentScreenStream);
              if (call) activeMediaCalls.push(call);
            } catch (err) {
              console.warn('[WebRTC Relay Host] Auto-call error:', err);
            }
          }
        };

        if (conn.open) {
          handleOpen();
        } else {
          conn.on('open', handleOpen);
        }

        conn.on('data', (data) => {
          if (!data) return;
          if (data.action === 'register_peer_id' && data.peerId) {
            clientPeerIds.add(data.peerId);
            if (currentScreenStream) {
              try {
                const call = peer.call(data.peerId, currentScreenStream);
                if (call) activeMediaCalls.push(call);
              } catch (_) {}
            }
          } else if (data.action === 'ping') {
            try {
              conn.send({ type: 'pong', timestamp: Date.now() });
            } catch (_) {}
          }

          if (callbacks.onClientMessage) {
            callbacks.onClientMessage(data);
          }
        });

        conn.on('close', () => {
          activeConnections.delete(conn);
          if (conn.peer) clientPeerIds.delete(conn.peer);
          if (callbacks.onClientDisconnect) {
            callbacks.onClientDisconnect();
          }
          console.log('[WebRTC Relay Host] Phone disconnected.');
        });

        conn.on('error', (err) => {
          console.warn('[WebRTC Relay Host] DataChannel notice:', err);
        });
      });

      peer.on('disconnected', () => {
        console.log('[WebRTC Relay Host] Disconnected from broker, reconnecting in 1.5s...');
        if (!destroyed) {
          setTimeout(() => {
            try {
              if (peer && !peer.destroyed) peer.reconnect();
            } catch (_) {}
          }, 1500);
        }
      });

      peer.on('error', (err) => {
        if (err?.type === 'peer-unavailable') {
          const deadId = err?.message?.match(/Could not connect to peer ([a-zA-Z0-9_-]+)/)?.[1];
          if (deadId) {
            clientPeerIds.delete(deadId);
          }
          return;
        }
        console.warn('[WebRTC Relay Host] Peer error:', err?.type || err?.message);
        if (err?.type === 'unavailable-id' && !destroyed) {
          console.log('[WebRTC Relay Host] Peer ID temporarily reserved by broker. Re-claiming in 2.5s...');
          clearTimeout(retryTimer);
          retryTimer = setTimeout(() => {
            if (!destroyed) {
              try {
                peer?.destroy();
              } catch (_) {}
              setupPeer();
            }
          }, 2500);
        } else if (err?.type === 'network' && !destroyed) {
          setTimeout(() => {
            try {
              peer?.reconnect();
            } catch (_) {}
          }, 2000);
        }
      });
    } catch (err) {
      console.warn('[WebRTC Relay Host] Setup error:', err);
    }
  };

  setupPeer();

  const instance = {
    isDestroyed: () => destroyed,
    updateCallbacks: (newCbs) => {
      callbacks = { ...callbacks, ...newCbs };
    },
    broadcast: (payload) => {
      for (const conn of activeConnections) {
        if (conn.open) {
          try {
            conn.send(payload);
          } catch (e) {
            console.warn('[WebRTC Relay Host] Broadcast error:', e);
          }
        }
      }
    },
    startScreenCall: (stream) => {
      currentScreenStream = stream;
      // Close any previous calls
      for (const c of activeMediaCalls) {
        try {
          c.close();
        } catch (_) {}
      }
      activeMediaCalls = [];

      for (const clientPeerId of clientPeerIds) {
        try {
          console.log(`[WebRTC Relay Host] Calling phone peer ${clientPeerId} with screen stream...`);
          const call = peer.call(clientPeerId, stream);
          if (call) activeMediaCalls.push(call);
        } catch (e) {
          console.warn('[WebRTC Relay Host] Media call error:', e);
        }
      }
      return activeMediaCalls;
    },
    stopScreenCall: () => {
      currentScreenStream = null;
      for (const c of activeMediaCalls) {
        try {
          c.close();
        } catch (_) {}
      }
      activeMediaCalls = [];
    },
    destroy: () => {
      destroyed = true;
      clearInterval(heartbeatTimer);
      clearTimeout(retryTimer);
      for (const c of activeMediaCalls) {
        try {
          c.close();
        } catch (_) {}
      }
      activeMediaCalls = [];
      try {
        peer?.destroy();
      } catch (_) {}
      if (globalHostInstance === instance) {
        globalHostInstance = null;
      }
    },
  };

  globalHostInstance = instance;
  return instance;
}

/**
 * Client Side (Mobile Teleprompter Phone): Connects to Desktop Host with auto-retry
 */
export function connectClientPeer(
  roomId,
  { onConnect, onMessage, onDisconnect, onScreenStream, onStatusChange } = {}
) {
  const targetHostId = `keter-host-${sanitizeRoomId(roomId)}`;
  let peer = null;
  let connection = null;
  let retryTimer = null;
  let pingTimer = null;
  let isDestroyed = false;
  let isConnected = false;

  const updateStatus = (status) => {
    if (onStatusChange) onStatusChange(status);
  };

  const startPingInterval = () => {
    clearInterval(pingTimer);
    pingTimer = setInterval(() => {
      if (isDestroyed) return;
      if (connection && connection.open) {
        try {
          connection.send({ action: 'ping', timestamp: Date.now() });
        } catch (_) {}
      }
    }, 4000);
  };

  const attemptConnection = () => {
    if (isDestroyed || !peer || peer.destroyed) return;
    if (connection && connection.open) return;

    // Clean up any stale connection handle
    if (connection) {
      try {
        connection.close();
      } catch (_) {}
      connection = null;
    }

    console.log(`[WebRTC Relay Client] Connecting to Host: ${targetHostId}...`);
    updateStatus('connecting');

    try {
      connection = peer.connect(targetHostId, {
        reliable: true,
      });

      connection.on('open', () => {
        console.log('[WebRTC Relay Client] Connected to Desktop Host via WebRTC!');
        isConnected = true;
        updateStatus('connected');
        clearTimeout(retryTimer);

        try {
          connection.send({ action: 'register_peer_id', peerId: peer.id });
          connection.send({ action: 'request_sync' });
        } catch (_) {}

        if (onConnect) onConnect();
        startPingInterval();
      });

      connection.on('data', (data) => {
        if (!data) return;
        if (!isConnected) {
          isConnected = true;
          updateStatus('connected');
          if (onConnect) onConnect();
        }
        if (onMessage) onMessage(data);
      });

      connection.on('close', () => {
        console.log('[WebRTC Relay Client] Connection closed.');
        isConnected = false;
        updateStatus('offline');
        if (onDisconnect) onDisconnect();

        if (!isDestroyed) {
          clearTimeout(retryTimer);
          retryTimer = setTimeout(attemptConnection, 2000);
        }
      });

      connection.on('error', (err) => {
        console.warn('[WebRTC Relay Client] Connection notice:', err);
      });
    } catch (e) {
      console.warn('[WebRTC Relay Client] Connect attempt error:', e);
      if (!isDestroyed) {
        clearTimeout(retryTimer);
        retryTimer = setTimeout(attemptConnection, 2500);
      }
    }
  };

  try {
    const PeerClass = getPeerConstructor();
    peer = new PeerClass(PEER_CONFIG);

    // Listen for incoming screen sharing MediaStream calls from Host
    peer.on('call', (mediaCall) => {
      console.log('[WebRTC Relay Client] Received incoming screen stream call from Host!');
      mediaCall.answer(); // Answers with no outgoing tracks (receive-only)

      mediaCall.on('stream', (remoteStream) => {
        console.log('[WebRTC Relay Client] Live screen MediaStream active!', remoteStream);
        if (onScreenStream) onScreenStream(remoteStream);
      });

      mediaCall.on('close', () => {
        console.log('[WebRTC Relay Client] Screen stream closed.');
        if (onScreenStream) onScreenStream(null);
      });

      mediaCall.on('error', (err) => {
        console.warn('[WebRTC Relay Client] Media call error:', err);
      });
    });

    peer.on('open', (myId) => {
      console.log(`[WebRTC Relay Client] Registered with client ID: ${myId}. Connecting to host: ${targetHostId}`);
      attemptConnection();
    });

    peer.on('disconnected', () => {
      console.log('[WebRTC Relay Client] Disconnected from broker, reconnecting...');
      if (!isDestroyed) {
        setTimeout(() => {
          try {
            if (peer && !peer.destroyed) peer.reconnect();
          } catch (_) {}
        }, 1500);
      }
    });

    peer.on('error', (err) => {
      console.warn('[WebRTC Relay Client] Peer notice:', err?.type || err?.message);
      if (err?.type === 'peer-unavailable' && !isDestroyed) {
        // Host desktop is not online yet; poll every 2 seconds
        updateStatus('waiting_for_host');
        clearTimeout(retryTimer);
        retryTimer = setTimeout(attemptConnection, 2000);
      } else if (err?.type === 'network' && !isDestroyed) {
        setTimeout(() => {
          try {
            peer?.reconnect();
          } catch (_) {}
        }, 1500);
      }
    });
  } catch (err) {
    console.warn('[WebRTC Relay Client] Peer creation failed:', err);
  }

  return {
    isConnected: () => isConnected && connection && connection.open,
    send: (actionObj) => {
      if (connection && connection.open) {
        try {
          connection.send(actionObj);
        } catch (e) {
          console.warn('[WebRTC Relay Client] Send error:', e);
        }
      }
    },
    reconnect: () => {
      console.log('[WebRTC Relay Client] Manual reconnect triggered...');
      clearTimeout(retryTimer);
      if (peer && peer.disconnected) {
        try {
          peer.reconnect();
        } catch (_) {}
      }
      attemptConnection();
    },
    destroy: () => {
      isDestroyed = true;
      clearInterval(pingTimer);
      clearTimeout(retryTimer);
      try {
        connection?.close();
        peer?.destroy();
      } catch (_) {}
    },
  };
}
