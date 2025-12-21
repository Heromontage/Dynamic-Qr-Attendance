import { useState, useEffect } from 'react';
import { AuthService } from '../services/AuthService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        const isTeacher = await AuthService.isTeacher(firebaseUser.uid);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role: isTeacher ? 'teacher' : 'student'
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    const result = await AuthService.login(email, password);
    if (result.success) {
      setUser(result.user);
    } else {
      setError(result.error);
    }
    setLoading(false);
    return result;
  };

  const register = async (email, password, displayName, role) => {
    setLoading(true);
    setError(null);
    const result = await AuthService.register(email, password, displayName, role);
    if (result.success) {
      setUser(result.user);
    } else {
      setError(result.error);
    }
    setLoading(false);
    return result;
  };

  const logout = async () => {
    setLoading(true);
    const result = await AuthService.logout();
    if (result.success) {
      setUser(null);
    }
    setLoading(false);
    return result;
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isTeacher: user?.role === 'teacher'
  };
};