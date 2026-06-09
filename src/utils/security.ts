import { supabase } from "@/integrations/supabase/client";

// Security utilities for input validation and sanitization

export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  // Remove potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 10) {
    errors.push('Password must be at least 10 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return { valid: errors.length === 0, errors };
};

export const validateIP = (ip: string): boolean => {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
};

const RATE_LIMIT_STORAGE_KEY = 'security_rate_limit';

type RateLimitRecord = Record<string, number[]>;

const readRateLimitStorage = (): RateLimitRecord => {
  try {
    return JSON.parse(localStorage.getItem(RATE_LIMIT_STORAGE_KEY) || '{}') as RateLimitRecord;
  } catch {
    return {};
  }
};

const writeRateLimitStorage = (data: RateLimitRecord) => {
  localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(data));
};

export const rateLimit = (key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean => {
  const now = Date.now();
  const data = readRateLimitStorage();
  const attempts = data[key] || [];
  const validAttempts = attempts.filter(time => now - time < windowMs);

  if (validAttempts.length >= maxAttempts) {
    data[key] = validAttempts;
    writeRateLimitStorage(data);
    return false;
  }

  validAttempts.push(now);
  data[key] = validAttempts;
  writeRateLimitStorage(data);
  return true;
};

export const logSecurityEvent = async (event: string, details?: any) => {
  try {
    const ipAddress = await getClientIp();
    const { error } = await (supabase.rpc as any)("log_security_event", {
      p_event_type: event,
      p_action: details?.action || event,
      p_resource_type: details?.resource_type || "system",
      p_resource_id: details?.resource_id || null,
      p_severity: details?.severity || "info",
      p_status: details?.status || "success",
      p_details: details || {},
      p_ip_address: ipAddress,
      p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      p_source_system: "web-client",
    });

    if (error) {
      console.error("Failed to log security event:", error);
    }
  } catch (error) {
    console.error("Error in logSecurityEvent:", error);
  }
};

const getClientIp = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch {
    return 'unknown';
  }
};

const FAILED_LOGIN_STORAGE_KEY = 'failed_login_attempts';

type FailedLoginRecord = Record<string, number[]>;

const readFailedLoginStorage = (): FailedLoginRecord => {
  try {
    return JSON.parse(localStorage.getItem(FAILED_LOGIN_STORAGE_KEY) || '{}') as FailedLoginRecord;
  } catch {
    return {};
  }
};

const writeFailedLoginStorage = (data: FailedLoginRecord) => {
  localStorage.setItem(FAILED_LOGIN_STORAGE_KEY, JSON.stringify(data));
};

export const recordFailedLoginAttempt = (key: string) => {
  const now = Date.now();
  const data = readFailedLoginStorage();
  const attempts = (data[key] || []).filter(ts => now - ts < 10 * 60 * 1000);
  attempts.push(now);
  data[key] = attempts;
  writeFailedLoginStorage(data);
};

export const checkForSuspiciousActivity = (key: string) => {
  const now = Date.now();
  const data = readFailedLoginStorage();
  const attempts = (data[key] || []).filter(ts => now - ts < 10 * 60 * 1000);
  if (attempts.length > 3) {
    void logSecurityEvent('suspicious_activity_detected', { type: 'rapid_failed_logins', count: attempts.length });
    return true;
  }
  return false;
};

// ============ ADVANCED SECURITY FEATURES ============

// Multi-Factor Authentication (MFA) Support
export const mfaManager = {
  enableMFA: (userId: string, method: 'totp' | 'sms' | 'email' = 'totp') => {
    const mfaStore = JSON.parse(localStorage.getItem('mfa_settings') || '{}');
    mfaStore[userId] = {
      enabled: true,
      method,
      enabledAt: new Date().toISOString(),
      verified: false
    };
    localStorage.setItem('mfa_settings', JSON.stringify(mfaStore));
    logSecurityEvent('mfa_enabled', { userId, method });
    return true;
  },

  disableMFA: (userId: string) => {
    const mfaStore = JSON.parse(localStorage.getItem('mfa_settings') || '{}');
    if (mfaStore[userId]) {
      mfaStore[userId].enabled = false;
    }
    localStorage.setItem('mfa_settings', JSON.stringify(mfaStore));
    logSecurityEvent('mfa_disabled', { userId });
    return true;
  },

  isMFAEnabled: (userId: string): boolean => {
    const mfaStore = JSON.parse(localStorage.getItem('mfa_settings') || '{}');
    return mfaStore[userId]?.enabled ?? false;
  },

  getMFAMethod: (userId: string): 'totp' | 'sms' | 'email' | null => {
    const mfaStore = JSON.parse(localStorage.getItem('mfa_settings') || '{}');
    return mfaStore[userId]?.method ?? null;
  }
};

