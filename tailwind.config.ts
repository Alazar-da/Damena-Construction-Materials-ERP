import type { Config } from 'tailwindcss';
export default { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { navy: '#071a2b', cobalt: '#1565d8', ink: '#102a43' }, fontFamily: { sans: ['Arial', 'Noto Sans Ethiopic', 'sans-serif'] } } }, plugins: [] } satisfies Config;
