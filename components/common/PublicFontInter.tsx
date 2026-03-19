'use client';

import React from 'react';

/**
 * PublicFontInter Component
 * 
 * Injects the Inter font via CDN and applies it globally to the document.
 * Designed for public-facing pages (Login, Register, etc.) to ensure 
 * consistent, premium typography.
 */
const PublicFontInter = () => {
  return (
    <>
      {/* Google Fonts CDN */}
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
      />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />

      {/* Global Style Injection */}
      <style jsx global>{`
        html, body {
          font-family: 'Inter', sans-serif !important;
        }
        
        /* Ensure smooth rendering */
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </>
  );
};

export default PublicFontInter;
