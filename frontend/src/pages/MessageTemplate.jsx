import React, { useState, useEffect, useCallback } from 'react';
import { Copy, CheckCircle2, Building2, CalendarDays, MessageSquareText, Mail, MessageSquare, ArrowLeft, User, Briefcase, MapPin, Tag, Clock, FileText, RotateCcw, CreditCard, Coins, Landmark, HandCoins, BanknoteArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MessageTemplate = () => {
  const [view, setView] = useState('selection'); // 'selection' | 'editor'
  const [selectedOption, setSelectedOption] = useState(null);

  const INITIAL_FORM_DATA = {
    agency: '',
    senderName: '',
    senderRole: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    recipientName: '권미경 대표님',
    round: '',
    selectionCount: '',
    recruitPeriod: '',
    payment: '',
    conditions: '',
    exclusion: '',
    etc: '',
    multiplier: '2',
    noticeTitle: '',
    noticeUrl: '',
    managerOrg: '',
    managerName: '',
    managerTel: '',
    parking: '',
    etcInfo: ''
  };

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedBody, setGeneratedBody] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // 시간 옵션 생성 (00:00 ~ 23:30, 30분 단위)
  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2).toString().padStart(2, '0');
    const minutes = (i % 2 === 0 ? '00' : '30');
    return `${hours}:${minutes}`;
  });

  const MY_AGENCY = '한국인재평가연구소';

  // 템플릿 제목 및 본문 생성 로직
  const getTemplateContent = useCallback(() => {
    if (!selectedOption) return { title: '', body: '' };

    const { agency, senderName, senderRole, date, startTime, endTime, location } = formData;
    // Placeholder 래퍼
    const p = (text) => `{{P:${text}}}`;

    const aName = agency || p('기관명');
    const sName = senderName || p('이름');
    const sRole = senderRole || p('직책');
    const roundName = formData.round || p('평가항목');
    
    // 날짜 포맷팅
    let evalDate = p('00월 00일(요일)');
    if (date) {
      const d = new Date(date);
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const week = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
      evalDate = `${month}월 ${day}일(${week})`;
    }

    const evalTime = (startTime && endTime) ? `${startTime} ~ ${endTime}` : p('09:00 ~ 12:00');
    const dispStartTime = startTime ? startTime : p('00:00');
    const loc = location || p('장소');

    let title = '';
    let body = '';

    switch (selectedOption.id) {
      case 'sms-selected':
        title = `${aName} 선정 안내`;
        body = `안녕하십니까. ${MY_AGENCY} ${sName} ${sRole}입니다.

위원님께서는 ${aName}의 ${roundName} 위원으로 선정되셨기에 아래와 같이 안내 드립니다.

■ 주요 일정
• 일시: ${evalDate} ${evalTime}
• 장소: ${loc} (상세 내용은 이메일 참조)

■ 필수 회신 (본 문자 번호로 회신)
1. 성함
2. 일정 가능 여부 

세부 일정 사항은 메일로 안내 드렸으니, 확인해 주시기 바랍니다.
문의 사항이 있으실 경우 언제든지 연락 주시면 상세히 안내해 드리겠습니다.

귀한 시간 내어 일정 맡아 주심에 감사 드리며, 잘 부탁 드리겠습니다.
좋은 하루 되시기 바랍니다. 감사합니다.

- ${sName} ${sRole} 올림`;
        break;

      case 'mail-selected':
        const mOrg = formData.managerOrg || p('담당자 소속 기관');
        const mName = formData.managerName || p('담당자 이름');
        const mTel = formData.managerTel || p('010-0000-0000');
        const park = formData.parking || p('직접 입력');
        const eInfo = formData.etcInfo || p('직접 입력');
        const nTitle = formData.noticeTitle || p('공고명');
        const nUrl = formData.noticeUrl || p('공고 주소 입력');
        const payVal = formData.payment || p('000원');

        const dispTime = date ? `${startTime} ~ ${endTime}` : p(`${startTime} ~ ${endTime}`);

        title = `[${MY_AGENCY}] ${aName} ${roundName} 세부 일정 안내`;
        body = `안녕하십니까. ${MY_AGENCY} ${sName} ${sRole}입니다.

위원님께서는 ${aName}의 ${roundName} 위원으로 선정되셨습니다. 바쁘신 일정 중에도 귀한 시간 내어 주심에 감사드리며, 원활한 평가 진행을 위해 아래의 상세 내용을 확인해 주시기 바랍니다.

------------------------------
[${aName} ${roundName} 일정 안내]

◉ 평가 일정 및 장소
1. 기관명: ${aName}
2. 과업 내용: ${roundName}
3. 평가 시간: ${evalDate} ${dispTime}(예정)
4. 평가 장소: ${loc}
* 도착 후 하단의 현장 담당자에게 연락 주시기 바랍니다.

◉ 현장 담당자 정보
${mOrg} ${mName} <T. ${mTel}>
*모든 현장 운영은 당일 담당자의 안내를 우선하여 주시기 바랍니다.

◉ 채용 개요 및 사전 확인
1. 채용 공고명: ${nTitle}
2. 공고 확인(URL): ${nUrl}
*원활한 평가를 위해 참석 전 채용 공고를 미리 확인해 주시길 부탁드립니다.
3. 주차 안내: ${park}
4. 기타 안내 사항:
${eInfo}

◉ 비용 안내
1. 지급 비용: ${payVal} (세전)
* 기관의 행정 절차에 따라 정산까지 약 2~3개월 소요될 수 있는 점 양해 부탁드립니다.*

------------------------------------

평가 진행과 관련하여 궁금하신 사항은 언제든지 연락 주시기 바랍니다.
평가를 맡아 주셔서 다시 한 번 감사 드리며, 잘 부탁 드리겠습니다. 

좋은 하루 되시기 바랍니다. 

- ${sName} ${sRole} 올림`;
        break;

      case 'sms-unselected':
        title = `${aName} 미선정 안내`;
        body = `안녕하십니까. ${MY_AGENCY} ${sName} ${sRole}입니다. 

위원님께서는 ${evalDate}에 진행되는 ${aName} ${roundName} 위원으로 미선정되셨습니다.

귀한 시간 내주셨음에도 불구하고, 좋은 소식 전달드리지 못하여 죄송합니다.
다음에 더 좋은 기회로 연락 드릴 수 있도록 노력하겠습니다. 

좋은 하루 되시기 바랍니다. 감사합니다.

- ${sName} ${sRole} 올림`;
        break;

      case 'sms-remind':
        const mOrgRemind = formData.managerOrg || p('담당자 소속 기관');
        const mNameRemind = formData.managerName || p('담당자 이름');
        const mTelRemind = formData.managerTel || p('010-0000-0000');

        title = `${aName} 리마인드 안내`;
        body = `안녕하십니까. ${MY_AGENCY} ${sName} ${sRole}입니다.
내일 예정된 [${aName}] ${roundName} 평가와 관련하여 최종 안내를 드립니다.

■ 평가 일정 및 장소
 - 일시: ${evalDate} ${dispStartTime} (시간 엄수)
 - 장소: ${loc}
* 현장 담당자: ${mOrgRemind} ${mNameRemind} <T. ${mTelRemind}>

■ 유의 사항
 - 원활한 평가 운영을 위해 예정된 도착 시간을 반드시 준수해 주시기 바랍니다.
 - 현장에서는 상기 담당자 안내를 따라 주시기 바랍니다.

귀한 시간 내어 주심에 다시 한 번 감사 드리며, 내일 평가도 잘 부탁드리겠습니다.

- ${sName} ${sRole} 올림`;
        break;

      case 'sms-deposit-request':
        title = `${aName} 입금 정보 요청`;
        body = `안녕하십니까. ${MY_AGENCY} ${sName} ${sRole}입니다.

먼저, [${aName}] ${roundName} 위원으로 참여하여 평가에 힘써 주심에 진심으로 감사드립니다.
평가 비용 정산을 진행하고자 하오니, 아래 정보를 확인하시어 본 메시지(또는 메일)로 회신 부탁드립니다.

■ 회신 필요 정보
1. 성함
2. 주민등록번호
3. 은행 및 계좌번호
4. 소득 구분 (사업소득/기타소득)
* 별도 요청이 없으신 경우 '사업소득'으로 신고됩니다. 

위원님의 노고 덕분에 이번 프로젝트를 성공적으로 마칠 수 있었습니다. 
다시 한번 감사의 인사를 전하며, 관련하여 문의 사항이 있으시면 언제든 연락 주시기 바랍니다.
오늘도 좋은 하루 보내시기를 바랍니다.

- ${sName} ${sRole} 올림`;
        break;

      case 'mail-request':
        const rName = formData.recipientName;
        const noticeTitle = formData.noticeTitle || p('공고명');
        const noticeUrl = formData.noticeUrl || p('상세 URL');
        const sCount = formData.selectionCount || p('n');
        const multi = formData.multiplier || '2';
        const candidateCount = !isNaN(parseInt(formData.selectionCount)) && !isNaN(parseInt(formData.multiplier)) 
          ? parseInt(formData.selectionCount) * parseInt(formData.multiplier) 
          : p(isNaN(parseInt(formData.selectionCount)) ? 'n*' + (formData.multiplier || '2') : formData.selectionCount * (formData.multiplier || '2'));
        
        let rPeriod = p('00월 00일까지');
        if (formData.recruitPeriod) {
          const d = new Date(formData.recruitPeriod);
          const month = d.getMonth() + 1;
          const day = d.getDate();
          const week = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
          rPeriod = `${month}/${day}(${week})까지`;
        }

        const pay = formData.payment || p('000원');
        const cond = formData.conditions || '1)\r\n2)\r\n3)';
        const excl = formData.exclusion || p('해당사항 없음');
        const etcNotes = formData.etc || p('기타사항 입력');

        title = `[${MY_AGENCY}] ${aName} ${roundName} 위원 섭외 요청의 件`;
        body = `${rName} 안녕하십니까. ${MY_AGENCY} ${sName} ${sRole}입니다. 
${aName} ${roundName} 위원님 섭외 건으로 연락 드립니다.
 
아래 사항들 바탕으로 ${roundName} 진행해 주실 수 있는 위원님 섭외해 주시면 감사하겠습니다.
 
--------------------------------------------------
[${aName} ${roundName}]
 
[전형 상세]
1. 기관: ${aName}
2. 전형: ${roundName}
3. 채용 공고명: ${noticeTitle}
   (${noticeUrl})
4. 장소: ${loc}
5. 일시: ${evalDate} ${evalTime}
6. 기타 사항: ${etcNotes}
 
[섭외 요청 사항]
• 선정 인원: ${sCount}명
  * ${multi}배수로 후보 ${candidateCount}분 섭외 부탁 드립니다.
• 섭외 요청 기간: ${rPeriod}
• 섭외 상세 조건
${cond}
• 제척 명단: ${excl}
• 위원 지급 비용: ${pay}
--------------------------------------------------
 
위 사항들 바탕으로 섭외 부탁 드리겠습니다!
늘 도움 주셔서 감사드리며, 좋은 하루 되시기 바랍니다 :) 

- ${sName} ${sRole} 올림`;
        break;

      default:
        break;
    }

    return { title, body };
  }, [selectedOption, formData]);

  // 정보 입력 시 메시지 자동 업데이트
  useEffect(() => {
    const { title, body } = getTemplateContent();
    setGeneratedTitle(title);
    setGeneratedBody(body);
  }, [getTemplateContent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTitleChange = (e) => setGeneratedTitle(e.target.value);
  const handleBodyChange = (e) => setGeneratedBody(e.target.value);

  const handleCopy = (type, id) => {
    let textToCopy = '';
    const clean = (text) => text.replace(/{{P:(.*?)}}/g, '$1');

    if (type === 'title') {
      textToCopy = clean(generatedTitle);
    } else if (type === 'body') {
      textToCopy = clean(generatedBody);
    } else if (type === 'all') {
      textToCopy = `${clean(generatedTitle)}\n\n${clean(generatedBody)}`;
    }

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    if (window.confirm('입력하신 모든 정보가 초기화됩니다. 계속하시겠습니까?')) {
      setFormData(INITIAL_FORM_DATA);
    }
  };

  // Ctrl+S 저장 기능 및 기타 단축키 처리
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // 실제 저장 로직 (localStorage)
        localStorage.setItem('khai_template_save', JSON.stringify({
          formData,
          generatedTitle,
          generatedBody,
          timestamp: new Date().getTime()
        }));
        setCopiedId('saved-toast');
        setTimeout(() => setCopiedId(null), 2000);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, generatedTitle, generatedBody]);

  // Placeholder 하이라이팅을 위한 함수
  const renderPreview = (text) => {
    if (!text) return null;

    // {{P:값}} 형태의 태그만 찾아서 회색 처리
    const parts = text.split(/({{P:.*?}})/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('{{P:') && part.endsWith('}}')) {
        const content = part.substring(4, part.length - 2);
        return <span key={i} className="text-[#3C478F] bg-[#3C478F]/5 rounded-sm px-1 font-medium">{content}</span>;
      }
      return part;
    });
  };

  const options = [
    { 
      id: 'mail-request', 
      title: '[메일] 섭외 요청', 
      icon: <Mail className="w-6 h-6" />, 
      color: 'bg-indigo-50 text-indigo-600',
      type: 'Email'
    },
    { 
      id: 'mail-selected', 
      title: '[메일] 선정 안내', 
      icon: <Mail className="w-6 h-6" />, 
      color: 'bg-blue-50 text-blue-600',
      type: 'Email'
    },
    { 
      id: 'sms-selected', 
      title: '[문자] 선정 안내', 
      icon: <MessageSquare className="w-6 h-6" />, 
      color: 'bg-emerald-50 text-emerald-600',
      type: 'SMS'
    },
    { 
      id: 'sms-unselected', 
      title: '[문자] 미선정 안내', 
      icon: <MessageSquare className="w-6 h-6" />, 
      color: 'bg-red-50 text-red-600',
      type: 'SMS'
    },
    { 
      id: 'sms-remind', 
      title: '[문자] 리마인드 안내', 
      icon: <MessageSquare className="w-6 h-6" />, 
      color: 'bg-amber-50 text-amber-600',
      type: 'SMS'
    },
    { 
      id: 'sms-deposit-request', 
      title: '[문자] 입금 정보 요청', 
      icon: <BanknoteArrowUp className="w-6 h-6" />, 
      color: 'bg-purple-50 text-purple-600',
      type: 'SMS'
    },
  ];

  const handleSelectOption = (option) => {
    setSelectedOption(option);
    setView('editor');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="min-h-full flex flex-col max-w-6xl mx-auto font-sans px-6 mt-10 pb-24"
    >
      <header className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end pb-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          {view === 'editor' && (
            <button 
              onClick={() => setView('selection')}
              className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-[#111827] group"
              title="뒤로가기"
            >
              <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
          )}
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-[#111827] tracking-tighter flex items-center gap-4">
              <span className="p-2.5 bg-[#111827] text-white rounded-2xl shadow-[0_4px_14px_rgba(17,24,39,0.3)]">
                <MessageSquareText className="w-6 h-6" />
              </span>
              안내문 생성하기
            </h2>
            <p className="text-gray-400 mt-2 text-sm font-medium tracking-wide">상황에 맞는 템플릿을 선택하고 상세 정보를 입력하여 전문적인 안내문을 완성하세요.</p>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {view === 'selection' ? (
          <motion.div 
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="pb-14"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelectOption(option)}
                  className="flex flex-col items-center justify-center p-14 bg-[#F9FAFB] border border-gray-100 rounded-[3rem] text-center transition-all hover:shadow-[0_40px_80px_rgba(0,0,0,0.07)] hover:border-[#111827]/10 group relative min-h-[260px] overflow-hidden hover:-translate-y-2"
                >
                  <div className="absolute -right-6 -bottom-6 opacity-[0.03] transition-transform group-hover:scale-110 group-hover:-rotate-12 duration-700">
                    {React.cloneElement(option.icon, { className: "w-32 h-32" })}
                  </div>

                  <div className="absolute top-6 right-8 px-3 py-1 rounded-full bg-white/80 border border-gray-100 text-[9px] font-black tracking-widest text-gray-400 uppercase">
                    {option.type}
                  </div>

                  <div className={`p-4 rounded-2xl ${option.color} mb-5 transition-transform group-hover:scale-110 shadow-sm relative z-10`}>
                    {React.cloneElement(option.icon, { className: "w-7 h-7" })}
                  </div>
                  <h3 className="text-lg font-black text-[#111827] tracking-tight relative z-10">{option.title}</h3>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="editor"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-10"
          >
            {/* 입력 폼 영역 */}
            <div className="lg:col-span-5 bg-[#F8F9FB] rounded-3xl p-8 sticky top-6 border border-gray-50 flex flex-col transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.02)] max-h-[calc(100vh-140px)] overflow-y-auto">
              <div className="mb-8 pb-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-[#111827] tracking-tight">발송 정보 입력</h3>
                  <div className="flex items-center mt-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md w-fit">
                    {MY_AGENCY}
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all group/reset"
                  title="모든 입력 필드 초기화"
                >
                  <RotateCcw className="w-3.5 h-3.5 group-hover/reset:rotate-[-120deg] transition-transform duration-300" />
                  초기화
                </button>
              </div>
              
              <div className="space-y-6 pb-20">

                {/* 2. 발신자 정보 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide tooltip" title="본인의 이름을 입력하세요.">본인 이름</label>
                    <input
                      type="text"
                      name="senderName"
                      value={formData.senderName}
                      onChange={handleChange}
                      placeholder="예) 홍길동"
                      className="w-full rounded-xl bg-white border-2 border-transparent focus:border-[#111827]/10 focus:ring-0 py-3 px-4 transition-all outline-none text-[15px] font-bold text-[#111827] shadow-sm font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide tooltip" title="본인의 직책을 입력하세요.">직책</label>
                    <input
                      type="text"
                      name="senderRole"
                      value={formData.senderRole}
                      onChange={handleChange}
                      placeholder="예) 연구원"
                      className="w-full rounded-xl bg-white border-2 border-transparent focus:border-[#111827]/10 focus:ring-0 py-3 px-4 transition-all outline-none text-[15px] font-bold text-[#111827] shadow-sm font-sans"
                    />
                  </div>
                </div>

                <div className="h-px bg-gray-100 my-2" />

                {/* 3. 기본 전형 정보 */}
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide tooltip" title="평가 대상 기관명을 입력하세요.">평가 기관명 (대상)</label>
                  <input
                    type="text"
                    name="agency"
                    value={formData.agency}
                    onChange={handleChange}
                    placeholder="예) 신용보증기금"
                    className="w-full rounded-xl bg-white border-2 border-transparent focus:border-[#111827]/10 focus:ring-0 py-3 px-4 transition-all outline-none text-[15px] font-bold text-[#111827] shadow-sm font-sans"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide tooltip" title="평가 단계를 입력하세요. (서류/면접 등)">평가 항목/전형</label>
                  <input
                    type="text"
                    name="round"
                    value={formData.round}
                    onChange={handleChange}
                    placeholder="예) 서류전형"
                    className="w-full rounded-xl bg-white border-2 border-transparent focus:border-[#111827]/10 focus:ring-0 py-3 px-4 transition-all outline-none text-[15px] font-bold text-[#111827] shadow-sm font-sans"
                  />
                </div>

                {/* 4. 채용 및 비용 정보 (관련 탭에서만 노출) */}
                {(selectedOption.id === 'mail-selected' || selectedOption.id === 'mail-request') && (
                  <>
                    <div className="h-px bg-gray-100 my-2" />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide tooltip" title="채용 공고의 공식 명칭을 입력하세요.">채용 공고명</label>
                        <input
                          type="text"
                          name="noticeTitle"
                          value={formData.noticeTitle}
                          onChange={handleChange}
                          placeholder="예) 24년 상반기 채용"
                          className="w-full rounded-xl bg-white border-2 border-transparent focus:border-[#111827]/10 focus:ring-0 py-3 px-4 transition-all outline-none text-[15px] font-bold text-[#111827] shadow-sm font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide tooltip" title="위원에게 지급될 비용을 입력하세요.">지급 비용</label>
                        <input
                          type="text"
                          name="payment"
                          value={formData.payment}
                          onChange={handleChange}
                          placeholder="예) 25만원"
                          className="w-full rounded-xl bg-white border-2 border-transparent focus:border-[#111827]/10 focus:ring-0 py-3 px-4 transition-all outline-none text-[15px] font-bold text-[#111827] shadow-sm font-sans"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide tooltip" title="위원들이 확인 가능한 공고 상세 URL을 입력하세요.">공고 URL</label>
                      <input
                        type="text"
                        name="noticeUrl"
                        value={formData.noticeUrl}
                        onChange={handleChange}
                        placeholder="예) https://agency.career.co.kr/..."
                        className="w-full rounded-xl bg-white border-2 border-transparent focus:border-[#111827]/10 focus:ring-0 py-3 px-4 transition-all outline-none text-[15px] font-bold text-[#111827] shadow-sm font-sans"
                      />
                    </div>
                  </>
                )}

                {selectedOption.id !== 'sms-unselected' && selectedOption.id !== 'sms-deposit-request' && (
                  <div className="h-px bg-gray-100 my-2" />
                )}

                {/* 5. 장소 및 일정 정보 (관련 탭에서만 노출) */}
                {selectedOption.id !== 'sms-unselected' && selectedOption.id !== 'sms-deposit-request' && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide tooltip" title="평가가 진행될 오프라인 또는 온라인 장소를 입력하세요.">평가 장소</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="예) 본사 3층 대회의실"
                        className="w-full rounded-xl bg-white border-2 border-transparent focus:border-[#111827]/10 focus:ring-0 py-3 px-4 transition-all outline-none text-[15px] font-bold text-[#111827] shadow-sm font-sans"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide tooltip" title="평가 일자를 캘린더에서 선택하세요.">평가 일자</label>
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleChange}
                          className="w-full rounded-xl bg-white border-2 border-transparent focus:border-[#111827]/10 focus:ring-0 py-3 px-4 transition-all outline-none text-[15px] font-bold text-[#111827] shadow-sm font-sans cursor-pointer"
                        />
                      </div>
                      <div>
                        {selectedOption.id === 'sms-remind' ? (
                          <>
                            <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide tooltip" title="평가 시간을 선택하세요.">시각</label>
                            <select
                              name="startTime"
                              value={formData.startTime}
                              onChange={handleChange}
                              className="w-full rounded-xl bg-white border-2 border-transparent focus:border-[#111827]/10 focus:ring-0 py-3 transition-all outline-none text-[15px] font-bold text-[#111827] shadow-sm appearance-none text-center font-sans cursor-pointer"
                            >
                              <option value="">시간 선택</option>
                              {timeOptions.map(t => <option key={`remind-${t}`} value={t}>{t}</option>)}
                            </select>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center mb-2 px-1">
                              <label className="flex-1 text-sm font-bold text-gray-500 uppercase tracking-wide text-center tooltip" title="평가 시작 시간을 선택하세요.">시작</label>
                              <span className="w-4"></span>
                              <label className="flex-1 text-sm font-bold text-gray-500 uppercase tracking-wide text-center tooltip" title="예상 종료 시간을 선택하세요.">종료(예정)</label>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <select
                                name="startTime"
                                value={formData.startTime}
                                onChange={handleChange}
                                className="flex-1 rounded-xl bg-white border-2 border-transparent focus:border-[#111827]/10 focus:ring-0 py-3 transition-all outline-none text-[14px] font-bold text-[#111827] shadow-sm appearance-none text-center font-sans cursor-pointer"
                              >
                                <option value="">시작 시간</option>
                                {timeOptions.map(t => <option key={`start-${t}`} value={t}>{t}</option>)}
                              </select>
                              <span className="text-gray-300 font-bold w-4 text-center">~</span>
                              <select
                                name="endTime"
                                value={formData.endTime}
                                onChange={handleChange}
                                className="flex-1 rounded-xl bg-white border-2 border-transparent focus:border-[#111827]/10 focus:ring-0 py-3 transition-all outline-none text-[14px] font-bold text-[#111827] shadow-sm appearance-none text-center font-sans cursor-pointer"
                              >
                                <option value="">종료 시간</option>
                                {timeOptions.map(t => <option key={`end-${t}`} value={t}>{t}</option>)}
                              </select>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {selectedOption.id !== 'sms-unselected' && selectedOption.id !== 'sms-deposit-request' && selectedOption.id !== 'sms-remind' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide tooltip" title="그 외 장소나 일정에 관한 안내사항을 입력하세요.">기타 사항 (장소/일정 관련)</label>
                    <input
                      type="text"
                      name="etc"
                      value={formData.etc}
                      onChange={handleChange}
                      placeholder="예) 건물 내 무료 주차 지원"
                      className="w-full rounded-xl bg-white border-2 border-transparent focus:border-[#111827]/10 focus:ring-0 py-3 px-4 transition-all outline-none text-[15px] font-bold text-[#111827] shadow-sm font-sans"
                    />
                  </div>
                )}

                {/* 6. 현장 담당자 정보 (선정 안내 및 리마인드 전용) */}
                {(selectedOption.id === 'mail-selected' || selectedOption.id === 'sms-remind') && (
                  <>
                    <div className="h-px bg-gray-100 my-2" />
                    <div>
                      <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide tooltip" title="현장 담당자의 소속 기관을 입력하세요.">현장 담당자 소속</label>
                      <input
                        type="text"
                        name="managerOrg"
                        value={formData.managerOrg}
                        onChange={handleChange}
                        placeholder="예) 인크루트"
                        className="w-full rounded-xl bg-white border-2 border-transparent focus:border-[#111827]/10 focus:ring-0 py-3 px-4 transition-all outline-none text-[15px] font-bold text-[#111827] shadow-sm font-sans"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide tooltip" title="현장 담당자의 성함을 입력하세요.">담당자 성함</label>
                        <input
                          type="text"
                          name="managerName"
                          value={formData.managerName}
                          onChange={handleChange}
                          placeholder="예) 홍길동"
                          className="w-full rounded-xl bg-white border-2 border-transparent focus:border-[#111827]/10 focus:ring-0 py-3 px-4 transition-all outline-none text-[15px] font-bold text-[#111827] shadow-sm font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide tooltip" title="현장 담당자의 연락처를 입력하세요.">담당자 연락처</label>
                        <input
                          type="text"
                          name="managerTel"
                          value={formData.managerTel}
                          onChange={handleChange}
                          placeholder="예) 010-1234-5678"
                          className="w-full rounded-xl bg-white border-2 border-transparent focus:border-[#111827]/10 focus:ring-0 py-3 px-4 transition-all outline-none text-[15px] font-bold text-[#111827] shadow-sm font-sans"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* 7. 추가 안내 사항 (선정 안내 전용) */}
                {selectedOption.id === 'mail-selected' && (
                  <>
                    <div className="h-px bg-gray-100 my-2" />
                    <div>
                      <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide tooltip" title="주차 가능 여부 및 방법을 입력하세요.">주차 안내</label>
                      <input
                        type="text"
                        name="parking"
                        value={formData.parking}
                        onChange={handleChange}
                        placeholder="예) 건물 내 무료 주차 지원"
                        className="w-full rounded-xl bg-white border-2 border-transparent focus:border-[#111827]/10 focus:ring-0 py-3 px-4 transition-all outline-none text-[15px] font-bold text-[#111827] shadow-sm font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide tooltip" title="그 외 위원님께 전달할 추가 안내 사항을 입력하세요.">기타 안내 사항</label>
                      <textarea
                        name="etcInfo"
                        value={formData.etcInfo}
                        onChange={handleChange}
                        placeholder="기타 안내 사항을 입력하세요."
                        rows="3"
                        className="w-full rounded-xl bg-white border-2 border-transparent focus:border-[#111827]/10 focus:ring-0 py-3 px-4 transition-all outline-none text-[14px] font-bold text-[#111827] shadow-sm resize-none font-sans"
                      />
                    </div>
                  </>
                )}

                {/* 8. 섭외 세부 사항 (메일 섭외 요청 전용 추가 필드) */}
                {selectedOption.id === 'mail-request' && (
                  <>
                    <div className="h-px bg-gray-100 my-2" />
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide text-[10px] tooltip" title="평가에 참여할 총 인원수를 입력하세요.">선정 인원</label>
                        <input
                          type="number"
                          name="selectionCount"
                          value={formData.selectionCount}
                          onChange={handleChange}
                          placeholder="n"
                          className="w-full rounded-xl bg-white border-2 border-transparent focus:border-[#111827]/10 focus:ring-0 py-3 px-4 transition-all outline-none text-[15px] font-bold text-[#111827] shadow-sm font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide text-[10px] tooltip" title="선정 인원 대비 섭외할 배수를 입력하세요.">섭외 배수</label>
                        <div className="flex items-center bg-white rounded-xl border-2 border-transparent focus-within:border-[#111827]/10 shadow-sm pr-3">
                          <input
                            type="number"
                            name="multiplier"
                            value={formData.multiplier}
                            onChange={handleChange}
                            min="1"
                            placeholder="2"
                            className="w-full py-3 px-4 bg-transparent border-none focus:ring-0 outline-none text-[15px] font-bold text-[#111827] font-sans"
                          />
                          <span className="text-gray-400 font-bold text-xs shrink-0">배</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide text-[10px] tooltip" title="위원에게 지급될 비용을 입력하세요.">지급 비용</label>
                        <input
                          type="text"
                          name="payment"
                          value={formData.payment}
                          onChange={handleChange}
                          placeholder="예) 25만원"
                          className="w-full rounded-xl bg-white border-2 border-transparent focus:border-[#111827]/10 focus:ring-0 py-3 px-4 transition-all outline-none text-[15px] font-bold text-[#111827] shadow-sm font-sans"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide tooltip" title="섭외가 완료되어야 하는 최종 날짜를 선택하세요.">섭외 요청 기한</label>
                      <input
                        type="date"
                        name="recruitPeriod"
                        value={formData.recruitPeriod}
                        onChange={handleChange}
                        className="w-full rounded-xl bg-white border-2 border-transparent focus:border-[#111827]/10 focus:ring-0 py-3 px-4 transition-all outline-none text-[15px] font-bold text-[#111827] shadow-sm font-sans cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide tooltip" title="섭외를 위한 필수 자격 조건 등을 상세히 입력하세요.">섭외 상세 조건</label>
                      <textarea
                        name="conditions"
                        value={formData.conditions}
                        onChange={handleChange}
                        placeholder="1) ...&#10;2) ..."
                        rows="3"
                        className="w-full rounded-xl bg-white border-2 border-transparent focus:border-[#111827]/10 focus:ring-0 py-3 px-4 transition-all outline-none text-[14px] font-bold text-[#111827] shadow-sm resize-none font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide tooltip" title="섭외에서 제외해야 할 인원 정보를 입력하세요.">제척 명단</label>
                      <input
                        type="text"
                        name="exclusion"
                        value={formData.exclusion}
                        onChange={handleChange}
                        placeholder="예) 홍길동 위원님 제척"
                        className="w-full rounded-xl bg-white border-2 border-transparent focus:border-[#111827]/10 focus:ring-0 py-3 px-4 transition-all outline-none text-[15px] font-bold text-[#111827] shadow-sm font-sans"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 결과 템플릿 영역 */}
            <div className="lg:col-span-7 flex flex-col space-y-6">
              {/* 제목 영역 (정렬 통일) */}
              <div className="bg-[#F9FAFB] rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                <div className="px-8 py-3 border-b border-gray-100 flex justify-between items-center bg-white">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">안내문 제목</span>
                  </div>
                  <button
                    onClick={() => handleCopy('title', 'title-copy')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black transition-all shadow-sm ${
                      copiedId === 'title-copy' 
                        ? 'bg-green-50 text-green-600' 
                        : 'bg-[#111827] text-white hover:bg-gray-800'
                    }`}
                  >
                    {copiedId === 'title-copy' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === 'title-copy' ? '복사완료' : '제목 복사'}
                  </button>
                </div>
                <div className="p-8 group/title relative">
                  <div className="w-full text-lg font-black text-[#111827] leading-relaxed break-all">
                    {renderPreview(generatedTitle) || <span className="text-gray-300">제목이 여기에 표시됩니다.</span>}
                  </div>
                  {/* 숨겨진 실제 입력을 제공하여 여전히 수동 수정이 필요할 경우 대비 (선택 사항) */}
                  <input
                    type="text"
                    value={generatedTitle}
                    onChange={handleTitleChange}
                    className="absolute inset-0 opacity-0 cursor-text w-full h-full"
                  />
                </div>
              </div>

              {/* 본문 영역 (정렬 통일) */}
              <div className="bg-[#F9FAFB] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden border border-gray-100 flex flex-col flex-1 min-h-[440px]">
                <div className="px-8 py-3 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">작성된 본문</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy('body', 'body-only')}
                      className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-[11px] font-black transition-all shadow-sm ${
                        copiedId === 'body-only' 
                          ? 'bg-green-50 text-green-600' 
                          : 'bg-[#111827] text-white hover:bg-gray-800'
                      } relative group`}
                    >
                      {copiedId === 'body-only' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>본문 복사</span>
                    </button>
                  </div>
                </div>
                <div className="flex-1 bg-[#FAFAFA]/30 overflow-y-auto max-h-[calc(100vh-320px)] custom-scrollbar">
                  <div className="grid grid-cols-1 grid-rows-1 relative min-h-[400px]">
                    {/* 프리뷰 레이어 - 가변 텍스트 강조용 (높이 드라이버) */}
                    <div 
                      className="col-start-1 row-start-1 whitespace-pre-wrap break-words text-[16px] leading-[1.8] tracking-normal font-sans text-gray-700 pointer-events-none px-8 pt-8 pb-20 z-0 min-h-[400px]"
                      style={{ 
                        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                      }}
                    >
                      {renderPreview(generatedBody) || <span className="text-gray-300">정보를 입력하면 본문이 여기에 생성됩니다.</span>}
                    </div>
                    {/* 실시간 편집 레이어 - 동일한 스타일과 위치 적용 (패딩 일치) */}
                    <textarea
                      value={generatedBody}
                      onChange={handleBodyChange}
                      className="col-start-1 row-start-1 w-full h-full bg-transparent text-transparent caret-[#111827] cursor-text resize-none border-none focus:ring-0 px-8 pt-8 pb-20 m-0 text-[16px] leading-[1.8] tracking-normal font-sans z-10 overflow-hidden break-words selection:bg-[#111827]/10"
                      style={{ 
                        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                        outline: 'none',
                        boxShadow: 'none'
                      }}
                      spellCheck="false"
                    />
                  </div>
                  
                  {/* 저장 알림 (Ctrl+S) */}
                  <AnimatePresence>
                    {copiedId === 'saved-toast' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-[#111827] text-white text-xs font-black rounded-full shadow-lg z-30 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        변경 사항이 저장되었습니다 (Ctrl+S)
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MessageTemplate;
