/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
       colors: {
        'custom-purple': '#644d7b',  
        'custom-purple-200': '#674787ff', 
        'custom-green': '#10b981',
        'brand-blue': '#1fb6ff',
        'custom-yellow': '#B2A97E',
        'custom-purple-300': 'rgba(242, 229, 179, 0.20)',
        'custom-purple-400': '#2c233a',
      },
      borderRadius: {
        'custom': '12px',
      },
      backgroundImage: {
        'purple-to-white': 'linear-gradient(180deg, #9E89B3 0%, #F8F8F8 100%)',
      }
    },
  },
  plugins: [],
}
