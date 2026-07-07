/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        brand: {
          50: '#eef6ff',
          100: '#d9ebff',
          600: '#155eef',
          700: '#0f4bc7',
          800: '#143f8f',
          900: '#14346f',
        },
        saffron: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
        },
        civic: {
          green: '#15803d',
          greenSoft: '#dcfce7',
          line: '#d8dee8',
          paper: '#ffffff',
          surface: '#f7f9fc',
          notice: '#fff8e1',
        },
      },
      boxShadow: {
        portal: '0 16px 36px rgba(15, 23, 42, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
