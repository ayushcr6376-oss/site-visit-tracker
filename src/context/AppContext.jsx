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

  // 2. Fetch Visits from 'site_visits' Table
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

  // 3. Add New Visit
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

  // 4. Smart Zero-Error Sign Up Function
  const signup = async (name, email, password, confirmPassword) => {
    setAuthError('');

    if (!email || !password) {
      setAuthError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // STEP A: Direct Login Attempt (To bypass 422 for already existing accounts)
    const { data: loginData } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password,
    });

    if (loginData?.user) {
      setUser(loginData.user);
      fetchVisits(loginData.user.id);
      return;
    }

    // STEP B: If account is brand new, execute SignUp
    try {
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
      });

      if (signUpErr) throw signUpErr;

      if (signUpData?.user) {
        setUser(signUpData.user);
        if (signUpData?.session) {
          fetchVisits(signUpData.user.id);
        } else {
          // Instant Fallback Login
          await login(cleanEmail, password);
        }
      }
    } catch (err) {
      // Fallback: If SignUp fails due to 422 or duplicate error, force final login
      try {
        const { data: finalLogin, error: finalErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (finalLogin?.user) {
          setUser(finalLogin.user);
          fetchVisits(finalLogin.user.id);
          return;
        }

        if (finalErr) throw finalErr;
      } catch (e) {
        setAuthError(err.message || 'Authentication error. Please check your credentials.');
      }
    }
  };

  // 5. Login Function
  const login = async (email, password) => {
    setAuthError('');
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
      setAuthError(err.message);
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