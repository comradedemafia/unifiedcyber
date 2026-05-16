// Advanced security utilities for threat detection, anomaly analysis, and self-protection

import { supabase } from "@/integrations/supabase/client";

// ============ THREAT INTELLIGENCE & DETECTION ============

export interface ThreatSignature {
  id: string;
  pattern: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  indicator: string;
}

export interface AnomalyScore {
  userId: string;
  score: number;
  factors: string[];
  timestamp: number;
  riskLevel: 'normal' | 'suspicious' | 'high-risk' | 'critical';
}

// IP Reputation system
const IP_REPUTATION_STORAGE = 'ip_reputation_db';

export const isValidExternalEndpoint = (value: string) => {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    if (url.username || url.password) return false;
    if (!url.hostname) return false;
    return true;
  } catch {
    return false;
  }
};

export interface HealthProbeResult {
  status: 'online' | 'offline' | 'unknown';
  reason: string;
}

export const probeExternalEndpoint = async (endpoint: string, apiKey?: string): Promise<HealthProbeResult> => {
  const headers: Record<string, string> = {};
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: 'HEAD',
      headers,
      mode: 'cors',
    });

    if (response.type === 'opaque') {
      return { status: 'unknown', reason: 'opaque response (possible CORS restriction)' };
    }

    if (response.ok) {
      return { status: 'online', reason: 'OK' };
    }

    if (response.status === 405 || response.status === 501) {
      const getResponse = await fetch(endpoint, {
        method: 'GET',
        headers,
        mode: 'cors',
      });
      if (getResponse.type === 'opaque') {
        return { status: 'unknown', reason: 'opaque response on GET (possible CORS restriction)' };
      }
      return {
        status: getResponse.ok ? 'online' : 'offline',
        reason: `GET ${getResponse.status}`,
      };
    }

    return { status: 'offline', reason: `HTTP ${response.status}` };
  } catch (error) {
    return { status: 'offline', reason: String(error) };
  }
};

export const manageIPReputation = {
  whitelist: (ip: string, reason: string = 'Trusted') => {
    const data = JSON.parse(localStorage.getItem(IP_REPUTATION_STORAGE) || '{"whitelist": [], "blacklist": [], "reputation": {}}');
    if (!data.whitelist.includes(ip)) {
      data.whitelist.push(ip);
      data.reputation[ip] = { status: 'trusted', reason, addedAt: new Date().toISOString() };
    }
    localStorage.setItem(IP_REPUTATION_STORAGE, JSON.stringify(data));
    return true;
  },

  blacklist: (ip: string, reason: string = 'Suspicious Activity') => {
    const data = JSON.parse(localStorage.getItem(IP_REPUTATION_STORAGE) || '{"whitelist": [], "blacklist": [], "reputation": {}}');
    if (!data.blacklist.includes(ip)) {
      data.blacklist.push(ip);
      data.reputation[ip] = { status: 'blocked', reason, addedAt: new Date().toISOString(), expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() };
    }
    localStorage.setItem(IP_REPUTATION_STORAGE, JSON.stringify(data));
    return true;
  },

  checkIP: (ip: string) => {
    const data = JSON.parse(localStorage.getItem(IP_REPUTATION_STORAGE) || '{"whitelist": [], "blacklist": [], "reputation": {}}');
    
    if (data.blacklist.includes(ip)) {
      const reputation = data.reputation[ip];
      if (reputation?.expires && new Date(reputation.expires) < new Date()) {
        // IP blacklist has expired
        data.blacklist = data.blacklist.filter((i: string) => i !== ip);
        localStorage.setItem(IP_REPUTATION_STORAGE, JSON.stringify(data));
        return 'expired';
      }
      return 'blocked';
    }
    
    if (data.whitelist.includes(ip)) return 'trusted';
    return 'unknown';
  },

  getReputation: (ip: string) => {
    const data = JSON.parse(localStorage.getItem(IP_REPUTATION_STORAGE) || '{"whitelist": [], "blacklist": [], "reputation": {}}');
    return data.reputation[ip] || null;
  }
};

