import { useState, useCallback } from 'react';
import { AttendanceService } from '../services/AttendanceService';

export const useAttendance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [analysis, setAnalysis] = useState(null);

  const generateToken = useCallback(async (courseCode, date) => {
    setLoading(true);
    setError(null);
    try {
      const result = await AttendanceService.generateToken(courseCode, date);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const submitAttendance = useCallback(async (token, studentData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await AttendanceService.submitAttendance(token, studentData);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const getAttendance = useCallback(async (courseCode, date) => {
    setLoading(true);
    setError(null);
    try {
      const result = await AttendanceService.getAttendance(courseCode, date);
      if (result.success) {
        setAttendanceRecords(result.records);
      }
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const analyzeAttendance = useCallback(async (courseCode, date) => {
    setLoading(true);
    setError(null);
    try {
      const result = await AttendanceService.analyzeAttendance(courseCode, date);
      if (result.success) {
        setAnalysis(result.analysis);
      }
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    attendanceRecords,
    analysis,
    generateToken,
    submitAttendance,
    getAttendance,
    analyzeAttendance
  };
};