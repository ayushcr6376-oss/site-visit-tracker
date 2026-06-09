import { supabase } from '../lib/supabase';

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

export function mapSessionToUser(session) {
  if (!session?.user) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name:
      session.user.user_metadata?.name ||
      session.user.email?.split('@')[0] ||
      'User',
  };
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    return { user: null, error: mapAuthError(error.message) };
  }

  return { user: mapSessionToUser(data.session), error: null };
}

export async function signUpWithEmail(name, email, password) {
  const trimmedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: { name: trimmedName },
    },
  });

  if (error) {
    return { user: null, error: mapAuthError(error.message) };
  }

  if (data.user && !data.session) {
    return {
      user: null,
      error:
        'Account created. Please check your email to confirm, then sign in.',
    };
  }

  return { user: mapSessionToUser(data.session), error: null };
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

function mapAuthError(message) {
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (normalized.includes('user already registered')) {
    return 'An account with this email already exists.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Please confirm your email before signing in.';
  }
  if (normalized.includes('password')) {
    return 'Password must be at least 6 characters.';
  }

  return message;
}

export function onAuthStateChange(callback) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => subscription.unsubscribe();
}
