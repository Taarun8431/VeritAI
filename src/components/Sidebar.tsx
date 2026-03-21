import { motion } from 'framer-motion';

interface SidebarProps {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  activeScreen: 'input' | 'analysis' | 'results';
}

export function Sidebar({ isDark, setIsDark, activeScreen }: SidebarProps) {
  const navItems = [
    { id: 'input', label: 'Dashboard', section: 'MAIN', icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )},
    { id: 'verify', label: 'Verify Claims', section: 'MAIN', badge: 'LIVE', icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )},
    { id: 'ai-detector', label: 'AI Detector', section: 'ANALYSIS', sub: 'Text authenticity', icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )},
    { id: 'media-scanner', label: 'Media Scanner', section: 'ANALYSIS', sub: 'Deepfake detection', icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
    { id: 'reports', label: 'Reports', section: 'SETTINGS', badge: 'Soon', icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )},
  ];

  const sections = ['MAIN', 'ANALYSIS', 'SETTINGS'];

  const isActive = (itemId: string) => {
    if (itemId === 'input') return activeScreen === 'input';
    if (itemId === 'verify') return activeScreen === 'analysis' || activeScreen === 'results';
    return false;
  };

  return (
    <div className="fixed left-0 top-0 w-[220px] h-screen bg-[var(--bg-sidebar)] border-r border-white/5 z-40 flex flex-col overflow-y-auto">
      {/* LOGO SECTION */}
      <div className="h-16 px-4 flex items-center gap-3 border-bottom border-white/5 border-b-[1px] border-white/10 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] flex items-center justify-center shadow-lg shadow-[#7c3aed]/40">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1L2 4v5c0 4.4 3 8.5 7 9.5 4-1 7-5.1 7-9.5V4L9 1z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M6 9l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="text-white text-lg font-bold font-heading">VeritAI</span>
      </div>

      {/* NAV SECTION */}
      <div className="flex-1 py-3 px-2">
        {sections.map(section => (
          <div key={section} className="mb-4">
            <div className="px-5 py-4 mb-1 text-[11px] font-bold text-white/30 uppercase tracking-widest">
              {section}
            </div>
            {navItems.filter(item => item.section === section).map(item => {
              const active = isActive(item.id);
              return (
                <div 
                  key={item.id}
                  className={`
                    flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 rounded-lg relative mb-1 group
                    ${active 
                      ? 'bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-white font-medium shadow-lg shadow-[#7c3aed]/35' 
                      : 'text-white/60 hover:bg-white/5 hover:text-white'}
                  `}
                >
                  <div className={active ? 'text-white' : 'text-current opacity-70 group-hover:opacity-100'}>
                    {item.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm">{item.label}</span>
                    {item.sub && <span className="text-[11px] text-white/30 group-hover:text-white/40">{item.sub}</span>}
                  </div>
                  {item.badge && (
                    <span className={`
                      ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded leading-none
                      ${item.badge === 'LIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/30'}
                    `}>
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* BOTTOM SECTION */}
      <div className="p-4 border-t border-white/10 shrink-0">
        <div className="flex items-center justify-between px-1 py-2">
          <div className="flex items-center gap-2">
            {isDark ? (
              <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
              </svg>
            )}
            <span className="text-[13px] text-white/60">Dark Mode</span>
          </div>
          <div 
            onClick={() => setIsDark(!isDark)}
            className={`
              w-10 h-[22px] rounded-full relative cursor-pointer transition-colors duration-200
              ${isDark ? 'bg-[#7c3aed]' : 'bg-white/15'}
            `}
          >
            <motion.div 
              animate={{ left: isDark ? 20 : 2 }}
              className="absolute top-0.5 w-[18px] h-[18px] bg-white rounded-full shadow-sm"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </div>
        </div>
        <div className="mt-2 text-[11px] text-white/20 font-mono text-center">
          v1.0.0 — Powered by Gemini
        </div>
      </div>
    </div>
  );
}
