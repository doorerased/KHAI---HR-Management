import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  FolderOpen, 
  UserPlus, 
  WalletCards, 
  MessageSquareText, 
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  BookOpen
} from 'lucide-react';

const Guide = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      title: "환영합니다! 🚀",
      subtitle: "평가 위원 관리 자동화 시스템 시작하기",
      content: "본 프로그램은 위원 섭외부터 정산까지의 번거로운 행정 업무를 획기적으로 줄여주는 스마트 도구입니다. 카드를 넘기며 주요 기능을 익혀보세요.",
      icon: <Sparkles className="w-12 h-12 text-[#FCC243]" />,
      color: "bg-yellow-50",
      tips: ["크롬(Chrome) 브라우저 사용을 권장합니다.", "모든 데이터는 안전하게 본인 PC에 저장됩니다."]
    },
    {
      title: "프로젝트 관리",
      subtitle: "사업별로 깔끔하게 정리하는 폴더 시스템",
      content: "새로운 평가 사업이 시작되면 '새 폴더'를 만드세요. 기관명과 평가 구분을 입력하면 해당 사업만의 독립적인 위원 명단이 생성됩니다.",
      icon: <FolderOpen className="w-12 h-12 text-[#3C478F]" />,
      color: "bg-blue-50",
      tips: ["업무가 끝나면 상태를 '완료'로 바꾸세요.", "완료 시점의 데이터가 스냅샷으로 영구 저장됩니다."]
    },
    {
      title: "프로필 자동 추출",
      subtitle: "문서에서 정보를 뽑아내는 마법",
      content: "이력서나 프로필 파일을 드래그 한 번으로 분석하세요. 성명, 생년월일, 연락처, 이메일을 시스템이 알아서 찾아줍니다.",
      icon: <UserPlus className="w-12 h-12 text-green-500" />,
      color: "bg-green-50",
      tips: ["🌟 파일명을 '홍길동_프로필'처럼 이름으로 시작하게 하세요.", "이름으로 시작하면 인식 확률이 200% 올라갑니다!"]
    },
    {
      title: "정산 정보 관리",
      subtitle: "복잡한 텍스트도 한 번에 해결",
      content: "위원이 보낸 문자나 카톡 내용을 복사해서 붙여넣으세요. 은행, 계좌번호, 주민번호를 똑똑하게 분류해 드립니다.",
      icon: <WalletCards className="w-12 h-12 text-purple-500" />,
      color: "bg-purple-50",
      tips: ["주민번호가 유효한지 실시간으로 검증합니다.", "민감한 정보는 마스킹 처리되어 안전합니다."]
    },
    {
      title: "메시지 자동 완성",
      subtitle: "반복되는 안내문 작성을 5초 만에",
      content: "준비된 템플릿을 선택하면 위원 정보가 자동으로 삽입됩니다. 완성된 문구는 클릭 한 번으로 복사하여 바로 사용하세요.",
      icon: <MessageSquareText className="w-12 h-12 text-pink-500" />,
      color: "bg-pink-50",
      tips: ["{이름}, {기관명} 변수가 자동으로 바뀝니다.", "맞춤형 메시지로 실수를 방지하세요."]
    },
    {
      title: "데이터 보안 및 백업",
      subtitle: "소중한 업무 자료를 지키는 방법",
      content: "본 프로그램은 개인정보 보호를 위해 서버가 아닌 사용자 브라우저에 데이터를 저장합니다. 따라서 주기적인 백업이 매우 중요합니다.",
      icon: <ShieldCheck className="w-12 h-12 text-red-500" />,
      color: "bg-red-50",
      tips: ["'데이터 관리' 메뉴에서 정기적으로 백업하세요.", "백업 파일(.json)만 있으면 언제든 복구 가능합니다."]
    }
  ];

  const handleNext = () => {
    setActiveStep((prev) => (prev === steps.length - 1 ? prev : prev + 1));
  };

  const handlePrev = () => {
    setActiveStep((prev) => (prev === 0 ? prev : prev - 1));
  };

  return (
    <div className="h-full flex flex-col items-center justify-center py-6 px-4">
      {/* Header Area */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-[#111827] flex items-center justify-center gap-3">
          <BookOpen className="w-8 h-8 text-[#FCC243]" />
          안내 가이드
        </h2>
        <p className="text-gray-400 mt-2 font-medium">효율적인 위원 관리를 위한 단계별 가이드</p>
      </div>

      {/* Catalog Display Area */}
      <div className="relative w-full max-w-2xl h-[450px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`w-full h-full ${steps[activeStep].color} rounded-[40px] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white flex flex-col`}
          >
            <div className="flex items-start justify-between mb-8">
              <div className="p-4 bg-white rounded-3xl shadow-sm">
                {steps[activeStep].icon}
              </div>
              <div className="text-[48px] font-black text-white/40 leading-none">
                0{activeStep + 1}
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-[28px] font-black text-[#111827] mb-2 leading-tight">
                {steps[activeStep].title}
              </h3>
              <p className="text-[#3C478F] font-bold mb-6 text-lg">
                {steps[activeStep].subtitle}
              </p>
              <p className="text-gray-600 leading-relaxed font-medium text-base">
                {steps[activeStep].content}
              </p>
            </div>

            {/* Tips Section */}
            <div className="mt-8 pt-6 border-t border-black/5">
              <div className="flex flex-wrap gap-2">
                {steps[activeStep].tips.map((tip, idx) => (
                  <div key={idx} className="flex items-center bg-white/60 backdrop-blur-sm px-4 py-2 rounded-2xl text-xs font-bold text-[#111827] border border-white shadow-sm">
                    {tip.includes('🌟') ? <Sparkles className="w-3 h-3 mr-1.5 text-yellow-500" /> : <CheckCircle2 className="w-3 h-3 mr-1.5 text-green-500" />}
                    {tip.replace('🌟', '').trim()}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-20">
          <button
            onClick={handlePrev}
            disabled={activeStep === 0}
            className={`p-4 rounded-full transition-all ${
              activeStep === 0 
                ? 'text-gray-200 cursor-not-allowed' 
                : 'bg-white text-[#111827] shadow-xl hover:scale-110 active:scale-95 border border-gray-100'
            }`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-20">
          <button
            onClick={activeStep === steps.length - 1 ? () => window.location.hash = '#/project' : handleNext}
            className="p-4 bg-[#111827] text-white rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center gap-3 mt-12">
        {steps.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveStep(idx)}
            className={`h-2 transition-all duration-300 rounded-full ${
              activeStep === idx 
                ? 'w-10 bg-[#111827]' 
                : 'w-2 bg-gray-200 hover:bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Bottom Hint */}
      <p className="mt-8 text-xs font-bold text-gray-400 flex items-center gap-1.5 animate-bounce">
        <AlertCircle className="w-3.5 h-3.5" />
        카드를 넘겨 모든 기능을 확인해 보세요.
      </p>
    </div>
  );
};

export default Guide;
