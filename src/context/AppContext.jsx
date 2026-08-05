import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // 1. Independent Auth State Listener
  useEffect(() => {
    // Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        fetchVisits(currentUser.id);
      }
    }).catch((err) => {
      console.error('Session error:', err);
      setLoading(false);
    });

    // Real-time Auth Subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        fetchVisits(currentUser.id);
      } else {
        setVisits([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch Visits (Fail-safe, will never block Auth)
  const fetchVisits = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('site_visits')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setVisits(data);
      }
    } catch (err) {
      console.error('Error fetching visits:', err);
    }
  };

  // 3. Add Visit
  const addVisit = async (visitData) => {
    try {
      const newEntry = user ? { ...visitData, user_id: user.id } : visitData;
      const { data, error } = await supabase
        .from('site_visits')
        .insert([newEntry])
        .select();

      if (!error && data) {
        setVisits((prev) => [data[0], ...prev]);
      }
    } catch (err) {
      console.error('Error adding visit:', err);
    }
  };

  // 4. Pure Direct Login
  const login = async (email, password) => {
    setAuthError('');
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (error) throw error;

      if (data?.user) {
        setUser(data.user);
        fetchVisits(data.user.id);
      }
    } catch (err) {
      setAuthError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Pure Direct Signup
  const signup = async (name, email, password, confirmPassword) => {
    setAuthError('');

    if (!email || !password) {
      setAuthError('Please fill in all required fields.');
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

    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: { name: name?.trim() || 'User' }
        }
      });

      if (error) throw error;

      if (data?.user) {
        setUser(data.user);
        if (data?.session) {
          fetchVisits(data.user.id);
        } else {
          setAuthError('Registration successful! Please sign in.');
        }
      }
    } catch (err) {
      setAuthError(err.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Direct Logout
  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setVisits([]);
    setLoading(false);
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