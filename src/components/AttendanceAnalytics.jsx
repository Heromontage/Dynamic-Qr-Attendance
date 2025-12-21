// ==================== AttendanceAnalytics.jsx ====================
// Dashboard component for displaying attendance analytics

import React from 'react';

export const AttendanceAnalytics = ({ records, analysis }) => {
  // Calculate statistics
  const totalStudents = records.length;
  const branches = [...new Set(records.map(r => r.branch))];
  const branchCounts = branches.map(branch => ({
    name: branch,
    count: records.filter(r => r.branch === branch).length
  }));

  // Time distribution (early, on-time, late)
  const timeDistribution = records.reduce((acc, record) => {
    const minute = new Date(record.markedAt).getMinutes();
    if (minute < 5) acc.early++;
    else if (minute < 15) acc.onTime++;
    else acc.late++;
    return acc;
  }, { early: 0, onTime: 0, late: 0 });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {totalStudents}
          </div>
          <div className="text-sm text-blue-800">Total Present</div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {timeDistribution.onTime}
          </div>
          <div className="text-sm text-green-800">On Time</div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {branches.length}
          </div>
          <div className="text-sm text-purple-800">Branches</div>
        </div>
      </div>

      {/* Branch Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Branch-wise Distribution
        </h3>
        <div className="space-y-3">
          {branchCounts.map(branch => (
            <div key={branch.name} className="flex items-center gap-3">
              <div className="w-24 text-sm font-medium text-gray-700">
                {branch.name}
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                  style={{ width: `${(branch.count / totalStudents) * 100}%` }}
                >
                  <span className="text-white text-xs font-semibold">
                    {branch.count}
                  </span>
                </div>
              </div>
              <div className="w-12 text-sm text-gray-600 text-right">
                {((branch.count / totalStudents) * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Analysis */}
      {analysis && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 7H7v6h6V7z" />
              <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800">
              Gemini AI Analysis
            </h3>
          </div>

          {analysis.suspiciousPatterns.length > 0 ? (
            <div className="space-y-3">
              {analysis.suspiciousPatterns.map((pattern, idx) => (
                <div 
                  key={idx}
                  className="bg-white rounded-lg p-4 border-l-4 border-red-500"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-gray-800">
                      {pattern.type}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      pattern.severity === 'HIGH' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {pattern.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{pattern.details}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold text-green-800">
                  No suspicious patterns detected
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                All attendance submissions appear legitimate based on AI analysis.
              </p>
            </div>
          )}

          {analysis.insights && analysis.insights.length > 0 && (
            <div className="mt-4 bg-white rounded-lg p-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                {analysis.insights[0].analysis}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Time Distribution Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Punctuality Analysis
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {timeDistribution.early}
            </div>
            <div className="text-xs text-gray-600">Early (0-5 min)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {timeDistribution.onTime}
            </div>
            <div className="text-xs text-gray-600">On Time (5-15 min)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {timeDistribution.late}
            </div>
            <div className="text-xs text-gray-600">Late (15+ min)</div>
          </div>
        </div>
      </div>
    </div>
  );
};