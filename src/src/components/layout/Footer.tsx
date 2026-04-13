/**
 * Footer.tsx — Landing Page Footer
 *
 * Simple footer with copyright and links.
 * Rendered only on the landing page (/) via App.tsx route logic.
 */
// React default import not required
import { Layers, Github, Twitter, Linkedin } from 'lucide-react';
export function Footer() {
  return (
    <footer className="bg-brand-dark border-t border-brand-border py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Layers className="w-6 h-6 text-brand-accent" />
            <span className="text-xl font-bold text-white tracking-tight">
              Progressly
            </span>
          </div>

          <div className="flex space-x-6 text-brand-muted">
            <a
              href="#"
              className="hover:text-brand-highlight transition-colors">
              
              <Github className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="hover:text-brand-highlight transition-colors">
              
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="hover:text-brand-highlight transition-colors">
              
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>
        <div className="mt-8 text-center md:text-left text-sm text-brand-muted/60">
          &copy; {new Date().getFullYear()} Progressly. All rights reserved.
        </div>
      </div>
    </footer>);

}