// API Key Management
export const apiKeyManager = {
  generateAPIKey: (name: string, permissions: string[] = ['read']): string => {
    const prefix = 'sk_';
    const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const apiKey = prefix + randomPart;

    const keys = JSON.parse(localStorage.getItem('api_keys') || '{}');
    keys[apiKey] = {
      name,
      permissions,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      active: true
    };
    localStorage.setItem('api_keys', JSON.stringify(keys));
    logSecurityEvent('api_key_created', { name });
    return apiKey;
  },

  validateAPIKey: (apiKey: string): boolean => {
    const keys = JSON.parse(localStorage.getItem('api_keys') || '{}');
    const key = keys[apiKey];
    if (!key || !key.active) return false;
    
    keys[apiKey].lastUsed = new Date().toISOString();
    localStorage.setItem('api_keys', JSON.stringify(keys));
    return true;
  },

  revokeAPIKey: (apiKey: string) => {
    const keys = JSON.parse(localStorage.getItem('api_keys') || '{}');
    if (keys[apiKey]) {
      keys[apiKey].active = false;
      keys[apiKey].revokedAt = new Date().toISOString();
    }
    localStorage.setItem('api_keys', JSON.stringify(keys));
    logSecurityEvent('api_key_revoked', { key: apiKey.substring(0, 10) + '...' });
    return true;
  },

  listAPIKeys: () => {
    return JSON.parse(localStorage.getItem('api_keys') || '{}');
  }
};

// Session Management
export const sessionManager = {
  createSecureSession: (userId: string, expiryMinutes: number = 60): string => {
    const sessionId = crypto.randomUUID();
    const sessions = JSON.parse(localStorage.getItem('sessions') || '{}');
    
    sessions[sessionId] = {
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString(),
      active: true,
      ipAddress: 'client-side', // In production, use actual IP
      userAgent: navigator.userAgent
    };
    
    localStorage.setItem('sessions', JSON.stringify(sessions));
    logSecurityEvent('session_created', { userId, expiryMinutes });
    return sessionId;
  },

  validateSession: (sessionId: string): boolean => {
    const sessions = JSON.parse(localStorage.getItem('sessions') || '{}');
    const session = sessions[sessionId];
    
    if (!session || !session.active) return false;
    if (new Date(session.expiresAt) < new Date()) {
      session.active = false;
      localStorage.setItem('sessions', JSON.stringify(sessions));
      return false;
    }
    
    return true;
  },

  revokeSession: (sessionId: string) => {
    const sessions = JSON.parse(localStorage.getItem('sessions') || '{}');
    if (sessions[sessionId]) {
      sessions[sessionId].active = false;
      sessions[sessionId].revokedAt = new Date().toISOString();
    }
    localStorage.setItem('sessions', JSON.stringify(sessions));
    logSecurityEvent('session_revoked', { sessionId });
    return true;
  }
};

// Data Encryption Helper (for sensitive fields)
export const dataEncryption = {
  encryptSensitiveField: async (data: string, keyMaterial?: string): Promise<string> => {
    // In production, use an audited encryption library (crypto-js or TweetNaCl.js)
    // Client-side hashing used as a placeholder; perform real encryption server-side
    const encoder = new TextEncoder();
    const encoded = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return 'enc_' + hashHex;
  },

  isDataEncrypted: (data: string): boolean => {
    return data.startsWith('enc_');
  }
};

// CORS & Security Headers Management
export const securityHeaders = {
  enforceCSP: () => {
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!cspMeta) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:";
      document.head.appendChild(meta);
      logSecurityEvent('csp_enforced', {});
    }
  },

  enforceHSTS: () => {
    // HSTS should be set server-side, but we can log client-side enforcement
    if (window.location.protocol === 'https:') {
      logSecurityEvent('hsts_available', { protocol: 'https' });
    }
  },

  getSecurityHeaders: () => {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };
  }
};
