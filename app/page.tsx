"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useSpring } from "framer-motion";

// Scroll progress bar extracted into its own component so hooks follow the Rules of Hooks
const ScrollProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-primary z-[60] origin-left"
      style={{ scaleX }}
    />
  );
};
import { 
  FileText, 
  BrainCircuit, 
  Timer, 
  Users, 
  Upload, 
  Settings, 
  BookOpen, 
  ChevronRight,
  Menu,
  X,
  CreditCard,
  Shield,
  MessageSquare
} from "lucide-react";

// --- Components ---

const Section = ({ children, id }: { children: React.ReactNode; id?: string }) => (
  <motion.section
    id={id}
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    className="py-20 px-6 md:px-12 lg:px-24"
  >
    {children}
  </motion.section>
);

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-md border-b" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-primary rounded-base flex items-center justify-center text-white font-bold text-xl group-hover:rotate-6 transition-transform">
            S
          </div>
          <span className="font-extrabold text-2xl tracking-tight">StudyDesk</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 font-semibold text-text-secondary">
          <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-primary transition-colors">How It Works</Link>
          <Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link 
            href="/login" 
            className="px-6 py-2 border-2 border-primary text-primary font-bold rounded-base hover:bg-primary hover:text-white transition-all"
          >
            Login
          </Link>
          <Link 
            href="/register" 
            className="px-6 py-2 bg-primary text-white font-bold rounded-base hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white border-b p-6 flex flex-col gap-4 font-semibold"
        >
          <Link href="#features" onClick={() => setIsOpen(false)}>Features</Link>
          <Link href="#how-it-works" onClick={() => setIsOpen(false)}>How It Works</Link>
          <Link href="/pricing" onClick={() => setIsOpen(false)}>Pricing</Link>
          <div className="flex flex-col gap-2 pt-4">
            <Link href="/login" className="w-full py-3 text-center border-2 border-primary text-primary rounded-base">Login</Link>
            <Link href="/register" className="w-full py-3 text-center bg-primary text-white rounded-base">Get Started</Link>
          </div>
        </motion.div>
      )}
    </nav>
  );
};

const MockupAnimation = () => {
  const [text, setText] = useState("");
  const fullText = "Summary: This module covers machine learning fundamentals, focusing on supervising vs unsupervised learning. Key algorithms include SVM, Random Forest, and Gradient Boosting...";
  
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, index));
      index++;
      if (index > fullText.length) index = 0;
    }, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-md bg-white rounded-[20px] shadow-2xl border p-6 aspect-[4/3] overflow-hidden">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-yellow-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
      </div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary/10 rounded-base flex items-center justify-center text-primary">
          <FileText size={20} />
        </div>
        <div>
          <div className="h-3 w-32 bg-slate-100 rounded-full mb-2" />
          <div className="h-2 w-20 bg-slate-50 rounded-full" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 rounded-base font-mono text-xs text-slate-600 dark:text-slate-400 border border-dashed border-slate-200">
           {text}<span className="animate-pulse">|</span>
        </div>
        <div className="flex gap-2">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-8 flex-1 bg-primary/5 rounded-base animate-pulse" />
            ))}
        </div>
      </div>
      
      {/* Floating Badge */}
      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute bottom-10 -right-6 bg-white shadow-xl border p-3 rounded-base flex items-center gap-3"
      >
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <Shield size={16} />
          </div>
          <div className="text-[10px] font-bold">Verified by AI</div>
      </motion.div>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
  <div className="p-8 rounded-base border bg-white hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all group">
    <div className="w-12 h-12 bg-primary/10 rounded-base flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
  </div>
);

// --- Main Page ---

