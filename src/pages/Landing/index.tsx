import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, AlertTriangle, ArrowRight, Play, CheckCircle,
  Lock, Search, Brain, Check, Database, Share2, Eye,
  Layers, Clock, FileText, ChevronRight, ChevronLeft, Activity, Terminal,
  RefreshCw, Cpu, Server, ExternalLink, Sparkles, ChevronDown,
  Menu, X, CheckSquare, Info, Zap
} from 'lucide-react';

import cyberHeadImg from '../../assets/cyber_head.png';
import aiHandImg from '../../assets/ai_hand.png';
import socCyberFaceImg from '../../assets/soc_cyber_face.png';
import veriproofLogo from '../../assets/veriproof_logo.png';
import {
  HERO_CAPABILITIES,
  VALUE_PROPOSITIONS,
  CORE_FEATURES,
  INNOVATIONS,
  EXPLAINABILITY_DEMO,
  ATTACK_TIMELINE_EVENTS,
  TECH_CAPABILITIES,
  USE_CASES,
  ROLE_PREVIEWS,
  type FeatureItem
} from '../../data/landingData';
import { MagicBentoCard } from '../../components/ui/MagicBento';
import { WorkflowsSection } from '../../components/workflow/WorkflowsSection';

const LandingPage: React.FC = () => {
  // Navigation State
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Features Horizontal Carousel Ref & State
  const featuresScrollRef = React.useRef<HTMLDivElement>(null);
  const [featuresPaused, setFeaturesPaused] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkFeaturesScroll = () => {
    if (featuresScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = featuresScrollRef.current;
      setCanScrollLeft(scrollLeft > 15);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 15);
    }
  };

  const scrollFeatures = (direction: 'left' | 'right') => {
    if (featuresScrollRef.current) {
      const scrollAmount = 350;
      featuresScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkFeaturesScroll, 350);
    }
  };

  // Continuous auto-advance with pause on hover
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || featuresPaused) return;

    const interval = setInterval(() => {
      if (featuresScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = featuresScrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 20) {
          featuresScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          featuresScrollRef.current.scrollBy({ left: 340, behavior: 'smooth' });
        }
        checkFeaturesScroll();
      }
    }, 3800);

    return () => clearInterval(interval);
  }, [featuresPaused]);

  // Value Proposition State (Detect, Protect, Prove, Trust)
  const [activeValueProp, setActiveValueProp] = useState<'detect' | 'protect' | 'prove' | 'trust'>('detect');


  // Core Features Modal / Detail State
  const [selectedFeature, setSelectedFeature] = useState<FeatureItem | null>(null);

  // Innovation Tab State
  const [activeInnovation, setActiveInnovation] = useState(0);

  // Attack Timeline State
  const [selectedTimelineEvent, setSelectedTimelineEvent] = useState(3); // Default to High-Risk Exfil event

  // Use Case State
  const [activeUseCase, setActiveUseCase] = useState(0);

  // Tooltip Hover for Capabilities
  const [hoveredCap, setHoveredCap] = useState<string | null>(null);

  // Scroll Spy for sticky navbar active links
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'features', 'how-it-works', 'innovation'];
      const scrollPos = window.scrollY + 200;

      for (const sec of sections) {
        const el = document.getElementById(sec);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sec);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll handler
  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] selection:bg-purple-500/30 selection:text-purple-300 relative font-sans">
      {/* ─── Ambient Glow & Cyber Grid Background ──────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[650px] h-[650px] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/4 -right-20 w-[550px] h-[550px] bg-purple-600/15 rounded-full blur-[160px]" />
        <div className="absolute top-2/3 left-1/4 w-[600px] h-[500px] bg-blue-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-10 right-1/4 w-[500px] h-[400px] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      {/* ─── 1. Fixed Navigation Bar ──────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#050816]/90 border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Left: Brand Logo */}
          <div
            className="flex items-center cursor-pointer group"
            onClick={() => scrollTo('home')}
          >
            <img
              src={veriproofLogo}
              alt="VeriProof — Secure Digital Document Verification Platform"
              className="h-14 sm:h-[58px] w-auto object-contain group-hover:opacity-90 transition-opacity duration-200"
            />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-300">
            {[
              { id: 'home', label: 'Home' },
              { id: 'features', label: 'Features' },
              { id: 'how-it-works', label: 'How It Works' },
              { id: 'innovation', label: 'Innovation' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`relative py-1.5 transition-colors uppercase tracking-wider text-[11px] ${
                  activeSection === item.id ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
                {activeSection === item.id && (
                  <motion.span
                    layoutId="activeNavIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full shadow-[0_0_8px_#A855F7]"
                  />
                )}
              </button>
            ))}
          </nav>

          {/* Right Action CTA Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2 text-xs font-semibold text-slate-300 bg-[#0B1020] hover:bg-[#11182B] border border-white/10 hover:border-purple-400/40 rounded-full transition-all inline-block"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#A855F7] to-[#EC4899] hover:from-[#A855F7] hover:to-[#EC4899] rounded-full shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Register Organization</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-slate-300 hover:text-white p-2 rounded-lg bg-white/5 border border-white/10"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-[#0B1020]/95 border-b border-white/10 px-6 py-4 flex flex-col gap-3"
            >
              {[
                { id: 'home', label: 'Home' },
                { id: 'features', label: 'Features' },
                { id: 'how-it-works', label: 'How It Works' },
                { id: 'innovation', label: 'Innovation' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="text-left text-xs font-semibold uppercase tracking-wider py-1.5 text-slate-300 hover:text-purple-400"
                >
                  {item.label}
                </button>
              ))}
              <div className="flex gap-3 pt-3 border-t border-white/10">
                <Link
                  to="/login"
                  className="flex-1 py-2 text-xs font-semibold text-slate-300 bg-white/5 rounded-xl border border-white/10 text-center"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="flex-1 py-2 text-xs font-bold text-white bg-purple-500 rounded-xl text-center"
                >
                  Register Organization
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ─── 2. Hero Section ───────────────────────────────────────────── */}
      <section id="home" className="relative z-10 pt-28 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT: Cyber Head Visual with 3 Dynamic Floating Status Cards */}
          <div className="lg:col-span-6 relative flex justify-center items-center">
            <div className="relative w-full max-w-[480px] aspect-[9/13] flex items-center justify-center">
              {/* Vibrant ambient backlights */}
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/25 via-pink-500/20 to-purple-600/35 rounded-full blur-[90px]" />
              <div className="absolute -bottom-10 left-10 w-44 h-44 bg-purple-400/20 rounded-full blur-[70px]" />

              {/* 3D Cyber Head Asset */}
              <motion.img
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                src={cyberHeadImg}
                alt="CIPHER03 Secure Document Verification Platform"
                className="relative z-10 w-full h-auto object-contain filter drop-shadow-[0_0_50px_rgba(168,85,247,0.3)]"
              />
            </div>
          </div>

          {/* RIGHT: Text Content & CTAs */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/25">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-[11px] font-mono tracking-wider font-bold text-purple-400 uppercase">
                CIPHER03 — SECURE DIGITAL DOCUMENT VERIFICATION PLATFORM
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-black leading-[1.06] tracking-tight">
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Verify Authenticity.
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Detect Tampering. Build Trust.
              </span>
            </h1>

            {/* Supporting Description */}
            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              Verify digital certificates, identity documents, invoices, contracts, and other supported documents. Analyze available document information, detect potential signs of modification, and review verification findings with clear reasons and supporting evidence.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => scrollTo('how-it-works')}
                className="px-7 py-3.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#A855F7] to-[#EC4899] hover:from-[#A855F7] hover:to-[#EC4899] shadow-xl shadow-purple-500/30 flex items-center gap-2 group transition-all"
              >
                <span>Verify a Document</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => scrollTo('how-it-works')}
                className="px-6 py-3.5 rounded-full text-xs font-semibold text-slate-300 bg-[#0B1020] hover:bg-[#11182B] border border-white/10 hover:border-purple-400/40 flex items-center gap-2 transition-all"
              >
                <Play size={13} className="text-purple-400 fill-purple-400" />
                <span>Explore How It Works</span>
              </button>
            </div>

            {/* ─── 4. Hero Product Capabilities ─── */}
            <div className="pt-4 border-t border-white/5">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-3">
                PLATFORM CAPABILITIES
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {HERO_CAPABILITIES.map(cap => (
                  <div
                    key={cap.id}
                    onMouseEnter={() => setHoveredCap(cap.id)}
                    onMouseLeave={() => setHoveredCap(null)}
                    className="relative cursor-pointer group bg-[#0B1020]/90 border border-white/5 hover:border-purple-500/30 rounded-xl px-3 py-2 transition-all flex items-center gap-2"
                  >
                    <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 flex-shrink-0">
                      {cap.iconName === 'Brain' && <Brain size={13} />}
                      {cap.iconName === 'Activity' && <Activity size={13} />}
                      {cap.iconName === 'Lock' && <Lock size={13} />}
                      {cap.iconName === 'Database' && <Database size={13} />}
                      {cap.iconName === 'Shield' && <Shield size={13} />}
                    </div>
                    <span className="text-[11px] font-medium text-slate-300 group-hover:text-white truncate">
                      {cap.title}
                    </span>

                    {/* Tooltip */}
                    {hoveredCap === cap.id && (
                      <div className="absolute bottom-full left-0 mb-2 z-30 w-56 p-2.5 rounded-xl bg-[#090E1F] border border-purple-500/40 text-[10px] text-slate-300 shadow-2xl backdrop-blur-xl">
                        {cap.tooltip}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 8. NETPROOF Value Proposition ─────────────────────────────── */}
      <section className="relative z-10 py-16 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="space-y-3 mb-12 text-center max-w-3xl mx-auto">
          <div className="inline-block px-3 py-1 rounded-full text-[10px] font-mono tracking-wider font-bold uppercase text-purple-400 bg-purple-500/10 border border-purple-500/20">
            VALUE PROPOSITION
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            From Document Submission to{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Verified Finding
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Click on each core pillar to explore how CIPHER03 supports the document verification lifecycle.
          </p>
        </div>

        {/* 4 Interactive Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {VALUE_PROPOSITIONS.map(vp => (
            <MagicBentoCard
              key={vp.id}
              onClick={() => setActiveValueProp(vp.id)}
              className={`p-6 rounded-2xl cursor-pointer transition-all border flex flex-col justify-between ${
                activeValueProp === vp.id
                  ? `bg-[#0E152E] ${vp.accentBorder} shadow-2xl scale-[1.02]`
                  : 'bg-[#0B1020]/90 border-white/5 hover:border-white/20'
              }`}
            >
              <div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${vp.color} p-[1px] mb-4`}>
                  <div className="w-full h-full bg-[#050816] rounded-xl flex items-center justify-center font-black text-xs text-white">
                    {vp.concept[0]}
                  </div>
                </div>

                <div className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
                  {vp.concept}
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  {vp.tagline}
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {vp.shortDesc}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 text-[11px] font-semibold text-purple-400 flex items-center gap-1">
                <span>{activeValueProp === vp.id ? 'Viewing details below' : 'Click to inspect'}</span>
                <ChevronDown size={14} className={activeValueProp === vp.id ? 'rotate-180 transition-transform' : ''} />
              </div>
            </MagicBentoCard>
          ))}
        </div>

        {/* Dynamic Detail Card Display for Selected Value Prop */}
        <div className="mt-6 p-6 sm:p-8 bg-[#0B1020] border border-purple-500/30 rounded-3xl">
          {(() => {
            const vp = VALUE_PROPOSITIONS.find(v => v.id === activeValueProp) || VALUE_PROPOSITIONS[0];
            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8 space-y-3">
                  <div className="text-[11px] font-mono text-purple-400 uppercase tracking-wider font-bold">
                    DEEP DIVE // {vp.concept} ARCHITECTURE
                  </div>
                  <h4 className="text-xl font-bold text-white">{vp.tagline}</h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {vp.fullDesc}
                  </p>
                </div>
                <div className="lg:col-span-4 bg-[#050816] p-4 rounded-2xl border border-white/5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold mb-2">
                    KEY DELIVERABLES:
                  </div>
                  <ul className="space-y-2">
                    {vp.keyOutputs.map((out, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                        <Check size={14} className="text-purple-400 flex-shrink-0" />
                        <span>{out}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ─── 9. How It Works (VeriProof Workflows) ─────────────────────── */}
      <section id="how-it-works" className="relative z-10 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/5">
        <WorkflowsSection />
      </section>

      {/* ─── 10. Core Features Section ─────────────────────────────────── */}
      <section id="features" className="relative z-10 py-16 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div className="space-y-3">
            <div className="inline-block px-3 py-1 rounded-full text-[10px] font-mono tracking-wider font-bold uppercase text-purple-400 bg-purple-500/10 border border-purple-500/20">
              CORE FEATURES
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Everything You Need for Trusted Document{' '}
              <span className="text-purple-400">Verification</span>
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Click "Learn More" on any module for implementation details.
          </span>
        </div>

        {/* Horizontal Navigation & Controls */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono bg-purple-500/10 border border-purple-500/20 text-purple-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {featuresPaused ? 'Paused on Hover' : 'Continuous Stream'}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Swipe or use controls to browse all {CORE_FEATURES.length} verification modules
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollFeatures('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className={`p-2.5 rounded-xl border transition-all ${
                canScrollLeft
                  ? 'bg-[#0B1020] border-purple-500/30 text-white hover:bg-purple-500/20 hover:border-purple-400 cursor-pointer shadow-lg'
                  : 'bg-[#050816] border-white/5 text-slate-600 cursor-not-allowed opacity-50'
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scrollFeatures('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              className={`p-2.5 rounded-xl border transition-all ${
                canScrollRight
                  ? 'bg-[#0B1020] border-purple-500/30 text-white hover:bg-purple-500/20 hover:border-purple-400 cursor-pointer shadow-lg'
                  : 'bg-[#050816] border-white/5 text-slate-600 cursor-not-allowed opacity-50'
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Horizontal Moving Cards Track with Edge Fades */}
        <div className="relative -mx-4 sm:-mx-6 px-4 sm:px-6">
          {/* Subtle gradient fades on edges */}
          <div
            className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-[#050816] to-transparent z-10 transition-opacity duration-300 ${
              canScrollLeft ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div
            className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-[#050816] to-transparent z-10 transition-opacity duration-300 ${
              canScrollRight ? 'opacity-100' : 'opacity-0'
            }`}
          />

          <div
            ref={featuresScrollRef}
            onScroll={checkFeaturesScroll}
            onMouseEnter={() => setFeaturesPaused(true)}
            onMouseLeave={() => setFeaturesPaused(false)}
            onTouchStart={() => setFeaturesPaused(true)}
            onTouchEnd={() => setFeaturesPaused(false)}
            className="flex gap-5 overflow-x-auto scroll-smooth py-3 px-1 select-none cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {CORE_FEATURES.map(feat => (
              <div
                key={feat.id}
                className="flex-shrink-0 w-[290px] sm:w-[320px] md:w-[340px]"
              >
                <MagicBentoCard
                  className="h-full bg-[#0B1020]/90 border border-white/5 hover:border-purple-500/30 rounded-2xl p-5 shadow-xl transition-all hover:bg-[#0E152E] flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#050816] border border-white/10 flex items-center justify-center text-purple-400">
                        {feat.iconName === 'Activity' && <Activity size={18} />}
                        {feat.iconName === 'Brain' && <Brain size={18} />}
                        {feat.iconName === 'Clock' && <Clock size={18} />}
                        {feat.iconName === 'Shield' && <Shield size={18} />}
                        {feat.iconName === 'Terminal' && <Terminal size={18} />}
                        {feat.iconName === 'Database' && <Database size={18} />}
                        {feat.iconName === 'AlertTriangle' && <AlertTriangle size={18} />}
                        {feat.iconName === 'Share2' && <Share2 size={18} />}
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {feat.badge}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed min-h-[50px]">
                      {feat.shortDesc}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedFeature(feat)}
                    className="mt-5 pt-3 border-t border-white/5 text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center justify-between w-full cursor-pointer"
                  >
                    <span>Learn More</span>
                    <ChevronRight size={14} />
                  </button>
                </MagicBentoCard>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Detail Modal / Drawer */}
        <AnimatePresence>
          {selectedFeature && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0B1020] border border-purple-500/30 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative"
              >
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-white p-1 rounded-lg bg-white/5"
                >
                  <X size={18} />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {selectedFeature.badge}
                  </span>
                  <h3 className="text-xl font-bold text-white">{selectedFeature.title}</h3>
                </div>

                <div className="space-y-4 text-xs sm:text-sm text-slate-300">
                  <div className="p-4 rounded-xl bg-[#050816] border border-white/5">
                    <span className="text-[10px] font-mono text-purple-400 uppercase font-bold block mb-1">
                      WHAT IT DOES
                    </span>
                    <p>{selectedFeature.whatItDoes}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#050816] border border-white/5">
                    <span className="text-[10px] font-mono text-purple-400 uppercase font-bold block mb-1">
                      WHY IT MATTERS
                    </span>
                    <p>{selectedFeature.whyItMatters}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#050816] border border-white/5">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block mb-1">
                      HOW CIPHER03 IMPLEMENTS IT
                    </span>
                    <p>{selectedFeature.howVeriproofImplements}</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedFeature(null)}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-500 hover:bg-purple-400 transition-colors"
                  >
                    Close Specifications
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </section>

      {/* ─── 11. Innovation Section ────────────────────────────────────── */}
      <section id="innovation" className="relative z-10 py-16 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="space-y-3 mb-10">
          <div className="inline-block px-3 py-1 rounded-full text-[10px] font-mono tracking-wider font-bold uppercase text-purple-400 bg-purple-500/10 border border-purple-500/20">
            INNOVATION
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            From Submission to <span className="text-purple-400">Verified Finding</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Smarter Analysis. Honest Results. Evidence-Backed Trust.
          </p>
        </div>

        {/* 5 Interactive Innovation Pills */}
        <div className="flex flex-wrap gap-2.5 mb-8">
          {INNOVATIONS.map((inv, idx) => (
            <button
              key={inv.id}
              onClick={() => setActiveInnovation(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeInnovation === idx
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-400/50 shadow-lg shadow-purple-500/10'
                  : 'bg-[#0B1020] text-slate-400 border border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              <Zap size={13} className={activeInnovation === idx ? 'text-purple-400' : 'text-slate-500'} />
              <span>{inv.title}</span>
            </button>
          ))}
        </div>

        {/* Selected Innovation Showcase */}
        {(() => {
          const item = INNOVATIONS[activeInnovation];
          return (
            <div className="bg-[#0B1020]/95 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="text-[11px] font-mono text-purple-400 font-bold uppercase">
                    INNOVATION 0{activeInnovation + 1}
                  </div>
                  <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{item.summary}</p>

                  <div className="space-y-2 pt-2">
                    {item.details.map((d, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <CheckCircle size={15} className="text-purple-400 flex-shrink-0 mt-0.5" />
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs">
                    <span className="text-[10px] font-mono text-red-400 font-bold uppercase block mb-1">
                      TRADITIONAL APPROACH
                    </span>
                    <p className="text-slate-300">{item.comparison.traditional}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block mb-1">
                      CIPHER03 APPROACH
                    </span>
                    <p className="text-slate-300">{item.comparison.veriproof}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* ─── 12. AI Explainability Section ─────────────────────────────── */}
      <section className="relative z-10 py-16 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="space-y-3 mb-10">
          <div className="inline-block px-3 py-1 rounded-full text-[10px] font-mono tracking-wider font-bold uppercase text-purple-400 bg-purple-500/10 border border-purple-500/20">
            VERIFICATION FINDINGS
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Don't Just Tell Me the Result.{' '}
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Show Me Why.
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Inspect the verification signal strengths and supporting factors behind each document assessment.
          </p>
        </div>

        <div className="bg-[#0B1020]/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: AI Neural Interface Visual without Card Frame */}
            <div className="lg:col-span-5 flex items-center justify-center relative py-4">
              {/* Dynamic ambient radial backlight glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-pink-500/15 to-purple-500/20 rounded-full blur-[80px] pointer-events-none" />

              <motion.img
                initial={{ opacity: 0, y: 15 }}
                animate={{
                  opacity: 1,
                  y: [0, -12, 0],
                }}
                transition={{
                  opacity: { duration: 0.6 },
                  y: {
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                }}
                src={aiHandImg}
                alt="AI Neural Analysis & Explainability Visual"
                className="w-full max-w-[360px] h-auto object-contain relative z-10 filter drop-shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:drop-shadow-[0_0_55px_rgba(168,85,247,0.6)] transition-all duration-300"
              />
            </div>

            {/* Right: Dynamic Signal Strength Indicators */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-white/5 pb-2">
                <span>SUPPORTING SIGNAL FACTORS</span>
                <span>FACTOR STRENGTH</span>
              </div>

              {EXPLAINABILITY_DEMO.factors.map((fac, idx) => (
                <div key={idx} className="space-y-1.5 p-3 rounded-xl bg-[#050816]/70 border border-white/5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{fac.factor}</span>
                    <span className="font-mono text-purple-400 font-bold">{fac.strength}%</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"
                      style={{ width: `${fac.strength}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1">
                    <span>{fac.description}</span>
                    <span className="text-slate-500">{fac.indicatorType}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 13. Attack Timeline Preview ───────────────────────────────── */}
      <section className="relative z-10 py-16 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div className="space-y-3">
            <div className="inline-block px-3 py-1 rounded-full text-[10px] font-mono tracking-wider font-bold uppercase text-purple-400 bg-purple-500/10 border border-purple-500/20">
              VERIFICATION TIMELINE
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Document Verification <span className="text-pink-400">Event Walkthrough</span>
            </h2>
          </div>
          <button
            onClick={() => scrollTo('architecture')}
            className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-purple-500 hover:bg-purple-400 transition-colors flex items-center gap-1.5 self-start md:self-auto"
          >
            <span>View Full Investigation</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Interactive Timeline Bar */}
        <div className="bg-[#0B1020]/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {ATTACK_TIMELINE_EVENTS.map((ev, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedTimelineEvent(idx)}
                className={`p-3 rounded-xl text-left transition-all border ${
                  selectedTimelineEvent === idx
                    ? 'bg-purple-500/20 border-purple-400 shadow-lg shadow-purple-500/10'
                    : 'bg-[#050816] border-white/5 hover:border-white/15'
                }`}
              >
                <div className="text-[10px] font-mono text-purple-400 font-bold">{ev.time}</div>
                <div className="text-xs font-bold text-white mt-1 truncate">{ev.title}</div>
                <span className={`inline-block mt-2 text-[9px] font-mono px-2 py-0.5 rounded ${
                  ev.risk === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                  ev.risk === 'HIGH' ? 'bg-amber-500/20 text-amber-400' :
                  ev.risk === 'MEDIUM' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-300'
                }`}>
                  {ev.risk}
                </span>
              </button>
            ))}
          </div>

          {/* Active Event Inspection Box */}
          {(() => {
            const ev = ATTACK_TIMELINE_EVENTS[selectedTimelineEvent];
            return (
              <div className="p-6 rounded-2xl bg-[#050816] border border-purple-500/30 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-8 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-purple-400">{ev.time} UTC</span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs font-bold text-white">{ev.eventType}</span>
                  </div>
                  <h4 className="text-lg font-bold text-white">{ev.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{ev.details}</p>
                </div>

                <div className="md:col-span-4 space-y-1.5 text-[11px] font-mono bg-white/[0.02] p-4 rounded-xl border border-white/5">
                  <div className="flex justify-between text-slate-400">
                    <span>Source:</span>
                    <span className="text-white">{ev.source}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Destination:</span>
                    <span className="text-white">{ev.destination}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Protocol:</span>
                    <span className="text-purple-400 font-bold">{ev.protocol}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

{/* ─── 19. Technology Capabilities ───────────────────────────────── */}
      <section className="relative z-10 py-16 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="space-y-3 mb-10 text-center max-w-2xl mx-auto">
          <div className="inline-block px-3 py-1 rounded-full text-[10px] font-mono tracking-wider font-bold uppercase text-purple-400 bg-purple-500/10 border border-purple-500/20">
            TECHNOLOGY STACK
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Integrated Technical Disciplines
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {TECH_CAPABILITIES.map(tc => (
            <div key={tc.category} className="bg-[#0B1020]/90 border border-white/10 hover:border-purple-400/30 rounded-2xl p-5 shadow-xl transition-all">
              <div className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider mb-3">
                {tc.category}
              </div>
              <ul className="space-y-1.5">
                {tc.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 20. Use Cases Section ───────────────────────────────────────── */}
      <section className="relative z-10 py-16 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="space-y-3 mb-10">
          <div className="inline-block px-3 py-1 rounded-full text-[10px] font-mono tracking-wider font-bold uppercase text-purple-400 bg-purple-500/10 border border-purple-500/20">
            REAL-WORLD APPLICATIONS
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Who Benefits from CIPHER03
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Designed for educational institutions, organizations, issuers, verifiers, and businesses that need reliable document verification findings.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {USE_CASES.map(uc => (
            <div
              key={uc.id}
              onClick={() => setActiveUseCase(USE_CASES.findIndex(u => u.id === uc.id))}
              className={`p-6 rounded-2xl cursor-pointer transition-all border ${
                activeUseCase === USE_CASES.findIndex(u => u.id === uc.id)
                  ? 'bg-[#0E152E] border-purple-400/50 shadow-lg shadow-purple-500/10'
                  : 'bg-[#0B1020]/90 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">
                {uc.audience}
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{uc.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">{uc.description}</p>
              <div className="space-y-1">
                {uc.keyBenefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <Check size={11} />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 20b. Cyber Face Visual with SOC Dashboard Preview ───────────── */}
      <section className="relative z-10 py-16 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-block px-3 py-1 rounded-full text-[10px] font-mono tracking-wider font-bold uppercase text-purple-400 bg-purple-500/10 border border-purple-500/20">
              PLATFORM INTELLIGENCE
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Built for the Modern{' '}
              <span className="text-purple-400">Verification Era</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              CIPHER03 combines multi-signal document analysis, trusted registry verification, and
              role-based workflows into a single, auditable document verification platform.
            </p>

          </div>

          <div className="lg:col-span-7 relative flex items-center justify-center">
            <div className="relative w-full max-w-[320px] aspect-[9/13] flex items-center justify-center mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-pink-500/15 to-purple-600/25 rounded-full blur-[80px]" />
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
                }}
              >
                <img
                  src={socCyberFaceImg}
                  alt="CIPHER03 Platform Intelligence Dashboard Visual"
                  style={{
                    aspectRatio: '1/1',
                    mixBlendMode: 'screen',
                  }}
                  className="w-full h-auto object-contain filter drop-shadow-[0_0_40px_rgba(168,85,247,0.35)] drop-shadow-[0_0_70px_rgba(236,72,153,0.2)] select-none pointer-events-auto cursor-pointer"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 22. Role-Based Product Preview ────────────────────────────── */}
      <section className="relative z-10 py-16 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="space-y-3 mb-10">
          <div className="inline-block px-3 py-1 rounded-full text-[10px] font-mono tracking-wider font-bold uppercase text-purple-400 bg-purple-500/10 border border-purple-500/20">
            ENTERPRISE ACCESS PROFILES
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Tailored Experiences by Role
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ROLE_PREVIEWS.map(r => (
            <MagicBentoCard
              key={r.roleId}
              className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="text-[10px] font-mono text-purple-400 font-bold uppercase mb-1">{r.badge}</div>
                <h3 className="text-base font-bold text-white mb-1">{r.name}</h3>
                <p className="text-xs text-slate-400 mb-4">{r.tagline}</p>
                <div className="space-y-1.5">
                  {r.capabilities.map((cap, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <Check size={13} className="text-purple-400 flex-shrink-0" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5">
                <button
                  onClick={() => scrollTo('how-it-works')}
                  className="w-full py-2 rounded-xl text-xs font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Explore {r.name} Flow</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </MagicBentoCard>
          ))}
        </div>
      </section>

{/* ─── 24. Final CTA ───────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-4 sm:px-6 max-w-5xl mx-auto text-center border-t border-white/5">
        <div className="bg-gradient-to-b from-[#0E152E] to-[#0B1020] border border-purple-500/30 rounded-3xl p-8 sm:p-14 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-pink-500/5 to-purple-500/10 pointer-events-none" />
          <div className="relative z-10 space-y-5 max-w-2xl mx-auto">
            <div className="inline-block px-3 py-1 rounded-full text-[10px] font-mono tracking-wider font-bold uppercase text-purple-300 bg-purple-500/10 border border-purple-500/25">
              GET STARTED
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Ready to Verify Your First Document?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Join educational institutions, organizations, and verifiers who use CIPHER03 to assess
              document authenticity with structured, evidence-backed verification findings.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                onClick={() => scrollTo('how-it-works')}
                className="px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#A855F7] to-[#EC4899] hover:from-[#9333EA] hover:to-[#DB2777] shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all flex items-center gap-2 group"
              >
                <span>Explore Platform</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>

            </div>
          </div>
        </div>
      </section>

      {/* ─── 25. Footer ─────────────────────────────────────────────────── */}
      <footer className="relative z-10 py-12 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/10 text-xs text-slate-400">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">

          {/* Brand Info */}
          <div className="md:col-span-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <img
                src={veriproofLogo}
                alt="VeriProof"
                className="h-10 sm:h-11 w-auto object-contain"
              />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              CIPHER03 — Secure Digital Document Verification Platform. Helping organizations assess document authenticity through multi-signal analysis and trusted registry verification.
            </p>
          </div>



          {/* Navigation Links */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-purple-400 uppercase font-bold tracking-wider">
              NAVIGATION
            </div>
            <ul className="space-y-1.5 text-slate-400">
              <li><button onClick={() => scrollTo('home')} className="hover:text-white transition-colors">Home</button></li>
              <li><button onClick={() => scrollTo('features')} className="hover:text-white transition-colors">Features</button></li>
              <li><button onClick={() => scrollTo('how-it-works')} className="hover:text-white transition-colors">How It Works</button></li>
              <li><button onClick={() => scrollTo('innovation')} className="hover:text-white transition-colors">Innovation</button></li>
            </ul>
          </div>

          {/* Product Links */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-purple-400 uppercase font-bold tracking-wider">
              PRODUCT
            </div>
            <ul className="space-y-1.5 text-slate-400">
              <li><button onClick={() => scrollTo('features')} className="hover:text-white transition-colors">Features</button></li>
              <li><button onClick={() => scrollTo('how-it-works')} className="hover:text-white transition-colors">Workflow</button></li>
              <li><button onClick={() => scrollTo('innovation')} className="hover:text-white transition-colors">Innovation</button></li>
              <li><button onClick={() => scrollTo('how-it-works')} className="hover:text-white transition-colors">Verification Pipeline</button></li>
              <li><button onClick={() => scrollTo('innovation')} className="hover:text-white transition-colors">Tamper Analysis</button></li>
            </ul>
          </div>

          {/* Security & Compliance */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-purple-400 uppercase font-bold tracking-wider">
              SECURITY & COMPLIANCE
            </div>
            <ul className="space-y-1.5 text-slate-400">
              <li><button onClick={() => scrollTo('features')} className="hover:text-white transition-colors">Integrity Verification</button></li>
              <li><button onClick={() => scrollTo('innovation')} className="hover:text-white transition-colors">Privacy Controls</button></li>
              <li><button onClick={() => scrollTo('how-it-works')} className="hover:text-white transition-colors">Evidence Chain</button></li>
              <li><button onClick={() => scrollTo('innovation')} className="hover:text-white transition-colors">Registry Audit</button></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 font-mono text-[11px]">
          <div>
            &copy; 2026 CIPHER03 / VERIPROOF. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Secure Document Verification Platform</span>
            <span className="text-purple-400">v2.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
