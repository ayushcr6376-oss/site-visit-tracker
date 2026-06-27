import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  mapSessionToUser,
  onAuthStateChange,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
  validateEmail,
  validateName,
  validatePassword,
} from '../utils/auth';
import {
  computeSummary,
  createVisit,
  deleteVisitById,
  fetchVisits,
} from '../utils/storage';
import { VISIT_STATUS } from '../utils/constants';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [visits, setVisits] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const loadUserVisits = useCallback(async (userId) => {
    setVisitsLoading(true);
    try {
      const data = await fetchVisits(userId);
      setVisits(data || []);
    } catch {
      setAuthError('Failed to load visits from cloud. Please refresh the page.');
      setVisits([]);
    } finally {
      setVisitsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((session) => {
      const nextUser = mapSessionToUser(session);
      setUser(nextUser);
      setAuthLoading(false);

      if (nextUser) {
        loadUserVisits(nextUser.id);
      } else {
        setVisits([]);
        setVisitsLoading(false);
      }
    });

    return unsubscribe;
  }, [loadUserVisits]);

  const summary = useMemo(() => computeSummary(visits), [visits]);

  // Master sorted and filtered visits log
  const filteredVisits = useMemo(() => {
    const sortedRaw = [...visits].sort(
      (a, b) => new Date(b.createdAt || b.visitDate).getTime() - new Date(a.createdAt || a.visitDate).getTime()
    );

    const query = searchQuery.trim().toLowerCase();
    if (!query) return sortedRaw;

    return sortedRaw.filter((visit) => {
      const haystack = [
        visit.clientCompany,
        visit.parentCompany,
        visit.visitType,
        visit.keyTask,
        visit.status,
        visit.visitDate,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [visits, searchQuery]);

  const login = useCallback(async (email, password) => {
    setAuthError('');

    if (!validateEmail(email)) {
      setAuthError('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setAuthError('Password is required.');
      return false;
    }

    const { user: signedInUser, error } = await signInWithEmail(email, password);
    if (error) {
      setAuthError(error);
      return false;
    }

    setUser(signedInUser);
    if (signedInUser) {
      await loadUserVisits(signedInUser.id);
    }
    return true;
  }, [loadUserVisits]);

  const signup = useCallback(async (name, email, password, confirmPassword) => {
    setAuthError('');
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!validateName(trimmedName)) {
      setAuthError('Name must be at least 2 characters.');
      return false;
    }
    if (!validateEmail(normalizedEmail)) {
      setAuthError('Please enter a valid email address.');
      return false;
    }
    if (!validatePassword(password)) {
      setAuthError('Password must be at least 6 characters.');
      return false;
    }
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return false;
    }

    const { user: newUser, error } = await signUpWithEmail(
      trimmedName,
      normalizedEmail,
      password
    );

    if (error) {
      setAuthError(error);
      return false;
    }

    setUser(newUser);
    if (newUser) {
      setVisits([]);
    }
    return true;
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOutUser();
    } catch {
      setAuthError('Failed to sign out. Please try again.');
      return;
    }
    setUser(null);
    setVisits([]);
    setSearchQuery('');
    setAuthError('');
  }, []);

  const addVisit = useCallback(
    async (visitData) => {
      if (!user?.id) return false;

      try {
        const newVisit = await createVisit(user.id, {
          visitDate: visitData.visitDate,
          durationHours: visitData.durationHours,
          durationMinutes: visitData.durationMinutes,
          clientCompany: visitData.clientCompany,
          parentCompany: visitData.parentCompany,
          payoutAmount: visitData.payoutAmount,
          visitType: visitData.visitType,
          keyTask: visitData.keyTask,
          status: visitData.status || VISIT_STATUS.PENDING,
          signature: visitData.signature || null,
        });
        setVisits((prev) => [newVisit, ...prev]);
        return true;
      } catch {
        setAuthError('Failed to save visit. Please try again.');
        return false;
      }
    },
    [user]
  );

  // Robust and solid delete function with state sync
  const deleteVisit = useCallback(async (visitId) => {
    if (!visitId) return;
    
    try {
      // First delete from cloud database permanently
      await deleteVisitById(visitId);
      
      // If db call succeeds, filter it out from state immediately
      setVisits((prev) => prev.filter((v) => v.id !== visitId));
      setAuthError('');
    } catch (err) {
      console.error("Delete failed:", err);
      setAuthError('Failed to delete visit from cloud database. Please try again.');
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      authLoading,
      visitsLoading,
      authError,
      setAuthError,
      login,
      signup,
      logout,
      visits,
      filteredVisits, // Main components use this to list records dynamically
      summary,
      searchQuery,
      setSearchQuery,
      addVisit,
      deleteVisit,
    }),
    [
      user,
      authLoading,
      visitsLoading,
      authError,
      login,
      signup,
      logout,
      visits,
      filteredVisits,
      summary,
      searchQuery,
      addVisit,
      deleteVisit,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}