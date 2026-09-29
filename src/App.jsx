import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sliders,
  Sparkles,
  Shield,
  ShieldAlert,
  AlertOctagon,
  Minus,
  X,
  Volume2,
  MousePointer,
  RotateCcw,
  Send,
  Eye,
  Minimize2,
  Maximize2,
  User,
  Camera,
  FileText,
  Trash2,
  Smartphone,
  Globe,
  Monitor,
} from 'lucide-react';
import { LandingPage } from './components/LandingPage';
import { AudioVisualizer } from './components/AudioVisualizer';
import { ChatConversation } from './components/ChatConversation';
import { SettingsModal } from './components/SettingsModal';
import { CompanionView } from './components/CompanionView';
import { PairingModal } from './components/PairingModal';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { OnboardingTour } from './components/OnboardingTour';
import { AuthGate } from './components/AuthGate';
import { ProjectSwitcher } from './components/ProjectSwitcher';
import { ProjectConfigModal } from './components/ProjectConfigModal';
import { getOrCreateRoomId } from './services/pairingService';
import { initHostPeer } from './services/peerRelayService';
import { createCloudRelay } from './services/cloudRelayService';
import { subscribeToRoomChannel, broadcastToRoomChannel, getActiveUser, getUserProfile } from './services/supabaseClient';
import { audioCaptureManager } from './services/audioCapture';
import { STTService } from './services/sttService';
import { streamLLMResponse, streamVisionResponse, reconstructQuestionFromScreens } from './services/llmService';
import { getEffectiveApiKey } from './services/apiKeysConfig';
import { PROMPT_MODES } from './utils/promptTemplates';
import {
  getStoredProjects,
  getActiveProjectId,
  setActiveProjectId,
  createProject,
  updateProject,
  deleteProject,
  isProjectExpired,
  activateProject,
  buyProjectPass,
  PROJECT_COST_INR,
} from './services/projectService';
import { RazorpayModal } from './components/RazorpayModal';

