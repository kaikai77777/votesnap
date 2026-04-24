import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'vote-yes': 'voteYes 0.4s ease-out',
        'vote-no': 'voteNo 0.4s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        voteYes: { '0%': { transform: 'translateX(0) rotate(0deg)', opacity: '1' }, '100%': { transform: 'translateX(100px) rotate(15deg)', opacity: '0' } },
        voteNo: { '0%': { transform: 'translateX(0) rotate(0deg)', opacity: '1' }, '100%': { transform: 'translateX(-100px) rotate(-15deg)', opacity: '0' } },
      },
    },
  },
  plugins: [],
}

export default config
