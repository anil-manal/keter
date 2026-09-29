// Project & Session Management Service for Keter Copilot
// Per-Project Cost Architecture (₹99 per Project / Session)
// Each project has its own Mode, Job Description (JD), Resume Context, and Chat History.
// Projects start UNACTIVATED (timer paused). Once activated, the 24h timer starts and CANNOT be deactivated.

const STORAGE_KEY = 'keter_projects';
const ACTIVE_ID_KEY = 'keter_active_project_id';
export const PROJECT_COST_INR = 99; // ₹99 per project session (1st project is free)
export const PROJECT_DURATION_MS = 24 * 60 * 60 * 1000; // 24 Hours

export function getStoredProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Normalize projects with activation metadata if legacy
        return parsed.map(p => {
          const isActivated = p.isActivated ?? (p.activatedAt ? true : false);
          let status = p.status;
          if (!status) {
            if (!isActivated) status = 'unactivated';
            else if (p.expiresAt && Date.now() > p.expiresAt) status = 'expired';
            else status = 'active';
          }
          return {
            ...p,
            isActivated,
            activatedAt: p.activatedAt || null,
            expiresAt: p.expiresAt || null,
            status,
            paidAmount: p.paidAmount ?? (p.id.includes('free') ? 0 : 99),
          };
        });
      }
    }
  } catch (e) {
    console.warn('[ProjectService] Error reading projects from localStorage:', e);
  }

  // Seed first initial project (Free 1-pass trial, unactivated so user can prepare JD & Resume)
  let existingMessages = [];
  try {
    const legacyHistory = localStorage.getItem('keter_conversation_history');
    if (legacyHistory) existingMessages = JSON.parse(legacyHistory) || [];
  } catch (_) {}

  let legacyConfig = {};
  try {
    const rawConfig = localStorage.getItem('keter_config');
    if (rawConfig) legacyConfig = JSON.parse(rawConfig) || {};
  } catch (_) {}

  const initialProject = {
    id: 'proj_' + Date.now(),
    title: 'Interview Session #1',
    company: 'Target Company',
    targetRole: 'Senior Full Stack Engineer',
    promptMode: legacyConfig.promptMode || 'technical',
    jobDescription: legacyConfig.jobDescription || '',
    resumeContext: legacyConfig.resumeContext || '',
    isActivated: false,
    activatedAt: null,
    expiresAt: null,
    status: 'unactivated',
    paidAmount: 0, // 1st free trial project
    createdAt: Date.now(),
    messages: existingMessages,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([initialProject]));
    localStorage.setItem(ACTIVE_ID_KEY, initialProject.id);
  } catch (e) {
    console.error('[ProjectService] Failed to seed initial project:', e);
  }

  return [initialProject];
}

export function getActiveProjectId() {
  const activeId = localStorage.getItem(ACTIVE_ID_KEY);
  const projects = getStoredProjects();
  if (activeId && projects.some(p => p.id === activeId)) {
    return activeId;
  }
  const fallback = projects[0]?.id;
  if (fallback) {
    localStorage.setItem(ACTIVE_ID_KEY, fallback);
  }
  return fallback;
}

export function setActiveProjectId(id) {
  localStorage.setItem(ACTIVE_ID_KEY, id);
}

export function getActiveProject() {
  const projects = getStoredProjects();
  const activeId = getActiveProjectId();
  return projects.find(p => p.id === activeId) || projects[0] || null;
}

/**
 * Creates a new project session (Unactivated by default).
 * Free trial allows 1 initial project. Subsequent projects must be purchased via Razorpay (₹99).
 */
export function createProject(projectData, isPro = false) {
  const existing = getStoredProjects();

  // If user has already used 1 free project and is not pro, require ₹99 purchase
  const hasFreeProject = existing.some(p => p.paidAmount === 0);
  if (!isPro && hasFreeProject && existing.length >= 1) {
    return {
      success: false,
      error: 'PAYMENT_REQUIRED',
      cost: PROJECT_COST_INR,
      message: `Free Trial includes 1 Project session. Purchase an interview project pass for ₹${PROJECT_COST_INR} to start another.`,
    };
  }

  const now = Date.now();
  const newProject = {
    id: 'proj_' + now,
    title: projectData.title?.trim() || `Interview Session #${existing.length + 1}`,
    company: projectData.company?.trim() || '',
    targetRole: projectData.targetRole?.trim() || 'Software Engineer',
    promptMode: projectData.promptMode || 'technical',
    jobDescription: projectData.jobDescription || '',
    resumeContext: projectData.resumeContext || '',
    isActivated: false,
    activatedAt: null,
    expiresAt: null,
    status: 'unactivated',
    paidAmount: isPro ? 0 : 0,
    createdAt: now,
    messages: [],
  };

  const updated = [newProject, ...existing];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(ACTIVE_ID_KEY, newProject.id);
  } catch (e) {
    console.error('[ProjectService] Error saving new project:', e);
    return { success: false, error: 'STORAGE_ERROR', message: 'Failed to save project.' };
  }

  return { success: true, project: newProject };
}

