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
  supabase,
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

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [visits, setVisits] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const loadUserVisits = useCallback(async () => {
    setVisitsLoading(true);
    try {
      const data = await fetchVisits();
      setVisits(data || []);
    } catch (err) {
      console.error(err);
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
        loadUserVisits();
      } else {
        setVisits([]);
        setVisitsLoading(false);
      }
    });

    return unsubscribe;
  }, [loadUserVisits]);

  // 📸 PROFILE AVATAR UPDATE FUNCTION
  const updateProfileAvatar = useCallback(async (avatarUrl) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl },
      });

      if (error) throw error;

      if (data?.user) {
        setUser((prev) => ({
          ...prev,
          avatar_url: avatarUrl,
          user_metadata: {
            ...prev?.user_metadata,
            avatar_url: avatarUrl,
          },
        }));
      }
      return { success: true };
    } catch (err) {
      console.error('Avatar update failed:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const summary = useMemo(() => computeSummary(visits), [visits]);

  // Master sorted and filtered visits log
  const filteredVisits = useMemo(() => {
    const sortedRaw = [...visits].sort(
      (a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()
    );

    const query = searchQuery.trim().toLowerCase();
    if (!query) return sortedRaw;

    return sortedRaw.filter((visit) => {
      const haystack = [
        visit.site_name,
        visit.parent_company,
        visit.visit_type,
        visit.key_task,
        visit.status,
        visit.date,
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
      await loadUserVisits();
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
      try {
        const newVisit = await createVisit(visitData);
        if (newVisit) {
          setVisits((prev) => [newVisit, ...prev]);
        }
        return true;
      } catch (err) {
        console.error('Save failed in context:', err);
        setAuthError('Failed to save visit. Please try again.');
        return false;
      }
    },
    []
  );

  const deleteVisit = useCallback(async (visitId) => {
    if (!visitId) return;
    try {
      await deleteVisitById(visitId);
      setVisits((prev) => prev.filter((v) => v.id !== visitId));
      setAuthError('');
    } catch (err) {
      console.error('Delete failed:', err);
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
      filteredVisits,
      summary,
      searchQuery,
      setSearchQuery,
      addVisit,
      createVisit: addVisit,
      deleteVisit,
      updateProfileAvatar,
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
      updateProfileAvatar,
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