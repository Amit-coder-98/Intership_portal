/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                mit: {
                    red: '#9E1B32',
                    teal: '#008C99',
                    orange: '#F37021',
                    dark: '#231F20',
                    grey: '#404041',
                    light: '#F8F9FA',
                    border: '#E1E4E8',
                }
            },
            fontFamily: {
                sans: ['"Noto Sans"', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
