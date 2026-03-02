import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#0066B2",
          gray: "#7C7B7F",
          white: "#FFFFFF",
          oxford: "#001F35",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Orbitron", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        orb: "0 0 60px rgba(0,102,178,0.38), 0 0 120px rgba(124,123,127,0.2)",
      },
      keyframes: {
        "gradient-flow": {
          "0%": { transform: "translate3d(-6%, -6%, 0) scale(1)" },
          "50%": { transform: "translate3d(5%, 4%, 0) scale(1.05)" },
          "100%": { transform: "translate3d(-4%, 6%, 0) scale(1)" },
        },
      },
      animation: {
        "gradient-flow": "gradient-flow 18s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [],
};

export default config;
