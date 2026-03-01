/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"DM Mono"', "Menlo", "monospace"],
        serif: ['"Crimson Pro"', "Georgia", "serif"],
      },
      colors: {
        // Semantic focus mode colors (also set via CSS vars in components)
        deep: "#c084fc",
        focus: "#67e8f9",
        drift: "#86efac",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
