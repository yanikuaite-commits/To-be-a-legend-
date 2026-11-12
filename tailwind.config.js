/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050b18",
        navy: "#0a1528",
        panel: "#101f36",
        line: "#1d3350",
        pitch: "#0f7a4f",
        gold: "#f5c451",
        lime: "#b6f36a",
      },
      fontFamily: {
        display: ['"Barlow Condensed"', "Impact", "system-ui", "sans-serif"],
        sans: ['Inter', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
