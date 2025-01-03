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
  		fontFamily: {
  			sans: [
  				'var(--font-roboto)',
  				'Arial',
  				'sans-serif'
  			],
  			heading: [
  				'var(--font-amatic)',
  				'cursive'
  			]
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				navy: {
  					DEFAULT: '#002D62',
  					foreground: '#FFFFFF'
  				},
  				mint: {
  					DEFAULT: '#AEE4D4',
  					foreground: '#002D62'
  				},
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			yellow: {
  				'50': '#fffdf0',
  				'100': '#fff9cc',
  				'200': '#fff5a3',
  				'300': '#fff17a',
  				'400': '#ffed52',
  				'500': '#FFD300',
  				'600': '#e6be00',
  				'700': '#b39300',
  				'800': '#806900',
  				'900': '#4d4000'
  			},
  			navy: {
  				'50': '#e6edf4',
  				'100': '#ccdbe9',
  				'200': '#99b7d3',
  				'300': '#6693bd',
  				'400': '#336fa7',
  				'500': '#002D62',
  				'600': '#002455',
  				'700': '#001b48',
  				'800': '#00123b',
  				'900': '#00092e'
  			},
  			mint: {
  				'50': '#f4fbf9',
  				'100': '#e9f7f3',
  				'200': '#d3efe7',
  				'300': '#AEE4D4',
  				'400': '#8ed9c1',
  				'500': '#6ecfae',
  				'600': '#4ec49b',
  				'700': '#3da981',
  				'800': '#2c8e67',
  				'900': '#1b734d'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		typography: {
  			DEFAULT: {
  				css: {
  					maxWidth: 'none',
  					color: 'inherit',
  					fontFamily: 'inherit',
  					h1: {
  						fontFamily: 'var(--font-amatic)',
  						fontWeight: '700',
  						fontSize: '3.5rem'
  					},
  					h2: {
  						fontFamily: 'var(--font-amatic)',
  						fontWeight: '700',
  						fontSize: '3rem'
  					},
  					h3: {
  						fontFamily: 'var(--font-amatic)',
  						fontWeight: '700',
  						fontSize: '2.5rem'
  					},
  					h4: {
  						fontFamily: 'var(--font-amatic)',
  						fontWeight: '700',
  						fontSize: '2rem'
  					},
  					a: {
  						color: '#002D62',
  						'&:hover': {
  							color: '#001b48'
  						}
  					},
  					p: {
  						marginTop: '1em',
  						marginBottom: '1em',
  						fontFamily: 'var(--font-roboto)'
  					},
  					pre: {
  						backgroundColor: '#1f2937',
  						color: '#e5e7eb',
  						fontSize: '0.875em',
  						padding: '1em',
  						borderRadius: '0.375em'
  					}
  				}
  			}
  		}
  	}
  },
  plugins: [
    require('@tailwindcss/typography'),
      require("tailwindcss-animate")
],
}

export default config 