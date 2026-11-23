const withOpacity = (variable) => `rgb(var(--${variable}) / <alpha-value>)`;

const palette = (prefix, include950 = true) => ({
  50: withOpacity(`${prefix}-50`),
  100: withOpacity(`${prefix}-100`),
  200: withOpacity(`${prefix}-200`),
  300: withOpacity(`${prefix}-300`),
  400: withOpacity(`${prefix}-400`),
  500: withOpacity(`${prefix}-500`),
  600: withOpacity(`${prefix}-600`),
  700: withOpacity(`${prefix}-700`),
  800: withOpacity(`${prefix}-800`),
  900: withOpacity(`${prefix}-900`),
  ...(include950 ? { 950: withOpacity(`${prefix}-950`) } : {}),
});

module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        blue: palette('blue'),
        slate: palette('slate'),
        sky: palette('sec'),
        cyan: palette('sec'),
        purple: palette('sec'),
        indigo: palette('sec'),
        violet: palette('sec'),
        emerald: palette('ok', false),
        green: palette('ok', false),
      },
    },
  },
  plugins: [],
};
