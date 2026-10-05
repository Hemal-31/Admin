import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Modal } from './Modal';
import { Camera, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { extractQrToken } from '../../utils/helpers';
import './QrScannerModal.css';

export function QrScannerModal({
  isOpen,
  onClose,
  onScan,
  onScanSuccess,
  title = 'Scan QR Code',
  placeholder = 'Enter Registration ID or Token',
}) {
  const [manualCode, setManualCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanDetected, setScanDetected] = useState(false);
  const scannerRef = useRef(null);
  // Store callbacks in refs so the effect doesn't re-run when they change
  const onScanSuccessRef = useRef(onScanSuccess);
  const onScanRef = useRef(onScan);
  const readerId = 'html5-qr-reader-container';

  // Keep refs up to date without triggering effect restarts
  useEffect(() => { onScanSuccessRef.current = onScanSuccess; }, [onScanSuccess]);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  useEffect(() => {
    let html5QrCode = null;

    if (isOpen) {
      setErrorMsg('');
      setScanDetected(false);
      setIsScanning(false);

      const startScanner = async () => {
        try {
          await new Promise((r) => setTimeout(r, 300));
          const container = document.getElementById(readerId);
          if (!container) return;

          html5QrCode = new Html5Qrcode(readerId);
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 15,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              const token = extractQrToken(decodedText);
              if (token) {
                setScanDetected(true);
                setTimeout(() => {
                  if (onScanSuccessRef.current) onScanSuccessRef.current(token);
                  if (onScanRef.current) onScanRef.current({ qrToken: token });
                }, 300);
              }
            },
            () => {}
          );
          setIsScanning(true);
        } catch (err) {
          console.warn('Camera scan start failed:', err);
          setErrorMsg(
            'Camera permission required. Please allow camera access in your browser or enter the Registration ID manually below.'
          );
          setIsScanning(false);
        }
      };

      startScanner();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            try { scannerRef.current?.clear(); } catch (_) {}
            scannerRef.current = null;
          });
      }
    };
  // Only restart the scanner when isOpen changes — not on callback changes
  }, [isOpen]);

  function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const token = extractQrToken(manualCode.trim());
    if (onScanSuccess) onScanSuccess(token || manualCode.trim());
    if (onScan) onScan({ registrationCode: manualCode.trim(), qrToken: token });
    setManualCode('');
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="560px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Modern Paytm-Style Optical Scanner Frame */}
        <div className="cyber-qr-scanner-card">
          <div className="cyber-qr-viewport">
            <div id={readerId}></div>

            {/* Dark Mask Vignette */}
            {isScanning && <div className="cyber-qr-mask" />}

            {/* Centered Paytm-Style Target Box with 4 Glowing Corners */}
            {isScanning && (
              <div className={`cyber-qr-target-box ${scanDetected ? 'is-success' : ''}`}>
                <div className="cyber-qr-corner top-left" />
                <div className="cyber-qr-corner top-right" />
                <div className="cyber-qr-corner bottom-left" />
                <div className="cyber-qr-corner bottom-right" />

                {/* Animated Scanning Laser Line */}
                <div className="cyber-qr-laser-line" />
              </div>
            )}

            {/* Loading / Starting Camera State */}
            {!isScanning && !errorMsg && (
              <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                <Camera size={48} color="#00f0ff" style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e2e8f0' }}>
                  Starting optical camera preview...
                </p>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                  Please grant camera access when prompted
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Live Instruction Pill */}
        {isScanning && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="cyber-qr-instruction">
              <span className="cyber-qr-instruction-dot" />
              <span>ALIGN BADGE QR CODE INSIDE FRAME</span>
            </div>
          </div>
        )}

        {/* Error / Permission Denied Notification */}
        {errorMsg && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#f87171',
              fontSize: '0.88rem',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Manual Lookup Form */}
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            className="cyber-login-input"
            style={{
              flex: 1,
              fontFamily: 'var(--font-mono, monospace)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
            placeholder={placeholder}
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Search size={18} />
            <span>Lookup</span>
          </button>
        </form>
      </div>
    </Modal>
  );
}

export default QrScannerModal;

