import React, { useState, useRef, useEffect } from 'react';
import {
  Folder,
  ChevronDown,
  Plus,
  Clock,
  Sliders,
  Trash2,
  Check,
  Zap,
  Sparkles,
  AlertCircle,
  FileText,
  Play,
  ShieldCheck,
} from 'lucide-react';
import {
  getProjectRemainingTime,
  PROJECT_COST_INR,
} from '../services/projectService';

export function ProjectSwitcher({
  activeProject,
  projects,
  onSelectProject,
  onCreateProjectClick,
  onEditProjectClick,
  onDeleteProject,
  onActivateProject,
  onBuyProjectClick,
  isPro = false,
  onOpenUpgrade,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const activeTimer = activeProject
    ? getProjectRemainingTime(activeProject)
    : { text: '24h Pass', isExpired: false, isActivated: false };

  const handleActivate = (e, project) => {
    e.stopPropagation();
    if (
      window.confirm(
        `Are you ready to activate "${project.title}"?\n\n⚠️ IMPORTANT RULE:\nOnce activated, your 24-hour interview timer begins immediately and CANNOT be paused or deactivated.`
      )
    ) {
      if (onActivateProject) {
        onActivateProject(project.id);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="no-drag"
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        zIndex: isOpen ? 10000 : 100,
      }}
    >
      {/* Active Project Pill */}
      <div
        className="no-drag"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: isOpen ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.85)',
          border: isOpen ? '1px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '8px',
          padding: '3px 6px 3px 8px',
          gap: '6px',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'all 0.15s ease',
        }}
        title="Switch Interview Project (Session)"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#f8fafc',
          }}
        >
          <Folder size={13} color="#38bdf8" />
          <span
            style={{
              maxWidth: '110px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: '#f8fafc',
            }}
          >
            {activeProject?.title || 'Interview Project'}
          </span>
          <ChevronDown
            size={12}
            color="#94a3b8"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s ease',
            }}
          />
        </div>

        {/* Unactivated vs Activated Timer Badge */}
        {!activeProject?.isActivated ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleActivate(e, activeProject);
            }}
            className="no-drag"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '5px',
              backgroundColor: 'rgba(34, 197, 94, 0.18)',
              color: '#4ade80',
              border: '1px solid rgba(34, 197, 94, 0.45)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            title="Session ready. Click to Activate (starts 24h timer)."
          >
            <Play size={10} fill="#4ade80" />
            <span>Activate (24h)</span>
          </button>
        ) : (
          <div
            className="no-drag"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '5px',
              backgroundColor: activeTimer.isExpired
                ? 'rgba(239, 68, 68, 0.15)'
                : 'rgba(56, 189, 248, 0.1)',
              color: activeTimer.isExpired ? '#f87171' : '#7dd3fc',
              border: activeTimer.isExpired
                ? '1px solid rgba(239, 68, 68, 0.3)'
                : '1px solid rgba(56, 189, 248, 0.2)',
              whiteSpace: 'nowrap',
            }}
            title={activeTimer.isExpired ? 'Session expired (24h limit)' : 'Active 24-Hour Interview Session'}
          >
            <Clock size={10} />
            <span>{activeTimer.shortText || activeTimer.text.replace(' left', '')}</span>
          </div>
        )}
      </div>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          className="no-drag"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            width: '340px',
            backgroundColor: '#0c101c',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.95), 0 0 25px rgba(56, 189, 248, 0.2)',
            borderRadius: '14px',
            zIndex: 999999,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Dropdown Header */}
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Folder size={14} color="#38bdf8" />
              <span>Interview Sessions</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onCreateProjectClick) onCreateProjectClick();
              }}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Create a new interview project session"
            >
              <Plus size={12} />
              <span>New Session</span>
            </button>
          </div>

          {/* Project List */}
          <div style={{ maxHeight: '250px', overflowY: 'auto', padding: '6px' }}>
            {projects.map((p) => {
              const isActive = p.id === activeProject?.id;
              const timer = getProjectRemainingTime(p);
              const msgCount = Array.isArray(p.messages) ? p.messages.length : 0;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProject(p);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                    border: isActive ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                    cursor: 'pointer',
                    marginBottom: '4px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isActive && <Check size={13} color="#38bdf8" />}
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? '#38bdf8' : '#f8fafc',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.title}
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                      {p.targetRole || 'Software Engineer'} • {msgCount} msg{msgCount === 1 ? '' : 's'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {/* If unactivated, show activate trigger */}
                    {!p.isActivated ? (
                      <button
                        type="button"
                        onClick={(e) => handleActivate(e, p)}
                        style={{
                          background: 'rgba(34, 197, 94, 0.18)',
                          border: '1px solid rgba(34, 197, 94, 0.4)',
                          color: '#4ade80',
                          padding: '3px 8px',
                          borderRadius: '5px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                        title="Start 24-hour timer"
                      >
                        <Play size={10} fill="#4ade80" />
                        <span>Activate</span>
                      </button>
                    ) : (
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 600,
                          padding: '2px 5px',
                          borderRadius: '4px',
                          backgroundColor: timer.isExpired
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(56, 189, 248, 0.1)',
                          color: timer.isExpired ? '#f87171' : '#7dd3fc',
                        }}
                      >
                        {timer.text}
                      </span>
                    )}

                    {/* Edit Project Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(false);
                        onEditProjectClick(p);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '2px',
                      }}
                      title="Edit JD & Resume Context"
                    >
                      <Sliders size={12} />
                    </button>

                    {/* Delete Project Button (if more than 1 project) */}
                    {projects.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete project "${p.title}"?`)) {
                            onDeleteProject(p.id);
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '2px',
                        }}
                        title="Delete project"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Buy Project Pass Action Button (₹99 via Razorpay) */}
          <div
            style={{
              padding: '10px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onBuyProjectClick) {
                  onBuyProjectClick();
                } else if (onCreateProjectClick) {
                  onCreateProjectClick();
                }
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                backgroundColor: 'linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)',
                background: '#0284c7',
                border: 'none',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                transition: 'all 0.15s ease',
              }}
            >
              <Zap size={14} color="#ffd700" />
              <span>Buy Project Pass (₹{PROJECT_COST_INR})</span>
            </button>

            <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center' }}>
              Pass stays unactivated until you hit "Activate"
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