function KeterHUD({ onOpenLanding }) {

  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('keter_config');
      const parsed = saved ? JSON.parse(saved) : {};
      return {
        llmProvider: 'groq',
        sttEngine: 'groq',
        promptMode: PROMPT_MODES.TECHNICAL,
        opacity: 0.95,
        resumeContext: '',
        jobDescription: '',
        apiKeys: {},
        ...parsed,
        // Shield is enabled by default on initial launch unless explicitly saved otherwise
        screenProtection: parsed.screenProtection !== undefined ? parsed.screenProtection : true,
      };
    } catch (e) {
      return {
        llmProvider: 'groq',
        sttEngine: 'groq',
        promptMode: PROMPT_MODES.TECHNICAL,
        opacity: 0.95,
        screenProtection: true,
        resumeContext: '',
        jobDescription: '',
        apiKeys: {},
      };
    }
  });

  const [isListening, setIsListening] = useState(false);
  const [isSystemAudioActive, setIsSystemAudioActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Project-based conversation & session state (each project has its own Mode, JD, Resume, & Chat History)
  const [projects, setProjects] = useState(() => getStoredProjects());
  const [activeProjectId, setActiveProjectIdState] = useState(() => getActiveProjectId());
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || null;

  // Persistent multi-turn conversation maintaining Interviewer, You, and Keter for active project
  const [messages, setMessages] = useState(() => {
    return activeProject?.messages || [];
  });

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState('edit');
  const [editingProject, setEditingProject] = useState(null);

  const [interimSpeech, setInterimSpeech] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [typedQuestion, setTypedQuestion] = useState('');
  const [capturedScreens, setCapturedScreens] = useState([]);
  const [isExtractingQuestion, setIsExtractingQuestion] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [clickThrough, setClickThrough] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sttStatusMessage, setSttStatusMessage] = useState('');
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [localIp, setLocalIp] = useState('localhost');
  const [roomId] = useState(() => getOrCreateRoomId());
  const [tunnelUrl, setTunnelUrl] = useState('');
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(() => {
    try {
      return localStorage.getItem('keter_tour_completed') !== 'true';
    } catch (_) {
      return false;
    }
  });
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const cached = localStorage.getItem('keter_user_profile');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (
          parsed.email &&
          (parsed.email.includes('candidate@keter.ai') ||
            parsed.email.includes('dummy') ||
            parsed.email.includes('test.verification') ||
            parsed.email.includes('example.com'))
        ) {
          localStorage.removeItem('keter_user_profile');
          return null;
        }
        if (parsed.email && parsed.email.includes('@')) {
          return parsed;
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  });
  const [isCompanionConnected, setIsCompanionConnected] = useState(false);
  const cloudChannelRef = useRef(null);
  const cloudRelayRef = useRef(null);
  const peerHostRef = useRef(null);

  // Check Supabase Auth state on load & listen for Google auth callback
  useEffect(() => {
    let active = true;
    (async () => {
      const activeUser = await getActiveUser();
      if (active && activeUser) {
        const prof = await getUserProfile(activeUser);
        if (active && prof) setUserProfile(prof);
      }
    })();

    if (window.electronAPI?.onGoogleAuthSuccess) {
      const unsub = window.electronAPI.onGoogleAuthSuccess((data) => {
        if (data?.email) {
          const cleanEmail = data.email.trim();
          const authProfile = {
            id: 'usr_' + Date.now(),
            email: cleanEmail,
            plan: 'free_trial',
            plan_status: 'active',
            free_credits_left: 10,
            expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            is_pro: false,
            provider: 'google',
          };
          localStorage.setItem('keter_user_profile', JSON.stringify(authProfile));
          setUserProfile(authProfile);
        }
      });
      return () => {
        active = false;
        if (typeof unsub === 'function') unsub();
      };
    }

    return () => { active = false; };
  }, []);

  // Sync messages into the active project and broadcast to companion HUD
  useEffect(() => {
    if (activeProject) {
      updateProject(activeProject.id, { messages });
      try {
        localStorage.setItem('keter_conversation_history', JSON.stringify(messages.slice(-50)));
      } catch (_) {}
    }
    if (window.electronAPI?.sendCompanionBroadcast) {
      window.electronAPI.sendCompanionBroadcast({ type: 'sync_messages', messages });
    }
  }, [messages, activeProject?.id]);

  // Project Management Handlers
  const handleSelectProject = (projOrId) => {
    if (!projOrId) return;
    const targetId = typeof projOrId === 'string' ? projOrId : projOrId?.id;
    if (!targetId) return;

    // Flush current messages to current project before switching
    if (activeProject?.id && activeProject.id !== targetId) {
      updateProject(activeProject.id, { messages });
    }

    const allProjects = getStoredProjects();
    const found = allProjects.find(p => p.id === targetId) || (typeof projOrId === 'object' ? projOrId : null);
    if (!found) return;

    setActiveProjectId(targetId);
    setActiveProjectIdState(targetId);
    setProjects(allProjects);
    setMessages(found.messages || []);
    if (found.promptMode) {
      setConfig(prev => ({ ...prev, promptMode: found.promptMode }));
    }
    if (window.electronAPI?.sendCompanionBroadcast) {
      window.electronAPI.sendCompanionBroadcast({ type: 'sync_messages', messages: found.messages || [] });
    }
    setSttStatusMessage(`Switched to "${found.title}"`);
  };

  const handleOpenCreateProject = () => {
    setProjectModalMode('create');
    setEditingProject(null);
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (proj) => {
    setProjectModalMode('edit');
    setEditingProject(proj || activeProject);
    setIsProjectModalOpen(true);
  };

  const handleActivateProject = (id) => {
    const res = activateProject(id);
    if (res.success && res.project) {
      const updated = getStoredProjects();
      setProjects(updated);
      if (activeProject?.id === id) {
        setActiveProjectIdState(res.project.id);
      }
      setSttStatusMessage(`🚀 Interview session "${res.project.title}" activated! 24-hour countdown started.`);
    }
  };

  const handleBuyProjectSuccess = ({ title, targetRole, paymentId }) => {
    const res = buyProjectPass({
      title,
      targetRole,
      promptMode: config.promptMode || 'technical',
      jobDescription: activeProject?.jobDescription || '',
      resumeContext: activeProject?.resumeContext || '',
      paymentId,
    });
    if (res.success && res.project) {
      const updated = getStoredProjects();
      setProjects(updated);
      setActiveProjectId(res.project.id);
      setActiveProjectIdState(res.project.id);
      setMessages([]);
      setSttStatusMessage(`🎉 Payment of ₹${PROJECT_COST_INR} via Razorpay confirmed! Session "${res.project.title}" ready to configure & activate.`);
    }
  };

  const handleSaveProject = (data) => {
    if (projectModalMode === 'create') {
      const res = createProject(data, !!userProfile?.is_pro);
      if (!res.success) {
        if (res.error === 'PAYMENT_REQUIRED' || res.error === 'FREE_LIMIT_REACHED') {
          setIsProjectModalOpen(false);
          setIsRazorpayModalOpen(true);
        } else {
          alert(res.message);
        }
        return;
      }
      const updated = getStoredProjects();
      setProjects(updated);
      setActiveProjectId(res.project.id);
      setActiveProjectIdState(res.project.id);
      setMessages([]);
      if (res.project.promptMode) {
        setConfig(prev => ({ ...prev, promptMode: res.project.promptMode }));
      }
    } else if (editingProject) {
      updateProject(editingProject.id, data);
      const updated = getStoredProjects();
      setProjects(updated);
      if (editingProject.id === activeProject?.id && data.promptMode) {
        setConfig(prev => ({ ...prev, promptMode: data.promptMode }));
      }
    }
  };

  const handleDeleteProject = (id) => {
    const updated = deleteProject(id);
    setProjects(updated);
    const newActive = updated[0];
    if (newActive) {
      setActiveProjectId(newActive.id);
      setActiveProjectIdState(newActive.id);
      setMessages(newActive.messages || []);
      if (newActive.promptMode) {
        setConfig(prev => ({ ...prev, promptMode: newActive.promptMode }));
      }
    }
  };

  const toggleMiniMode = () => {
    const next = !isMiniMode;
    setIsMiniMode(next);
    if (window.electronAPI?.setWindowSize) {
      if (next) {
        window.electronAPI.setWindowSize(760, 210);
      } else {
        window.electronAPI.setWindowSize(960, 580);
      }
    }
  };

  const sttServiceRef = useRef(null);
  const abortControllerRef = useRef(null);
  const visualizerIntervalRef = useRef(null);
  const handleReadScreenRef = useRef(null);
  const handleExtractQuestionRef = useRef(null);
  const handleClearCapturedScreensRef = useRef(null);
  const handleToggleListeningRef = useRef(null);

  // Synchronize window opacity to native Electron window
  useEffect(() => {
    if (window.electronAPI?.setWindowOpacity) {
      window.electronAPI.setWindowOpacity(config.opacity || 0.95);
    }
  }, [config.opacity]);

  // Initialize Electron listeners & Local IP
  useEffect(() => {
    if (window.electronAPI) {
      if (window.electronAPI.getLocalIp) {
        window.electronAPI.getLocalIp().then(ip => setLocalIp(ip)).catch(() => {});
      }

      const unsubPanic = window.electronAPI.onPanicTrigger ? window.electronAPI.onPanicTrigger(() => {
        handlePanicTrigger();
      }) : () => {};

      const unsubHotkeys = window.electronAPI.onHotkeyTrigger((action) => {
        if (action === 'toggle-clickthrough') {
          toggleClickThrough();
        } else if (action === 'read-screen') {
          if (handleReadScreenRef.current) handleReadScreenRef.current();
        } else if (action === 'trigger-generate') {
          if (currentQuestion) generateAnswer(currentQuestion, 'interviewer');
        } else if (action === 'clear-chat') {
          setMessages([]);
          setCurrentQuestion('');
          setCapturedScreens([]);
        } else if (action === 'toggle-listening') {
          if (handleToggleListeningRef.current) handleToggleListeningRef.current();
        } else if (typeof action === 'string' && action.startsWith('opacity:')) {
          const val = parseFloat(action.split(':')[1]);
          if (!isNaN(val)) {
            setConfig(prev => ({ ...prev, opacity: val }));
          }
        }
      });

      return () => {
        unsubPanic();
        unsubHotkeys();
      };
    }
  }, [currentQuestion, clickThrough]);

  // Synchronize screen protection setting with Electron main process reliably
  useEffect(() => {
    if (window.electronAPI?.setContentProtection) {
      window.electronAPI.setContentProtection(config.screenProtection !== false).catch(() => {});
    }
  }, [config.screenProtection]);

  const [isScreenSharingToPhone, setIsScreenSharingToPhone] = useState(false);
  const screenStreamRef = useRef(null);
  const screenIntervalRef = useRef(null);
  const startScreenShareToPhoneRef = useRef(null);
  const stopScreenShareToPhoneRef = useRef(null);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const capturedScreensRef = useRef(capturedScreens);
  capturedScreensRef.current = capturedScreens;
  const isScreenSharingToPhoneRef = useRef(isScreenSharingToPhone);
  isScreenSharingToPhoneRef.current = isScreenSharingToPhone;

  const startScreenShareToPhone = async () => {
    try {
      setIsScreenSharingToPhone(true);
      broadcastToCompanion({ type: 'screen_sharing_status', isSharing: true });

      // 1. Instant High-Speed Native Screen Capture (100% reliable across 5G/4G/Wi-Fi)
      if (window.electronAPI?.captureScreenFrame) {
        clearInterval(screenIntervalRef.current);
        const sendFrame = async () => {
          try {
            const frame = await window.electronAPI.captureScreenFrame();
            if (frame) {
              broadcastToCompanion({ type: 'screen_frame', image: frame });
            }
          } catch (_) {}
        };
        // Send initial frame immediately without delay
        sendFrame();
        screenIntervalRef.current = setInterval(sendFrame, 500);
      }

      // 2. WebRTC Live MediaStream (High-Speed Video Track for local LAN)
      if (navigator.mediaDevices?.getDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always', frameRate: { ideal: 30, max: 30 } },
          audio: false,
        }).then((stream) => {
          screenStreamRef.current = stream;
          peerHostRef.current?.startScreenCall(stream);

          const track = stream.getVideoTracks()[0];
          if (track) {
            track.onended = () => {
              stopScreenShareToPhone();
            };
          }
        }).catch((mediaErr) => {
          console.warn('[Screen Mirror] WebRTC video notice (using native frame capture):', mediaErr.message);
        });
      }
    } catch (err) {
      console.error('[Screen Share Error]', err);
      setIsScreenSharingToPhone(false);
      broadcastToCompanion({ type: 'screen_sharing_status', isSharing: false });
    }
  };

  const stopScreenShareToPhone = () => {
    setIsScreenSharingToPhone(false);
    if (screenIntervalRef.current) {
      clearInterval(screenIntervalRef.current);
      screenIntervalRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    peerHostRef.current?.stopScreenCall();
    broadcastToCompanion({ type: 'screen_sharing_status', isSharing: false });
  };

  startScreenShareToPhoneRef.current = startScreenShareToPhone;
  stopScreenShareToPhoneRef.current = stopScreenShareToPhone;

  // Centralized action handler for all messages from mobile companion (WebRTC, LAN WebSocket, Supabase)
  const handleCompanionAction = (msg) => {
    if (!msg) return;
    setIsCompanionConnected(true);
    if (msg.action === 'read_screen') {
      handleReadScreenRef.current?.();
    } else if (msg.action === 'get_question') {
      handleExtractQuestionRef.current?.();
    } else if (msg.action === 'clear_screens') {
      handleClearCapturedScreensRef.current?.();
    } else if (msg.action === 'ask_keter' && msg.text) {
      generateAnswer(msg.text.trim(), 'interviewer');
    } else if (msg.action === 'log_user_response' && msg.text) {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const userMsg = {
        id: 'you_' + Date.now(),
        role: 'user',
        text: msg.text.trim(),
        timestamp: timeStr,
      };
      setMessages(prev => [...prev, userMsg]);
    } else if (msg.action === 'update_message' && msg.id && msg.text) {
      setMessages(prev => {
        const next = prev.map(m => m.id === msg.id ? { ...m, text: msg.text } : m);
        broadcastToCompanion({ type: 'sync_messages', messages: next });
        return next;
      });
      setCurrentQuestion(msg.text);
    } else if (msg.action === 'clear_history') {
      setMessages([]);
    } else if (msg.action === 'toggle_window_visibility') {
      window.electronAPI?.toggleWindowVisibility?.();
    } else if (msg.action === 'start_screen_share') {
      startScreenShareToPhoneRef.current?.();
    } else if (msg.action === 'stop_screen_share') {
      stopScreenShareToPhoneRef.current?.();
    } else if (msg.action === 'toggle_screen_share') {
      if (isScreenSharingToPhone) stopScreenShareToPhoneRef.current?.();
      else startScreenShareToPhoneRef.current?.();
    } else if (msg.action === 'request_sync' || msg.action === 'client_connected') {
      broadcastToCompanion({ type: 'sync_messages', messages: messagesRef.current });
      broadcastToCompanion({ type: 'screens_buffered', count: capturedScreensRef.current.length });
      broadcastToCompanion({ type: 'screen_sharing_status', isSharing: isScreenSharingToPhoneRef.current });
      if (isScreenSharingToPhoneRef.current) {
        if (window.electronAPI?.captureScreenFrame) {
          window.electronAPI.captureScreenFrame().then((frame) => {
            if (frame) broadcastToCompanion({ type: 'screen_frame', image: frame });
          }).catch(() => {});
        }
        if (screenStreamRef.current) {
          peerHostRef.current?.startScreenCall(screenStreamRef.current);
        }
      }
    }
  };

  // Listen to Local WebSocket Companion messages
  useEffect(() => {
    if (window.electronAPI?.onCompanionClientMessage) {
      const unsubCompanion = window.electronAPI.onCompanionClientMessage((msg) => {
        handleCompanionAction(msg);
      });
      return () => unsubCompanion();
    }
  }, []);

  // Audio level polling for visualizer
  useEffect(() => {
    if (isListening) {
      visualizerIntervalRef.current = setInterval(() => {
        const { micLevel, systemLevel } = audioCaptureManager.getAudioLevels();
        setAudioLevel(Math.max(micLevel, systemLevel));
      }, 70);
    } else {
      clearInterval(visualizerIntervalRef.current);
      setAudioLevel(0);
    }
    return () => clearInterval(visualizerIntervalRef.current);
  }, [isListening]);

  const broadcastToCompanion = (payload) => {
    if (window.electronAPI?.sendCompanionBroadcast) {
      window.electronAPI.sendCompanionBroadcast(payload);
    }
    if (cloudRelayRef.current) {
      cloudRelayRef.current.send(payload);
    }
    if (cloudChannelRef.current) {
      broadcastToRoomChannel(cloudChannelRef.current, payload);
    }
    if (peerHostRef.current) {
      peerHostRef.current.broadcast(payload);
    }
  };

  // Universal Cross-Network Cloud Relay (Works everywhere on 5G/4G/Wi-Fi worldwide)
  useEffect(() => {
    if (!roomId) return;
    const relay = createCloudRelay({
      roomId,
      isHost: true,
      onMessage: (msg) => {
        handleCompanionAction(msg);
      },
      onStatusChange: (status) => {
        if (status === 'connected') {
          console.log('[App] Cloud Relay connected for room:', roomId);
        }
      },
    });

    cloudRelayRef.current = relay;
    return () => {
      relay?.destroy();
      cloudRelayRef.current = null;
    };
  }, [roomId]);

  // WebRTC Peer Relay (Zero-config global pairing over 5G/LTE/Wi-Fi)
  useEffect(() => {
    if (!roomId) return;
    const peerHost = initHostPeer(roomId, {
      onClientConnect: () => {
        setIsCompanionConnected(true);
        peerHost?.broadcast({ type: 'sync_messages', messages: messagesRef.current });
        peerHost?.broadcast({ type: 'screens_buffered', count: capturedScreensRef.current.length });
        peerHost?.broadcast({ type: 'screen_sharing_status', isSharing: isScreenSharingToPhoneRef.current });
        if (isScreenSharingToPhoneRef.current && screenStreamRef.current) {
          peerHost?.startScreenCall(screenStreamRef.current);
        }
      },
      onClientMessage: (msg) => {
        handleCompanionAction(msg);
      },
      onClientDisconnect: () => {
        setIsCompanionConnected(false);
      },
    });

    peerHostRef.current = peerHost;
  }, [roomId]);

  // Start Global 5G/Cloud Companion Tunnel when roomId is ready
  useEffect(() => {
    if (!roomId) return;
    if (window.electronAPI?.startTunnelForRoom) {
      window.electronAPI.startTunnelForRoom(roomId).then((url) => {
        if (url) {
          console.log('[App] 5G Companion Tunnel Online:', url);
          setTunnelUrl(url);
        }
      }).catch((err) => {
        console.warn('[App] Tunnel startup notice:', err);
      });
    }

    if (window.electronAPI?.onTunnelUrl) {
      const unsub = window.electronAPI.onTunnelUrl((url) => {
        if (url) setTunnelUrl(url);
      });
      return () => unsub();
    }
  }, [roomId]);

  // Broadcast buffered screens count changes
  useEffect(() => {
    broadcastToCompanion({ type: 'screens_buffered', count: capturedScreens.length });
  }, [capturedScreens.length]);

  // Broadcast screen sharing status changes
  useEffect(() => {
    broadcastToCompanion({ type: 'screen_sharing_status', isSharing: isScreenSharingToPhone });
  }, [isScreenSharingToPhone]);

  // Subscribe to Cloud Realtime Pairing Channel (e.g. room:KTR-XXXX fallback)
  useEffect(() => {
    const channel = subscribeToRoomChannel(roomId, (msg) => {
      handleCompanionAction(msg);
    });

    cloudChannelRef.current = channel;
    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [roomId, messages, capturedScreens.length, isScreenSharingToPhone]);

  // Toggle Audio Listening (Mic + Speech recognition)
  const toggleListening = async () => {
    if (isListening) {
      stopListening();
    } else {
      await startListening();
    }
  };
  handleToggleListeningRef.current = toggleListening;

  const startListening = async (overrideStream = null) => {
    setIsListening(true);
    setSttStatusMessage('Activating audio listeners...');

    let activeStream = overrideStream;
    if (!activeStream) {
      const micStream = await audioCaptureManager.startMicrophone();
      activeStream = audioCaptureManager.getMixedStream() || micStream;
    }

    if (!activeStream) {
      setSttStatusMessage('⚠️ Audio input access was denied or not found.');
      setIsListening(false);
      return;
    }

    sttServiceRef.current = new STTService({
      onTranscript: (transcriptData) => {
        setSttStatusMessage(`Listening... "${transcriptData.text.slice(0, 45)}"`);
      },
      onInterimSpeech: (interimText) => {
        setInterimSpeech(interimText);
      },
      onQuestionDetected: (detectedQuestion) => {
        setSttStatusMessage(`💡 Complete question detected! Generating answer...`);
        setInterimSpeech('');
        generateAnswer(detectedQuestion, 'interviewer');
      },
      onError: (err) => {
        console.warn('STT Error:', err);
        if (err.error === 'network' || !err.message) {
          setSttStatusMessage('⚠️ Voice requires Groq Whisper or Deepgram in desktop mode.');
        } else {
          setSttStatusMessage(`⚠️ Speech error (${err.error || err.message}).`);
        }
      },
    });

    const groqKey = getEffectiveApiKey('groq', config.apiKeys);
    const deepgramKey = getEffectiveApiKey('deepgram', config.apiKeys);

    if ((config.sttEngine === 'groq' || !config.sttEngine) && groqKey) {
      await sttServiceRef.current.startGroqWhisper(activeStream, groqKey);
      setSttStatusMessage('🟢 Listening via Groq Whisper AI...');
    } else if (config.sttEngine === 'deepgram' && deepgramKey) {
      await sttServiceRef.current.startDeepgram(activeStream, deepgramKey);
      setSttStatusMessage('🟢 Listening via Deepgram Nova-2...');
    } else {
      const webSpeechStarted = sttServiceRef.current.startWebSpeech();
      if (webSpeechStarted) {
        setSttStatusMessage('🟢 Listening via Web Speech API...');
      } else if (groqKey) {
        await sttServiceRef.current.startGroqWhisper(activeStream, groqKey);
        setSttStatusMessage('🟢 Listening via Groq Whisper AI...');
      } else {
        setSttStatusMessage('🎤 Mic active! Add your Groq key in Settings for voice transcription.');
      }
    }
  };

  const stopListening = () => {
    setIsListening(false);
    setIsSystemAudioActive(false);
    setSttStatusMessage('');
    setInterimSpeech('');
    if (sttServiceRef.current) {
      sttServiceRef.current.stop();
      sttServiceRef.current = null;
    }
    audioCaptureManager.stopAll();
  };

  // Capture System/Meeting Audio Loopback
  const captureSystemAudio = async () => {
    if (isSystemAudioActive) {
      audioCaptureManager.stopSystemAudio();
      setIsSystemAudioActive(false);
      setSttStatusMessage('Meeting audio loopback disconnected.');
      return;
    }

    setSttStatusMessage('Connecting meeting audio loopback...');
    const stream = await audioCaptureManager.startSystemAudio();
    if (stream) {
      setIsSystemAudioActive(true);
      setSttStatusMessage('🔊 Meeting audio loopback active (Zoom/Teams/System audio connected).');
      if (!isListening) {
        await startListening(stream);
      } else {
        const mixed = audioCaptureManager.getMixedStream();
        const groqKey = getEffectiveApiKey('groq', config.apiKeys);
        if (sttServiceRef.current && groqKey && mixed) {
          sttServiceRef.current.stop();
          await sttServiceRef.current.startGroqWhisper(mixed, groqKey);
        }
      }
    } else {
      setSttStatusMessage('⚠️ Could not connect meeting audio. Make sure permissions are allowed.');
    }
  };

  // Generate Answer via streaming LLM with multi-turn conversation history
  const generateAnswer = async (question, targetRole = 'interviewer') => {
    if (!question || question.trim().length === 0) return;

    // Check if project is not activated yet
    if (activeProject && !activeProject.isActivated) {
      const confirmActivate = window.confirm(
        `Session "${activeProject.title}" is ready but not activated yet.\n\nActivate now to begin your 24-hour interview timer?\n\n⚠️ IMPORTANT RULE: Once activated, the timer starts immediately and CANNOT be paused or deactivated.`
      );
      if (confirmActivate) {
        handleActivateProject(activeProject.id);
      } else {
        setSttStatusMessage('⏸️ Project session not activated. Click "Activate (24h)" when your interview begins.');
        return;
      }
    }

    // Check if 24-hour project session has expired
    if (activeProject && isProjectExpired(activeProject)) {
      setSttStatusMessage('⚠️ This 24-hour interview session has ended. Purchase a new project pass (₹99) to continue.');
      setIsRazorpayModalOpen(true);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const questionId = 'q_' + Date.now();
    const keterId = 'keter_' + (Date.now() + 1);

    const currentMode = activeProject?.promptMode || config.promptMode;

    // Add question to messages if not already present as the last message
    setMessages(prev => {
      const last = prev[prev.length - 1];
      const isAlreadyLast = last && last.text.trim() === question.trim() && (last.role === 'interviewer' || last.role === 'user' || last.role === 'screen');

      const newQuestionMsg = isAlreadyLast ? null : {
        id: questionId,
        role: targetRole,
        text: question.trim(),
        timestamp,
      };

      const newKeterMsg = {
        id: keterId,
        role: 'keter',
        text: '',
        isStreaming: true,
        mode: currentMode,
        timestamp,
      };

      return newQuestionMsg ? [...prev, newQuestionMsg, newKeterMsg] : [...prev, newKeterMsg];
    });

    setIsGenerating(true);
    setCurrentQuestion(question);
    setInterimSpeech('');
    broadcastToCompanion({ type: 'question', text: question });

    const apiKey = getEffectiveApiKey(config.llmProvider, config.apiKeys);

    // Build multi-turn context (Interviewer questions, Candidate responses, and Keter suggestions)
    const conversationHistory = messages.slice(-10).map(m => {
      if (m.role === 'interviewer') {
        return { role: 'user', content: `[Interviewer Question]: ${m.text}` };
      } else if (m.role === 'screen') {
        return { role: 'user', content: `[Screen / Assessment Question]: ${m.text}` };
      } else if (m.role === 'user') {
        return { role: 'user', content: `[Candidate / You Said]: ${m.text}` };
      } else {
        return { role: 'assistant', content: m.text };
      }
    });

    await streamLLMResponse({
      question,
      conversationHistory,
      provider: config.llmProvider,
      apiKey,
      apiKeys: config.apiKeys,
      mode: currentMode,
      resumeContext: activeProject?.resumeContext || config.resumeContext,
      jobDescription: activeProject?.jobDescription || config.jobDescription,
      customInstructions: activeProject?.customInstructions || config.customInstructions || '',
      signal: abortControllerRef.current.signal,
      onToken: (token) => {
        setMessages(prev => prev.map(msg => 
          msg.id === keterId ? { ...msg, text: msg.text + token } : msg
        ));
        broadcastToCompanion({ type: 'token', text: token });
      },
      onError: (err) => {
        setMessages(prev => prev.map(msg => 
          msg.id === keterId ? { ...msg, text: msg.text + `\n\n⚠️ Error: ${err.message}`, isStreaming: false } : msg
        ));
        setIsGenerating(false);
      },
      onComplete: () => {
        setMessages(prev => prev.map(msg => 
          msg.id === keterId ? { ...msg, isStreaming: false } : msg
        ));
        setIsGenerating(false);
        broadcastToCompanion({ type: 'complete' });
      },
    });
  };

  // Multi-Screen Capture Buffer (Hotkey: Alt+S or Mobile 📸 Screen button)
  const handleReadScreen = async () => {
    if (isGenerating || isExtractingQuestion) return;
    if (!window.electronAPI?.captureScreenForVision) {
      setSttStatusMessage('⚠️ Screen capture API is only active in Keter desktop app.');
      return;
    }

    setSttStatusMessage('📸 Capturing screen...');
    try {
      const captureResult = await window.electronAPI.captureScreenForVision();
      if (!captureResult) {
        setSttStatusMessage('⚠️ Screen capture returned empty.');
        return;
      }

      const imageBase64 = typeof captureResult === 'string' ? captureResult : captureResult.imageBase64;
      const ocrText = typeof captureResult === 'object' ? (captureResult.ocrText || '') : '';

      const newScreen = {
        id: Date.now(),
        imageBase64,
        ocrText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setCapturedScreens(prev => {
        const next = [...prev, newScreen];
        setSttStatusMessage(`📸 Screen #${next.length} captured! Hit Alt+S again to append more, or click "Get Question".`);
        broadcastToCompanion({ type: 'screens_buffered', count: next.length });
        return next;
      });
    } catch (err) {
      console.error('[Vision Capture Error]', err);
      setSttStatusMessage(`⚠️ Error reading screen: ${err.message}`);
    }
  };

  // Reconstruct the full question from all buffered screens and write it into Keter
  const handleExtractQuestion = async () => {
    if (capturedScreens.length === 0 || isExtractingQuestion) return;
    setIsExtractingQuestion(true);
    setSttStatusMessage(`📝 Extracting complete question from ${capturedScreens.length} screen capture(s)...`);

    try {
      const extractedText = await reconstructQuestionFromScreens({
        screens: capturedScreens,
        provider: config.llmProvider,
        apiKeys: config.apiKeys || {},
        apiKey: getEffectiveApiKey(config.llmProvider, config.apiKeys),
      });

      if (extractedText) {
        setCapturedScreens([]);
        broadcastToCompanion({ type: 'screens_buffered', count: 0 });
        setTypedQuestion('');
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const questionId = 'q_' + Date.now();
        const newQuestionMsg = {
          id: questionId,
          role: 'screen',
          text: extractedText,
          timestamp,
        };
        setMessages(prev => {
          const next = [...prev, newQuestionMsg];
          broadcastToCompanion({ type: 'sync_messages', messages: next });
          return next;
        });
        setCurrentQuestion(extractedText);
        setTypedQuestion(extractedText);
        setSttStatusMessage(`✅ Question ready! Review or edit below, then click "Ask Keter" to solve.`);
      } else {
        setSttStatusMessage('⚠️ Could not extract text from captured screens.');
      }
    } catch (err) {
      console.error('[Extract Question Error]', err);
      setSttStatusMessage(`⚠️ Error extracting question: ${err.message}`);
    } finally {
      setIsExtractingQuestion(false);
    }
  };

  const handleClearCapturedScreens = () => {
    setCapturedScreens([]);
    setSttStatusMessage('Screen buffer cleared.');
    broadcastToCompanion({ type: 'screens_buffered', count: 0 });
  };

  handleReadScreenRef.current = handleReadScreen;
  handleExtractQuestionRef.current = handleExtractQuestion;
  handleClearCapturedScreensRef.current = handleClearCapturedScreens;
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (typedQuestion.trim()) {
      generateAnswer(typedQuestion.trim(), 'interviewer');
      setTypedQuestion('');
    } else if (currentQuestion) {
      generateAnswer(currentQuestion, 'interviewer');
    } else {
      const lastQ = [...messages].reverse().find(m => m.role === 'interviewer' || m.role === 'screen');
      if (lastQ && lastQ.text) {
        generateAnswer(lastQ.text, lastQ.role || 'interviewer');
      }
    }
  };

  // Log what You (Candidate) said to keep conversational memory
  const handleLogCandidateResponse = () => {
    if (!typedQuestion.trim()) return;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: 'you_' + Date.now(),
      role: 'user',
      text: typedQuestion.trim(),
      timestamp,
    };
    setMessages(prev => [...prev, userMsg]);
    setTypedQuestion('');
  };

  const toggleClickThrough = () => {
    const nextState = !clickThrough;
    setClickThrough(nextState);
    if (window.electronAPI) {
      window.electronAPI.setIgnoreMouseEvents(nextState, { forward: true });
    }
  };

  // Toggle Screen Capture Protection
  const toggleScreenProtection = () => {
    const nextState = !(config.screenProtection !== false);
    const updated = { ...config, screenProtection: nextState };
    saveConfig(updated);
    setSttStatusMessage(nextState
      ? '🛡️ Stealth Invisibility ON: 100% Invisible on Zoom, Teams, Meet & Screen Shares (Desktop passes through cleanly with NO black box).'
      : '👁️ Stealth Invisibility OFF: Window is now visible in screen recordings and shares.');
  };

  // Panic Button / Kill-Switch
  const handlePanicTrigger = () => {
    stopListening();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setCurrentQuestion('');
    setInterimSpeech('');
    broadcastToCompanion({ type: 'clear' });

    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  // Close Application / Quit App
  const handleQuitApp = () => {
    stopListening();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (window.electronAPI?.quitApp) {
      window.electronAPI.quitApp();
    } else if (window.electronAPI?.closeWindow) {
      window.electronAPI.closeWindow();
    } else {
      window.close();
    }
  };

  // Sample Interview Simulation
  const triggerSimulation = () => {
    const sampleQuestions = [
      "Tell me about a challenging technical problem you solved under pressure.",
      "How do you design a scalable rate limiter for distributed microservices?",
      "Can you write a function to find the length of the longest substring without repeating characters?",
      "Describe a time you had a technical disagreement with a team member and how you resolved it."
    ];
    const picked = sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)];
    generateAnswer(picked, 'interviewer');
  };

  const saveConfig = (newConfig) => {
    setConfig(newConfig);
    localStorage.setItem('keter_config', JSON.stringify(newConfig));
    if (window.electronAPI?.setContentProtection && typeof newConfig.screenProtection === 'boolean') {
      window.electronAPI.setContentProtection(newConfig.screenProtection).catch(() => {});
    }
  };

  // Mandatory Sign-In Gate: Access to Keter is locked until candidate signs in with Google
  const isAuthenticated = !!(userProfile && userProfile.email && userProfile.email.includes('@'));

  if (!isAuthenticated) {
    return (
      <AuthGate
        onAuthSuccess={(prof) => {
          setUserProfile(prof);
        }}
        onOpenLanding={onOpenLanding}
      />
    );
  }

  return (
    <div
      className={`hud-container ${clickThrough ? 'click-through-active' : ''} ${config.ghostMode ? 'frameless-ghost' : ''}`}
      style={{ opacity: config.opacity !== undefined ? config.opacity : 0.95 }}
    >
      {/* 1. Header Bar */}
      {/* 1. Header Bar */}
      <header className="app-header">
        <div className="header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Sparkles size={14} color="#00f2fe" />
            <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.06em', color: '#f8fafc' }}>
              KETER
            </span>
          </div>

          {/* Project Switcher Dropdown (Like ChatGPT's Project/Session Switcher) */}
          <div data-tour="project-switcher" className="no-drag" style={{ display: 'inline-flex' }}>
            <ProjectSwitcher
              activeProject={activeProject}
              projects={projects}
              onSelectProject={handleSelectProject}
              onCreateProjectClick={handleOpenCreateProject}
              onEditProjectClick={handleOpenEditProject}
              onDeleteProject={handleDeleteProject}
              onActivateProject={handleActivateProject}
              onBuyProjectClick={() => setIsRazorpayModalOpen(true)}
              isPro={!!userProfile?.is_pro}
              onOpenUpgrade={() => setIsRazorpayModalOpen(true)}
            />
          </div>

          <div className="status-pill">
            <span className={`status-dot ${isListening ? 'dot-listening' : isGenerating ? 'dot-generating' : 'dot-paused'}`} />
            <span style={{ color: isListening ? '#34d399' : isGenerating ? '#38bdf8' : '#94a3b8' }}>
              {isListening ? 'LISTENING' : isGenerating ? 'STREAMING' : 'READY'}
            </span>
            {isListening && <AudioVisualizer level={audioLevel} isListening={isListening} />}
          </div>
        </div>

        {/* Center / Primary Action Tools */}
        <div className="no-drag header-tools">
          {/* Audio Input Controls */}
          <div data-tour="audio-controls" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <button
              onClick={toggleListening}
              className={`icon-btn ${isListening ? 'active' : ''}`}
              title={isListening ? "Stop Mic Listening" : "Start Live Mic Listening"}
            >
              {isListening ? <Mic size={13} color="#34d399" /> : <MicOff size={13} />}
            </button>

            <button
              onClick={captureSystemAudio}
              className={`icon-btn ${isSystemAudioActive ? 'active' : ''}`}
              title={isSystemAudioActive ? "Meeting Audio Loopback ACTIVE" : "Connect Meeting Audio Loopback (Zoom/Teams/Meet)"}
              style={{ color: isSystemAudioActive ? '#34d399' : '#94a3b8' }}
            >
              <Volume2 size={13} />
            </button>
          </div>

          {/* Screen Question Capture */}
          <div data-tour="screen-capture" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <button
              onClick={handleReadScreen}
              className="icon-btn screen-capture-btn"
              title="Capture current screen view (Alt+S). Capture multiple slices if problem overflows."
            >
              <Camera size={12} color="#f472b6" />
              <span>{capturedScreens.length > 0 ? `+${capturedScreens.length}` : 'Screen'}</span>
              <span className="kbd-pill">Alt+S</span>
            </button>

          {capturedScreens.length > 0 && (
            <>
              <button
                onClick={handleExtractQuestion}
                disabled={isExtractingQuestion}
                className="icon-btn get-q-btn"
                title="Stitch captured screens together and write complete question into Keter"
              >
                <FileText size={12} />
                <span>{isExtractingQuestion ? '...' : `Get Q (${capturedScreens.length})`}</span>
              </button>
              <button
                onClick={handleClearCapturedScreens}
                className="icon-btn"
                title="Clear screen buffer"
                style={{ padding: '3px 5px', color: '#94a3b8' }}
              >
                <Trash2 size={12} />
              </button>
            </>
          )}

          </div>

          <div className="header-divider" />

          {/* Shield Status Badge (Shows whether Shield is ON or OFF) & Opacity Cycle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <div
              data-tour="stealth-shield-status"
              onClick={toggleScreenProtection}
              className="no-drag"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 7px',
                borderRadius: '6px',
                background: config.screenProtection !== false ? 'rgba(52, 211, 153, 0.12)' : 'rgba(239, 68, 68, 0.14)',
                border: config.screenProtection !== false ? '1px solid rgba(52, 211, 153, 0.35)' : '1px solid rgba(239, 68, 68, 0.4)',
                cursor: 'pointer',
                userSelect: 'none',
              }}
              title={
                config.screenProtection !== false
                  ? 'Screen Invisibility: ON (Window hidden from Zoom, Teams & Meet). Click to toggle.'
                  : 'Screen Invisibility: OFF (Window visible on screen shares). Click to turn ON.'
              }
            >
              {config.screenProtection !== false ? (
                <Shield size={12} color="#34d399" />
              ) : (
                <ShieldAlert size={12} color="#f87171" />
              )}
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: config.screenProtection !== false ? '#34d399' : '#f87171',
                }}
              >
                {config.screenProtection !== false ? 'SHIELD ON' : 'SHIELD OFF'}
              </span>
            </div>

            {/* Opacity Cycle */}
            <div data-tour="opacity-control" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <button
                onClick={() => {
                  const opacities = [1.0, 0.75, 0.50, 0.25, 0.10, 0.0];
                  const current = config.opacity ?? 0.95;
                  const idx = opacities.findIndex(val => Math.abs(val - current) < 0.1);
                  const next = idx === -1 || idx === opacities.length - 1 ? opacities[0] : opacities[idx + 1];
                  saveConfig({ ...config, opacity: next });
                }}
                className="icon-btn"
                title={`Window Opacity: ${Math.round((config.opacity ?? 0.95) * 100)}% (Click to cycle)`}
                style={{ gap: '3px', padding: '3px 6px' }}
              >
                <Eye size={12} color="#38bdf8" />
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  {Math.round((config.opacity ?? 0.95) * 100)}%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pinned Window Controls (Always Visible & Never Clipped) */}
        <div className="no-drag header-pinned">
          {/* Mobile HUD */}
          <div data-tour="phone-companion" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <button
              onClick={() => setIsPairingOpen(true)}
              className={`icon-btn phone-btn ${isCompanionConnected ? 'connected' : ''}`}
              title="Air-Gapped Mobile Companion HUD (Scan QR)"
            >
              <Smartphone size={12} />
              <span>{isCompanionConnected ? 'Linked' : 'Phone'}</span>
            </button>

            {isCompanionConnected && (
              <button
                onClick={() => {
                  if (isScreenSharingToPhone) stopScreenShareToPhone();
                  else startScreenShareToPhone();
                }}
                className={`icon-btn ${isScreenSharingToPhone ? 'active' : ''}`}
                title={isScreenSharingToPhone ? "Screen Mirror to Phone ACTIVE (Click to stop)" : "Stream PC Screen to Phone (Click to start)"}
                style={{
                  color: isScreenSharingToPhone ? '#38bdf8' : '#94a3b8',
                  background: isScreenSharingToPhone ? 'rgba(56, 189, 248, 0.15)' : undefined,
                  border: isScreenSharingToPhone ? '1px solid rgba(56, 189, 248, 0.4)' : undefined,
                  padding: '3px 6px',
                  gap: '3px',
                }}
              >
                <Monitor size={12} />
                <span style={{ fontSize: '10px' }}>{isScreenSharingToPhone ? 'Mirroring' : 'Mirror'}</span>
              </button>
            )}
          </div>

          {/* User Profile */}
          <div data-tour="profile-btn" style={{ display: 'inline-flex' }}>
            <button
              onClick={() => setIsProfileOpen(true)}
              className="icon-btn profile-btn"
              title="Candidate Profile & License"
            >
              <User size={12} />
              <span>{userProfile?.name ? userProfile.name.split(' ')[0] : 'Profile'}</span>
            </button>
          </div>

          {/* Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="icon-btn"
            title="Settings & Model Config"
          >
            <Sliders size={13} />
          </button>

          <div className="header-divider" />

          {/* Panic Kill-Switch */}
          <div data-tour="panic-btn" style={{ display: 'inline-flex' }}>
            <button
              onClick={handlePanicTrigger}
              className="btn-panic"
              title="Panic Kill-Switch (Escape / Ctrl+Shift+X)"
            >
              <AlertOctagon size={12} />
              <span>PANIC</span>
            </button>
          </div>

          {/* Mini Mode Toggle */}
          <button
            onClick={toggleMiniMode}
            className={`icon-btn ${isMiniMode ? 'active' : ''}`}
            title={isMiniMode ? "Expand to Full HUD" : "Compact Teleprompter Bar"}
          >
            {isMiniMode ? <Maximize2 size={13} color="#38bdf8" /> : <Minimize2 size={13} />}
          </button>

          {/* Minimize Window */}
          <button
            onClick={() => window.electronAPI?.minimizeWindow ? window.electronAPI.minimizeWindow() : null}
            className="icon-btn"
            title="Minimize Window"
          >
            <Minus size={13} />
          </button>

          {/* Close Application */}
          <button
            onClick={handleQuitApp}
            className="icon-btn btn-close-app"
            title="Close Application (Exit Keter)"
          >
            <X size={13} />
          </button>
        </div>
      </header>

      {/* STT Status Notification Banner */}
      {sttStatusMessage && (
        <div style={{ background: 'rgba(30, 41, 59, 0.85)', padding: '5px 16px', fontSize: '11px', color: '#93c5fd', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{sttStatusMessage}</span>
          <button onClick={() => setSttStatusMessage('')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '11px' }}>✕</button>
        </div>
      )}

      {/* 2. Main Conversation Chat Thread (Interviewer, You, Keter) */}
      <div data-tour="chat-conversation" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <ChatConversation
          messages={messages}
          interimSpeech={interimSpeech}
          onManualAskInterim={(text) => generateAnswer(text, 'interviewer')}
          onReaskQuestion={(text) => generateAnswer(text, 'interviewer')}
          onUpdateMessage={(id, newText) => {
            setMessages(prev => {
              const next = prev.map(m => m.id === id ? { ...m, text: newText } : m);
              broadcastToCompanion({ type: 'sync_messages', messages: next });
              return next;
            });
            setCurrentQuestion(newText);
          }}
          onRegenerateAnswer={(keterMsg) => {
            const idx = messages.findIndex(m => m.id === keterMsg.id);
            const prevQ = messages.slice(0, idx).reverse().find(m => m.role === 'interviewer' || m.role === 'user');
            if (prevQ) generateAnswer(prevQ.text, prevQ.role);
          }}
          onClearHistory={() => setMessages([])}
          isGenerating={isGenerating}
          isMiniMode={isMiniMode}
        />
      </div>

      {/* 3. Quick Input & Action Bar (Hidden in Mini Mode) */}
      {!isMiniMode && (
        <div data-tour="manual-input" style={{ background: 'rgba(10, 14, 22, 0.95)', borderTop: '1px solid var(--border-subtle)' }} className="no-drag">
          {/* Buffered Screen Slices Banner */}
          {capturedScreens.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 14px',
              background: 'rgba(236, 72, 153, 0.12)',
              borderBottom: '1px solid rgba(236, 72, 153, 0.25)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#f472b6' }}>
                  📸 {capturedScreens.length} Screen Slice{capturedScreens.length > 1 ? 's' : ''} Buffered
                </span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  (Scroll down & press Alt+S to add more, or click Get Question)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handleExtractQuestion}
                  disabled={isExtractingQuestion}
                  className="icon-btn"
                  style={{
                    background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    padding: '3px 10px',
                    fontSize: '11px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isExtractingQuestion ? 'wait' : 'pointer',
                  }}
                >
                  <FileText size={12} />
                  <span>{isExtractingQuestion ? 'Extracting...' : `Get Question (${capturedScreens.length})`}</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearCapturedScreens}
                  className="icon-btn"
                  title="Clear screen buffer"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', padding: '3px 8px', fontSize: '11px', borderRadius: '4px' }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          <div style={{ padding: '8px 14px' }}>
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                <textarea
                  className="form-input"
                  style={{
                    width: '100%',
                    fontSize: '12px',
                    padding: '8px 28px 8px 12px',
                    background: 'rgba(18, 24, 38, 0.85)',
                    resize: 'vertical',
                    minHeight: '36px',
                    maxHeight: '160px',
                    fontFamily: typedQuestion.includes('class') || typedQuestion.includes('function') ? 'monospace' : 'inherit',
                    lineHeight: 1.4,
                  }}
                  rows={typedQuestion.includes('\n') ? Math.min(6, Math.max(3, typedQuestion.split('\n').length)) : 1}
                  placeholder="Ask Keter, or hit Alt+S & 'Get Question' to paste whole problem here..."
                  value={typedQuestion}
                  onChange={(e) => setTypedQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || !typedQuestion.includes('\n'))) {
                      e.preventDefault();
                      handleManualSubmit(e);
                    }
                  }}
                />
                {typedQuestion && (
                  <button
                    type="button"
                    onClick={() => setTypedQuestion('')}
                    title="Clear question text"
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '8px',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="icon-btn active"
                title="Send question to Keter for instant answer (Ctrl+Enter)"
                style={{
                  padding: '7px 14px',
                  fontSize: '12px',
                  gap: '5px',
                  background: 'var(--accent-gradient)',
                  color: '#090d16',
                  border: 'none',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  height: '36px',
                }}
              >
                <Sparkles size={13} />
                <span>Ask Keter</span>
              </button>
              <button
                type="button"
                onClick={handleLogCandidateResponse}
                className="icon-btn"
                title="Record this text as what You (Candidate) answered"
                style={{
                  padding: '7px 12px',
                  fontSize: '12px',
                  gap: '5px',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  color: '#34d399',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  height: '36px',
                }}
              >
                <User size={13} />
                <span>+ You</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={saveConfig}
        localIp={localIp}
        onStartTour={() => {
          setIsSettingsOpen(false);
          setIsMiniMode(false);
          setIsTourOpen(true);
        }}
      />

      {/* Cloud QR Mobile Pairing Modal */}
      <PairingModal
        isOpen={isPairingOpen}
        onClose={() => setIsPairingOpen(false)}
        localIp={localIp}
        tunnelUrl={tunnelUrl}
        isCompanionConnected={isCompanionConnected}
      />

      {/* Candidate Profile Page Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onProfileChange={(prof) => setUserProfile(prof)}
        onOpenSettings={() => {
          setIsProfileOpen(false);
          setIsSettingsOpen(true);
        }}
        projects={projects}
        activeProject={activeProject}
        onSelectProject={handleSelectProject}
        onCreateProject={handleOpenCreateProject}
        onEditProject={handleOpenEditProject}
        onDeleteProject={handleDeleteProject}
        onActivateProject={handleActivateProject}
        onBuyProjectClick={() => {
          setIsProfileOpen(false);
          setIsRazorpayModalOpen(true);
        }}
        onStartTour={() => {
          setIsMiniMode(false);
          setIsTourOpen(true);
        }}
      />

      {/* 1st Startup Guided Tour Modal */}
      <OnboardingTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />

      {/* Razorpay ₹99 Per-Project Pass Checkout Modal */}
      <RazorpayModal
        isOpen={isRazorpayModalOpen}
        onClose={() => setIsRazorpayModalOpen(false)}
        userProfile={userProfile}
        onPaymentSuccess={handleBuyProjectSuccess}
      />

      {/* User Account & License Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthChange={(prof) => setUserProfile(prof)}
      />

      {/* Project Configuration Modal (Per-project JD, Resume, Mode, & 24h validity) */}
      <ProjectConfigModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        mode={projectModalMode}
        project={editingProject || activeProject}
        isPro={!!userProfile?.is_pro}
        onSave={handleSaveProject}
        onOpenUpgrade={() => {
          setIsProjectModalOpen(false);
          setIsRazorpayModalOpen(true);
        }}
        onActivateProject={handleActivateProject}
      />
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Keter ErrorBoundary caught an error:', error);
    console.error('Error stack:', error?.stack);
    console.error('Component stack:', errorInfo?.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          color: '#f8fafc',
          background: '#070a12',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
          </div>
          <h2 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>HUD Recovery</h2>
          <p style={{ color: '#f87171', fontSize: '12px', fontWeight: 600, maxWidth: '500px', lineHeight: 1.5, margin: '0 0 12px' }}>
            {this.state.error?.message || 'An unexpected rendering issue occurred.'}
          </p>
          <pre style={{
            color: '#cbd5e1',
            fontSize: '11px',
            maxWidth: '90vw',
            maxHeight: '160px',
            overflow: 'auto',
            textAlign: 'left',
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '16px',
            userSelect: 'text',
            whiteSpace: 'pre-wrap'
          }}>
            {this.state.error?.stack}
            {this.state.errorInfo?.componentStack ? `\n\nComponent Stack:${this.state.errorInfo.componentStack}` : ''}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #00f2fe 0%, #7c3aed 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px'
            }}
          >
            Reload Keter HUD
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const isCompanionMode = urlParams.get('mode') === 'companion';
  const isElectron = !!(window.electronAPI);

  // In Electron desktop app: always default to 'app' HUD.
  // On public web: always default to 'landing' marketing & download page (or companion mode for mobile teleprompter).
  const [currentView, setCurrentView] = useState(() => {
    return isElectron ? 'app' : 'landing';
  });

  return (
    <ErrorBoundary>
      {isCompanionMode ? (
        <CompanionView />
      ) : currentView === 'landing' || !isElectron ? (
        <LandingPage />
      ) : (
        <KeterHUD onOpenLanding={() => setCurrentView('landing')} />
      )}
    </ErrorBoundary>
  );
}
