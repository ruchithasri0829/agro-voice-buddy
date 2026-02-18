import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

export default function Splash() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => navigate("/home"), 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center hero-gradient relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-gold" />
        <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-primary-light" />
        <div className="absolute top-1/2 left-1/4 w-20 h-20 rounded-full bg-gold-light" />
      </div>

      <div
        className="relative z-10 flex flex-col items-center gap-6 transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)" }}
      >
        {/* Logo */}
        <div className="relative animate-float">
          <div className="absolute inset-0 rounded-full bg-gold opacity-20 blur-xl scale-150" />
          <img
            src={logo}
            alt="AgroDhwani Logo"
            className="w-28 h-28 rounded-3xl shadow-lg relative z-10"
          />
        </div>

        {/* App Name */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-foreground tracking-tight">
            AgroDhwani
          </h1>
          <p className="text-primary-foreground/70 text-lg mt-1 font-medium">
            एग्रोध्वनि • అగ్రోధ్వని
          </p>
        </div>

        {/* Tagline */}
        <p className="text-primary-foreground/60 text-center text-sm px-8 max-w-xs">
          Smart AI Voice Assistant for Farmers
        </p>

        {/* Loading dots */}
        <div className="flex gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-gold status-dot"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}
        </div>
      </div>

      {/* Bottom leaf decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-24 opacity-10">
        <svg viewBox="0 0 400 100" className="w-full h-full" preserveAspectRatio="none">
          <path d="M0,50 Q100,0 200,50 Q300,100 400,50 L400,100 L0,100 Z" fill="currentColor" className="text-gold" />
        </svg>
      </div>
    </div>
  );
}
