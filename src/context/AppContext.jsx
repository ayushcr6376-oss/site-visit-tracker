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
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchVisits(currentUser.id);
      } else {
        setVisits([]);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchVisits(currentUser.id);
      } else {
        setVisits([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch Visits from 'site_visits' Table (ONLY for Current User ID)
  const fetchVisits = async (userId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('site_visits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVisits(data || []);
    } catch (err) {
      console.error('Error fetching site_visits:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Add New Visit to 'site_visits' Table
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
      if (data) {
        setVisits((prev) => [data[0], ...prev]);
      }
    } catch (err) {
      console.error('Error adding site_visit:', err.message);
    }
  };

  // 4. Fixed Sign Up Function
  const signup = async (name, email, password, confirmPassword) => {
    setAuthError('');
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      });

      if (error) throw error;

      // Agar session instantly mila
      if (data?.session) {
        setUser(data.session.user);
        fetchVisits(data.session.user.id);
      } else {
        // Agar account create ho gaya, direct login execute karo
        await login(email, password);
      }
    } catch (err) {
      // Handling duplicate email gracefully
      if (err.message.includes('already registered')) {
        try {
          await login(email, password);
        } catch (loginErr) {
          setAuthError('User already exists. Please login with your password.');
        }
      } else {
        setAuthError(err.message);
      }
    }
  };

  // 5. Login Function
  const login = async (email, password) => {
    setAuthError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data?.user) {
        setUser(data.user);
        fetchVisits(data.user.id);
      }
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // 6. Logout Function (Clears State & Storage)
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