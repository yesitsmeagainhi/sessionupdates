// src/components/CameraComponent.tsx

"use client";

import React, { useRef, useEffect, useState } from 'react';

type Props = {
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
};

export default function CameraComponent({ onCapture, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        });
        setStream(activeStream);
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
        }
      } catch (err) {
        alert('Could not access camera. Please check permissions.');
        onCancel();
      }
    };

    startCamera();

    return () => {
      activeStream?.getTracks().forEach(track => track.stop());
    };
  }, [onCancel]);

  const handleCaptureClick = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      onCapture(dataUrl);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'black', zIndex: 100 }}>
      <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div style={{ position: 'absolute', bottom: '20px', width: '100%', textAlign: 'center' }}>
        <button onClick={handleCaptureClick} style={{ padding: '15px 30px', fontSize: '18px' }}>Capture</button>
        <button onClick={onCancel} style={{ marginLeft: '10px', padding: '15px 20px' }}>Cancel</button>
      </div>
    </div>
  );
}