import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Wifi,
  WifiOff,
  User,
  MessageSquare,
  Trash2,
  Camera,
  FileText,
  Globe,
  Monitor,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { ChatConversation } from './ChatConversation';
import { subscribeToRoomChannel, broadcastToRoomChannel } from '../services/supabaseClient';
import { connectClientPeer } from '../services/peerRelayService';
import { createCloudRelay } from '../services/cloudRelayService';

export function CompanionView() {
  const [messages, setMessages] = useState([]);
  const [typedText, setTypedText] = useState('');
  const [screensBuffered, setScreensBuffered] = useState(0);
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connected' | 'connecting' | 'waiting_for_host' | 'offline'
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDesktopVisible, setIsDesktopVisible] = useState(true);

  // Live Screen Mirroring & Gesture State
  const [screenStream, setScreenStream] = useState(null);
  const [screenFrame, setScreenFrame] = useState(null);
  const [isScreenMirrorActive, setIsScreenMirrorActive] = useState(false);
  const [viewLayout, setViewLayout] = useState('split'); // 'split' | 'fullscreen' | 'prompter'
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [isInteracting, setIsInteracting] = useState(false);

  const socketRef = useRef(null);
  const realtimeChannelRef = useRef(null);
  const peerClientRef = useRef(null);
  const cloudRelayRef = useRef(null);
  const videoRef = useRef(null);
  const mirrorContainerRef = useRef(null);

  // Gesture tracking refs
  const zoomScaleRef = useRef(zoomScale);
  zoomScaleRef.current = zoomScale;
  const panOffsetRef = useRef(panOffset);
  panOffsetRef.current = panOffset;
  const initialPinchDist = useRef(0);
  const initialZoomScale = useRef(1);
  const initialMidpoint = useRef({ x: 0, y: 0 });
  const initialPan = useRef({ x: 0, y: 0 });
  const touchStartPos = useRef({ x: 0, y: 0 });
  const lastTapTime = useRef(0);
  const isMouseDownRef = useRef(false);
  const mouseStartPos = useRef({ x: 0, y: 0 });

  // Read optional room code from URL params (e.g. ?mode=companion&room=KTR-7821)
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('room') || '';

  const triggerReconnect = () => {
    setConnectionStatus('connecting');
    if (peerClientRef.current?.reconnect) {
      try { peerClientRef.current.reconnect(); } catch (_) {}
    }
  };

  // Bind video element when screen stream arrives
  useEffect(() => {
    if (videoRef.current && screenStream) {
      videoRef.current.srcObject = screenStream;
      videoRef.current.play().catch((err) => {
        console.warn('[Companion] Video autoplay notice:', err);
      });
    }
  }, [screenStream, isScreenMirrorActive, viewLayout]);

  // Touch Pinch-to-Zoom & Pan Gesture Listener (attached non-passively to prevent browser viewport zoom)
  useEffect(() => {
    const el = mirrorContainerRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialPinchDist.current = dist;
        initialZoomScale.current = zoomScaleRef.current;
        initialMidpoint.current = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
        initialPan.current = { ...panOffsetRef.current };
        setIsInteracting(true);
      } else if (e.touches.length === 1) {
        touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        initialPan.current = { ...panOffsetRef.current };

        // Double-tap to quickly toggle between 1x and 2.4x zoom
        const now = Date.now();
        if (now - lastTapTime.current < 320) {
          e.preventDefault();
          if (zoomScaleRef.current > 1.15) {
            setZoomScale(1);
            setPanOffset({ x: 0, y: 0 });
          } else {
            setZoomScale(2.4);
          }
        }
        lastTapTime.current = now;
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (initialPinchDist.current > 0) {
          const ratio = dist / initialPinchDist.current;
          const newScale = Math.min(Math.max(initialZoomScale.current * ratio, 1), 6);
          setZoomScale(newScale);

          // Pan along with two-finger pinch midpoint
          const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          const dx = midX - initialMidpoint.current.x;
          const dy = midY - initialMidpoint.current.y;
          setPanOffset({
            x: initialPan.current.x + dx,
            y: initialPan.current.y + dy,
          });
        }
      } else if (e.touches.length === 1 && zoomScaleRef.current > 1.05) {
        // 1-finger pan when zoomed
        e.preventDefault();
        const dx = e.touches[0].clientX - touchStartPos.current.x;
        const dy = e.touches[0].clientY - touchStartPos.current.y;
        setPanOffset({
          x: initialPan.current.x + dx,
          y: initialPan.current.y + dy,
        });
      }
    };

    const onTouchEnd = (e) => {
      if (e.touches.length < 2) {
        setIsInteracting(false);
        initialPinchDist.current = 0;
      }
      if (e.touches.length === 0 && zoomScaleRef.current < 1.05) {
        setZoomScale(1);
        setPanOffset({ x: 0, y: 0 });
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [isScreenMirrorActive]);

  const handleMouseDown = (e) => {
    if (zoomScale > 1.05) {
      isMouseDownRef.current = true;
      mouseStartPos.current = { x: e.clientX, y: e.clientY };
      initialPan.current = { ...panOffset };
    }
  };

  const handleMouseMove = (e) => {
    if (isMouseDownRef.current && zoomScale > 1.05) {
      const dx = e.clientX - mouseStartPos.current.x;
      const dy = e.clientY - mouseStartPos.current.y;
      setPanOffset({
        x: initialPan.current.x + dx,
        y: initialPan.current.y + dy,
      });
    }
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.88;
    setZoomScale((prev) => {
      const next = Math.min(Math.max(prev * factor, 1), 6);
      if (next <= 1.05) {
        setPanOffset({ x: 0, y: 0 });
        return 1;
      }
      return next;
    });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleResetTransform = () => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
    setRotation(0);
  };

  const handleToggleZoom = () => {
    if (zoomScale > 1.1) {
      setZoomScale(1);
      setPanOffset({ x: 0, y: 0 });
    } else {
      setZoomScale(2.2);
    }
  };

  useEffect(() => {
    // 1. Handle incoming message packet
    const handleIncomingData = (data) => {
      if (!data) return;
      setConnected(true);
      setConnectionStatus('connected');

      if (data.type === 'sync_messages' && Array.isArray(data.messages)) {
        setMessages(data.messages);
      } else if (data.type === 'screens_buffered') {
        setScreensBuffered(data.count || 0);
      } else if (data.type === 'window_visibility') {
        setIsDesktopVisible(data.isVisible);
      } else if (data.type === 'screen_sharing_status') {
        setIsScreenMirrorActive(!!data.isSharing);
        if (data.isSharing && viewLayout === 'prompter') {
          setViewLayout('split');
        }
      } else if (data.type === 'screen_frame' && data.image) {
        setScreenFrame(data.image);
        setIsScreenMirrorActive(true);
        if (viewLayout === 'prompter') {
          setViewLayout('split');
        }
      } else if (data.type === 'question_extracted') {
        setTypedText('');
        setScreensBuffered(0);
      } else if (data.type === 'question') {
        setIsGenerating(true);
      } else if (data.type === 'token') {
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          return prev.map((m) => {
            if (data.id ? m.id === data.id : m.role === 'keter' && m.isStreaming) {
              return { ...m, text: m.text + data.text };
            }
            return m;
          });
        });
      } else if (data.type === 'complete') {
        setIsGenerating(false);
        setMessages((prev) => prev.map((m) => ({ ...m, isStreaming: false })));
      } else if (data.type === 'clear') {
        setMessages([]);
        setIsGenerating(false);
      }
    };

    // 2. WebRTC Peer Relay (Works universally across 5G, 4G, and Wi-Fi networks worldwide)
    if (roomId) {
      console.log(`[Companion] Connecting via WebRTC Peer Relay to Room: ${roomId}`);
      setConnectionStatus('connecting');
      const client = connectClientPeer(roomId, {
        onConnect: () => {
          console.log('[Companion] WebRTC connected! Requesting sync...');
          setConnected(true);
          setConnectionStatus('connected');
          client?.send({ action: 'request_sync' });
        },
        onStatusChange: (status) => {
          setConnectionStatus(status);
          if (status === 'connected') setConnected(true);
          else if (status === 'offline') setConnected(false);
        },
        onMessage: (data) => {
          handleIncomingData(data);
        },
        onScreenStream: (stream) => {
          console.log('[Companion] Live screen MediaStream received from Host!', stream);
          setScreenStream(stream);
          setIsScreenMirrorActive(true);
          setViewLayout((prev) => (prev === 'prompter' ? 'split' : prev));
        },
        onDisconnect: () => {
          if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            setConnected(false);
            setConnectionStatus('offline');
          }
        },
      });
      peerClientRef.current = client;

      // Also subscribe to Supabase Realtime Channel if credentials exist
      const channel = subscribeToRoomChannel(roomId, (msg) => {
        handleIncomingData(msg);
      });
      realtimeChannelRef.current = channel;
      broadcastToRoomChannel(channel, { action: 'request_sync' });

      // Connect Universal Cross-Network Cloud Relay (Immediate 5G/4G connection)
      const relay = createCloudRelay({
        roomId,
        isHost: false,
        onMessage: (data) => {
          handleIncomingData(data);
        },
        onStatusChange: (status) => {
          if (status === 'connected') {
            setConnected(true);
            setConnectionStatus('connected');
          }
        },
      });
      cloudRelayRef.current = relay;
    }

    // 3. Multi-Transport WebSocket Connection (Cloud 5G/Cellular Tunnel + Local LAN)
    const ipFromUrl = urlParams.get('ip') || '';
    const tunnelFromUrl = urlParams.get('tunnel') || '';
    const cleanRoom = (roomId || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const candidateUrls = [];

    // Priority 1: Cloud 5G / LTE Tunnel passed via pairing QR URL
    if (tunnelFromUrl) {
      const wssUrl = tunnelFromUrl.replace(/^http:\/\//i, 'ws://').replace(/^https:\/\//i, 'wss://');
      candidateUrls.push(wssUrl);
    }

    // Priority 2: Predictable room tunnel domain
    if (cleanRoom) {
      candidateUrls.push(`wss://keter-${cleanRoom}.loca.lt`);
    }

    // Priority 3: Local Wi-Fi direct LAN (instant if on the same Wi-Fi)
    if (ipFromUrl && ipFromUrl !== 'localhost' && ipFromUrl !== '127.0.0.1') {
      candidateUrls.push(`ws://${ipFromUrl}:5188`);
    }

    // Priority 4: Localhost / dev hostname
    if (window.location.hostname && !window.location.hostname.includes('vercel.app') && window.location.hostname !== 'localhost') {
      candidateUrls.push(`ws://${window.location.hostname}:5188`);
    }

    console.log('[Companion] WebSocket candidates:', candidateUrls);

    let hasWinningWs = false;
    const openedSockets = [];

    candidateUrls.forEach((endpoint) => {
      try {
        const socket = new WebSocket(endpoint);
        openedSockets.push(socket);

        socket.onopen = () => {
          if (hasWinningWs && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            try { socket.close(); } catch (_) {}
            return;
          }
          hasWinningWs = true;
          socketRef.current = socket;
          setConnected(true);
          setConnectionStatus('connected');
          console.log(`[Companion] Connected to Host via: ${endpoint}`);
          try {
            socket.send(JSON.stringify({ action: 'request_sync' }));
          } catch (_) {}
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleIncomingData(data);
          } catch (e) {
            console.error('[Companion] JSON parse error:', e);
          }
        };

        socket.onclose = () => {
          if (socketRef.current === socket) {
            socketRef.current = null;
            hasWinningWs = false;
            if (!peerClientRef.current && !cloudRelayRef.current && !roomId) {
              setConnected(false);
              setConnectionStatus('offline');
            }
          }
        };

        socket.onerror = () => {
          // Silently caught
        };
      } catch (wsErr) {
        // Silently ignore
      }
    });

    return () => {
      cloudRelayRef.current?.destroy();
      cloudRelayRef.current = null;
      peerClientRef.current?.destroy();
      peerClientRef.current = null;
      openedSockets.forEach((s) => {
        try { s.close(); } catch (_) {}
      });
      socketRef.current = null;
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.unsubscribe();
      }
    };
  }, [roomId]);

  // Dispatch action across Cloud Relay, WebRTC DataChannel, Local WebSocket, & Realtime Channel
  const dispatchAction = (actionObj) => {
    if (cloudRelayRef.current) {
      cloudRelayRef.current.send(actionObj);
    }
    if (peerClientRef.current) {
      peerClientRef.current.send(actionObj);
    }
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(actionObj));
    }
    if (realtimeChannelRef.current) {
      broadcastToRoomChannel(realtimeChannelRef.current, actionObj);
    }
  };

  useEffect(() => {
    document.body.classList.add('companion-mode');
    return () => {
      document.body.classList.remove('companion-mode');
    };
  }, []);

  // Send candidate response from phone (+ You)
  const handleLogUserResponse = (e) => {
    e?.preventDefault();
    if (!typedText.trim()) return;
    dispatchAction({ action: 'log_user_response', text: typedText.trim() });
    setTypedText('');
  };

  // Ask Keter question from phone
  const handleAskKeter = (e) => {
    e?.preventDefault();
    if (typedText.trim()) {
      dispatchAction({ action: 'ask_keter', text: typedText.trim() });
      setTypedText('');
    } else {
      const lastQ = [...messages].reverse().find((m) => m.role === 'interviewer' || m.role === 'screen');
      if (lastQ && lastQ.text) {
        dispatchAction({ action: 'ask_keter', text: lastQ.text });
      }
    }
  };

  const handleClearHistory = () => {
    dispatchAction({ action: 'clear_history' });
    setMessages([]);
  };

  // Trigger One-Touch Screen Auto-Read from mobile
  const handleReadScreen = () => {
    dispatchAction({ action: 'read_screen' });
  };

  const handleGetQuestion = () => {
    dispatchAction({ action: 'get_question' });
  };

  const handleClearScreens = () => {
    dispatchAction({ action: 'clear_screens' });
    setScreensBuffered(0);
  };

  const handleToggleDesktopVisibility = () => {
    dispatchAction({ action: 'toggle_window_visibility' });
  };

  const handleToggleScreenShare = () => {
    if (!isScreenMirrorActive) {
      setIsScreenMirrorActive(true);
      if (viewLayout === 'prompter') setViewLayout('split');
      dispatchAction({ action: 'start_screen_share' });
    } else {
      setIsScreenMirrorActive(false);
      dispatchAction({ action: 'stop_screen_share' });
    }
  };

  return (
    <div
      style={{
        height: '100dvh',
        maxHeight: '100dvh',
        width: '100vw',
        background: '#090b10',
        color: '#f8fafc',
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Mobile Sticky Top Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'calc(10px + env(safe-area-inset-top, 0px)) 12px 10px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: '#0c101c',
          zIndex: 50,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="#00f2fe" />
          <h1 style={{ fontSize: '13.5px', fontWeight: 800, letterSpacing: '0.04em', margin: 0 }}>KETER HUD</h1>
          {roomId && (
            <span
              style={{
                fontSize: '9.5px',
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '2px 5px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <Globe size={9} /> {roomId}
            </span>
          )}
        </div>

        {/* View & Screen Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Screen Share / Mirror Toggle */}
          <button
            type="button"
            onClick={handleToggleScreenShare}
            style={{
              fontSize: '11px',
              padding: '4px 8px',
              borderRadius: '7px',
              border: isScreenMirrorActive ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.18)',
              background: isScreenMirrorActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.06)',
              color: isScreenMirrorActive ? '#38bdf8' : '#cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 700,
            }}
            title="Stream PC screen to phone (P2P zero server lag)"
          >
            <Monitor size={12} />
            <span>{isScreenMirrorActive ? 'Mirror ON' : 'Mirror'}</span>
          </button>

          {/* Remote PC Ghost Invisibility Toggle */}
          <button
            type="button"
            onClick={handleToggleDesktopVisibility}
            title={isDesktopVisible ? 'Hide PC Window completely (Stealth Ghost Mode)' : 'Show PC Window'}
            style={{
              fontSize: '11px',
              padding: '4px 8px',
              borderRadius: '7px',
              border: isDesktopVisible ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(52,211,153,0.5)',
              background: isDesktopVisible ? 'rgba(255,255,255,0.06)' : 'rgba(52,211,153,0.15)',
              color: isDesktopVisible ? '#94a3b8' : '#34d399',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600,
            }}
          >
            <span>{isDesktopVisible ? '👻 Ghost' : '👁️ Show'}</span>
          </button>

          {/* Interactive Connection Status Badge */}
          <button
            type="button"
            onClick={triggerReconnect}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10.5px',
              color: connected
                ? '#34d399'
                : connectionStatus === 'waiting_for_host' || connectionStatus === 'connecting'
                ? '#fbbf24'
                : '#f87171',
              padding: '3px 7px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: connected
                ? 'rgba(52,211,153,0.12)'
                : connectionStatus === 'waiting_for_host' || connectionStatus === 'connecting'
                ? 'rgba(251,191,36,0.12)'
                : 'rgba(239,68,68,0.12)',
              cursor: 'pointer',
              fontWeight: 700,
            }}
            title={connected ? 'Live P2P link active. Tap to refresh.' : 'Disconnected. Tap to retry connection.'}
          >
            {connected ? (
              <Wifi size={11} />
            ) : connectionStatus === 'waiting_for_host' || connectionStatus === 'connecting' ? (
              <RefreshCw size={11} style={{ animation: 'spin 2s linear infinite' }} />
            ) : (
              <WifiOff size={11} />
            )}
            <span>
              {connected
                ? 'Live'
                : connectionStatus === 'waiting_for_host'
                ? 'Wait PC'
                : connectionStatus === 'connecting'
                ? 'Linking'
                : 'Off (Tap)'}
            </span>
          </button>
        </div>
      </header>

      {/* 2. Live PC Screen Mirror Section (Hardware P2P Streaming with 2-finger zoom, pan, & rotate) */}
      {isScreenMirrorActive && (
        <div
          ref={mirrorContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{
            height: viewLayout === 'fullscreen' ? '100%' : '42%',
            minHeight: '150px',
            backgroundColor: '#000000',
            borderBottom: viewLayout === 'fullscreen' ? 'none' : '1px solid rgba(56, 189, 248, 0.35)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
            touchAction: 'none',
            cursor: zoomScale > 1.05 ? (isMouseDownRef.current ? 'grabbing' : 'grab') : 'default',
          }}
        >
          {/* Zoomable, Pannable, and Rotatable Screen Content Wrapper */}
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) rotate(${rotation}deg) scale(${zoomScale})`,
              transformOrigin: 'center center',
              transition: isInteracting || isMouseDownRef.current ? 'none' : 'transform 0.15s ease-out',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            {screenFrame ? (
              <img
                src={screenFrame}
                alt="Live PC Screen"
                draggable={false}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  backgroundColor: '#000',
                  pointerEvents: 'none',
                }}
              />
            ) : screenStream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  backgroundColor: '#000',
                  pointerEvents: 'none',
                }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
                <Monitor size={30} color="#38bdf8" />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Connecting to PC Screen Mirror...</span>
                <span style={{ fontSize: '10.5px', color: '#64748b' }}>(Universal 5G / Cloud Direct Stream)</span>
              </div>
            )}
          </div>

          {/* Live Status Badge */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 10,
            }}
          >
            {screenFrame || screenStream ? (
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  color: '#ffffff',
                  backgroundColor: '#10b981',
                  padding: '2px 7px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ffffff' }} />
                LIVE MIRROR
              </span>
            ) : (
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  color: '#ffffff',
                  backgroundColor: '#f59e0b',
                  padding: '2px 7px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
                }}
              >
                <RefreshCw size={10} style={{ animation: 'spin 2s linear infinite' }} />
                CONNECTING...
              </span>
            )}
          </div>

          {/* Floating Pan & Zoom Hint when zoomed */}
          {zoomScale > 1.05 && (
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '12px',
                padding: '3px 10px',
                fontSize: '10px',
                color: '#93c5fd',
                pointerEvents: 'none',
                zIndex: 10,
                whiteSpace: 'nowrap',
                fontWeight: 600,
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
              }}
            >
              ✋ 1-Finger Drag to Pan • 2-Finger Pinch to Zoom
            </div>
          )}

          {/* Quick Screen Overlay Tools (Rotate, Zoom, Reset, Fullscreen, Close) */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 10,
            }}
          >
            {/* Screen Rotate Button */}
            <button
              type="button"
              onClick={handleRotate}
              title={`Rotate Screen 90° (Current: ${rotation}°)`}
              style={{
                background: rotation > 0 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.85)',
                border: rotation > 0 ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.25)',
                color: rotation > 0 ? '#38bdf8' : '#ffffff',
                borderRadius: '6px',
                padding: '4px 7px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontWeight: 700,
              }}
            >
              <RotateCw size={13} />
              {rotation > 0 && <span style={{ fontSize: '9.5px' }}>{rotation}°</span>}
            </button>

            {/* Zoom In/Out Toggle with scale indicator */}
            <button
              type="button"
              onClick={handleToggleZoom}
              title={zoomScale > 1.05 ? 'Reset Zoom (1x)' : 'Zoom in (2.2x)'}
              style={{
                background: zoomScale > 1.05 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.85)',
                border: zoomScale > 1.05 ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.25)',
                color: zoomScale > 1.05 ? '#38bdf8' : '#ffffff',
                borderRadius: '6px',
                padding: '4px 7px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontWeight: 700,
              }}
            >
              {zoomScale > 1.05 ? <ZoomOut size={13} /> : <ZoomIn size={13} />}
              {zoomScale > 1.05 && <span style={{ fontSize: '9.5px' }}>{zoomScale.toFixed(1)}x</span>}
            </button>

            {/* Quick Reset Button (Visible when manipulated) */}
            {(zoomScale > 1.05 || panOffset.x !== 0 || panOffset.y !== 0 || rotation !== 0) && (
              <button
                type="button"
                onClick={handleResetTransform}
                title="Reset Zoom, Position, and Rotation"
                style={{
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: '#fca5a5',
                  borderRadius: '6px',
                  padding: '4px 7px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                Reset
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setViewLayout(viewLayout === 'fullscreen' ? 'split' : 'fullscreen')}
              title={viewLayout === 'fullscreen' ? 'Split View (Screen + Prompter)' : 'Full Screen View'}
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                borderRadius: '6px',
                padding: '4px 7px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {viewLayout === 'fullscreen' ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>

            {/* Close Screen Share */}
            <button
              type="button"
              onClick={() => {
                setIsScreenMirrorActive(false);
                dispatchAction({ action: 'stop_screen_share' });
              }}
              title="Close Screen Mirror"
              style={{
                background: 'rgba(239, 68, 68, 0.25)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#f87171',
                borderRadius: '6px',
                padding: '4px 7px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* 3. Synchronized 3-Way Conversation Thread (Interviewer, You, Keter) */}
      {viewLayout !== 'fullscreen' && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <ChatConversation
            messages={messages}
            onClearHistory={handleClearHistory}
            onReaskQuestion={(text) => {
              dispatchAction({ action: 'ask_keter', text });
            }}
            onUpdateMessage={(id, newText) => {
              setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text: newText } : m)));
              dispatchAction({ action: 'update_message', id, text: newText });
            }}
            isGenerating={isGenerating}
          />
        </div>
      )}

      {/* Floating Screen Capture & Question Solver FAB (Bottom-Right) */}
      <div
        style={{
          position: 'fixed',
          bottom: 'max(98px, calc(92px + env(safe-area-inset-bottom, 28px)))',
          right: '14px',
          zIndex: 110,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px',
          pointerEvents: 'auto',
        }}
      >
        {screensBuffered > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={handleClearScreens}
              title="Discard captured image slices"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(239, 68, 68, 0.25)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#f87171',
                borderRadius: '9999px',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: 600,
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Trash2 size={13} />
              <span>Discard</span>
            </button>

            <button
              type="button"
              onClick={handleGetQuestion}
              title="Extract full question from captured screens"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '9999px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 700,
                boxShadow: '0 4px 18px rgba(236, 72, 153, 0.55)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <FileText size={14} />
              <span>Get Question ({screensBuffered})</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleReadScreen}
          title="Capture screen slice on PC (Tap multiple times to buffer slices)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: screensBuffered > 0 ? 'rgba(236, 72, 153, 0.95)' : 'rgba(20, 26, 40, 0.95)',
            border: screensBuffered > 0 ? '1px solid #f472b6' : '1px solid rgba(236, 72, 153, 0.45)',
            color: screensBuffered > 0 ? '#ffffff' : '#f472b6',
            borderRadius: '9999px',
            padding: '9px 14px',
            fontSize: '12px',
            fontWeight: 600,
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.6), 0 0 10px rgba(236, 72, 153, 0.25)',
            backdropFilter: 'blur(10px)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Camera size={15} />
          <span>{screensBuffered > 0 ? `+ Snap More (${screensBuffered})` : '📸 Screen'}</span>
        </button>
      </div>

      {/* Mobile Bottom Action Bar (Spacious input field, + You, and Ask) */}
      <footer
        style={{
          flexShrink: 0,
          background: 'rgba(9, 11, 16, 0.98)',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '10px 12px max(28px, calc(16px + env(safe-area-inset-bottom, 28px))) 12px',
          backdropFilter: 'blur(16px)',
          zIndex: 100,
          boxSizing: 'border-box',
        }}
      >
        <form onSubmit={handleAskKeter} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', width: '100%' }}>
          <textarea
            className="form-input"
            style={{
              flex: 1,
              fontSize: '13.5px',
              padding: '11px 12px',
              background: 'rgba(20, 26, 40, 0.9)',
              borderRadius: '9px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              resize: 'none',
              minHeight: '44px',
              maxHeight: '120px',
              lineHeight: 1.4,
              boxSizing: 'border-box',
            }}
            rows={typedText.includes('\n') ? Math.min(4, typedText.split('\n').length) : 1}
            placeholder="Type candidate response or question..."
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
          />
          <button
            type="button"
            onClick={handleLogUserResponse}
            className="icon-btn"
            title="Log what You (Candidate) answered"
            style={{
              padding: '0 12px',
              fontSize: '12px',
              gap: '4px',
              border: '1px solid rgba(52, 211, 153, 0.4)',
              color: '#34d399',
              whiteSpace: 'nowrap',
              borderRadius: '9px',
              background: 'rgba(52, 211, 153, 0.08)',
              cursor: 'pointer',
              height: '44px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              boxSizing: 'border-box',
            }}
          >
            <User size={14} />
            <span>+ You</span>
          </button>
          <button
            type="submit"
            className="icon-btn active"
            title="Send question to Keter"
            style={{
              padding: '0 14px',
              fontSize: '12px',
              gap: '4px',
              background: 'var(--accent-gradient)',
              color: '#090d16',
              border: 'none',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              borderRadius: '9px',
              cursor: 'pointer',
              height: '44px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              boxSizing: 'border-box',
            }}
          >
            <Sparkles size={14} />
            <span>Ask</span>
          </button>
        </form>
      </footer>
    </div>
  );
}
