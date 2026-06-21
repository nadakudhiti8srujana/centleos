import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { WORKSPACE_SLUGS } from "@/types";
import { getErrorMessage } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Mail, Lock, Building, User as UserIcon } from "lucide-react";
import { authService } from "@/services/auth";
import { useGoogleLogin } from "@react-oauth/google";

// Mock OAuth Icons
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);



export function DualPaneAuth() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleGoogleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        let slug = undefined;
        // Basic heuristic to pick up the typed company slug if any
        if (loginCompanySlug) slug = loginCompanySlug;
        if (userLoginCompanySlug) slug = userLoginCompanySlug;
        if (regCompanySlug) slug = regCompanySlug;

        const user = await googleLogin(tokenResponse.access_token, slug);
        if (user.role === "super_admin") {
          navigate("/super-admin");
        } else if (user.role === "user") {
          navigate("/user-dashboard");
        } else {
          navigate("/dashboard");
        }
      } catch (err) {
        setLoginError(getErrorMessage(err));
        setUserLoginError(getErrorMessage(err));
      }
    },
  });

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const handleMouseMove = (event: React.MouseEvent) => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    // Normalize to -1 to 1
    const xPct = (mouseX / windowWidth - 0.5) * 2;
    const yPct = (mouseY / windowHeight - 0.5) * 2;
    
    x.set(xPct);
    y.set(yPct);
  };

  const bookRotateY = useTransform(x, [-1, 1], [-5, 5]);
  const bookRotateX = useTransform(y, [-1, 1], [3, -3]);

  // Admin Login State
  const [activeTab, setActiveTab] = useState<"company" | "super">("company");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginCompanySlug, setLoginCompanySlug] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // User Auth State
  const [userAuthMode, setUserAuthMode] = useState<"login" | "register">("register");
  
  // User Login State
  const [userLoginEmail, setUserLoginEmail] = useState("");
  const [userLoginPassword, setUserLoginPassword] = useState("");
  const [userLoginCompanySlug, setUserLoginCompanySlug] = useState("");
  const [userLoginLoading, setUserLoginLoading] = useState(false);
  const [userLoginError, setUserLoginError] = useState("");

  // User Register State
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regCompanySlug, setRegCompanySlug] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  // Is Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [mobileView, setMobileView] = useState<"admin" | "user">("user");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const user = await login({ 
        email: loginEmail, 
        password: loginPassword,
        company_slug: activeTab === "company" ? loginCompanySlug : undefined
      });
      if (user.role === "super_admin") {
        navigate("/super-admin");
      } else if (user.role === "user") {
        navigate("/user-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setLoginError(getErrorMessage(err));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleUserLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserLoginError("");
    setUserLoginLoading(true);
    try {
      const user = await login({ 
        email: userLoginEmail, 
        password: userLoginPassword,
        company_slug: userLoginCompanySlug 
      });
      if (user.role === "user") {
        navigate("/user-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setUserLoginError(getErrorMessage(err));
    } finally {
      setUserLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");
    setRegLoading(true);
    try {
      await authService.registerUser({
        email: regEmail,
        password: regPassword,
        full_name: regFullName,
        workspace_slug: regCompanySlug
      });
      setRegSuccess("Account created successfully! Please sign in.");
      setUserAuthMode("login");
      setUserLoginEmail(regEmail);
      setUserLoginCompanySlug(regCompanySlug);
      setRegEmail("");
      setRegPassword("");
      setRegFullName("");
    } catch (err) {
      setRegError(getErrorMessage(err));
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div 
      className="dark min-h-screen bg-[#0a0014] text-white overflow-x-hidden overflow-y-auto py-24 relative flex items-center justify-center font-sans"
      onMouseMove={!isMobile ? handleMouseMove : undefined}
    >
      {/* Background Particles & Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, -50, 0] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen opacity-50"
        ></motion.div>
        <motion.div 
          animate={{ x: [0, -50, 0], y: [0, 50, 0] }} 
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-[40rem] h-[40rem] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen opacity-50"
        ></motion.div>
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[30rem] bg-violet-600/10 rounded-[100%] blur-[100px] mix-blend-screen opacity-40"
        ></motion.div>
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay"></div>
      </div>

      {/* Header Brand */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden bg-slate-900 border border-white/10 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
          <img src="/centlelogo.jpeg" alt="CentleOS" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300 leading-tight drop-shadow-sm">CentleOS</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-indigo-300 font-semibold leading-none mt-0.5">CRM Platform</span>
        </div>
      </div>

      {isMobile ? (
        // MOBILE TOGGLE LAYOUT
        <div className="w-full max-w-md px-6 py-24 relative z-10">
          {mobileView === "admin" ? (
          <motion.div 
            key="mobile-admin"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#110c22]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-2">Admin Portal 🛡️</h2>
            <p className="text-slate-400 text-sm mb-6">Sign in to manage your company.</p>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">{loginError}</div>}
              <div className="flex bg-[#1a122e] rounded-xl p-1 border border-white/5 mb-4">
                <button
                  type="button"
                  className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-colors ${activeTab === 'company' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-slate-300'}`}
                  onClick={() => setActiveTab('company')}
                >
                  Company Login
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-colors ${activeTab === 'super' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-slate-300'}`}
                  onClick={() => setActiveTab('super')}
                >
                  Super Admin
                </button>
              </div>

              {activeTab === "company" && (
                <Select 
                  label="Company / Workspace" 
                  options={WORKSPACE_SLUGS.map((w) => ({ value: w.slug, label: w.name }))} 
                  value={loginCompanySlug} 
                  onChange={(e) => setLoginCompanySlug(e.target.value)} 
                  required 
                  placeholder="Select Workspace"
                />
              )}
              
              <Input label="Email address" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required autoComplete="off" />
              <Input label="Password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required autoComplete="new-password" />
              <Button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 border-none shadow-[0_0_20px_rgba(139,92,246,0.3)]" loading={loginLoading}>Sign In</Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
                Are you a regular user?{" "}
                <button type="button" onClick={() => setMobileView("user")} className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">Switch to User Portal</button>
              </p>
            </div>
          </motion.div>
          ) : (
          <motion.div 
            key="mobile-user"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#110c22]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-2">User Portal {userAuthMode === 'register' ? '🚀' : '👋'}</h2>
            <p className="text-slate-400 text-sm mb-6">{userAuthMode === 'register' ? 'Create account for new user and login afterwards.' : 'Sign in to your user account.'}</p>
            <div className="flex bg-[#1a122e] rounded-xl p-1 border border-white/5 mb-6">
              <button
                type="button"
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-colors ${userAuthMode === 'login' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-slate-300'}`}
                onClick={() => setUserAuthMode('login')}
              >
                User Login
              </button>
              <button
                type="button"
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-colors ${userAuthMode === 'register' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-slate-300'}`}
                onClick={() => setUserAuthMode('register')}
              >
                Register User
              </button>
            </div>
            
            {userAuthMode === 'register' ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {regError && <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">{regError}</div>}
              {regSuccess && <div className="text-green-400 text-sm bg-green-400/10 p-3 rounded-lg border border-green-400/20">{regSuccess}</div>}
              <Input label="Full Name" value={regFullName} onChange={(e) => setRegFullName(e.target.value)} required autoComplete="off" />
              <Input label="Work Email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required autoComplete="off" />
              <Select label="Company / Workspace" options={WORKSPACE_SLUGS.map((w) => ({ value: w.slug, label: w.name }))} value={regCompanySlug} onChange={(e) => setRegCompanySlug(e.target.value)} required placeholder="Select Workspace" />
              <Input label="Password" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required autoComplete="new-password" />
              <Button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 border-none shadow-[0_0_20px_rgba(139,92,246,0.3)]" loading={regLoading}>Create Account</Button>
            </form>
            ) : (
            <form onSubmit={handleUserLoginSubmit} className="space-y-4">
              {userLoginError && <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">{userLoginError}</div>}
              {regSuccess && <div className="text-green-400 text-sm bg-green-400/10 p-3 rounded-lg border border-green-400/20">{regSuccess}</div>}
              
              <Select label="Company / Workspace" options={WORKSPACE_SLUGS.map((w) => ({ value: w.slug, label: w.name }))} value={userLoginCompanySlug} onChange={(e) => setUserLoginCompanySlug(e.target.value)} required placeholder="Select Workspace" />
              <Input label="Email address" type="email" value={userLoginEmail} onChange={(e) => setUserLoginEmail(e.target.value)} required autoComplete="off" />
              <Input label="Password" type="password" value={userLoginPassword} onChange={(e) => setUserLoginPassword(e.target.value)} required autoComplete="new-password" />
              
              <Button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 border-none shadow-[0_0_20px_rgba(139,92,246,0.3)]" loading={userLoginLoading}>Sign In</Button>
            </form>
            )}
            
            <div className="mt-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-white/5 flex-1"></div>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Or continue with</span>
                <div className="h-px bg-white/5 flex-1"></div>
              </div>
              <div className="flex justify-center">
                <button type="button" onClick={() => handleGoogleAuth()} className="w-full flex items-center justify-center gap-3 h-11 bg-[#1a122e] hover:bg-[#23183d] border border-white/5 rounded-xl transition-colors font-semibold text-sm">
                  <GoogleIcon />
                  Continue with Google
                </button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
                Are you an admin?{" "}
                <button type="button" onClick={() => setMobileView("admin")} className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">Switch to Admin Portal</button>
              </p>
            </div>
          </motion.div>
          )}
        </div>
      ) : (
        // DESKTOP 3D OPEN BOOK LAYOUT
        <motion.div 
          className="relative z-10 perspective-[2500px] flex items-center justify-center w-full max-w-[1200px]"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{ rotateY: bookRotateY, rotateX: bookRotateX }}
        >


          {/* Center Spine Element */}
          <div className="absolute inset-y-8 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-[#0d0818] via-[#1f1338] to-[#0d0818] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] z-0 rounded-full flex flex-col items-center justify-center gap-12 overflow-hidden border-y border-white/5">
             <div className="text-white/20 text-xs font-bold tracking-[0.3em] origin-center -rotate-90 whitespace-nowrap opacity-50">Welcome to CentleOS</div>
             <div className="w-10 h-10 rounded-full bg-[#110a24] border border-white/10 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)] z-10">
               <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
             </div>
          </div>

          <div className="flex w-full max-w-[700px] h-[640px] preserve-3d z-10 relative">
            
            {/* Premium Animated Aurora Shadow behind the book */}
            <motion.div 
              className="absolute -inset-10 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 rounded-[3rem] blur-[80px] -z-10 opacity-30"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{ backgroundSize: "200% 200%" }}
            />
            
            {/* Left Page: Login */}
            <motion.div 
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 5, opacity: 1 }}
              transition={{ duration: 1.2, type: "spring", bounce: 0.4 }}
              className="w-1/2 h-full origin-right"
            >
              <div className="w-full h-full bg-gradient-to-br from-[#1c1331] to-[#110a1f] rounded-l-[2rem] border border-white/10 border-r-0 p-1 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
                <div className="w-full h-full bg-[#110b1f]/90 rounded-l-[1.8rem] p-6 flex flex-col relative overflow-hidden">
                  {/* Subtle inner glow */}
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none"></div>
                  
                  <div className="relative z-10 flex-1 flex flex-col">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">Admin Portal 🛡️</h2>
                      <p className="text-indigo-200/60 text-xs">Sign in to manage your company or platform.</p>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-5 flex-1">
                      {loginError && <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">{loginError}</div>}
                      <div className="flex bg-[#1a122e] rounded-xl p-1 border border-white/5 mb-2">
                        <button
                          type="button"
                          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-colors ${activeTab === 'company' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-slate-300'}`}
                          onClick={() => setActiveTab('company')}
                        >
                          Company Login
                        </button>
                        <button
                          type="button"
                          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-colors ${activeTab === 'super' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-slate-300'}`}
                          onClick={() => setActiveTab('super')}
                        >
                          Super Admin
                        </button>
                      </div>

                      {activeTab === "company" && (
                        <div className="relative">
                          <Select 
                            label="Company / Workspace" 
                            options={WORKSPACE_SLUGS.map((w) => ({ value: w.slug, label: w.name }))} 
                            value={loginCompanySlug} 
                            onChange={(e) => setLoginCompanySlug(e.target.value)} 
                            required 
                            placeholder="Select Workspace"
                            className="bg-[#1a122e] border-white/5 focus:border-indigo-500/50 text-white pl-10 h-10 text-sm rounded-xl"
                          />
                          <Building className="absolute left-3.5 top-[32px] w-4 h-4 text-indigo-400/50 z-10 pointer-events-none" />
                        </div>
                      )}

                      <div className="relative">
                        <Input 
                          label="Email address" 
                          type="email" 
                          value={loginEmail} 
                          onChange={(e) => setLoginEmail(e.target.value)} 
                          required 
                          autoComplete="off"
                          className="bg-[#1a122e] border-white/5 focus:border-indigo-500/50 text-white pl-10 h-10 text-sm rounded-xl"
                        />
                        <Mail className="absolute left-3.5 top-[32px] w-4 h-4 text-indigo-400/50" />
                      </div>

                      <div className="relative">
                        <Input 
                          label="Password" 
                          type="password" 
                          value={loginPassword} 
                          onChange={(e) => setLoginPassword(e.target.value)} 
                          required 
                          autoComplete="new-password"
                          className="bg-[#1a122e] border-white/5 focus:border-indigo-500/50 text-white pl-10 h-10 text-sm rounded-xl"
                        />
                        <Lock className="absolute left-3.5 top-[32px] w-4 h-4 text-indigo-400/50" />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-[#1a122e] checked:bg-indigo-500 focus:ring-indigo-500/20" />
                          <span className="text-sm text-slate-400">Remember me</span>
                        </label>
                        <a href="#" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">Forgot password?</a>
                      </div>

                      <Button type="submit" className="w-full h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border-none shadow-[0_0_20px_rgba(99,102,241,0.3)] mt-4 text-xs font-semibold" loading={loginLoading}>
                        Sign In &rarr;
                      </Button>
                    </form>

                    <div className="mt-5">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-px bg-white/5 flex-1"></div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Or continue with</span>
                        <div className="h-px bg-white/5 flex-1"></div>
                      </div>
                      <div className="flex justify-center">
                        <button type="button" onClick={() => handleGoogleAuth()} className="w-full flex items-center justify-center gap-3 h-10 bg-[#1a122e] hover:bg-[#23183d] border border-white/5 rounded-xl transition-colors font-semibold text-xs">
                          <GoogleIcon />
                          Continue with Google
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Page: Register */}
            <motion.div 
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: -5, opacity: 1 }}
              transition={{ duration: 1.2, type: "spring", bounce: 0.4, delay: 0.15 }}
              className="w-1/2 h-full origin-left"
            >
              <div className="w-full h-full bg-gradient-to-bl from-[#1f1538] to-[#110a1f] rounded-r-[2rem] border border-white/10 border-l-0 p-1 shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
                <div className="w-full h-full bg-[#110b1f]/90 rounded-r-[1.8rem] p-6 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-purple-500/10 to-transparent pointer-events-none"></div>
                  
                  <div className="relative z-10 flex-1 flex flex-col">
                    <div className="mb-6 pl-4 flex flex-col">
                      <div className="mb-4">
                        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                          User Portal {userAuthMode === 'register' ? '🚀' : '👋'}
                        </h2>
                        <p className="text-purple-200/60 text-xs">
                          {userAuthMode === 'register' ? 'Create an account to join your workspace.' : 'Sign in to your user account.'}
                        </p>
                      </div>

                      <div className="flex bg-[#1a122e] rounded-xl p-1 border border-white/5 w-full">
                        <button
                          type="button"
                          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-colors ${userAuthMode === 'login' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-slate-300'}`}
                          onClick={() => setUserAuthMode('login')}
                        >
                          User Login
                        </button>
                        <button
                          type="button"
                          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-colors ${userAuthMode === 'register' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-slate-300'}`}
                          onClick={() => setUserAuthMode('register')}
                        >
                          Register User
                        </button>
                      </div>
                    </div>

                    {userAuthMode === 'register' ? (
                      <form onSubmit={handleRegisterSubmit} className="space-y-4 flex-1 pl-4">
                      {regError && <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">{regError}</div>}
                      {regSuccess && <div className="text-green-400 text-sm bg-green-400/10 p-3 rounded-lg border border-green-400/20">{regSuccess}</div>}
                      
                      <div className="relative">
                        <Input 
                          label="Full Name" 
                          value={regFullName} 
                          onChange={(e) => setRegFullName(e.target.value)} 
                          required 
                          autoComplete="off"
                          className="bg-[#1a122e] border-white/5 focus:border-purple-500/50 text-white pl-10 h-10 text-sm rounded-xl"
                        />
                        <UserIcon className="absolute left-3.5 top-[32px] w-4 h-4 text-purple-400/50" />
                      </div>

                      <div className="relative">
                        <Input 
                          label="Work Email" 
                          type="email" 
                          value={regEmail} 
                          onChange={(e) => setRegEmail(e.target.value)} 
                          required 
                          autoComplete="off"
                          className="bg-[#1a122e] border-white/5 focus:border-purple-500/50 text-white pl-10 h-10 text-sm rounded-xl"
                        />
                        <Mail className="absolute left-3.5 top-[32px] w-4 h-4 text-purple-400/50" />
                      </div>

                      <div className="relative">
                        <Select 
                          label="Company / Workspace" 
                          options={WORKSPACE_SLUGS.map((w) => ({ value: w.slug, label: w.name }))} 
                          value={regCompanySlug} 
                          onChange={(e) => setRegCompanySlug(e.target.value)} 
                          required 
                          placeholder="Select Workspace"
                          className="bg-[#1a122e] border-white/5 focus:border-purple-500/50 text-white pl-10 h-10 text-sm rounded-xl"
                        />
                        <Building className="absolute left-3.5 top-[32px] w-4 h-4 text-purple-400/50 z-10 pointer-events-none" />
                      </div>

                      <div className="relative">
                        <Input 
                          label="Password" 
                          type="password" 
                          value={regPassword} 
                          onChange={(e) => setRegPassword(e.target.value)} 
                          required 
                          autoComplete="new-password"
                          className="bg-[#1a122e] border-white/5 focus:border-purple-500/50 text-white pl-10 h-10 text-sm rounded-xl"
                        />
                        <Lock className="absolute left-3.5 top-[32px] w-4 h-4 text-purple-400/50" />
                      </div>

                      <Button type="submit" className="w-full h-10 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border-none shadow-[0_0_20px_rgba(168,85,247,0.3)] mt-4 text-xs font-semibold" loading={regLoading}>
                        Create Account &rarr;
                      </Button>
                    </form>
                    ) : (
                      <form onSubmit={handleUserLoginSubmit} className="space-y-4 flex-1 pl-4">
                        {userLoginError && <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">{userLoginError}</div>}
                        {regSuccess && <div className="text-green-400 text-sm bg-green-400/10 p-3 rounded-lg border border-green-400/20">{regSuccess}</div>}
                        
                        <div className="relative">
                          <Select 
                            label="Company / Workspace" 
                            options={WORKSPACE_SLUGS.map((w) => ({ value: w.slug, label: w.name }))} 
                            value={userLoginCompanySlug} 
                            onChange={(e) => setUserLoginCompanySlug(e.target.value)} 
                            required 
                            placeholder="Select Workspace"
                            className="bg-[#1a122e] border-white/5 focus:border-purple-500/50 text-white pl-10 h-10 text-sm rounded-xl"
                          />
                          <Building className="absolute left-3.5 top-[32px] w-4 h-4 text-purple-400/50 z-10 pointer-events-none" />
                        </div>
                        
                        <div className="relative">
                          <Input 
                            label="Email address" 
                            type="email" 
                            value={userLoginEmail} 
                            onChange={(e) => setUserLoginEmail(e.target.value)} 
                            required 
                            autoComplete="off"
                            className="bg-[#1a122e] border-white/5 focus:border-purple-500/50 text-white pl-10 h-10 text-sm rounded-xl"
                          />
                          <Mail className="absolute left-3.5 top-[32px] w-4 h-4 text-purple-400/50" />
                        </div>
                        
                        <div className="relative">
                          <Input 
                            label="Password" 
                            type="password" 
                            value={userLoginPassword} 
                            onChange={(e) => setUserLoginPassword(e.target.value)} 
                            required 
                            autoComplete="new-password"
                            className="bg-[#1a122e] border-white/5 focus:border-purple-500/50 text-white pl-10 h-10 text-sm rounded-xl"
                          />
                          <Lock className="absolute left-3.5 top-[32px] w-4 h-4 text-purple-400/50" />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-[#1a122e] checked:bg-purple-500 focus:ring-purple-500/20" />
                            <span className="text-sm text-slate-400">Remember me</span>
                          </label>
                          <a href="#" className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">Forgot password?</a>
                        </div>

                        <Button type="submit" className="w-full h-10 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border-none shadow-[0_0_20px_rgba(168,85,247,0.3)] mt-4 text-xs font-semibold" loading={userLoginLoading}>
                          Sign In &rarr;
                        </Button>
                      </form>
                    )}

                    <div className="mt-5 pl-4">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-px bg-white/5 flex-1"></div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Or continue with</span>
                        <div className="h-px bg-white/5 flex-1"></div>
                      </div>
                      <div className="flex justify-center">
                        <button type="button" onClick={() => handleGoogleAuth()} className="w-full flex items-center justify-center gap-3 h-10 bg-[#1a122e] hover:bg-[#23183d] border border-white/5 rounded-xl transition-colors font-semibold text-xs">
                          <GoogleIcon />
                          Continue with Google
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </motion.div>
      )}

      {/* Footer Tagline */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center z-50">
        <p className="text-slate-500 text-xs tracking-wider">© 2026 CentleOS. All rights reserved.</p>
        <p className="text-indigo-400/40 text-[10px] uppercase tracking-[0.3em] mt-1">One Workspace. Infinite Possibilities.</p>
      </div>
    </div>
  );
}
