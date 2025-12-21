import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase-config';

export class AnalyticsService {
  // Get attendance statistics
  static async getAttendanceStats(courseCode, startDate, endDate) {
    try {
      const q = query(
        collection(db, 'attendance'),
        where('courseCode', '==', courseCode),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc')
      );

      const snapshot = await getDocs(q);
      const records = [];
      
      snapshot.forEach(doc => {
        records.push({ id: doc.id, ...doc.data() });
      });

      // Calculate statistics
      const stats = {
        totalDays: new Set(records.map(r => r.date)).size,
        totalPresent: records.length,
        uniqueStudents: new Set(records.map(r => r.studentId)).size,
        averagePerDay: records.length / new Set(records.map(r => r.date)).size || 0,
        branchDistribution: this._calculateBranchDistribution(records),
        attendanceByDate: this._groupByDate(records)
      };

      return {
        success: true,
        stats,
        records
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get student attendance history
  static async getStudentHistory(studentId, courseCode) {
    try {
      const q = query(
        collection(db, 'attendance'),
        where('studentId', '==', studentId),
        where('courseCode', '==', courseCode),
        orderBy('markedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const history = [];
      
      snapshot.forEach(doc => {
        history.push({ id: doc.id, ...doc.data() });
      });

      const attendanceRate = (history.length / 30) * 100; // Assuming 30 total classes

      return {
        success: true,
        history,
        attendanceRate: attendanceRate.toFixed(2)
      };
    } catch (error) {
      console.error('Error getting student history:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get security alerts
  static async getSecurityAlerts(teacherId) {
    try {
      const q = query(
        collection(db, 'securityAlerts'),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const alerts = [];
      
      snapshot.forEach(doc => {
        alerts.push({ id: doc.id, ...doc.data() });
      });

      return {
        success: true,
        alerts
      };
    } catch (error) {
      console.error('Error getting alerts:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Private helper methods
  static _calculateBranchDistribution(records) {
    const distribution = {};
    records.forEach(record => {
      distribution[record.branch] = (distribution[record.branch] || 0) + 1;
    });
    return distribution;
  }

  static _groupByDate(records) {
    const grouped = {};
    records.forEach(record => {
      if (!grouped[record.date]) {
        grouped[record.date] = [];
      }
      grouped[record.date].push(record);
    });
    return grouped;
  }
}