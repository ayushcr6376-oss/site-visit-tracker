import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // 1. Initial Session Check & Auth State Listener
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchVisits(currentUser.id);
        }
      } catch (err) {
        console.error('Session Init Error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchVisits(currentUser.id);
      } else {
        setVisits([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch Visits
  const fetchVisits = async (userId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('site_visits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) console.error('Error fetching site_visits:', error.message);
      else setVisits(data || []);
    } catch (err) {
      console.error('Visits Fetch Catch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Add Visit
  const addVisit = async (visitData) => {
    if (!user) return;
    try {
      const newEntry = {
        ...visitData,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('site_visits')
        .insert([newEntry])
        .select();

      if (error) throw error;
      if (data) setVisits((prev) => [data[0], ...prev]);
    } catch (err) {
      console.error('Error adding site_visit:', err.message);
    }
  };

  // 4. Clean Login Function
  const login = async (email, password) => {
    setAuthError('');
    setLoading(true);

    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (error) throw error;

      if (data?.user) {
        setUser(data.user);
        await fetchVisits(data.user.id);
      }
    } catch (err) {
      console.error('Login Failed:', err);
      setAuthError(err.message || 'Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Clean Signup Function
  const signup = async (name, email, password, confirmPassword) => {
    setAuthError('');
    setLoading(true);

    if (!email || !password) {
      setAuthError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
      });

      if (error) throw error;

      if (data?.session) {
        setUser(data.session.user);
        await fetchVisits(data.session.user.id);
      } else if (data?.user) {
        // Direct attempt to login after signup
        const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (loginData?.user) {
          setUser(loginData.user);
          await fetchVisits(loginData.user.id);
        } else {
          setAuthError('Account created! Please switch to Sign In and log in.');
        }
      }
    } catch (err) {
      console.error('Signup Failed:', err);
      if (err.message?.includes('already registered')) {
        setAuthError('Account already exists. Please go to Sign In tab.');
      } else {
        setAuthError(err.message || 'Signup failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 6. Logout
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