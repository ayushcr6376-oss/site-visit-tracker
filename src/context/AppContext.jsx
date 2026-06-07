import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  clearAuthSession,
  generateAuthToken,
  getRegisteredUsers,
  getStoredAuth,
  saveAuthSession,
  saveRegisteredUsers,
  validateEmail,
  validateName,
  validatePassword,
} from '../utils/auth';
import {
  computeSummary,
  generateVisitId,
  loadVisits,
  saveVisits,
} from '../utils/storage';
import { VISIT_STATUS } from '../utils/constants';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [visits, setVisits] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const { user: storedUser, token: storedToken } = getStoredAuth();
    if (storedUser && storedToken) {
      setUser(storedUser);
      setToken(storedToken);
    }
    setVisits(loadVisits());
    setAuthLoading(false);
  }, []);

  const persistVisits = useCallback((nextVisits) => {
    saveVisits(nextVisits);
    setVisits(nextVisits);
  }, []);

  const summary = useMemo(() => computeSummary(visits), [visits]);

  const filteredVisits = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return [...visits].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    }
    return visits
      .filter((visit) => {
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
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [visits, searchQuery]);

  const login = useCallback((email, password) => {
    setAuthError('');
    const normalizedEmail = email.trim().toLowerCase();

    if (!validateEmail(normalizedEmail)) {
      setAuthError('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setAuthError('Password is required.');
      return false;
    }

    const users = getRegisteredUsers();
    const found = users.find((u) => u.email === normalizedEmail);

    if (!found) {
      setAuthError('No account found with this email. Please sign up first.');
      return false;
    }
    if (found.password !== password) {
      setAuthError('Incorrect password. Please try again.');
      return false;
    }

    const sessionToken = generateAuthToken(found.id);
    saveAuthSession(found, sessionToken);
    setUser(found);
    setToken(sessionToken);
    return true;
  }, []);

  const signup = useCallback((name, email, password, confirmPassword) => {
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

    const users = getRegisteredUsers();
    if (users.some((u) => u.email === normalizedEmail)) {
      setAuthError('An account with this email already exists.');
      return false;
    }

    const newUser = {
      id: `user_${Date.now()}`,
      name: trimmedName,
      email: normalizedEmail,
      password,
      createdAt: new Date().toISOString(),
    };

    const updatedUsers = [...users, newUser];
    saveRegisteredUsers(updatedUsers);

    const sessionToken = generateAuthToken(newUser.id);
    saveAuthSession(newUser, sessionToken);
    setUser(newUser);
    setToken(sessionToken);
    return true;
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
    setToken(null);
    setSearchQuery('');
    setAuthError('');
  }, []);

  const addVisit = useCallback(
    (visitData) => {
      const newVisit = {
        id: generateVisitId(),
        visitDate: visitData.visitDate,
        durationHours: visitData.durationHours,
        durationMinutes: visitData.durationMinutes,
        clientCompany: visitData.clientCompany.trim(),
        parentCompany: visitData.parentCompany.trim(),
        payoutAmount: visitData.payoutAmount,
        visitType: visitData.visitType,
        keyTask: visitData.keyTask.trim(),
        status: visitData.status || VISIT_STATUS.PENDING,
        signature: visitData.signature || null,
        createdAt: new Date().toISOString(),
      };
      const nextVisits = [newVisit, ...visits];
      persistVisits(nextVisits);
      return true;
    },
    [visits, persistVisits]
  );

  const deleteVisit = useCallback(
    (visitId) => {
      const nextVisits = visits.filter((v) => v.id !== visitId);
      persistVisits(nextVisits);
    },
    [visits, persistVisits]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      authLoading,
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
      deleteVisit,
    }),
    [
      user,
      token,
      authLoading,
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
