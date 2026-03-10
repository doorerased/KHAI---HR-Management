import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { FileSearch, MessageSquareText, WalletCards, BriefcaseBusiness } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = () => {
  const location = useLocation();
  const navItems = [
    { path: '/project', label: '프로젝트 관리', icon: <BriefcaseBusiness className="w-5 h-5" /> },
    { path: '/profile', label: '위원 정보 가져오기', icon: <FileSearch className="w-5 h-5" /> },
    { path: '/bank', label: '정산 정보 가져오기', icon: <WalletCards className="w-5 h-5" /> },
    { path: '/message', label: '안내문 생성하기', icon: <MessageSquareText className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      {/* Sidebar - Bauhaus Minimalism: Subtle contrast with main content */}
      <aside className="w-64 bg-[#F2F3F7] flex flex-col z-10 hidden md:flex border-r-0">
        <div className="h-28 flex items-center px-8 bg-[#F2F3F7]">
          <div className="flex items-center">
            <div className="flex flex-col">
              <h1 className="text-[33px] font-black text-[#111827] tracking-[0.15em] leading-none uppercase">KHAI</h1>
              <span className="text-[10px] font-black text-gray-400 tracking-[0.4em] uppercase mt-1.5 whitespace-nowrap">HR Management System</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 py-8 px-6 space-y-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative flex items-center px-4 py-3 rounded-2xl text-[15px] font-bold transition-all duration-300 ${
                  isActive
                    ? 'text-[#111827] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
                    : 'text-gray-400 hover:text-[#3C478F] hover:bg-white/50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active Indicator Line (Bauhaus Yellow) */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#FCC243] rounded-r-full" />
                  )}
                  <span className={`mr-4 ${isActive ? 'text-[#3C478F]' : 'text-gray-400'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-white">
        {/* Mobile Header (Minimal) */}
        <header className="md:hidden h-20 bg-[#F2F3F7] flex items-center px-6 flex-shrink-0 z-10">
          <h1 className="text-xl font-black text-[#111827] tracking-[0.15em] uppercase">KHAI</h1>
        </header>
        
        <div className="flex-1 overflow-auto p-4 md:p-10 bg-white">
          <div className="max-w-6xl mx-auto h-full">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav (Minimal) */}
      <nav className="md:hidden bg-white/80 backdrop-blur-xl flex justify-around items-center h-20 flex-shrink-0 z-10 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.03)] rounded-t-3xl absolute bottom-0 w-full left-0">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center w-full h-full text-[11px] font-bold transition-colors ${
                isActive ? 'text-[#111827]' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute top-0 w-8 h-1 bg-[#FCC243] rounded-b-full shadow-[0_4px_10px_rgba(252,194,67,0.4)]" />
                )}
                <div className={`mb-1.5 mt-2 transition-transform ${isActive ? 'scale-110 text-[#3C478F]' : ''}`}>
                  {React.cloneElement(item.icon, { className: 'w-6 h-6' })}
                </div>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
