import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import { signInWithEmail, signUpWithEmail, mapSessionToUser } from '../utils/auth';

const AppContext = createContext();

// Helper to calculate hours between formatted times (e.g. "09:00 AM" to "06:00 PM")
function calculateTimeDuration(inTimeStr, outTimeStr) {
  if (!inTimeStr || !outTimeStr || inTimeStr === '—' || outTimeStr === '—') return 0;
  try {
    const parseTime = (t) => {
      const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const period = match[3].toUpperCase();
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const inMinutes = parseTime(inTimeStr);
    const outMinutes = parseTime(outTimeStr);
    if (inMinutes === null || outMinutes === null) return 0;

    let diff = outMinutes - inMinutes;
    if (diff < 0) diff += 24 * 60;
    return Number((diff / 60).toFixed(1));
  } catch {
    return 0;
  }
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [visits, setVisits] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // 1. Session Check & Auth Listener
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

  // 2. Fetch Visits (User Isolated & Complete Mapping)
  const fetchVisits = async (userId) => {
    const currentUserId = userId || user?.id;
    if (!currentUserId) {
      setVisits([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('site_visits')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching site_visits:', error.message);
      } else {
        const mapped = (data || []).map((row) => {
          const inTimeVal = row.in_time || row.inTime || row.check_in || '—';
          const outTimeVal = row.out_time || row.outTime || row.check_out || '—';
          const rawTask = row.key_task || row.keyTask || row.purpose || row.task || '';
          
          // Direct check on every possible payout field
          const rawPayout = row.payout_amount !== undefined && row.payout_amount !== null ? row.payout_amount : 
                            (row.payoutAmount !== undefined && row.payoutAmount !== null ? row.payoutAmount : (row.payout || 0));

          return {
            id: row.id,
            visitDate: row.visit_date || (row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
            clientCompany: row.client_company || row.site_name || 'Industrial Site',
            parentCompany: row.parent_company || row.manager_name || '',
            visitType: row.visit_type || 'Site Visit',
            keyTask: rawTask ? String(rawTask) : 'No tasks logged.',
            inTime: inTimeVal,
            outTime: outTimeVal,
            durationHours: calculateTimeDuration(inTimeVal, outTimeVal),
            payoutAmount: Number(rawPayout) || 0,
            status: row.status || 'pending',
            signature: row.signature || null,
            createdAt: row.created_at,
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

  // 3. Add Visit
  const addVisit = async (visitData) => {
    try {
      const activeUser = user || (await supabase.auth.getUser()).data?.user;
      if (!activeUser) throw new Error('User not logged in');

      const taskVal = visitData.keyTask || visitData.key_task || visitData.purpose || '';
      const payoutVal = Number(visitData.payoutAmount || visitData.payout_amount || visitData.payout || 0);
      const inT = visitData.inTime || visitData.check_in || '—';
      const outT = visitData.outTime || visitData.check_out || '—';

      const newEntry = {
        user_id: activeUser.id,
        site_name: visitData.clientCompany || visitData.site_name || 'Industrial Site',
        client_company: visitData.clientCompany || visitData.site_name || 'Industrial Site',
        parent_company: visitData.parentCompany || '',
        purpose: taskVal,
        key_task: taskVal,
        keyTask: taskVal,
        check_in: inT,
        check_out: outT,
        in_time: inT,
        out_time: outT,
        payout_amount: payoutVal,
        payoutAmount: payoutVal,
        visit_type: visitData.visitType || 'Site Visit',
        status: visitData.status || 'pending',
        visit_date: visitData.visitDate || new Date().toISOString().split('T')[0],
        signature: visitData.signature || null,
      };

      const { error } = await supabase.from('site_visits').insert([newEntry]);

      if (error) {
        console.error('Error adding site_visit:', error.message);
        throw error;
      }

      await fetchVisits(activeUser.id);
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

  // 5. Search Filter
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

  // 6. Summary Calculation with ALL Metrics Aliases
  const summary = useMemo(() => {
    const totalVisits = visits.length;
    
    // Exact Total Billings Calculation
    const totalAmount = visits.reduce((acc, curr) => {
      const amt = Number(curr.payoutAmount || curr.payout_amount || 0);
      return acc + (isNaN(amt) ? 0 : amt);
    }, 0);

    // Exact Total Hours Calculation
    const totalHours = visits.reduce((acc, curr) => {
      const hrs = Number(curr.durationHours || 0);
      return acc + (isNaN(hrs) ? 0 : hrs);
    }, 0);

    const paidVisits = visits.filter((v) => 
      String(v.status).toLowerCase() === 'paid' || String(v.status).toLowerCase() === 'completed'
    ).length;

    const pendingVisits = visits.filter((v) => 
      String(v.status).toLowerCase() === 'pending'
    ).length;

    return {
      totalVisits,
      totalBillings: totalAmount,
      totalBilling: totalAmount,
      totalPayout: totalAmount,
      totalEarnings: totalAmount,
      totalHours: Number(totalHours.toFixed(1)),
      totalHoursLogged: Number(totalHours.toFixed(1)),
      paidVisits,
      pendingVisits,
    };
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