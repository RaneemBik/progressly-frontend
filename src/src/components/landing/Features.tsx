/**
 * Features.tsx — Landing Page Feature Highlights Section
 *
 * Renders below the hero section on the landing page.
 * Showcases three core features:
 *  1. Kanban Board — visual task management
 *  2. Team Collaboration — invite and roles
 *  3. Dependency Tracking — graph visualisation
 *
 * Each card animates in when it enters the viewport.
 */
// React default import not required
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  ShieldCheck,
  Activity,
  Zap } from
'lucide-react';
export function Features() {
  const features = [
  {
    icon: LayoutDashboard,
    title: 'Smart Dashboard',
    description:
    "Get a bird's-eye view of all your projects, tasks, and team progress in one centralized hub."
  },
  {
    icon: KanbanSquare,
    title: 'Task Boards',
    description:
    'Organize work visually with intuitive drag-and-drop Kanban boards that keep everyone aligned.'
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description:
    'Invite members, assign tasks, and work together seamlessly across different projects.'
  },
  {
    icon: ShieldCheck,
    title: 'Role-Based Access',
    description:
    'Control who can see and do what with granular permissions for owners, admins, and members.'
  },
  {
    icon: Activity,
    title: 'Real-Time Progress',
    description:
    'Track project health with visual indicators and automatic task counting.'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description:
    'Built for speed with modern architecture, ensuring your team never waits on the tool.'
  }];

  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };
  return (
    <section className="py-24 bg-brand-dark relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{
              opacity: 0,
              y: 20
            }}
            whileInView={{
              opacity: 1,
              y: 0
            }}
            viewport={{
              once: true
            }}
            className="text-3xl md:text-4xl font-bold text-white mb-4">
            
            Everything you need to ship faster
          </motion.h2>
          <motion.p
            initial={{
              opacity: 0,
              y: 20
            }}
            whileInView={{
              opacity: 1,
              y: 0
            }}
            viewport={{
              once: true
            }}
            transition={{
              delay: 0.1
            }}
            className="text-lg text-brand-muted max-w-2xl mx-auto">
            
            Powerful features designed to help your team stay organized,
            focused, and productive without the clutter.
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            margin: '-100px'
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {features.map((feature, index) =>
          <motion.div
            key={index}
            variants={itemVariants}
            className="glass-panel p-6 rounded-2xl hover:border-brand-accent/50 transition-colors duration-300 group">
            
              <div className="w-12 h-12 rounded-xl bg-brand-accent/10 flex items-center justify-center mb-6 group-hover:bg-brand-accent/20 transition-colors">
                <feature.icon className="w-6 h-6 text-brand-highlight" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-brand-muted leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>);

}