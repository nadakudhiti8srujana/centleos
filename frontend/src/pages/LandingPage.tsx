import { 
  ArrowRight, 
  Globe2, 
  PieChart, 
  ShieldCheck, 
  Sparkles, 
  Users2, 
  Zap,
  Building2,
  TrendingUp,
  Briefcase,
  GraduationCap,
  Landmark,
  Megaphone,
  Check,
  ArrowUpRight,
  LineChart
} from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";
import CountUp from 'react-countup';
import { useState, useEffect } from 'react';
import { Modal } from "@/components/ui/Modal";

const ROUTING_OPTIONS = [
  { id: "student", label: "Student", target: "SkillTank", icon: GraduationCap, color: "text-blue-400", bg: "bg-blue-400/10" },
  { id: "startup", label: "Startup", target: "Saasum", icon: Zap, color: "text-amber-400", bg: "bg-amber-400/10" },
  { id: "company", label: "Company", target: "Vriddhi", icon: Building2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { id: "club", label: "College Club", target: "Promtal", icon: Users2, color: "text-rose-400", bg: "bg-rose-400/10" },
  { id: "influencer", label: "Influencer", target: "Tobofu", icon: Megaphone, color: "text-fuchsia-400", bg: "bg-fuchsia-400/10" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

export function LandingPage() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (event: React.MouseEvent) => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    mouseX.set((event.clientX / windowWidth - 0.5) * 2);
    mouseY.set((event.clientY / windowHeight - 0.5) * 2);
  };

  const heroRotateY = useTransform(mouseX, [-1, 1], [-15, 15]);
  const heroRotateX = useTransform(mouseY, [-1, 1], [15, -15]);

  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [persona, setPersona] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("routing_persona");
    if (saved) {
      setPersona(saved);
    } else {
      const timer = setTimeout(() => setShowQuestionnaire(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handlePersonaSelect = (id: string, target: string) => {
    localStorage.setItem("routing_persona", id);
    setPersona(id);
    setShowQuestionnaire(false);
    // Could redirect to a specific sub-product page here, but for now we personalize the CTA
  };

  const getPrimaryCTA = () => {
    if (!persona) return "Deploy Your Workspace";
    const option = ROUTING_OPTIONS.find(o => o.id === persona);
    return option ? `Explore ${option.target}` : "Deploy Your Workspace";
  };

  return (
    <div 
      className="min-h-screen bg-[#020617] font-sans text-slate-100 overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200"
      onMouseMove={handleMouseMove}
    >
      
      <Modal open={showQuestionnaire} onClose={() => setShowQuestionnaire(false)} title="Welcome to CentleOS">
        <div className="py-2">
          <h3 className="text-lg font-medium text-white mb-6">How do you identify yourself?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ROUTING_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handlePersonaSelect(opt.id, opt.target)}
                className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-slate-800/40 hover:bg-slate-700/60 hover:border-indigo-500/50 transition-all text-left"
              >
                <div className={`p-3 rounded-lg ${opt.bg} ${opt.color}`}>
                  <opt.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-slate-200">{opt.label}</div>
                  <div className="text-xs text-slate-400">Best for {opt.target}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Modal>
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-slate-800 shadow-lg shadow-indigo-500/20 border border-white/10">
                <img src="/centlelogo.jpeg" alt="CentleOS" className="h-full w-full object-cover" />
              </div>
              <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                CentleOS
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#ecosystem" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Ecosystem</a>
              <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#showcase" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Showcase</a>
              <a href="#pricing" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Pricing</a>
            </div>
            <div className="flex items-center gap-4">
              <RouterLink to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block">
                Sign In
              </RouterLink>
              <RouterLink 
                to="/register-workspace" 
                className="text-sm font-semibold bg-white text-slate-900 px-5 py-2.5 rounded-full hover:bg-indigo-50 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] transform hover:-translate-y-0.5"
              >
                Start Free Trial
              </RouterLink>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-4 overflow-hidden">
        {/* Abstract 3D Background Elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] -z-10 mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-violet-600/20 rounded-full blur-[120px] -z-10 mix-blend-screen" style={{ animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay z-0 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-left"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-semibold mb-8 backdrop-blur-md">
                <Sparkles className="w-4 h-4" />
                <span>The OS for Modern Enterprises</span>
              </motion.div>
              
              <motion.h1 variants={fadeUp} className="text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
                Enterprise Operations.<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400">
                  Perfectly Aligned.
                </span>
              </motion.h1>
              
              <motion.p variants={fadeUp} className="text-lg lg:text-xl text-slate-400 mb-10 max-w-xl leading-relaxed">
                Powering CRM, ERP, Referrals, Analytics, and Team Operations in one unified business workspace. Built for modern companies managing sales, finance, partnerships, and growth from a single platform.
              </motion.p>
              
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4">
                <RouterLink 
                  to="/register-workspace" 
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:shadow-[0_0_60px_rgba(99,102,241,0.6)] transform hover:-translate-y-1"
                >
                  {getPrimaryCTA()}
                  <ArrowRight className="w-5 h-5" />
                </RouterLink>
                <RouterLink 
                  to="/join" 
                  className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium rounded-2xl transition-all flex items-center justify-center gap-2 backdrop-blur-md"
                >
                  <Users2 className="w-5 h-5 text-slate-400" />
                  Join Existing Team
                </RouterLink>
              </motion.div>
            </motion.div>

            {/* 3D Dashboard Mockup */}
            <motion.div 
              initial={{ opacity: 0, x: 100, rotateY: 15, rotateX: 5 }}
              animate={{ opacity: 1, x: 0, rotateY: -10, rotateX: 5 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="relative perspective-[2000px] hidden lg:block"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-fuchsia-500 rounded-2xl blur-3xl opacity-20 transform -translate-x-10 translate-y-10"></div>
              <motion.div 
                style={{ rotateY: heroRotateY, rotateX: heroRotateX }}
                className="rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] p-2 preserve-3d"
              >
                <div className="absolute top-4 left-4 flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                </div>
                <div className="mt-8 rounded-xl border border-white/5 bg-[#0a0014] overflow-hidden flex h-[350px] shadow-inner relative">
                  <img src="/aurora-dashboard-hero.png" alt="CentleOS Dashboard Mockup" className="w-full h-full object-cover" />
                </div>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-10 border-y border-white/5 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs font-bold text-slate-500 mb-8 uppercase tracking-[0.2em]">Powering next-generation enterprises</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-2 font-bold text-xl"><Globe2 /> GlobalTech</motion.div>
            <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-2 font-bold text-xl"><Zap /> Bolt Systems</motion.div>
            <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-2 font-bold text-xl"><ShieldCheck /> SecureFlow</motion.div>
            <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-2 font-bold text-xl"><PieChart /> DataMatrix</motion.div>
          </div>
        </div>
      </section>

      {/* The Centle Ecosystem Section */}
      <section id="ecosystem" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-white mb-6">Built for the Centle Ecosystem</motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-slate-400">CentleOS is inspired by the operational requirements of multiple business ventures and designed as a unified operating system for modern organizations.</motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Saasum", subtitle: "CRM & ERP Operations", icon: Building2, color: "from-blue-500 to-indigo-500" },
              { title: "Maceco", subtitle: "Analytics & Research", icon: LineChart, color: "from-violet-500 to-fuchsia-500" },
              { title: "Tobofu", subtitle: "Marketing & Growth", icon: Megaphone, color: "from-rose-500 to-orange-500" },
              { title: "Promtal", subtitle: "Recruitment & Talent", icon: Briefcase, color: "from-emerald-500 to-teal-500" },
              { title: "Skill Tank", subtitle: "Learning & Training", icon: GraduationCap, color: "from-cyan-500 to-blue-500" },
              { title: "Vriddhi", subtitle: "Finance & Compliance", icon: Landmark, color: "from-amber-500 to-orange-500" },
            ].map((ecosystem, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ rotateY: 10, rotateX: -5, scale: 1.05, zIndex: 10 }}
                className="group relative perspective-[1000px] transform-gpu"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.2)] group-hover:shadow-[0_20px_50px_rgba(139,92,246,0.3)] group-hover:border-indigo-500/50 relative overflow-hidden h-full flex flex-col preserve-3d">
                  <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${ecosystem.color} opacity-10 blur-3xl rounded-full group-hover:opacity-30 transition-opacity duration-500`}></div>
                  
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-gradient-to-br ${ecosystem.color} shadow-lg text-white`}>
                    <ecosystem.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 relative z-10">{ecosystem.title}</h3>
                  <p className="text-slate-400 font-medium relative z-10 uppercase tracking-wider text-xs">{ecosystem.subtitle}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Statistics Section */}
      <section className="py-24 bg-indigo-900/10 border-y border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="text-4xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-sm flex justify-center">
                <CountUp end={6} duration={2.5} enableScrollSpy scrollSpyOnce />
                <span className="text-indigo-400">+</span>
              </div>
              <p className="text-slate-400 font-medium">Business Verticals</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="text-4xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-sm flex justify-center">
                <CountUp end={1000} duration={2.5} enableScrollSpy scrollSpyOnce separator="," />
                <span className="text-indigo-400">+</span>
              </div>
              <p className="text-slate-400 font-medium">Leads Managed</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <div className="text-4xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-sm flex justify-center">
                <CountUp end={500} duration={2.5} enableScrollSpy scrollSpyOnce separator="," />
                <span className="text-indigo-400">+</span>
              </div>
              <p className="text-slate-400 font-medium">Invoices Processed</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              <div className="text-4xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-sm flex justify-center">
                <CountUp end={99.9} duration={2.5} decimals={1} enableScrollSpy scrollSpyOnce />
                <span className="text-indigo-400">%</span>
              </div>
              <p className="text-slate-400 font-medium">Platform Availability</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why CentleOS (Feature Grid) */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-white mb-6">Why Teams Choose CentleOS</motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-slate-400">A premium enterprise platform combining the most critical business features under one roof.</motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {[
              "CRM + ERP Unified Platform",
              "Referral & Affiliate Mgmt",
              "Team Collaboration",
              "Advanced Analytics",
              "Revenue Forecasting",
              "Role Based Access Control",
              "Multi Company Architecture",
              "Google Authentication",
              "Audit Logs & Tracking",
              "Team Management"
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 flex items-center gap-4 hover:bg-slate-800/60 hover:border-indigo-500/50 transition-all cursor-default"
              >
                <div className="bg-indigo-500/20 p-2 rounded-lg shrink-0">
                  <Check className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-sm font-semibold text-slate-200">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Showcase Section */}
      <section id="showcase" className="py-32 bg-slate-900/30 border-y border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-white mb-6">Experience the Platform</motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-slate-400">Authentic capabilities driving real-world business value.</motion.p>
          </motion.div>

          <div className="space-y-32">
            {[
              {
                title: "CRM Dashboard",
                desc: "Gain instant visibility into your entire sales pipeline. Track leads, monitor conversions, and drive revenue with actionable insights.",
                image: "/screenshot-crm.png",
                fallbackImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
                reverse: false
              },
              {
                title: "Advanced Analytics",
                desc: "Enterprise-grade reporting and data visualization. Make data-driven decisions confidently with real-time analytics.",
                image: "/screenshot-analytics.png",
                fallbackImage: "https://images.unsplash.com/photo-1543286386-713bdd548da4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
                reverse: true
              },
              {
                title: "ERP Invoice Management",
                desc: "Seamlessly transition from won deals to paid invoices. Track financials, manage statuses, and maintain perfect audit trails.",
                image: "/screenshot-invoices.png",
                fallbackImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
                reverse: false
              },
              {
                title: "Referral Engine",
                desc: "Scale your growth with built-in affiliate tracking. Empower ambassadors to generate leads and track their commissions automatically.",
                image: "/screenshot-referrals.png",
                fallbackImage: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
                reverse: true
              }
            ].map((showcase, i) => (
              <div key={i} className={`flex flex-col ${showcase.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-20`}>
                <motion.div 
                  initial={{ opacity: 0, x: showcase.reverse ? 50 : -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8 }}
                  className="lg:w-1/3"
                >
                  <h3 className="text-3xl font-bold text-white mb-6">{showcase.title}</h3>
                  <p className="text-lg text-slate-400 mb-8">{showcase.desc}</p>
                  <div className="flex items-center text-indigo-400 font-semibold hover:text-indigo-300 transition-colors cursor-pointer">
                    Explore feature <ArrowUpRight className="ml-2 w-4 h-4" />
                  </div>
                </motion.div>
                
                <motion.div 
                  style={{ y: showcase.reverse ? y1 : y2 }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8 }}
                  className="lg:w-2/3 relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-fuchsia-600 rounded-[2rem] blur-2xl opacity-20 transform scale-105"></div>
                  <div className="relative rounded-[1.5rem] border border-white/10 bg-slate-900/60 backdrop-blur-2xl p-2 shadow-2xl">
                    <img 
                      src={showcase.image} 
                      alt={showcase.title} 
                      className="rounded-xl border border-white/5 opacity-90 w-full h-auto object-cover bg-slate-950"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = showcase.fallbackImage;
                      }}
                    />
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Benefits Section */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Increase Team Productivity", desc: "Automate repetitive tasks and reduce manual data entry across departments.", icon: TrendingUp, color: "from-blue-500/20 to-indigo-500/20" },
              { title: "Centralize Business Operations", desc: "A single source of truth for your sales, finance, and marketing data.", icon: Layers, color: "from-violet-500/20 to-fuchsia-500/20" },
              { title: "Scale Without Tool Switching", desc: "Eliminate context switching. Everything your team needs is in one workspace.", icon: Maximize, color: "from-emerald-500/20 to-teal-500/20" }
            ].map((benefit, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.6 }}
                className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-10 hover:bg-slate-800/60 transition-all text-center"
              >
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-8 bg-gradient-to-br ${benefit.color} border border-white/5`}>
                  <benefit.icon className="w-10 h-10 text-white opacity-80" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{benefit.title}</h3>
                <p className="text-slate-400 leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section (Simplified) */}
      <section id="pricing" className="py-24 bg-slate-900/30 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Enterprise-Grade Architecture</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12">Flexible deployment and custom plans tailored for organizations of all sizes.</p>
          
          <div className="inline-block bg-slate-800/50 backdrop-blur-md border border-white/10 rounded-3xl p-10 md:p-16 max-w-3xl mx-auto w-full">
            <h3 className="text-3xl font-bold text-white mb-4">Custom Plans</h3>
            <p className="text-slate-400 mb-10 max-w-xl mx-auto">Get full access to the CentleOS unified ecosystem, priority support, and custom integrations designed specifically for your organizational needs.</p>
            <RouterLink 
              to="/register-workspace" 
              className="inline-flex px-8 py-4 bg-white text-slate-900 hover:bg-indigo-50 font-bold text-lg rounded-2xl transition-colors shadow-xl"
            >
              Contact Sales
            </RouterLink>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer id="contact" className="relative pt-32 pb-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-slate-950 -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-700 rounded-[3rem] p-12 md:p-20 text-center shadow-[0_0_80px_rgba(99,102,241,0.3)] mb-24 relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay"></div>
            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-8 relative z-10 tracking-tight">Run Your Entire Business From One Workspace</h2>
            <p className="text-indigo-100 text-xl mb-12 max-w-3xl mx-auto relative z-10 leading-relaxed">
              Manage leads, invoices, referrals, users, analytics, and team operations without switching between multiple tools.
            </p>
            <RouterLink 
              to="/register-workspace" 
              className="inline-flex items-center gap-3 px-10 py-5 bg-white text-indigo-600 font-extrabold text-lg rounded-2xl hover:bg-indigo-50 transition-transform transform hover:scale-105 shadow-2xl relative z-10"
            >
              Start Your Workspace
              <ArrowRight className="w-6 h-6" />
            </RouterLink>
          </motion.div>
          
          <div className="flex flex-col md:flex-row justify-between items-center border-t border-white/10 pt-10 text-slate-500 text-sm">
            <div className="flex items-center gap-3 mb-6 md:mb-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded overflow-hidden bg-slate-800">
                <img src="/centlelogo.jpeg" alt="CentleOS" className="h-full w-full object-cover" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">CentleOS</span>
            </div>
            <div className="flex gap-8 font-medium">
              <a href="#" className="hover:text-white transition-colors">Platform</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
            <p className="mt-6 md:mt-0">&copy; 2026 CentleOS Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Missing icons for Customer Benefits Section
function Layers(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 2L2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>
}
function Maximize(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
}
