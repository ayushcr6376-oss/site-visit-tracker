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
    // Check active session
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

    // Listen for Auth Changes (Sign In, Sign Out, etc.)
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

  // 2. Fetch Visits (ONLY for Current User ID)
  const fetchVisits = async (userId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVisits(data || []);
    } catch (err) {
      console.error('Error fetching visits:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Add New Visit (Attaching Current User ID)
  const addVisit = async (visitData) => {
    if (!user) return;
    try {
      const newEntry = {
        ...visitData,
        user_id: user.id, // 👈 Ensures data stays private to this user
      };

      const { data, error } = await supabase
        .from('visits')
        .insert([newEntry])
        .select();

      if (error) throw error;
      if (data) {
        setVisits((prev) => [data[0], ...prev]);
      }
    } catch (err) {
      console.error('Error adding visit:', err.message);
    }
  };

  // 4. Sign Up Function
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
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // 5. Login Function
  const login = async (email, password) => {
    setAuthError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // 6. Logout Function (Clears State)
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setVisits([]); // 👈 Clear data on logout
    localStorage.clear(); // 👈 Clear local storage
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