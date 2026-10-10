// @ts-nocheck
import { useRef, useEffect } from 'react';

const FALLBACK_RGB = { r: 255, g: 255, b: 255 };

const LetterGlitch = ({
  glitchColors = ['#2b4539', '#61dca3', '#61b3dc'],
  className = '',
  glitchSpeed = 50,
  centerVignette = false,
  outerVignette = true,
  smooth = true,
  lightMode = false,
  backgroundColor,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789'
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const letters = useRef([]);
  const grid = useRef({ columns: 0, rows: 0 });
  const context = useRef(null);
  const lastGlitchTime = useRef(Date.now());

  const lettersAndSymbols = Array.from(characters);

  const fontSize = 16;
  const charWidth = 10;
  const charHeight = 20;

  const getRandomChar = () => lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)];
  const getRandomColor = () => glitchColors[Math.floor(Math.random() * glitchColors.length)];

  const hexToRgb = hex => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
  };

  const mixRgb = (start, end, factor) => ({
    r: Math.round(start.r + (end.r - start.r) * factor),
    g: Math.round(start.g + (end.g - start.g) * factor),
    b: Math.round(start.b + (end.b - start.b) * factor)
  });

  const rgbToCss = ({ r, g, b }) => `rgb(${r}, ${g}, ${b})`;
  const getRandomRgb = () => hexToRgb(getRandomColor()) || FALLBACK_RGB;

  const calculateGrid = (width, height) => {
    const columns = Math.ceil(width / charWidth);
    const rows = Math.ceil(height / charHeight);
    return { columns, rows };
  };

  const initializeLetters = (columns, rows) => {
    grid.current = { columns, rows };
    const total = columns * rows;
    letters.current = Array.from({ length: total }, () => {
      const rgb = getRandomRgb();
      return { char: getRandomChar(), rgb, fromRgb: rgb, targetRgb: getRandomRgb(), colorProgress: 1 };
    });
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    if (context.current) context.current.setTransform(dpr, 0, 0, dpr, 0, 0);
    const { columns, rows } = calculateGrid(rect.width, rect.height);
    initializeLetters(columns, rows);
    drawLetters();
  };

  const drawLetters = () => {
    if (!context.current || letters.current.length === 0) return;
    const ctx = context.current;
    const { width, height } = canvasRef.current.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = 'top';
    letters.current.forEach((letter, i) => {
      const x = (i % grid.current.columns) * charWidth;
      const y = Math.floor(i / grid.current.columns) * charHeight;
      ctx.fillStyle = rgbToCss(letter.rgb);
      ctx.fillText(letter.char, x, y);
    });
  };

  const updateLetters = () => {
    if (!letters.current) return;
    const count = Math.max(1, Math.floor(letters.current.length * 0.05));
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * letters.current.length);
      const l = letters.current[idx];
      l.char = getRandomChar();
      l.fromRgb = l.rgb;
      l.targetRgb = getRandomRgb();
      l.colorProgress = smooth ? 0 : 1;
      if (!smooth) l.rgb = l.targetRgb;
    }
  };

  const handleSmoothTransitions = () => {
    let redraw = false;
    letters.current.forEach(l => {
      if (l.colorProgress < 1) {
        l.colorProgress = Math.min(1, l.colorProgress + 0.05);
        l.rgb = mixRgb(l.fromRgb, l.targetRgb, l.colorProgress);
        redraw = true;
      }
    });
    if (redraw) drawLetters();
  };

  const animate = () => {
    const now = Date.now();
    if (now - lastGlitchTime.current >= glitchSpeed) {
      updateLetters();
      drawLetters();
      lastGlitchTime.current = now;
    }
    if (smooth) handleSmoothTransitions();
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    context.current = canvas.getContext('2d');
    resizeCanvas();
    animate();
    let timeout;
    const onResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        cancelAnimationFrame(animationRef.current);
        resizeCanvas();
        animate();
      }, 100);
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glitchSpeed, smooth]);

  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: backgroundColor || (lightMode ? '#ffffff' : '#000000'),
    overflow: 'hidden'
  };
  const canvasStyle = { display: 'block', width: '100%', height: '100%' };
  const outerVignetteStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    background: lightMode
      ? 'radial-gradient(circle, rgba(255,255,255,0) 58%, rgba(255,255,255,0.96) 100%)'
      : 'radial-gradient(circle, rgba(0,0,0,0) 60%, rgba(0,0,0,1) 100%)'
  };
  const centerVignetteStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    background: lightMode
      ? 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 60%)'
      : 'radial-gradient(circle, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%)'
  };

  return (
    <div style={containerStyle} className={className}>
      <canvas ref={canvasRef} style={canvasStyle} />
      {outerVignette && <div style={outerVignetteStyle} />}
      {centerVignette && <div style={centerVignetteStyle} />}
    </div>
  );
};

export default LetterGlitch;
