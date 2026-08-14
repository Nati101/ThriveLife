import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  Home,
  BarChart3,
  BookOpen,
  Settings,
  Menu,
  X,
  Target,
  Users,
  Trophy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { isFeatureEnabled } from "@/components/utils/featureFlags";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    async function loadUser() {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (error) {
        // Not logged in
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Base navigation items
  const navItems = [
    { name: "Home", icon: Home, path: createPageUrl("Dashboard") },
    { name: "My Teams", icon: Users, path: createPageUrl("MyTeam") },
    { name: "Daily Rhythms", icon: Target, path: createPageUrl("DailyRhythms") },
    { name: "Wellness Assessment", icon: BarChart3, path: createPageUrl("WellnessAssessment") },
    { name: "Journal & Goals", icon: BookOpen, path: createPageUrl("Journal") },
    { name: "Settings", icon: Settings, path: createPageUrl("Settings") }
  ];

  const isActive = (path) => {
    const currentPath = location.pathname;
    return currentPath === path || (path !== "/" && currentPath.startsWith(path));
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 text-foreground">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar for desktop */}
        <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-border shadow-sm">
          <div className="px-6 h-20 flex items-center border-b border-border">
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dd5a726e4_ChatGPTImageAug18202508_03_05PM.png" 
                alt="ThriveLife Logo" 
                className="h-10 w-10 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-800">ThriveLife</h1>
                <p className="text-xs text-muted-foreground">Wellness Platform</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-base font-medium ${
                      isActive(item.path)
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                    }`}
                  >
                    <item.icon size={20} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {user && (
            <div className="px-4 py-4 border-t border-border mt-auto">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-100">
                 <Avatar>
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>{(user.display_name || user.full_name || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user.display_name || user.full_name || "User"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b px-4 py-3 flex items-center justify-between">
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2">
               <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dd5a726e4_ChatGPTImageAug18202508_03_05PM.png" alt="ThriveLife Logo" className="h-8 w-8 object-contain" />
              <span className="font-bold text-gray-800">ThriveLife</span>
            </Link>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg text-muted-foreground hover:bg-gray-100">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </header>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-30 bg-black/50 md:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
            )}
            {mobileMenuOpen && (
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed top-0 left-0 bottom-0 z-40 w-64 bg-white md:hidden flex flex-col shadow-xl"
              >
                  <div className="p-4 border-b">
                    <span className="font-bold text-gray-800">ThriveLife</span>
                  </div>
                  <nav className="flex-1 p-4">
                    <ul className="space-y-2">
                      {navItems.map((item) => (
                        <li key={item.name}>
                          <Link to={item.path} className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive(item.path) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-gray-100"}`}>
                            <item.icon size={20} />
                            <span>{item.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
              </motion.div>
            )}
          </AnimatePresence>

          <main className="flex-1 overflow-auto relative">
            {children}
            <Toaster />
          </main>
        </div>
      </div>
    </div>
  );
}
