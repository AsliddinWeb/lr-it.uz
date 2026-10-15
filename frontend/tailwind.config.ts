import type { Config } from "tailwindcss";

// Tokenlar CSS o'zgaruvchilarida (light/dark) — `bg-danger/10` kabi shaffoflik modifikatorlari
// ishlashi uchun rang color-mix orqali beriladi (<alpha-value> o'rniga Tailwind 0..1 qo'yadi).
const token = (name: string) =>
  `color-mix(in srgb, var(${name}) calc(<alpha-value> * 100%), transparent)`;

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
  	extend: {
  		colors: {
  			bg: token('--bg'),
  			surface: token('--surface'),
  			'surface-2': token('--surface-2'),
  			border: token('--border'),
  			'text-primary': token('--text-primary'),
  			'text-muted': token('--text-muted'),
  			primary: {
  				DEFAULT: token('--primary'),
  				soft: token('--primary-soft')
  			},
  			success: token('--success'),
  			warning: token('--warning'),
  			danger: token('--danger'),
  			accent: token('--accent')
  		},
  		fontFamily: {
  			display: [
  				'var(--font-sora)'
  			],
  			sans: [
  				'var(--font-inter)'
  			]
  		},
  		borderRadius: {
  			'2xl': '1rem'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: token('--radix-accordion-content-height')
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: token('--radix-accordion-content-height')
  				},
  				to: {
  					height: '0'
  				}
  			},
  			blob: {
  				'0%, 100%': { transform: 'translate(0, 0) scale(1)' },
  				'33%': { transform: 'translate(4%, 6%) scale(1.08)' },
  				'66%': { transform: 'translate(-3%, -4%) scale(0.95)' }
  			},
  			shimmer: {
  				'0%': { backgroundPosition: '0% 0%' },
  				'100%': { backgroundPosition: '200% 0%' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			blob: 'blob 16s ease-in-out infinite',
  			shimmer: 'shimmer 3.5s linear infinite'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};

export default config;
