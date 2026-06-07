import { AUTH_TOKEN_PREFIX, STORAGE_KEYS } from './constants';

export function generateAuthToken(userId) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 12);
  return `${AUTH_TOKEN_PREFIX}${userId}_${timestamp}_${random}`;
}

export function saveAuthSession(user, token) {
  localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
}

export function clearAuthSession() {
  localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
}

export function getStoredAuth() {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const userRaw = localStorage.getItem(STORAGE_KEYS.AUTH_USER);

  if (!token || !userRaw) {
    return { user: null, token: null };
  }

  try {
    const user = JSON.parse(userRaw);
    if (!user?.id || !user?.email || !user?.name) {
      return { user: null, token: null };
    }
    if (!token.startsWith(AUTH_TOKEN_PREFIX)) {
      return { user: null, token: null };
    }
    return { user, token };
  } catch {
    return { user: null, token: null };
  }
}

export function getRegisteredUsers() {
  const raw = localStorage.getItem('isvt_users');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveRegisteredUsers(users) {
  localStorage.setItem('isvt_users', JSON.stringify(users));
}

export function validateEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email.trim());
}

export function validatePassword(password) {
  return password.length >= 6;
}

export function validateName(name) {
  return name.trim().length >= 2;
}
