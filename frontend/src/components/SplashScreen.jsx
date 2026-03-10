import React from 'react';
import { motion } from 'framer-motion';

const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#FAFAFA] flex items-center justify-center overflow-hidden">
      <motion.div 
        className="relative flex flex-col items-center justify-center pt-8"
        initial={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 1.8, ease: [0.25, 1, 0.5, 1] }}
      >
        <span 
          className="text-[140px] sm:text-[220px] font-black tracking-[0.15em] text-transparent bg-clip-text bg-linear-to-r from-[#3C478F] to-[#FCC243] leading-none ml-[0.15em] drop-shadow-sm"
          style={{ WebkitTextFillColor: 'transparent' }}
        >
          KHAI
        </span>
        <motion.span 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.9, y: 0 }}
          transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
          className="text-lg sm:text-2xl font-bold tracking-[0.5em] text-transparent bg-clip-text bg-linear-to-r from-[#3C478F] to-[#FCC243] mt-2 sm:mt-4 pl-[0.5em]"
        >
          HR Management System
        </motion.span>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
