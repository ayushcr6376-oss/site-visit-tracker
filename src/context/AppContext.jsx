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

  // Fetch visits with ultimate fallback for ALL naming conventions
  const fetchVisits = async () => {
    try {
      const { data, error } = await supabase
        .from('site_visits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching site_visits:', error.message);
      } else {
        const mapped = (data || []).map((row) => {
          // Task extraction
          const rawTask = row.key_task || row.keyTask || row.purpose || row.task || '';
          
          // Payout extraction
          const rawPayout = row.payout_amount !== undefined && row.payout_amount !== null ? row.payout_amount : 
                            (row.payoutAmount !== undefined && row.payoutAmount !== null ? row.payoutAmount : row.payout);

          return {
            id: row.id,
            visitDate: row.visit_date || row.visitDate || (row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
            clientCompany: row.client_company || row.clientCompany || row.site_name || 'Industrial Site',
            parentCompany: row.parent_company || row.parentCompany || row.manager_name || '',
            visitType: row.visit_type || row.visitType || 'Site Visit',
            keyTask: rawTask ? String(rawTask) : '',
            inTime: row.in_time || row.inTime || row.check_in || '—',
            outTime: row.out_time || row.outTime || row.check_out || '—',
            payoutAmount: rawPayout !== undefined && rawPayout !== null ? Number(rawPayout) : 0,
            status: row.status || 'pending',
            signature: row.signature || null,
            createdAt: row.created_at,
            rawRow: row // Backup of raw DB row
          };
        });
        setVisits(mapped);
      }
    } catch (err) {
      console.error('Visits Fetch Catch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addVisit = async (visitData) => {
    try {
      const taskVal = visitData.keyTask || visitData.key_task || visitData.purpose || '';
      const payoutVal = Number(visitData.payoutAmount || visitData.payout_amount || visitData.payout || 0);

      const newEntry = {
        user_id: user?.id || null,
        site_name: visitData.clientCompany || visitData.site_name || 'Industrial Site',
        client_company: visitData.clientCompany || visitData.site_name || 'Industrial Site',
        parent_company: visitData.parentCompany || '',
        purpose: taskVal,
        key_task: taskVal,
        keyTask: taskVal,
        check_in: visitData.inTime || visitData.check_in || '—',
        check_out: visitData.outTime || visitData.check_out || '—',
        in_time: visitData.inTime || visitData.check_in || '—',
        out_time: visitData.outTime || visitData.check_out || '—',
        payout_amount: payoutVal,
        payoutAmount: payoutVal,
        visit_type: visitData.visitType || 'Site Visit',
        status: visitData.status || 'pending',
        visit_date: visitData.visitDate || new Date().toISOString().split('T')[0],
        signature: visitData.signature || null,
      };

      const { error } = await supabase
        .from('site_visits')
        .insert([newEntry]);

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

  const deleteVisit = async (visitId) => {
    try {
      const { error } = await supabase.from('site_visits').delete().eq('id', visitId);
      if (error) throw error;
      setVisits((prev) => prev.filter((v) => v.id !== visitId));
    } catch (err) {
      console.error('Error deleting visit:', err.message);
    }
  };

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

  const summary = useMemo(() => {
    const totalVisits = visits.length;
    const totalPayout = visits.reduce((acc, curr) => acc + (curr.payoutAmount || 0), 0);
    const paidVisits = visits.filter((v) => v.status === 'PAID' || v.status === 'completed').length;
    const pendingVisits = visits.filter((v) => v.status === 'PENDING' || v.status === 'pending').length;
    return { totalVisits, totalPayout, paidVisits, pendingVisits };
  }, [visits]);

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