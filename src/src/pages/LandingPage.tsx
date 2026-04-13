/**
 * LandingPage.tsx — Public Marketing / Hero Page
 *
 * The first page visitors see. Contains:
 *  - Animated 3D hero section (ThreeBackground + Framer Motion text reveals)
 *  - CTA buttons: changes based on auth state
 *      Authenticated → "View Your Projects" (→ /dashboard)
 *      Guest         → "Get Started Free" (→ /register) + "Sign In" (→ /login)
 *  - Features section below the fold
 *
 * The authenticated CTA prevents logged-in users from seeing sign-up prompts
 * when they navigate back to the landing page.
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ThreeBackground } from '../components/landing/ThreeBackground';
import { Features } from '../components/landing/Features';
import { Button } from '../components/ui/Button';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { useStore } from '../store/useStore';

export function LandingPage() {
  const { state } = useStore();

  return (
    <div className="min-h-screen bg-brand-dark overflow-hidden">
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <ThreeBackground />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-16">
          <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8, ease:'easeOut' }}>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 drop-shadow-2xl font-display">
              Manage Projects.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-highlight to-brand-secondary">
                Empower Teams.
              </span>
            </h1>
          </motion.div>

          <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8, delay:0.2, ease:'easeOut' }}
            className="mt-4 text-xl md:text-2xl text-brand-text/90 max-w-3xl mx-auto mb-10 drop-shadow-md font-light">
            Progressly helps teams organize work, track progress, and collaborate seamlessly.
          </motion.p>

          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8, delay:0.4, ease:'easeOut' }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {state.isAuthenticated ? (
              <Link to="/dashboard">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 rounded-full" icon={<LayoutDashboard className="w-5 h-5" />}>
                  View Your Projects
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 rounded-full" icon={<ArrowRight className="w-5 h-5" />}>
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 rounded-full bg-brand-dark/50 backdrop-blur-md">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-brand-dark to-transparent z-10" />
      </section>
      <Features />
    </div>
  );
}
