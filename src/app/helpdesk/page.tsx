// ─────────────────────────────────────────────────────────
//  HelpScreen.tsx  –  Contact page for student support (Next.js / Web Version)
// ─────────────────────────────────────────────────────────
'use client'; // Add this line for client-side interactivity (though not strictly needed for links)

import React from 'react';
// We don't import from 'react-native' or '@react-navigation/native'

// --- Contact Info ---
const HELP_PHONE_NUMBER = '7400264218';
// Add country code (+91 for India) for WhatsApp
const HELP_WHATSAPP_NUMBER = `91${HELP_PHONE_NUMBER}`;
const WHATSAPP_MESSAGE = "Hello, I have a query regarding the app.";
const WHATSAPP_LINK = `https://wa.me/${HELP_WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
const CALL_LINK = `tel:${HELP_PHONE_NUMBER}`;

// Define the palette for Tailwind JIT (Just-In-Time) compiler
// You can also add these to your tailwind.config.js
const PALETTE = {
  blue: '#004e92',
  textMain: '#1a1a1a',
  textMute: '#686868',
  surface: '#ffffff',
  bg: '#f2f5fa',
  whatsappBg: '#f0fff6',
};

export default function HelpScreen() {
  // We don't need useNavigation or useSafeAreaInsets for this web page
  // Navigation would be handled by Next.js's router if needed

  return (
    // We use web tags (div, header, main, etc.) and Tailwind classes
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: PALETTE.bg }}>
      <StatusBar /> {/* Custom component to set status bar color on mobile browsers */}
      
      {/* HEADER */}
      <header 
        className="p-4 text-white shadow-lg" 
        style={{ backgroundColor: PALETTE.blue }}
      >
        <div className="mx-auto max-w-2xl">
          {/* We can add a back button here later if needed, e.g., using router.back() */}
          <h1 className="text-center text-xl font-bold">Help & Support</h1>
        </div>
      </header>

      {/* BODY */}
      <main className="flex-grow">
        <div className="mx-auto max-w-2xl p-5">
          <h2 
            className="mb-2 text-2xl font-bold" 
            style={{ color: PALETTE.textMain }}
          >
            How can we help?
          </h2>
          <p 
            className="mb-6 text-base" 
            style={{ color: PALETTE.textMute }}
          >
            Contact our support team for any queries or issues you are facing.
          </p>

          {/* Button Links */}
          <div className="space-y-4">
            
            {/* WhatsApp Button - using <a> tag for the link */}
            <a
              href={WHATSAPP_LINK}
              target="_blank" // Opens in a new tab
              rel="noopener noreferrer" // Security best practice
              className="flex transform items-center rounded-xl p-4 shadow-md transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: PALETTE.whatsappBg }}
            >
              <WhatsappIcon className="mr-4 h-10 w-10" />
              <div>
                <p className="font-semibold" style={{ color: PALETTE.textMain }}>
                  Chat on WhatsApp
                </p>
                <p className="text-sm" style={{ color: PALETTE.textMute }}>
                  Start a conversation with our team
                </p>
              </div>
            </a>

            {/* Call Button - using <a> tag for the link */}
            <a
              href={CALL_LINK}
              className="flex transform items-center rounded-xl p-4 shadow-md transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: PALETTE.surface }}
            >
              <CallIcon className="mr-4 h-10 w-10" />
              <div>
                <p className="font-semibold" style={{ color: PALETTE.textMain }}>
                  Call Us Directly
                </p>
                <p className="text-sm" style={{ color: PALETTE.textMute }}>
                  Speak to a support agent
                </p>
              </div>
            </a>
          </div>

          {/* Footer Text */}
          <div className="mt-8 pt-4 pb-5 text-center">
            <p className="text-sm" style={{ color: PALETTE.textMute }}>
              You can reach us at
            </p>
            <p 
              className="my-1 text-lg font-semibold" 
              style={{ color: PALETTE.textMain }}
            >
              +91 {HELP_PHONE_NUMBER}
            </p>
            <p className="text-sm" style={{ color: PALETTE.textMute }}>
              (Mon - Fri, 9 AM - 6 PM)
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}

/**
 * A simple component to control the mobile status bar color.
 * We use a meta tag for this in the web.
 */
function StatusBar() {
  return (
    <head>
      {/* This sets the browser top bar color on mobile devices */}
      <meta name="theme-color" content={PALETTE.blue} />
    </head>
  );
}

/**
 * Inline SVG component for the WhatsApp Icon
 */
const WhatsappIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="#25D366" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M19.05 4.91A9.816 9.816 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.69-1.06-5.14-2.9-7.01zm-7.01 15.24c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.264 8.264 0 0 1-1.26-4.38c0-4.54 3.67-8.21 8.21-8.21s8.21 3.67 8.21 8.21-3.67 8.21-8.21 8.21zm4.26-6.33c-.23-.11-1.36-.67-1.57-.75-.2-.08-.34-.11-.49.11-.15.23-.59.75-.73.9-.14.15-.28.17-.53.06-.25-.11-1.06-.39-2.02-1.24-.75-.66-1.26-1.47-1.41-1.72-.15-.25-.02-.38.1-.5.11-.11.25-.28.37-.42.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.42-.06-.11-.49-1.18-.67-1.62-.18-.44-.37-.38-.5-.38h-.48c-.15 0-.39.06-.59.31-.2.25-.78.76-.78 1.85s.8 2.15.91 2.3c.11.15 1.58 2.42 3.83 3.39.56.24.99.38 1.33.48.55.17 1.05.14 1.44.09.44-.06 1.36-.55 1.55-1.09.19-.53.19-.98.14-1.09-.06-.11-.2-.17-.42-.28z"/>
  </svg>
);

/**
 * Inline SVG component for the Call Icon
 */
const CallIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="#004e92" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.02.74-.24 1.02l-2.2 2.2z"/>
  </svg>
);

