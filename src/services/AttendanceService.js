import { httpsCallable } from 'firebase/functions';
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp } from 'firebase/firestore';
import { functions, db, auth } from '../firebase-config';

// Check if running in emulator
const isEmulator = window.location.hostname === 'localhost';

export class AttendanceService {
  // Generate token for QR code (Teacher)
  static async generateToken(courseCode, date) {
    // For emulator: Use local token generation
    if (isEmulator) {
      console.log('🔧 Using local token generation (Emulator mode)');
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const userId = auth.currentUser?.uid || 'demo-teacher';
      const token = btoa(`${courseCode}:${date}:${timestamp}:${randomStr}:${userId}`);
      
      // Store in Firestore
      try {
        const sessionId = `${userId}_${courseCode}_${date}`;
        await addDoc(collection(db, 'activeSessions'), {
          sessionId,
          token,
          courseCode,
          date,
          teacherId: userId,
          createdAt: serverTimestamp(),
          expiresAt: new Date(timestamp + 15000),
          usedBy: []
        });
      } catch (error) {
        console.warn('Could not store session:', error);
      }
      
      return {
        success: true,
        token: token,
        expiresAt: timestamp + 15000
      };
    }

    // For production: Use cloud function
    try {
      const generateTokenFunc = httpsCallable(functions, 'generateToken');
      const result = await generateTokenFunc({ courseCode, date });
      return result.data;
    } catch (error) {
      console.error('Error calling cloud function:', error);
      
      // Fallback to local generation
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const token = btoa(`${courseCode}:${date}:${timestamp}:${randomStr}`);
      
      return {
        success: true,
        token: token,
        expiresAt: timestamp + 15000
      };
    }
  }

  // Submit student attendance
  static async submitAttendance(token, studentData) {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('You must be logged in to submit attendance');
    }

    // For emulator: Direct Firestore write
    if (isEmulator) {
      console.log('🔧 Using local attendance submission (Emulator mode)');
      
      try {
        // Decode and validate token
        let decodedToken;
        try {
          decodedToken = atob(token);
          const parts = decodedToken.split(':');
          
          if (parts.length < 3) {
            throw new Error('Invalid token format');
          }
          
          const tokenTimestamp = parseInt(parts[2]);
          const tokenAge = Date.now() - tokenTimestamp;
          
          // Check if token is within 15 seconds
          if (tokenAge > 15000) {
            return {
              success: false,
              message: 'Token expired! QR code is only valid for 15 seconds. Please scan again.'
            };
          }
          
          // Check if token is too old (more than 60 seconds)
          if (tokenAge < 0 || tokenAge > 60000) {
            return {
              success: false,
              message: 'Invalid token timestamp'
            };
          }
        } catch (error) {
          return {
            success: false,
            message: 'Invalid QR code format'
          };
        }
        
        // Check for duplicate submission
        const duplicateQuery = query(
          collection(db, 'attendance'),
          where('studentId', '==', currentUser.uid),
          where('tokenUsed', '==', token.substring(0, 20))
        );
        
        const duplicateSnapshot = await getDocs(duplicateQuery);
        if (!duplicateSnapshot.empty) {
          return {
            success: false,
            message: 'You have already marked attendance with this QR code!'
          };
        }
        
        // Create attendance record
        const attendanceRef = await addDoc(collection(db, 'attendance'), {
          studentId: currentUser.uid,
          studentName: studentData.studentName,
          rollNo: studentData.rollNo,
          branch: studentData.branch,
          courseCode: decodedToken.split(':')[0],
          date: decodedToken.split(':')[1],
          markedAt: serverTimestamp(),
          tokenUsed: token.substring(0, 20),
          submittedAt: Date.now(),
          verified: true
        });
        
        console.log('✅ Attendance recorded:', attendanceRef.id);
        
        return {
          success: true,
          message: 'Attendance marked successfully!',
          attendanceId: attendanceRef.id
        };
      } catch (error) {
        console.error('Error submitting attendance:', error);
        return {
          success: false,
          message: 'Failed to submit attendance: ' + error.message
        };
      }
    }

