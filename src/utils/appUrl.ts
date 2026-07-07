export const getAppBaseUrl = (): string => {
  const configuredUrl = import.meta.env.VITE_APP_URL as string | undefined;

  if (configuredUrl && configuredUrl.trim()) {
    const normalized = configuredUrl.trim();
    if (/^https?:\/\//i.test(normalized)) {
      return normalized.replace(/\/$/, '');
    }

    return `https://${normalized.replace(/\/$/, '')}`;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return 'http://localhost:5173';
};