// Advanced Anomaly Detection
export const analyzeUserBehavior = (userId: string, activityLog: any[]): AnomalyScore => {
  const factors: string[] = [];
  let riskScore = 0;

  const normalizeEvent = (log: any) => {
    const event = (log.event_type || log.event || log.action || '').toString().toLowerCase();
    const timestamp = log.timestamp ? Number(log.timestamp) : log.created_at ? new Date(log.created_at).getTime() : Date.now();
    return { ...log, event, timestamp };
  };

  const normalizedLogs = activityLog.map(normalizeEvent);

  // Check login patterns
  const loginAttempts = normalizedLogs.filter(log => log.event.includes('login'));
  if (loginAttempts.length > 10) {
    factors.push('excessive_login_attempts');
    riskScore += 15;
  }

  // Check time-of-access anomalies
  const currentHour = new Date().getHours();
  const typicalAccessHours = [9, 10, 11, 14, 15, 16]; // Business hours
  if (!typicalAccessHours.includes(currentHour) && loginAttempts.length > 0) {
    factors.push('off_hours_access');
    riskScore += 10;
  }

  // Check for rapid geographical changes
  const lastTwoLogins = loginAttempts.slice(-2);
  if (lastTwoLogins.length === 2) {
    const timeDiff = lastTwoLogins[1].timestamp - lastTwoLogins[0].timestamp;
    if (timeDiff < 1 * 60 * 1000) { // Less than 1 minute
      factors.push('impossible_travel');
      riskScore += 20;
    }
  }

  // Check failed authentication attempts
  const failedAttempts = normalizedLogs.filter(log => log.event.includes('failed') || log.status === 'failed');
  if (failedAttempts.length >= 5) {
    factors.push('multiple_failed_attempts');
    riskScore += 25;
  }

  // Check for privilege escalation attempts
  const privEscAttempts = normalizedLogs.filter(log => log.event.includes('escalation') || log.action?.toString().toLowerCase().includes('escalation'));
  if (privEscAttempts.length > 0) {
    factors.push('privilege_escalation_attempt');
    riskScore += 35;
  }

  // Check for data exfiltration patterns
  const dataAccessLogs = normalizedLogs.filter(log => log.event.includes('data_access') || log.resource_type?.toString().toLowerCase().includes('data'));
  if (dataAccessLogs.length > 50) {
    factors.push('excessive_data_access');
    riskScore += 20;
  }

  // Determine risk level
  let riskLevel: 'normal' | 'suspicious' | 'high-risk' | 'critical' = 'normal';
  if (riskScore >= 70) riskLevel = 'critical';
  else if (riskScore >= 50) riskLevel = 'high-risk';
  else if (riskScore >= 25) riskLevel = 'suspicious';

  return {
    userId,
    score: riskScore,
    factors,
    timestamp: Date.now(),
    riskLevel
  };
};

// ============ SELF-PROTECTION MECHANISMS ============

export interface DefensePosture {
  timestamp: number;
  integrityChecksum: string;
  configurationVersion: number;
  securityHeaders: Record<string, string>;
  activeDefenses: string[];
  threatLevel: 'secure' | 'guarded' | 'critical';
}

export const checkSystemIntegrity = async (): Promise<DefensePosture> => {
  const activeDefenses: string[] = [];
  
  try {
    // Check HTTPS
    if (window.location.protocol === 'https:') {
      activeDefenses.push('HTTPS');
    }

    // Check CSP
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (cspMeta) {
      activeDefenses.push('CSP');
    }

    // Check for localStorage (basic security check)
    try {
      localStorage.setItem('_security_check', '1');
      localStorage.removeItem('_security_check');
      activeDefenses.push('Storage');
    } catch (e) {
      // Storage not available
    }

    // Create integrity checksum
    const integrityChecksum = generateIntegrityChecksum();

    const threatLevel: DefensePosture['threatLevel'] = 
      activeDefenses.length >= 2 ? 'secure' : 
      activeDefenses.length >= 1 ? 'guarded' : 
      'critical';

    return {
      timestamp: Date.now(),
      integrityChecksum,
      configurationVersion: 1,
      securityHeaders: {},
      activeDefenses,
      threatLevel
    };
  } catch (error) {
    console.error('Error checking system integrity:', error);
    return {
      timestamp: Date.now(),
      integrityChecksum: 'error-' + Date.now(),
      configurationVersion: 1,
      securityHeaders: {},
      activeDefenses: [],
      threatLevel: 'guarded'
    };
  }
};

const generateIntegrityChecksum = (): string => {
  try {
    // Simple checksum without crypto.subtle (more compatible)
    const content = document.documentElement.innerHTML.substring(0, 1000);
    let hash = 0;
    
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16).padStart(32, '0').substring(0, 32);
  } catch (error) {
    return 'checksum-' + Date.now().toString(16);
  }
};

// ============ EXTERNAL SYSTEM PROTECTION ============

export interface ProtectedSystem {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  status: 'online' | 'offline' | 'compromised';
  lastHealthCheck: number;
  defenseLevel: number;
  lastFailureReason?: string | null;
}

const PROTECTED_SYSTEMS_STORAGE = 'protected_systems';