export default function LandingPage() {
  const universityBadges = [
    { name: "UCT", logo: "UCT" },
    { name: "Wits", logo: "WITS" },
    { name: "UKZN", logo: "UKZN" },
    { name: "UP", logo: "UP" },
    { name: "SU", logo: "SU" },
    { name: "UJ", logo: "UJ" },
    { name: "DUT", logo: "DUT" },
    { name: "CPUT", logo: "CPUT" }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:text-slate-50 selection:bg-primary selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 md:px-12 lg:px-24 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-black uppercase tracking-widest">
              <BrainCircuit size={16} /> Now Powered by StudyDesk v2.0
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
              Your Ultimate AI Co-Pilot for <span className="text-primary italic decoration-blue-200 underline decoration-4">Mastering</span> Your Course
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              Upload your PDFs, textbooks, or lecture slides. Our AI instantly scaffolds 
              structured notes, creates adaptive quizzes, and schedules mock exams tailored to your goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link 
                href="/register" 
                className="px-10 py-4 bg-primary text-white font-bold rounded-base text-lg flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 transition-all"
              >
                Get Started Free <ChevronRight size={20} />
              </Link>
              <Link 
                href="#features" 
                className="px-10 py-4 border-2 border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100 font-bold rounded-base text-lg flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all"
              >
                See How It Works
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative flex justify-center lg:justify-end"
          >
            <MockupAnimation />
            
            {/* Background Decorative Element */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <Section id="features">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Built for Academic Dominance</h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg font-bold max-w-2xl mx-auto">Everything you need to master your syllabus in record time, powered by next-gen cognitive tools.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FeatureCard 
              icon={FileText}
              title="AI Notes from PDFs"
              desc="Extract key concepts, summaries, and terminology from complex documents in seconds. No more manual transcription."
            />
            <FeatureCard 
              icon={BrainCircuit}
              title="Auto-Generated Quizzes"
              desc="Instantly turn any module into interactive flashcards and multiple-choice quizzes to test your retention."
            />
            <FeatureCard 
              icon={Timer}
              title="Mock Exams with Timers"
              desc="Simulate high-pressure exam environments with time-tracked assessments that mimic actual paper structures."
            />
            <FeatureCard 
              icon={Users}
              title="Tutor Group Collaboration"
              desc="Join study pods moderated by top tutors. Share notes, discuss concepts, and clear doubts in real-time."
            />
          </div>
        </div>
      </Section>

      {/* How It Works */}
      <Section id="how-it-works">
        <div className="max-w-7xl mx-auto bg-slate-50/50 rounded-[30px] p-12 md:p-20 border border-dashed border-slate-200">
           <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Master Your Course in 3 Steps</h2>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
             {/* Lines for desktop */}
             <div className="hidden md:block absolute top-[60px] left-[20%] right-[20%] h-[2px] bg-slate-200 -z-0" />
             
             {[
               { id: 1, title: "Upload", icon: Upload, desc: "Drop your lecture notes, slides, or textbook chapters." },
               { id: 2, title: "Generate", icon: Settings, desc: "Our AI constructs a custom learning path and prep materials." },
               { id: 3, title: "Master", icon: BookOpen, desc: "Acing exams with confidence via repetitive, active recall." }
             ].map((step) => (
               <div key={step.id} className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-[120px] h-[120px] bg-white rounded-full border shadow-sm flex items-center justify-center text-primary mb-6 ring-8 ring-slate-50/50">
                    <step.icon size={40} />
                  </div>
                  <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-4">
                    {step.id}
                  </div>
                  <h3 className="text-2xl font-black mb-2">{step.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300 font-bold">{step.desc}</p>
               </div>
             ))}
           </div>
        </div>
      </Section>

      {/* Social Proof */}
      <section className="py-20 border-y border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest text-sm mb-12">
            Join 10,000+ students at top South African universities
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all">
             {universityBadges.map((u) => (
               <div key={u.name} className="flex flex-col items-center gap-2">
                  <div className="text-2xl font-bold">{u.logo}</div>
                  <span className="text-[10px] font-bold">{u.name}</span>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 md:px-12 lg:px-24 border-t bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
          <div className="col-span-2 lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-base flex items-center justify-center text-white font-bold text-xl">S</div>
              <span className="font-extrabold text-2xl tracking-tight">StudyDesk</span>
            </Link>
            <p className="text-slate-600 dark:text-slate-400 max-w-xs leading-relaxed">
              The premier ecosystem for students and tutors to collaborate and dominate academic goals.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="w-10 h-10 border rounded-base flex items-center justify-center hover:bg-primary hover:text-white transition-colors"><Users size={18} /></Link>
              <Link href="#" className="w-10 h-10 border rounded-base flex items-center justify-center hover:bg-primary hover:text-white transition-colors"><MessageSquare size={18} /></Link>
            </div>
          </div>
          
          <div className="space-y-6">
            <h4 className="font-bold uppercase tracking-widest text-sm">Product</h4>
            <ul className="space-y-4 text-slate-600 dark:text-slate-400 font-medium">
              <li><Link href="#features" className="hover:text-primary transition-colors text-sm">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-primary transition-colors text-sm">Pricing</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors text-sm">AI Engine</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="font-bold uppercase tracking-widest text-sm">Company</h4>
            <ul className="space-y-4 text-slate-600 dark:text-slate-400 font-medium">
              <li><Link href="#" className="hover:text-primary transition-colors text-sm">About Us</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors text-sm">Careers</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors text-sm">Contact</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="font-bold uppercase tracking-widest text-sm">Legal</h4>
            <ul className="space-y-4 text-slate-600 dark:text-slate-400 font-medium">
              <li><Link href="/privacy" className="hover:text-primary transition-colors text-sm">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors text-sm">Terms</Link></li>
              <li><Link href="/popia" className="hover:text-primary transition-colors text-sm">POPIA</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pt-20 mt-20 border-t text-sm font-bold text-slate-600 dark:text-slate-400 gap-4">
          <p>© 2026 StudyDesk. All rights reserved.</p>
          <div className="flex gap-8">
            <span>Made with ❤️ for SA Students</span>
          </div>
        </div>
      </footer>

      {/* Progress Bar */}
      <ScrollProgressBar />
    </div>
  );
}
