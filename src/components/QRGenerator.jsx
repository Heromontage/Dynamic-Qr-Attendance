// ==================== QRGenerator.jsx ====================
// Component for generating animated QR codes with countdown

import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode.react';

export const QRGenerator = ({ token, countdown, onExpire }) => {
  const qrRef = useRef(null);

  useEffect(() => {
    if (countdown === 0 && onExpire) {
      onExpire();
    }
  }, [countdown, onExpire]);

  return (
    <div className="relative">
      {/* QR Code */}
      <div 
        ref={qrRef}
        className={`transition-all duration-300 ${
          countdown <= 5 ? 'animate-pulse' : ''
        }`}
      >
        <QRCode
          value={token}
          size={256}
          level="H"
          includeMargin={true}
          renderAs="canvas"
          imageSettings={{
            src: "/logo.png", // Your institution logo
            height: 40,
            width: 40,
            excavate: true,
          }}
        />
      </div>

      {/* Countdown Overlay */}
      <div className="absolute -bottom-12 left-0 right-0">
        <div className="flex items-center justify-center gap-2">
          <div className={`text-2xl font-bold transition-colors ${
            countdown <= 5 ? 'text-red-600' : 'text-blue-600'
          }`}>
            {countdown}s
          </div>
          <div className="text-sm text-gray-600">remaining</div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${
              countdown <= 5 ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${(countdown / 15) * 100}%` }}
          />
        </div>
      </div>

      {/* Security Badge */}
      <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>Secure</span>
      </div>
    </div>
  );
};