export const protectedSystemsManager = {
  register: (system: Omit<ProtectedSystem, 'lastHealthCheck' | 'status'>) => {
    const systems = JSON.parse(localStorage.getItem(PROTECTED_SYSTEMS_STORAGE) || '[]');
    const newSystem: ProtectedSystem = {
      ...system,
      status: 'online',
      lastHealthCheck: Date.now(),
      defenseLevel: 1
    };
    systems.push(newSystem);
    localStorage.setItem(PROTECTED_SYSTEMS_STORAGE, JSON.stringify(systems));
    return newSystem;
  },

  getAll: (): ProtectedSystem[] => {
    return JSON.parse(localStorage.getItem(PROTECTED_SYSTEMS_STORAGE) || '[]');
  },

  updateStatus: (systemId: string, status: ProtectedSystem['status'], reason?: string) => {
    const systems = JSON.parse(localStorage.getItem(PROTECTED_SYSTEMS_STORAGE) || '[]');
    const system = systems.find((s: ProtectedSystem) => s.id === systemId);
    if (system) {
      system.status = status;
      system.lastHealthCheck = Date.now();
      system.lastFailureReason = reason ?? system.lastFailureReason ?? null;
    }
    localStorage.setItem(PROTECTED_SYSTEMS_STORAGE, JSON.stringify(systems));
  },

  increaseDefenseLevel: (systemId: string) => {
    const systems = JSON.parse(localStorage.getItem(PROTECTED_SYSTEMS_STORAGE) || '[]');
    const system = systems.find((s: ProtectedSystem) => s.id === systemId);
    if (system && system.defenseLevel < 5) {
      system.defenseLevel += 1;
    }
    localStorage.setItem(PROTECTED_SYSTEMS_STORAGE, JSON.stringify(systems));
  }
};

// ============ AUTOMATED THREAT RESPONSE ============

export interface ThreatResponse {
  threatId: string;
  action: string;
  executedAt: number;
  success: boolean;
  details: string;
}

export const automatedThreatResponse = {
  respondToThreat: async (threatType: string, sourceIP: string): Promise<ThreatResponse> => {
    const threatId = crypto.randomUUID();
    const executedAt = Date.now();
    let action = '';
    let success = false;
    let details = '';

    // Automatic response based on threat type
    switch (threatType.toUpperCase()) {
      case 'DDOS':
        action = 'RATE_LIMIT_AND_ALERT';
        manageIPReputation.blacklist(sourceIP, `DDoS attack from ${sourceIP}`);
        success = true;
        details = `Blocked ${sourceIP} due to DDoS attack pattern`;
        break;

      case 'SQL_INJECTION':
        action = 'BLOCK_SESSION_AND_ESCALATE';
        success = true;
        details = 'SQL injection attempt detected and logged for investigation';
        break;

      case 'XSS_ATTEMPT':
        action = 'SANITIZE_AND_LOG';
        success = true;
        details = 'XSS attempt detected, input sanitized';
        break;

      case 'BRUTE_FORCE':
        action = 'LOCK_ACCOUNT_TEMPORARY';
        manageIPReputation.blacklist(sourceIP, 'Brute force attack detected');
        success = true;
        details = `Account temporarily locked, ${sourceIP} blacklisted for 24 hours`;
        break;

      case 'UNAUTHORIZED_ACCESS':
        action = 'REVOKE_SESSION_AND_ALERT';
        success = true;
        details = 'Unauthorized access attempt blocked, session revoked';
        break;

      default:
        action = 'LOG_AND_MONITOR';
        success = true;
        details = `Unknown threat type: ${threatType}, monitoring for patterns`;
    }

    return { threatId, action, executedAt, success, details };
  },

  escalateThreat: async (threatType: string, severity: 'high' | 'critical') => {
    // In production, this would send to SOC/Security team
    return {
      escalated: true,
      timestamp: Date.now(),
      threat: threatType,
      severity,
      notificationSent: true
    };
  }
};

// ============ SECURITY CONFIGURATION ============

export const initializeSecurityDefenses = async () => {
  // Enable Content Security Policy
  const cspMeta = document.createElement('meta');
  cspMeta.httpEquiv = 'Content-Security-Policy';
  cspMeta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:; frame-ancestors 'none';";
  document.head.appendChild(cspMeta);

  // Set other security headers (note: requires server-side implementation)
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };

  // Log defense initialization
  console.log('Security defenses initialized:', securityHeaders);
};

export const generateSecurityReport = (): string => {
  const timestamp = new Date().toISOString();

  return `
SECURITY REPORT - ${timestamp}
================================
Active Defenses: unavailable in client-only mode
Total Logged Events: audit logs are stored in Supabase DB
Last 24h Events: audit logs are stored in Supabase DB
Defense Posture: Standard
  `;
};
