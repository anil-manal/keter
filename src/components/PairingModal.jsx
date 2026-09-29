import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Wifi,
  Globe,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import {
  getOrCreateRoomId,
  regenerateRoomId,
  getPairingUrl,
  generateQrDataUrl,
} from '../services/pairingService';

export function PairingModal({ isOpen, onClose, localIp, tunnelUrl, isCompanionConnected = false }) {
  if (!isOpen) return null;

  const [roomId, setRoomId] = useState(() => getOrCreateRoomId());
  const [isCloudMode, setIsCloudMode] = useState(true);
  const [activeIp, setActiveIp] = useState(localIp || 'localhost');
  const [activeTunnelUrl, setActiveTunnelUrl] = useState(tunnelUrl || '');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGeneratingQr, setIsGeneratingQr] = useState(true);

  // Ensure active IP is resolved from Electron if not passed yet
  useEffect(() => {
    if (localIp && localIp !== 'localhost') {
      setActiveIp(localIp);
    } else if (window.electronAPI?.getLocalIp) {
      window.electronAPI.getLocalIp().then((ip) => {
        if (ip) setActiveIp(ip);
      }).catch(() => {});
    }
  }, [localIp]);

  // Synchronize 5G / Cloud Tunnel URL
  useEffect(() => {
    if (tunnelUrl) {
      setActiveTunnelUrl(tunnelUrl);
    } else if (window.electronAPI?.getTunnelUrl) {
      window.electronAPI.getTunnelUrl().then((url) => {
        if (url) setActiveTunnelUrl(url);
      }).catch(() => {});
    }

    if (window.electronAPI?.onTunnelUrl) {
      const unsub = window.electronAPI.onTunnelUrl((url) => {
        if (url) setActiveTunnelUrl(url);
      });
      return () => unsub();
    }
  }, [tunnelUrl]);

  // Trigger or refresh tunnel when room code changes
  useEffect(() => {
    if (roomId && window.electronAPI?.startTunnelForRoom) {
      window.electronAPI.startTunnelForRoom(roomId).then((url) => {
        if (url) setActiveTunnelUrl(url);
      }).catch(() => {});
    }
  }, [roomId]);

  const pairingUrl = getPairingUrl({
    roomId,
    localIp: activeIp,
    isCloud: isCloudMode,
    tunnelUrl: activeTunnelUrl,
  });

  useEffect(() => {
    let active = true;
    setIsGeneratingQr(true);
    generateQrDataUrl(pairingUrl).then((url) => {
      if (active) {
        setQrDataUrl(url);
        setIsGeneratingQr(false);
      }
    });
    return () => { active = false; };
  }, [pairingUrl]);

  const handleRegenerate = () => {
    const newRoom = regenerateRoomId();
    setRoomId(newRoom);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(pairingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(5, 7, 13, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '12px',
    }}>
      <div className="modal-card" style={{
        backgroundColor: '#0d111c',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.1)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '460px',
        maxHeight: 'min(92vh, 580px)',
        color: '#f1f5f9',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
            }}>
              <Smartphone size={16} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '0.02em', color: '#f8fafc' }}>
                Air-Gapped Mobile HUD
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Scan to turn any phone into an invisible teleprompter
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', overflowY: 'auto', flex: 1 }}>
          {/* Network Mode Switcher */}
          <div style={{
            display: 'flex',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            width: '100%',
            flexShrink: 0,
          }}>
            <button
              onClick={() => setIsCloudMode(true)}
              style={{
                flex: 1,
                padding: '7px 10px',
                fontSize: '11px',
                fontWeight: '600',
                borderRadius: '7px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                backgroundColor: isCloudMode ? '#0284c7' : 'transparent',
                color: isCloudMode ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              <Globe size={13} />
              Cloud / 5G Mode
            </button>
            <button
              onClick={() => setIsCloudMode(false)}
              style={{
                flex: 1,
                padding: '7px 10px',
                fontSize: '11px',
                fontWeight: '600',
                borderRadius: '7px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                backgroundColor: !isCloudMode ? '#0284c7' : 'transparent',
                color: !isCloudMode ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              <Wifi size={13} />
              Local Wi-Fi Mode
            </button>
          </div>

          {/* QR Code Container (High-contrast pure white card for instant optical camera lock) */}
          <div style={{
            position: 'relative',
            padding: '10px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '175px',
            height: '175px',
            flexShrink: 0,
          }}>
            {isGeneratingQr ? (
              <div style={{ color: '#0f172a', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={15} className="animate-spin" /> Generating...
              </div>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Scan to pair mobile companion"
                style={{ width: '155px', height: '155px', borderRadius: '4px', display: 'block' }}
              />
            ) : (
              <div style={{ color: '#ef4444', fontSize: '12px' }}>Failed to generate QR</div>
            )}
          </div>

          {/* Room PIN Code Card */}
          <div style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '8px 14px',
            borderRadius: '10px',
            flexShrink: 0,
          }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                Pairing Room Code
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '0.08em', color: '#38bdf8' }}>
                {roomId}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleRegenerate}
                title="Generate new room code"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                }}
              >
                <RefreshCw size={12} /> New
              </button>
              <button
                onClick={handleCopy}
                style={{
                  background: copied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                  border: copied ? '1px solid #22c55e' : '1px solid rgba(56, 189, 248, 0.4)',
                  color: copied ? '#22c55e' : '#38bdf8',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy URL'}
              </button>
            </div>
          </div>

          {/* Target URL Preview */}
          <div style={{
            fontSize: '11px',
            color: '#94a3b8',
            wordBreak: 'break-all',
            textAlign: 'center',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '6px 12px',
            borderRadius: '6px',
            width: '100%',
            fontFamily: 'monospace',
          }}>
            {pairingUrl}
          </div>

          {/* Connection Status Live Pill */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '12px',
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: isCompanionConnected ? 'rgba(34, 197, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              border: isCompanionConnected ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
              color: isCompanionConnected ? '#4ade80' : '#fbbf24',
            }}>
              <Radio size={12} className={isCompanionConnected ? '' : 'animate-pulse'} />
              {isCompanionConnected ? '🟢 Mobile HUD Active & Synced' : '🟡 Waiting for Phone Scan...'}
            </div>

            {isCloudMode && (
              <div style={{
                fontSize: '11px',
                color: activeTunnelUrl ? '#38bdf8' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}>
                <Globe size={11} />
                {activeTunnelUrl ? '5G / Cross-Network Direct Tunnel: Online' : 'Starting 5G / Cellular Cloud Relay...'}
              </div>
            )}
          </div>

          {/* Stealth & Screen Mirror Note */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '11px',
            color: '#94a3b8',
            lineHeight: '1.4',
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            padding: '8px 12px',
            borderRadius: '8px',
            width: '100%',
          }}>
            <ShieldCheck size={16} style={{ color: '#38bdf8', flexShrink: 0, marginTop: '1px' }} />
            <div>
              <strong style={{ color: '#f8fafc' }}>Live Screen Mirroring + AI Prompter:</strong> Stream your PC screen live to your smartphone mounted under your webcam. Maintain 100% natural eye contact with zero latency and zero cloud servers (100% private P2P).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
