import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        border: "rgb(229, 231, 235)",
        input: "rgb(229, 231, 235)",
        ring: "rgb(229, 231, 235)",
        background: "rgb(249, 250, 251)",
        foreground: "rgb(17, 24, 39)",
        primary: {
          DEFAULT: "#ffd300",
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "#000000",
          foreground: "#ffffff",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            a: {
              color: '#2563eb',
              '&:hover': {
                color: '#1d4ed8',
              },
            },
            p: {
              marginTop: '1em',
              marginBottom: '1em',
            },
            'h2, h3': {
              color: 'inherit',
              fontWeight: '600',
            },
            pre: {
              backgroundColor: '#1f2937',
              color: '#e5e7eb',
              fontSize: '0.875em',
              padding: '1em',
              borderRadius: '0.375em',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

export default config 