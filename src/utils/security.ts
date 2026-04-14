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

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
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

export const rateLimit = (() => {
  const attempts = new Map<string, number[]>();

  return (key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean => {
    const now = Date.now();
    const userAttempts = attempts.get(key) || [];

    // Remove old attempts outside the window
    const validAttempts = userAttempts.filter(time => now - time < windowMs);

    if (validAttempts.length >= maxAttempts) {
      return false; // Rate limited
    }

    validAttempts.push(now);
    attempts.set(key, validAttempts);
    return true; // Allowed
  };
})();

export const logSecurityEvent = (event: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY ${timestamp}] ${event}`, details);

  // In a real app, this would send to a security logging service
  // For now, we'll store in localStorage for demo purposes
  const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
  logs.push({ timestamp, event, details });
  // Keep only last 100 logs
  if (logs.length > 100) logs.shift();
  localStorage.setItem('security_logs', JSON.stringify(logs));
};

export const checkForSuspiciousActivity = () => {
  // Check for rapid successive failed login attempts
  const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
  const recentLogs = logs.filter((log: any) =>
    log.event.includes('login_failed') &&
    Date.now() - new Date(log.timestamp).getTime() < 10 * 60 * 1000 // Last 10 minutes
  );

  if (recentLogs.length > 3) {
    logSecurityEvent('suspicious_activity_detected', { type: 'rapid_failed_logins', count: recentLogs.length });
    return true;
  }

  return false;
};