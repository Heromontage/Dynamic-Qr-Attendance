// ==================== QRScanner.jsx ====================
// Component for scanning QR codes using device camera

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export const QRScanner = ({ onScan, onError }) => {
  const [scanning, setScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Initialize camera list
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera for mobile
          const backCamera = devices.find(d => d.label.toLowerCase().includes('back'));
          setSelectedCamera(backCamera?.id || devices[0].id);
        }
      })
      .catch(err => {
        console.error('Error getting cameras:', err);
      });
  }, []);

  // Start scanning
  const startScanning = async () => {
    if (!selectedCamera) {
      onError?.('No camera selected');
      return;
    }

    try {
      html5QrCodeRef.current = new Html5Qrcode("qr-reader");
      
      await html5QrCodeRef.current.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText, decodedResult) => {
          // QR Code detected
          onScan?.(decodedText);
          stopScanning();
        },
        (errorMessage) => {
          // Scanning in progress (not an actual error)
          // console.log('Scanning...', errorMessage);
        }
      );

      setScanning(true);
    } catch (err) {
      console.error('Error starting scanner:', err);
      onError?.(err.message);
    }
  };

  // Stop scanning
  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        setScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Camera Selection */}
      {!scanning && cameras.length > 1 && (
        <select
          value={selectedCamera || ''}
          onChange={(e) => setSelectedCamera(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        >
          {cameras.map(camera => (
            <option key={camera.id} value={camera.id}>
              {camera.label || `Camera ${camera.id}`}
            </option>
          ))}
        </select>
      )}

      {/* Scanner Container */}
      <div className="relative">
        <div 
          id="qr-reader" 
          className={`w-full rounded-lg overflow-hidden ${
            scanning ? 'block' : 'hidden'
          }`}
          style={{ maxWidth: '500px', margin: '0 auto' }}
        />

        {!scanning && (
          <div className="bg-gray-100 rounded-lg p-12 text-center">
            <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <p className="text-gray-600 mb-4">Click below to scan QR code</p>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3">
        {!scanning ? (
          <button
            onClick={startScanning}
            disabled={!selectedCamera}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Start Camera
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Stop Scanning
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Scanning Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Hold your device steady</li>
              <li>Ensure good lighting</li>
              <li>Keep QR code within frame</li>
              <li>Scan within 15 seconds of generation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};