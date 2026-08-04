import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { signInWithEmail, signUpWithEmail, mapSessionToUser } from '../auth'; // Directly linking helper!

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // 1. Initial Session Check & Centralized Auth State Listener
  useEffect(() => {
    let mounted = true;

    // Get initial session safely
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
    }).catch(err => {
      console.error('Session Init Error:', err);
      if (mounted) setLoading(false);
    });

    // Listen for auth state changes
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

  // 2. Fetch Visits (Without breaking global loading state)
  const fetchVisits = async (userId) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('site_visits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching site_visits:', error.message);
      } else {
        setVisits(data || []);
      }
    } catch (err) {
      console.error('Visits Fetch Error:', err);
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

  // 4. Clean Login Handler
  const login = async (email, password) => {
    setAuthError('');
    setLoading(true);

    const { user: authUser, error } = await signInWithEmail(email, password);

    if (error) {
      setAuthError(error);
      setLoading(false);
    } else if (authUser) {
      setUser(authUser);
      await fetchVisits(authUser.id);
    }
  };

  // 5. Clean Signup Handler
  const signup = async (name, email, password, confirmPassword) => {
    setAuthError('');

    if (!name || !email || !password) {
      setAuthError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    const { user: authUser, error } = await signUpWithEmail(name, email, password);

    if (error) {
      setAuthError(error);
      setLoading(false);
    } else if (authUser) {
      setUser(authUser);
      await fetchVisits(authUser.id);
    } else {
      setLoading(false);
    }
  };

  // 6. Logout Handler
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