import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import { signInWithEmail, signUpWithEmail, mapSessionToUser } from '../utils/auth';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [visits, setVisits] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // 1. Session Check & Listener
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        const mappedUser = mapSessionToUser(session);
        setUser(mappedUser);
        fetchVisits();
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
        fetchVisits();
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

  // 2. Fetch Visits with Universal Field Fallbacks
  const fetchVisits = async () => {
    try {
      const { data, error } = await supabase
        .from('site_visits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching site_visits:', error.message);
      } else {
        const mapped = (data || []).map((row) => ({
          id: row.id,
          visitDate: row.visit_date || (row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
          clientCompany: row.client_company || row.site_name || 'Industrial Site',
          parentCompany: row.parent_company || row.manager_name || '',
          visitType: row.visit_type || 'Site Visit',
          keyTask: row.key_task || row.keyTask || row.purpose || 'No tasks logged.',
          inTime: row.in_time || row.inTime || row.check_in || '—',
          outTime: row.out_time || row.outTime || row.check_out || '—',
          payoutAmount: Number(row.payout_amount || row.payoutAmount || 0),
          status: row.status || 'PAID',
          signature: row.signature || null,
          createdAt: row.created_at,
        }));
        setVisits(mapped);
      }
    } catch (err) {
      console.error('Visits Fetch Catch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Add Visit (Saves both Naming Formats so DB never fails)
  const addVisit = async (visitData) => {
    try {
      const newEntry = {
        user_id: user?.id || null,
        site_name: visitData.clientCompany || visitData.site_name || 'Industrial Site',
        client_company: visitData.clientCompany || visitData.site_name || 'Industrial Site',
        parent_company: visitData.parentCompany || visitData.manager_name || '',
        manager_name: visitData.parentCompany || visitData.manager_name || '',
        purpose: visitData.keyTask || visitData.purpose || '',
        key_task: visitData.keyTask || visitData.purpose || '',
        keyTask: visitData.keyTask || visitData.purpose || '',
        check_in: visitData.inTime || visitData.check_in || '—',
        check_out: visitData.outTime || visitData.check_out || '—',
        in_time: visitData.inTime || visitData.check_in || '—',
        out_time: visitData.outTime || visitData.check_out || '—',
        payout_amount: Number(visitData.payoutAmount || 0),
        payoutAmount: Number(visitData.payoutAmount || 0),
        visit_type: visitData.visitType || 'Site Visit',
        status: visitData.status || 'PAID',
        visit_date: visitData.visitDate || new Date().toISOString().split('T')[0],
        signature: visitData.signature || null,
      };

      const { data, error } = await supabase
        .from('site_visits')
        .insert([newEntry])
        .select();

      if (error) {
        console.error('Error adding site_visit:', error.message);
        throw error;
      }

      await fetchVisits();
      return { success: true };
    } catch (err) {
      console.error('Error in addVisit:', err);
      throw err;
    }
  };

  // 4. Delete Visit
  const deleteVisit = async (visitId) => {
    try {
      const { error } = await supabase.from('site_visits').delete().eq('id', visitId);
      if (error) throw error;
      setVisits((prev) => prev.filter((v) => v.id !== visitId));
    } catch (err) {
      console.error('Error deleting visit:', err.message);
    }
  };

  // 5. Filtered Visits Search
  const filteredVisits = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return visits;
    return visits.filter((v) =>
      [v.clientCompany, v.parentCompany, v.keyTask, v.visitType, v.status, v.inTime, v.outTime]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [visits, searchQuery]);

  // 6. Summary Calculator
  const summary = useMemo(() => {
    const totalVisits = visits.length;
    const totalPayout = visits.reduce((acc, curr) => acc + (curr.payoutAmount || 0), 0);
    const paidVisits = visits.filter((v) => v.status === 'PAID').length;
    const pendingVisits = visits.filter((v) => v.status === 'PENDING').length;
    return { totalVisits, totalPayout, paidVisits, pendingVisits };
  }, [visits]);

  // 7. Auth Functions
  const login = async (email, password) => {
    setAuthError('');
    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }
    const { user: authUser, error } = await signInWithEmail(email, password);
    if (error) setAuthError(error);
    else if (authUser) setUser(authUser);
  };

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
    if (error) setAuthError(error);
    else if (authUser) setUser(authUser);
  };

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
        filteredVisits,
        summary,
        searchQuery,
        setSearchQuery,
        loading,
        authError,
        setAuthError,
        login,
        signup,
        logout,
        addVisit,
        deleteVisit,
        fetchVisits,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);