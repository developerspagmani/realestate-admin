'use client';

import { useEffect, useRef } from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export default function QRCode({ value, size = 200, className = '' }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple QR code placeholder (since we can't install qrcode package due to npm restrictions)
    // This creates a simple visual placeholder that looks like a QR code
    const cellSize = size / 25;
    ctx.fillStyle = '#000000';
    
    // Create a pattern that resembles a QR code
    for (let row = 0; row < 25; row++) {
      for (let col = 0; col < 25; col++) {
        // Generate pseudo-random pattern based on the value
        const hash = value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const shouldFill = ((row * col + hash) % 3) !== 0;
        
        if (shouldFill) {
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }

    // Add corner markers (typical QR code feature)
    ctx.fillStyle = '#000000';
    // Top-left corner
    ctx.fillRect(0, 0, cellSize * 7, cellSize);
    ctx.fillRect(0, 0, cellSize, cellSize * 7);
    ctx.fillRect(cellSize * 6, 0, cellSize, cellSize * 7);
    ctx.fillRect(0, cellSize * 6, cellSize * 7, cellSize);
    
    // Top-right corner
    ctx.fillRect(cellSize * 18, 0, cellSize * 7, cellSize);
    ctx.fillRect(cellSize * 18, 0, cellSize, cellSize * 7);
    ctx.fillRect(cellSize * 24, 0, cellSize, cellSize * 7);
    ctx.fillRect(cellSize * 18, cellSize * 6, cellSize * 7, cellSize);
    
    // Bottom-left corner
    ctx.fillRect(0, cellSize * 18, cellSize * 7, cellSize);
    ctx.fillRect(0, cellSize * 18, cellSize, cellSize * 7);
    ctx.fillRect(cellSize * 6, cellSize * 18, cellSize, cellSize * 7);
    ctx.fillRect(0, cellSize * 24, cellSize * 7, cellSize);

  }, [value, size]);

  return (
    <canvas 
      ref={canvasRef} 
      width={size} 
      height={size} 
      className={`border border-gray-300 ${className}`}
    />
  );
}
