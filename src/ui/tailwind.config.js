/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Professional QA Studio color palette
        'qa-slate': {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        'qa-emerald': {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        'qa-indigo': {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        "qa-studio-dark": {
          // Primary: Subtle blue-gray (professional, not vibrant)
          "primary": "#5b6ee8",
          "primary-focus": "#4c5dd4",
          "primary-content": "#ffffff",
          
          // Secondary: Muted slate
          "secondary": "#64748b",
          "secondary-focus": "#475569",
          "secondary-content": "#ffffff",
          
          // Accent: Subtle indigo
          "accent": "#6366f1",
          "accent-focus": "#4f46e5",
          "accent-content": "#ffffff",
          
          // Neutral: Professional grays
          "neutral": "#1e293b",
          "neutral-focus": "#0f172a",
          "neutral-content": "#e2e8f0",
          
          // Base: Subtle dark background
          "base-100": "#0f1419",
          "base-200": "#1a1f2e",
          "base-300": "#252b3d",
          "base-content": "#e2e8f0",
          
          // Status colors (muted, professional)
          "info": "#3b82f6",
          "success": "#22c55e",
          "warning": "#eab308",
          "error": "#ef4444",
          
          // Border radius
          "--rounded-box": "0.5rem",
          "--rounded-btn": "0.375rem",
          "--rounded-badge": "0.5rem",
          
          // Animation
          "--animation-btn": "0.2s",
          "--animation-input": "0.2s",
          
          // Border
          "--border-btn": "1px",
        },
        "qa-studio-light": {
          // Primary: Professional blue
          "primary": "#4f46e5",
          "primary-focus": "#4338ca",
          "primary-content": "#ffffff",
          
          // Secondary: Muted slate
          "secondary": "#64748b",
          "secondary-focus": "#475569",
          "secondary-content": "#ffffff",
          
          // Accent: Subtle indigo
          "accent": "#6366f1",
          "accent-focus": "#4f46e5",
          "accent-content": "#ffffff",
          
          // Neutral: Light grays
          "neutral": "#f1f5f9",
          "neutral-focus": "#e2e8f0",
          "neutral-content": "#0f172a",
          
          // Base: Clean light background
          "base-100": "#ffffff",
          "base-200": "#f8fafc",
          "base-300": "#f1f5f9",
          "base-content": "#0f172a",
          
          // Status colors
          "info": "#3b82f6",
          "success": "#22c55e",
          "warning": "#eab308",
          "error": "#ef4444",
          
          // Border radius
          "--rounded-box": "0.5rem",
          "--rounded-btn": "0.375rem",
          "--rounded-badge": "0.5rem",
          
          // Animation
          "--animation-btn": "0.2s",
          "--animation-input": "0.2s",
          
          // Border
          "--border-btn": "1px",
        },
      },
    ],
    darkTheme: "qa-studio-dark",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: false,
    themeRoot: ":root",
  },
}

