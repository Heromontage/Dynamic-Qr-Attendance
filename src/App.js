import React, { useState, useEffect } from 'react';
import { Camera, QrCode, Users, Calendar, TrendingUp, Shield, AlertCircle, CheckCircle, Clock, LogOut, Eye, EyeOff } from 'lucide-react';
import { AuthService } from './services/AuthService';
import { AttendanceService } from './services/AttendanceService';
import QRCode from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function DynamicQRAttendance() {
  // Auth States
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);

  // Login/Register Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('student');
  const [authError, setAuthError] = useState('');

  // Teacher States
  const [courseCode, setCourseCode] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [qrData, setQrData] = useState(null);
  const [countdown, setCountdown] = useState(15);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [attendanceList, setAttendanceList] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  // Student States
  const [studentName, setStudentName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [branch, setBranch] = useState('');
  const [scannedToken, setScannedToken] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // Check authentication state on mount
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        const userRole = await AuthService.getUserRole(firebaseUser.uid);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role: userRole
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // QR Code Generation with Token Rotation
  useEffect(() => {
    if (isSessionActive && courseCode && user?.role === 'teacher') {
      const generateQR = async () => {
        try {
          const result = await AttendanceService.generateToken(courseCode, sessionDate);
          if (result.success) {
            setQrData(result.token);
            setCountdown(15);
          }
        } catch (error) {
          console.error('Token generation error:', error);
        }
      };

      generateQR();
      const interval = setInterval(generateQR, 15000);
      return () => clearInterval(interval);
    }
  }, [isSessionActive, courseCode, sessionDate, user]);

  // Countdown Timer
  useEffect(() => {
    if (isSessionActive && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, isSessionActive]);

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    const result = await AuthService.login(email, password);
    if (result.success) {
      setUser(result.user);
      setEmail('');
      setPassword('');
    } else {
      setAuthError(result.error);
    }
    setLoading(false);
  };

  // Handle Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const result = await AuthService.register(email, password, displayName, role);
    if (result.success) {
      setUser(result.user);
      setEmail('');
      setPassword('');
      setDisplayName('');
    } else {
      setAuthError(result.error);
    }
    setLoading(false);
  };

  // Handle Logout
  const handleLogout = async () => {
    await AuthService.logout();
    setUser(null);
    setIsSessionActive(false);
  };

  // Teacher: Start Session
  const startSession = () => {
    if (!courseCode) {
      alert('Please enter course code');
      return;
    }
    setIsSessionActive(true);
  };

  // Teacher: End Session
  const endSession = async () => {
    setIsSessionActive(false);
    try {
      const attendanceResult = await AttendanceService.getAttendance(courseCode, sessionDate);
      if (attendanceResult.success) {
        setAttendanceList(attendanceResult.records);
      }

      const analysisResult = await AttendanceService.analyzeAttendance(courseCode, sessionDate);
      if (analysisResult.success) {
        setAiAnalysis(analysisResult.analysis);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  // Student: Start QR Scanner
  const startQRScanner = () => {
    setIsScanning(true);
    setSubmissionStatus(null);

    setTimeout(() => {
      const scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      });

      scanner.render(
        (decodedText) => {
          setScannedToken(decodedText);
          setIsScanning(false);
          scanner.clear();
        },
        (error) => {
          console.warn('QR scan error:', error);
        }
      );
    }, 100);
  };

  // Student: Stop Scanner
  const stopScanner = () => {
    setIsScanning(false);
    const scannerElement = document.getElementById('qr-reader');
    if (scannerElement) {
      scannerElement.innerHTML = '';
    }
  };

  // Student: Submit Attendance
  const submitAttendance = async () => {
    if (!studentName || !rollNo || !branch || !scannedToken) {
      setSubmissionStatus({ 
        success: false, 
        message: 'Please fill all fields and scan QR code' 
      });
      return;
    }

    try {
      const result = await AttendanceService.submitAttendance(scannedToken, {
        studentName,
        rollNo,
        branch
      });

      setSubmissionStatus({
        success: result.success,
        message: result.message
      });

      if (result.success) {
        setStudentName('');
        setRollNo('');
        setBranch('');
        setScannedToken('');
      }
    } catch (error) {
      setSubmissionStatus({
        success: false,
        message: error.message || 'Failed to submit attendance'
      });
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Login/Register Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {authMode === 'login' ? 'Login' : 'Register'}
            </h1>
            <p className="text-gray-600">Dynamic QR Attendance System</p>
          </div>

          <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {authMode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{authError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (authMode === 'login' ? 'Login' : 'Register')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthError('');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {authMode === 'login' 
                ? "Don't have an account? Register" 
                : 'Already have an account? Login'}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Security Features
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>15-second token rotation prevents screenshots</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Gemini AI detects suspicious patterns</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Firebase real-time validation</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Teacher Dashboard
  if (user.role === 'teacher') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h1>
                  <p className="text-gray-600">Welcome, {user.displayName || user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Session Setup */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Session Setup
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course Code</label>
                  <input
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                    disabled={isSessionActive}
                    placeholder="e.g., CS101"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    disabled={isSessionActive}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {!isSessionActive ? (
                  <button
                    onClick={startSession}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
                  >
                    Start Session
                  </button>
                ) : (
                  <button
                    onClick={endSession}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-lg"
                  >
                    End Session & Analyze
                  </button>
                )}
              </div>
            </div>

            {/* QR Code Display */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-purple-600" />
                Dynamic QR Code
              </h2>

              {isSessionActive && qrData ? (
                <div className="text-center">
                  <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl p-8 mb-4">
                    <div className="bg-white rounded-lg p-4 inline-block">
                      <QRCode
                        value={qrData}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-lg font-semibold mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-800">Refreshes in: </span>
                    <span className={`${countdown <= 5 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
                      {countdown}s
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${countdown <= 5 ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${(countdown / 15) * 100}%` }}
                    ></div>
                  </div>

                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2 text-sm text-yellow-800">
                      <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>QR code regenerates every 15 seconds. Screenshots won't work!</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <QrCode className="w-24 h-24 mx-auto mb-4 opacity-20" />
                  <p>Start a session to generate QR code</p>
                </div>
              )}
            </div>
          </div>

          {/* Attendance List */}
          {attendanceList.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Attendance Records ({attendanceList.length})
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Roll No</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Branch</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceList.map((record, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{record.rollNo}</td>
                        <td className="py-3 px-4">{record.studentName}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            {record.branch}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {record.markedAt ? new Date(record.markedAt).toLocaleTimeString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI Analysis */}
          {aiAnalysis && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Gemini AI Analysis
              </h2>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 font-medium">
                    Total Students Present: {aiAnalysis.totalPresent}
                  </p>
                </div>

                {aiAnalysis.suspiciousPatterns && aiAnalysis.suspiciousPatterns.length > 0 ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <h3 className="font-semibold text-red-800">Suspicious Activities Detected</h3>
                    </div>
                    {aiAnalysis.suspiciousPatterns.map((activity, idx) => (
                      <div key={idx} className="ml-7 mt-2">
                        <p className="font-medium text-red-700">{activity.type}</p>
                        <p className="text-sm text-red-600">{activity.details}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <p className="text-green-800 font-medium">No anomalies detected</p>
                    </div>
                  </div>
                )}

                {aiAnalysis.insights && aiAnalysis.insights.length > 0 && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h3 className="font-semibold text-purple-800 mb-2">AI Insights:</h3>
                    {aiAnalysis.insights.map((insight, idx) => (
                      <p key={idx} className="text-sm text-purple-700 mt-1">{insight.analysis || insight}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Student Portal
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Student Portal</h1>
                <p className="text-gray-600">Welcome, {user.displayName || user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Attendance Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Submit Attendance</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student Name</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number</label>
              <input
                type="text"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value.toUpperCase())}
                placeholder="e.g., 21CS001"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select your branch</option>
                <option value="CSE">Computer Science</option>
                <option value="ECE">Electronics</option>
                <option value="MECH">Mechanical</option>
                <option value="CIVIL">Civil</option>
                <option value="EEE">Electrical</option>
              </select>
            </div>

            {/* QR Scanner */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Scan QR Code</label>
              
              {!isScanning && !scannedToken && (
                <button
                  onClick={startQRScanner}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Open Camera to Scan QR
                </button>
              )}

              {isScanning && (
                <div className="space-y-4">
                  <div id="qr-reader" className="rounded-lg overflow-hidden border-2 border-purple-200"></div>
                  <button
                    onClick={stopScanner}
                    className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <AlertCircle className="w-5 h-5" />
                    Cancel Scanning
                  </button>
                </div>
              )}
              {scannedToken && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">QR Code Scanned Successfully!</span>
              </div>
              <p className="text-sm text-gray-600 font-mono break-all mb-3">
                Token: {scannedToken.substring(0, 40)}...
              </p>
              <button
                onClick={startQRScanner}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Scan Again
              </button>
            </div>
          )}
        </div>

        <button
          onClick={submitAttendance}
          disabled={!scannedToken || !studentName || !rollNo || !branch}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          Submit Attendance
        </button>
      </div>

      {/* Submission Status */}
      {submissionStatus && (
        <div className={`mt-6 p-4 rounded-lg border ${
          submissionStatus.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-2">
            {submissionStatus.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p className={`font-semibold ${
                submissionStatus.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {submissionStatus.success ? 'Success!' : 'Failed'}
              </p>
              <p className={`text-sm ${
                submissionStatus.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {submissionStatus.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* How It Works */}
    <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <Shield className="w-5 h-5 text-purple-600" />
        How It Works
      </h3>
      <ul className="space-y-2 text-sm text-gray-600">
        <li className="flex items-start gap-2">
          <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-purple-600">1</span>
          </div>
          <span>Teacher generates a dynamic QR code that changes every 15 seconds</span>
        </li>
        <li className="flex items-start gap-2">
          <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-purple-600">2</span>
          </div>
          <span>Click "Open Camera" and scan the QR code in real-time</span>
        </li>
        <li className="flex items-start gap-2">
          <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-purple-600">3</span>
          </div>
          <span>Fill in your details and submit - Screenshots won't work!</span>
        </li>
        <li className="flex items-start gap-2">
          <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-purple-600">4</span>
          </div>
          <span>Gemini AI verifies and detects any suspicious activity</span>
        </li>
      </ul>
    </div>
  </div>
</div>);
}