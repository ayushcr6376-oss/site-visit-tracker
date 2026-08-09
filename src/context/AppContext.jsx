import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';
// ✅ Path fixed to '../utils/auth' to fix Vercel build crash
import { signInWithEmail, signUpWithEmail, mapSessionToUser } from '../utils/auth';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // 1. Initial Session Check & Realtime Auth Listener
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        const mappedUser = mapSessionToUser(session);
        setUser(mappedUser);
        fetchVisits(session.user.id);
      } else {
        setUser(null);
        setVisits([]);
        setLoading(false);
      }
    }).catch((err) => {
      console.error('Session Init Error:', err);
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        const mappedUser = mapSessionToUser(session);
        setUser(mappedUser);
        fetchVisits(session.user.id);
      } else {
        setUser(null);
        setVisits([]);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 2. Fetch Visits
  const fetchVisits = async (userId) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('site_visits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching site_visits:', error.message);
      } else {
        setVisits(data || []);
      }
    } catch (err) {
      console.error('Visits Fetch Catch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Add Visit (Updated to handle insert properly and fetch fresh list)
  const addVisit = async (visitData) => {
    try {
      const newEntry = user ? { ...visitData, user_id: user.id } : visitData;
      
      const { data, error } = await supabase
        .from('site_visits')
        .insert([newEntry])
        .select();

      if (error) {
        console.error('Error adding site_visit:', error.message);
        throw error;
      }

      if (data && data.length > 0) {
        setVisits((prev) => [data[0], ...prev]);
      } else if (user?.id) {
        fetchVisits(user.id);
      }
      return { success: true };
    } catch (err) {
      console.error('Error in addVisit:', err);
      throw err;
    }
  };

  // 4. Login Function
  const login = async (email, password) => {
    setAuthError('');

    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }

    const { user: authUser, error } = await signInWithEmail(email, password);

    if (error) {
      setAuthError(error);
    } else if (authUser) {
      setUser(authUser);
    }
  };

  // 5. Signup Function
  const signup = async (name, email, password, confirmPassword) => {
    setAuthError('');

    if (!email || !password) {
      setAuthError('Please fill in required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    const { user: authUser, error } = await signUpWithEmail(name || 'User', email, password);

    if (error) {
      setAuthError(error);
    } else if (authUser) {
      setUser(authUser);
    }
  };

  // 6. Logout Function
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setVisits([]);
    localStorage.clear();
  };

  return (
    <AppContext.Provider
      value={{
        user,
        visits,
        loading,
        authError,
        setAuthError,
        login,
        signup,
        logout,
        addVisit,
        fetchVisits,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);