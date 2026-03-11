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
      {/* Sidebar - Bauhaus Minimalism */}
      <aside className="w-64 bg-[#F2F3F7] flex flex-col z-10 hidden md:flex border-r-0">
        <div className="h-24 flex items-center justify-center bg-[#F2F3F7]">
          <h1 
            className="text-[30px] font-black tracking-[0.15em] leading-none uppercase text-transparent bg-clip-text bg-linear-to-r from-[#3C478F] to-[#FCC243] ml-[0.15em] drop-shadow-sm"
            style={{ WebkitTextFillColor: 'transparent' }}
          >KHAI</h1>
        </div>

        {/* 미니멀 구분선 */}
        <div className="mx-6 h-px bg-linear-to-r from-transparent via-gray-300/60 to-transparent" />
        
        <nav className="flex-1 py-6 px-5 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group relative flex items-center px-4 py-3.5 rounded-2xl text-[14px] font-bold transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? 'text-[#111827] bg-white shadow-[0_4px_20px_rgb(0,0,0,0.05)]'
                    : 'text-gray-400 hover:text-[#111827] hover:bg-white/60 hover:translate-x-0.5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#FCC243] rounded-r-full shadow-[2px_0_8px_rgba(252,194,67,0.3)]" />
                  )}
                  <span className={`mr-3 transition-colors duration-300 ${isActive ? 'text-[#3C478F]' : 'text-gray-400 group-hover:text-[#3C478F]'}`}>
                    {React.cloneElement(item.icon, { className: 'w-[18px] h-[18px]' })}
                  </span>
                  {item.label}
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FCC243]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* 하단 미니멀 브랜딩 */}
        <div className="px-6 py-5 mt-auto">
          <div className="h-px bg-linear-to-r from-transparent via-gray-300/60 to-transparent mb-5" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_rgba(74,222,128,0.4)]" />
              <span className="text-[11px] font-bold text-gray-400">System Online</span>
            </div>
            <span className="text-[10px] font-bold text-gray-300 tracking-wider">v1.0</span>
          </div>
        </div>
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
