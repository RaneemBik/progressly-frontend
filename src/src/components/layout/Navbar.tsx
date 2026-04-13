/**
 * Navbar.tsx — Fixed Top Navigation Bar
 *
 * Rendered on all pages EXCEPT /login and /register.
 *
 * Authenticated state:
 *  - Logo → /dashboard
 *  - "Home" link → landing page (allows navigating back without logging out)
 *  - User name display (desktop only)
 *  - Logout button → clears JWT + store, redirects to /
 *
 * Guest state:
 *  - Logo → /
 *  - Sign In button → /login
 *  - Get Started button → /register
 *
 * On the landing page (/) the nav has a transparent background.
 * On all other pages it uses the surface background with a border.
 */
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layers, LogOut, User, Home } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../ui/Button';
import { api } from '../../services/api';

export function Navbar() {
  const { state, dispatch } = useStore();
  const location = useLocation();
  const navigate  = useNavigate();
  const isAuth    = location.pathname === '/login' || location.pathname === '/register';

  const handleLogout = () => { api.auth.logout(); dispatch({ type: 'SET_USER', payload: null }); navigate('/'); };

  if (isAuth) return null;
  const isLanding = location.pathname === '/';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isLanding ? 'bg-transparent backdrop-blur-sm border-b border-white/5' : 'bg-brand-surface border-b border-brand-border'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to={state.isAuthenticated ? '/dashboard' : '/'} className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center shadow-lg shadow-brand-accent/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Progressly</span>
          </Link>

          <div className="flex items-center space-x-3">
            {state.isAuthenticated ? (
              <>
                {/* Clickable home link back to landing */}
                {location.pathname !== '/' && (
                  <Link to="/" className="hidden md:flex items-center space-x-1.5 text-sm text-brand-muted hover:text-brand-highlight transition-colors px-2 py-1 rounded-md hover:bg-brand-surface">
                    <Home className="w-4 h-4" />
                    <span>Home</span>
                  </Link>
                )}
                <div className="hidden md:flex items-center space-x-2 text-sm text-brand-muted">
                  <div className="w-8 h-8 rounded-full bg-brand-dark border border-brand-border flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="truncate max-w-[120px]">{state.user?.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} icon={<LogOut className="w-4 h-4" />}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
                <Link to="/register"><Button variant="primary" size="sm">Get Started</Button></Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