    // For production: Use cloud function
    try {
      const submitAttendanceFunc = httpsCallable(functions, 'submitAttendance');
      const result = await submitAttendanceFunc({
        token,
        ...studentData,
        submittedAt: Date.now()
      });
      return result.data;
    } catch (error) {
      console.error('Error calling cloud function:', error);
      throw new Error('Failed to submit attendance: ' + error.message);
    }
  }

  // Get attendance records (Teacher)
  static async getAttendance(courseCode, date) {
    try {
      const q = query(
        collection(db, 'attendance'),
        where('courseCode', '==', courseCode),
        where('date', '==', date),
        orderBy('markedAt', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const records = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        records.push({
          id: doc.id,
          ...data,
          markedAt: data.markedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        });
      });
      
      console.log(`✅ Found ${records.length} attendance records`);
      
      return {
        success: true,
        records: records,
        totalCount: records.length
      };
    } catch (error) {
      console.error('Error fetching attendance:', error);
      return {
        success: false,
        error: error.message,
        records: [],
        totalCount: 0
      };
    }
  }

  // Analyze attendance with basic logic (Gemini AI fallback)
  static async analyzeAttendance(courseCode, date) {
    try {
      const attendanceResult = await this.getAttendance(courseCode, date);
      const records = attendanceResult.records || [];
      
      const analysis = {
        totalPresent: records.length,
        suspiciousPatterns: [],
        insights: []
      };
      
      // Check for duplicate roll numbers
      const rollNos = records.map(r => r.rollNo);
      const duplicates = rollNos.filter((item, index) => rollNos.indexOf(item) !== index);
      
      if (duplicates.length > 0) {
        analysis.suspiciousPatterns.push({
          type: 'Duplicate Roll Numbers',
          severity: 'HIGH',
          details: `Roll numbers ${[...new Set(duplicates)].join(', ')} appear multiple times`
        });
      }
      
      // Check for rapid submissions
      const timestamps = records
        .map(r => new Date(r.markedAt).getTime())
        .sort((a, b) => a - b);
      
      let rapidCount = 0;
      for (let i = 1; i < timestamps.length; i++) {
        if (timestamps[i] - timestamps[i-1] < 1000) {
          rapidCount++;
        }
      }
      
      if (rapidCount > records.length * 0.2) {
        analysis.suspiciousPatterns.push({
          type: 'Rapid Submissions',
          severity: 'MEDIUM',
          details: `${rapidCount} submissions occurred within 1 second of each other`
        });
      }
      
      // Add insights
      if (analysis.suspiciousPatterns.length === 0) {
        analysis.insights.push('No suspicious patterns detected. All submissions appear legitimate.');
      } else {
        analysis.insights.push(`Found ${analysis.suspiciousPatterns.length} potential issues that need review.`);
      }
      
      console.log('✅ Analysis complete:', analysis);
      
      return {
        success: true,
        analysis: analysis
      };
    } catch (error) {
      console.error('Error analyzing attendance:', error);
      return {
        success: false,
        error: error.message,
        analysis: {
          totalPresent: 0,
          suspiciousPatterns: [],
          insights: ['Analysis failed: ' + error.message]
        }
      };
    }
  }

  // Get student's attendance history
  static async getStudentHistory(studentId) {
    try {
      const q = query(
        collection(db, 'attendance'),
        where('studentId', '==', studentId),
        orderBy('markedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const history = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        history.push({
          id: doc.id,
          ...data,
          markedAt: data.markedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        });
      });
      
      return {
        success: true,
        history: history
      };
    } catch (error) {
      console.error('Error fetching student history:', error);
      return {
        success: false,
        error: error.message,
        history: []
      };
    }
  }
}