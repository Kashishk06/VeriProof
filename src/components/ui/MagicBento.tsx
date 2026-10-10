import React, { useRef, useState, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';

export interface MagicBentoProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: string; // Format: "R, G, B", defaults to project's signature "192, 132, 252"
  secondaryGlowColor?: string; // Format: "R, G, B", defaults to project's "244, 114, 182"
  enableTilt?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  enableParticles?: boolean;
  enableMagnetism?: boolean;
  enableRipple?: boolean;
  spotlightRadius?: number;
  maxTilt?: number;
  magneticStrength?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

export const MagicBentoCard: React.FC<MagicBentoProps> = ({
  children,
  className = '',
  // Default to the project's signature "in 5 simple steps" gradient palette:
  // Purple-400 (192, 132, 252) & Pink-400 (244, 114, 182)
  glowColor = '192, 132, 252',
  secondaryGlowColor = '244, 114, 182',
  enableTilt = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  enableParticles = true,
  enableMagnetism = true,
  enableRipple = true,
  spotlightRadius = 320,
  maxTilt = 6,
  magneticStrength = 8,
  onClick,
  ...rest
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  // Detect coarse pointers / mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Generate ambient star particles with project gradient colors
  useEffect(() => {
    if (!enableParticles || isMobile) return;

    const count = 5;
    const colors = [
      `rgba(${glowColor}, 0.65)`,
      `rgba(${secondaryGlowColor}, 0.65)`,
      'rgba(168, 85, 247, 0.55)', // Cyber cyan accent from project
    ];

    const generated: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 15 + Math.random() * 70,
      y: 15 + Math.random() * 70,
      size: 1.5 + Math.random() * 2,
      color: colors[i % colors.length],
      duration: 3 + Math.random() * 3,
      delay: Math.random() * 2,
    }));

    setParticles(generated);
  }, [enableParticles, isMobile, glowColor, secondaryGlowColor]);

  // Handle Mouse Move for Tilt, Magnetism, and Spotlight
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current || isMobile) return;

      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setMousePos({ x, y });

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate tilt
      const rotateX = enableTilt ? ((y - centerY) / centerY) * -maxTilt : 0;
      const rotateY = enableTilt ? ((x - centerX) / centerX) * maxTilt : 0;

      // Calculate subtle magnetic pull
      const moveX = enableMagnetism ? ((x - centerX) / centerX) * magneticStrength : 0;
      const moveY = enableMagnetism ? ((y - centerY) / centerY) * magneticStrength : 0;

      // Smooth GSAP Tweening
      gsap.to(cardRef.current, {
        rotateX,
        rotateY,
        x: moveX,
        y: moveY,
        duration: 0.35,
        ease: 'power2.out',
        transformPerspective: 1000,
        transformStyle: 'preserve-3d',
      });
    },
    [isMobile, enableTilt, enableMagnetism, maxTilt, magneticStrength]
  );

  // Handle Mouse Enter
  const handleMouseEnter = () => {
    if (isMobile) return;
    setIsHovered(true);
  };

  // Handle Mouse Leave (Reset smoothly with GSAP)
  const handleMouseLeave = () => {
    if (!cardRef.current || isMobile) return;
    setIsHovered(false);

    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      x: 0,
      y: 0,
      duration: 0.5,
      ease: 'power3.out',
    });
  };

  // Handle Click for Ripple Effect
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (enableRipple && cardRef.current && !isMobile) {
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      const maxDim = Math.max(rect.width, rect.height) * 2;

      setRipples(prev => [...prev, { id, x, y, size: maxDim }]);

      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 700);
    }

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`relative overflow-hidden transition-shadow duration-300 group ${className}`}
      style={{
        willChange: isMobile ? 'auto' : 'transform',
      }}
      {...rest}
    >
      {/* ─── 1. Border Glow Overlay (Mouse Tracking) ────────────────── */}
      {enableBorderGlow && !isMobile && isHovered && (
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit] transition-opacity duration-300 z-10"
          style={{
            padding: '1px',
            background: `radial-gradient(${spotlightRadius * 0.75}px circle at ${mousePos.x}px ${mousePos.y}px, rgba(${glowColor}, 0.55), rgba(${secondaryGlowColor}, 0.3) 40%, transparent 80%)`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
      )}

      {/* ─── 2. Spotlight Radial Highlight ──────────────────────────── */}
      {enableSpotlight && !isMobile && isHovered && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-0"
          style={{
            background: `radial-gradient(${spotlightRadius}px circle at ${mousePos.x}px ${mousePos.y}px, rgba(${glowColor}, 0.12), rgba(${secondaryGlowColor}, 0.05) 45%, transparent 70%)`,
          }}
        />
      )}

      {/* ─── 3. Click Ripple Effect ─────────────────────────────────── */}
      {enableRipple && !isMobile && ripples.map(r => (
        <span
          key={r.id}
          className="absolute rounded-full pointer-events-none z-20 animate-ping"
          style={{
            left: r.x - r.size / 2,
            top: r.y - r.size / 2,
            width: r.size,
            height: r.size,
            background: `radial-gradient(circle, rgba(${secondaryGlowColor}, 0.25) 0%, rgba(${glowColor}, 0.1) 50%, transparent 70%)`,
            animationDuration: '650ms',
          }}
        />
      ))}

      {/* ─── 4. Particle / Star Sparkles Effect ─────────────────────── */}
      {enableParticles && !isMobile && isHovered && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {particles.map(p => (
            <span
              key={p.id}
              className="absolute rounded-full animate-pulse"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                boxShadow: `0 0 8px ${p.color}`,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* ─── Card Content ───────────────────────────────────────────── */}
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );
};

export default MagicBentoCard;