/**
 * Purchases a new Project Session Pass via Razorpay (₹99).
 * The project is added as UNACTIVATED. The 24h timer does NOT start until user explicitly activates it.
 */
export function buyProjectPass({
  title,
  targetRole,
  promptMode,
  jobDescription,
  resumeContext,
  paymentId,
}) {
  const existing = getStoredProjects();
  const now = Date.now();

  const newProject = {
    id: 'proj_' + now,
    title: title?.trim() || `Interview Session #${existing.length + 1}`,
    company: '',
    targetRole: targetRole?.trim() || 'Full Stack Engineer',
    promptMode: promptMode || 'technical',
    jobDescription: jobDescription || '',
    resumeContext: resumeContext || '',
    isActivated: false,
    activatedAt: null,
    expiresAt: null,
    status: 'unactivated',
    paidAmount: PROJECT_COST_INR,
    paymentId: paymentId || ('pay_' + Math.random().toString(36).substring(2, 10)),
    createdAt: now,
    messages: [],
  };

  const updated = [newProject, ...existing];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(ACTIVE_ID_KEY, newProject.id);
  } catch (e) {
    console.error('[ProjectService] Error saving purchased project:', e);
    return { success: false, error: 'STORAGE_ERROR' };
  }

  return { success: true, project: newProject };
}

/**
 * Activates an unactivated project session.
 * CRITICAL RULE: Once activated, it CANNOT be deactivated or paused, and expires strictly after 24 hours.
 */
export function activateProject(id) {
  const existing = getStoredProjects();
  const target = existing.find(p => p.id === id);
  if (!target) return { success: false, error: 'NOT_FOUND' };

  if (target.isActivated) {
    return { success: false, error: 'ALREADY_ACTIVATED', project: target };
  }

  const now = Date.now();
  const expiresAt = now + PROJECT_DURATION_MS;

  const updatedProject = {
    ...target,
    isActivated: true,
    activatedAt: now,
    expiresAt: expiresAt,
    status: 'active',
  };

  const updatedList = existing.map(p => p.id === id ? updatedProject : p);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (e) {
    console.error('[ProjectService] Error activating project:', e);
    return { success: false, error: 'STORAGE_ERROR' };
  }

  return { success: true, project: updatedProject };
}

export function updateProject(id, updates) {
  const existing = getStoredProjects();
  // Prevent tampering with activation timestamps or deactivating once activated
  const safeUpdates = { ...updates };
  delete safeUpdates.isActivated;
  delete safeUpdates.activatedAt;
  delete safeUpdates.expiresAt;

  const updated = existing.map(p => {
    if (p.id === id) {
      return { ...p, ...safeUpdates };
    }
    return p;
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('[ProjectService] Error updating project:', e);
  }

  return updated.find(p => p.id === id) || null;
}

export function deleteProject(id) {
  const existing = getStoredProjects();
  const remaining = existing.filter(p => p.id !== id);

  if (remaining.length === 0) {
    const now = Date.now();
    const fresh = {
      id: 'proj_' + now,
      title: 'Interview Session #1',
      company: 'Target Company',
      targetRole: 'Senior Full Stack Engineer',
      promptMode: 'technical',
      jobDescription: '',
      resumeContext: '',
      isActivated: false,
      activatedAt: null,
      expiresAt: null,
      status: 'unactivated',
      paidAmount: 0,
      createdAt: now,
      messages: [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([fresh]));
    localStorage.setItem(ACTIVE_ID_KEY, fresh.id);
    return [fresh];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    if (getActiveProjectId() === id) {
      localStorage.setItem(ACTIVE_ID_KEY, remaining[0].id);
    }
  } catch (e) {
    console.error('[ProjectService] Error deleting project:', e);
  }

  return remaining;
}

export function isProjectExpired(project) {
  if (!project) return false;
  // If not yet activated, it cannot be expired
  if (!project.isActivated || !project.expiresAt) return false;
  return Date.now() > project.expiresAt;
}

export function getProjectRemainingTime(project) {
  if (!project) return { text: 'Ready (24h Pass)', isExpired: false, isActivated: false, percent: 100 };

  // 1. Not activated yet
  if (!project.isActivated || !project.expiresAt) {
    return {
      text: 'Ready to Activate (24h)',
      shortText: '24h Pass',
      isExpired: false,
      isActivated: false,
      percent: 100,
    };
  }

  // 2. Activated - calculate remaining 24h window
  const diff = project.expiresAt - Date.now();
  if (diff <= 0) {
    return {
      text: 'Expired (24h limit)',
      shortText: 'Expired',
      isExpired: true,
      isActivated: true,
      percent: 0,
    };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const percent = Math.max(0, Math.min(100, Math.round((diff / PROJECT_DURATION_MS) * 100)));

  if (hours > 0) {
    return {
      text: `${hours}h ${mins}m left`,
      shortText: `${hours}h ${mins}m`,
      isExpired: false,
      isActivated: true,
      percent,
    };
  }
  return {
    text: `${mins}m left`,
    shortText: `${mins}m`,
    isExpired: false,
    isActivated: true,
    percent,
  };
}
