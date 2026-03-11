import React, { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS } from '../config/api';

import { SearchCode, Loader2, Download, Table as TableIcon, AlignLeft, Save, Trash2, CheckSquare, Square, Search, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, WalletCards } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import ProjectSaveModal from '../components/ProjectSaveModal';

const LOCAL_STORAGE_KEY = 'savedBankInfos';

const BANK_OPTIONS = [
  'KB국민은행', 'NH농협은행', '신한은행', '카카오뱅크', '우리은행', 
  '하나은행', '토스뱅크', 'IBK기업은행', '케이뱅크', '우체국 (우정사업본부)'
];

const BankExtractor = () => {
  const [activeTab, setActiveTab] = useState('extract'); // 'extract' | 'archive'
  
  // -- 추출 탭 전용 상태 --
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState('idle'); // idle, analyzing, complete
  const [extractedData, setExtractedData] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  // -- 보관함 탭 전용 상태 --
  const [archivedData, setArchivedData] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse saved bank infos', e);
      return [];
    }
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [duplicatesInfo, setDuplicatesInfo] = useState(null);
  const searchInputRef = useRef(null);
  
  // Ctrl+S 저장 토스트 알림을 위한 상태
  const [showSaveToast, setShowSaveToast] = useState(false);

  // -- 모달 및 성공 알림 --
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectSaveSuccessMessage, setProjectSaveSuccessMessage] = useState('');

  const saveToArchive = (newData) => {
    if (!newData || newData.length === 0) return;
    setArchivedData(prev => {
      const updated = [...prev, ...newData.map((item, idx) => ({
        ...item,
        createdAt: Date.now() + idx,
        archiveId: `bank_${Date.now() + idx}_${Math.random().toString(36).substr(2, 5)}`
      }))];
      return updated;
    });
  };

  // 데이터 마이그레이션: 모든 항목에 archiveId가 있는지 확인 (레거시 데이터 대응)
  useEffect(() => {
    let updated = false;
    const migratedData = archivedData.map((item, index) => {
      if (!item.archiveId) {
        updated = true;
        const timestamp = item.createdAt || (Date.now() + index);
        return {
          ...item,
          archiveId: `bank_migrated_${timestamp}_${Math.random().toString(36).substr(2, 5)}`
        };
      }
      return item;
    });

    if (updated) {
      setArchivedData(migratedData);
    }
  }, []);

  // archivedData 변경 시 로컬 스토리지 자동 저장 (용량 초과 에러 방지)
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(archivedData));
    } catch (e) {
      console.error('LocalStorage save failed:', e);
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        alert('⚠️ 브라우저 저장 공간이 가득 찼습니다. 데이터 관리에서 백업 후 불필요한 항목을 삭제해주세요.');
      }
    }
  }, [archivedData]);

  // Ctrl+F 색인 단축키 및 Ctrl+S 저장 단축키 핸들러 (UI 알림용)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+F
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        if (activeTab === 'archive') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
      // Ctrl+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveToLocalStorage(archivedData);
        setShowSaveToast(true);
        setTimeout(() => setShowSaveToast(false), 2000);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, archivedData]);

  const saveToLocalStorage = (data) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    
    setStatus('analyzing');
    setErrorMsg('');
    setExtractedData([]);
    
    try {
      // 마스터 DB(보관된 프로필) 가져오기
      let dbNames = [];
      let dbProfiles = [];
      try {
        const savedProfiles = JSON.parse(localStorage.getItem('savedProfiles') || '[]');
        dbProfiles = savedProfiles;
        dbNames = savedProfiles.map(p => p.name).filter(Boolean);
      } catch (e) {
        console.error('Failed to load master DB', e);
      }


      const response = await fetch(API_ENDPOINTS.EXTRACT_BANK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, dbNames, dbProfiles }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `파싱 실패: ${response.statusText}`);
      }

      if (result.success && result.data) {
        setExtractedData(result.data);
        setStatus('complete');
        
        // 추출된 결과를 보관함에 즉시 병합 및 LocalStorage 저장 (중복 방지 포함)
        setArchivedData(prev => {
          let updatedData = [...prev];
          let foundDuplicates = [];

          result.data.forEach((newItem, index) => {
            // 중복 판별 (이름, 주민번호, 은행명, 계좌번호가 모두 동일한 경우)
            const isDuplicate = (a, b) => 
              a.name === b.name && a.residentId === b.residentId && a.bank === b.bank && a.account === b.account;
            
            const existingIndex = updatedData.findIndex(item => isDuplicate(item, newItem));
            
            const timestamp = Date.now() + index;
            const newItemWithMetadata = {
              ...newItem,
              createdAt: timestamp,
              archiveId: `bank_${timestamp}_${Math.random().toString(36).substr(2, 5)}`
            };

            if (existingIndex >= 0) {
              // 중복 시 기존 기록을 덮어씌움 (새 추출 데이터로 최신화)
              newItemWithMetadata.archiveId = updatedData[existingIndex].archiveId;
              updatedData[existingIndex] = newItemWithMetadata;
              foundDuplicates.push(newItem.name);
            } else {
              updatedData.push(newItemWithMetadata);
            }
          });

          if (foundDuplicates.length > 0) {
            const uniqueNames = [...new Set(foundDuplicates)];
            setTimeout(() => {
              setDuplicatesInfo({ count: uniqueNames.length, names: uniqueNames });
            }, 100);
          }

          saveToLocalStorage(updatedData);
          return updatedData;
        });
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || '서버 통신 오류 처리 불가');
      setStatus('idle');
    }
  };

  const handleDownloadExcel = (dataToExport, fileName = "extracted_bank_infos.xlsx") => {
    if (!dataToExport || dataToExport.length === 0) return;
    const excelData = dataToExport.map(row => ({
      '이름': row.name,
      '주민등록번호': row.residentId,
      '은행명': row.bank,
      '계좌번호': row.account,
      '소득구분': row.incomeCategory
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "입금정보목록");
    XLSX.writeFile(workbook, fileName);
  };

  // --- 보관함 관리 기능 ---
  const toggleSelectAll = () => {
    if (selectedIds.length === archivedData.length && archivedData.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(archivedData.map(d => d.archiveId));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
    );
  };

  const deleteSelected = () => {
    if (selectedIds.length === 0) return;
    
    const count = selectedIds.length;
    
    if (window.confirm(`선택한 ${count}건의 데이터를 삭제하시겠습니까?`)) {
      setArchivedData(prev => {
        const nextData = prev.filter(item => {
          if (!item.archiveId) return true;
          return !selectedIds.includes(item.archiveId);
        });
        return nextData;
      });
      setSelectedIds([]); 
    }
  };

  const exportSelectedToExcel = () => {
     if (selectedIds.length === 0) return;
     const itemsToExport = archivedData.filter(item => selectedIds.includes(item.archiveId));
     handleDownloadExcel(itemsToExport, `saved_bank_infos_${Date.now()}.xlsx`);
  };

  // 인라인 편집 핸들러 (React 상태만 변경, LocalStorage 저장은 Ctrl+S에서 수행)
  const handleEditCell = (id, field, value) => {
    setArchivedData(prev => prev.map(item => 
      item.archiveId === id ? { ...item, [field]: value } : item
    ));
  };

  // --- 정렬 및 필터 처리 ---
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getProcessedArchiveData = () => {
    let result = [...archivedData];
    // 검색어 필터링
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(item => 
        (item.name || '').toLowerCase().includes(lowerQuery) ||
        (item.residentId || '').toLowerCase().includes(lowerQuery) ||
        (item.bank || '').toLowerCase().includes(lowerQuery) ||
        (item.account || '').toLowerCase().includes(lowerQuery)
      );
    }
    // 정렬
    result.sort((a, b) => {
      if (sortConfig.key === 'name') {
        const nameA = a.name || '';
        const nameB = b.name || '';
        if (nameA < nameB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (nameA > nameB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      } else if (sortConfig.key === 'createdAt') {
        const timeA = a.createdAt || 0;
        const timeB = b.createdAt || 0;
        return sortConfig.direction === 'asc' ? timeA - timeB : timeB - timeA;
      }
      return 0;
    });
    return result;
  };

  const processedData = getProcessedArchiveData();

  return (
    <div className="min-h-full flex flex-col max-w-6xl mx-auto font-sans px-6 mt-10 pb-24">
      {/* 데이터 정산/저장 토스트 팝업 */}
      <AnimatePresence>
        {showSaveToast && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900 border border-gray-700 text-white px-6 py-3 rounded-full shadow-2xl flex items-center z-50"
          >
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            수정된 입금 정보가 보관함에 안전하게 저장되었습니다.
          </motion.div>
        )}
        
        {projectSaveSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-[#3C478F] text-white px-6 py-3 rounded-full shadow-2xl flex items-center z-50 font-bold tracking-wide"
          >
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-xs">✓</span>
            </div>
            {projectSaveSuccessMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <datalist id="bank-list">
        {BANK_OPTIONS.map(bank => <option key={bank} value={bank} />)}
      </datalist>

      <header className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end pb-6 border-b border-gray-100">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-[#111827] tracking-tighter flex items-center gap-4">
            <span className="p-2.5 bg-[#111827] text-white rounded-2xl shadow-[0_4px_14px_rgba(17,24,39,0.3)]">
              <WalletCards className="w-6 h-6" />
            </span>
            정산 정보 가져오기
          </h2>
          <p className="text-gray-400 mt-2 text-sm font-medium tracking-wide">위원들이 보낸 문자/카톡 텍스트에서 계좌와 주민번호를 추출합니다.</p>
        </div>
        
        {/* Apple-style Minimal Tabs */}
        <div className="flex space-x-8 mt-4 md:mt-0">
          <button 
            onClick={() => setActiveTab('extract')}
            className={`relative pb-3 text-[15px] font-bold transition-colors ${activeTab === 'extract' ? 'text-[#3C478F]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            추출하기
            {activeTab === 'extract' && (
              <motion.div layoutId="bankTabIndicator" className="absolute -bottom-px left-0 right-0 h-1 bg-[#FCC243] rounded-t-full" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('archive')}
            className={`relative pb-3 text-[15px] font-bold transition-colors flex items-center ${activeTab === 'archive' ? 'text-[#3C478F]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            내 보관함
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${activeTab === 'archive' ? 'bg-[#3C478F]/10 text-[#3C478F]' : 'bg-gray-100 text-gray-500'}`}>{archivedData.length}</span>
            {activeTab === 'archive' && (
              <motion.div layoutId="bankTabIndicator" className="absolute -bottom-px left-0 right-0 h-1 bg-[#FCC243] rounded-t-full" />
            )}
          </button>
        </div>
      </header>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium shadow-sm">
          ⚠️ {errorMsg}
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-y-auto pb-4">
        {activeTab === 'extract' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[3.5fr_6.5fr] gap-8 h-full">
            {/* 텍스트 입력 영역 - Minimal Card */}
            <div className="bg-[#F8F9FB] rounded-[2rem] border border-gray-50 p-5 sticky top-2 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.02)] h-fit">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-[#FCC243]">
                    <AlignLeft className="w-4 h-4" />
                  </div>
                  <h3 className="text-[17px] font-black text-[#111827] tracking-tight">텍스트 원문 등록</h3>
                </div>
              </div>
              <div className="relative mb-6">
                <textarea
                  className="w-full h-56 bg-white rounded-2xl p-4 text-[14px] font-medium text-gray-700 leading-relaxed border-none focus:ring-2 focus:ring-[#3C478F]/20 shadow-sm placeholder:text-gray-300 transition-all outline-none resize-none"
                  placeholder={`위원님들이 보낸 카톡/문자 내용을 붙여넣으세요. 이름, 주민번호, 은행, 계좌번호를 자동으로 찾아냅니다. (기타소득이라고 기재할 시 소득구분 자동 변경)\n\n[예시]\n은행명 : 농협은행\n계좌번호 : 123-12-123456\n주민번호 : 800101-1234567\n이름 : 홍길동 (기타 소득)`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={status === 'analyzing'}
                />
                {status === 'analyzing' && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 transition-all rounded-b-3xl">
                    <Loader2 className="w-10 h-10 text-[#3C478F] animate-spin mb-3" />
                    <p className="text-[#111827] font-bold">인공지능 분석 중...</p>
                  </div>
                )}
                <div className="mt-2 pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={handleAnalyze}
                    disabled={status === 'analyzing' || !inputText.trim()}
                    className={`flex items-center space-x-2 px-8 py-3 rounded-full text-sm font-bold text-white transition-all duration-300
                      ${status === 'analyzing' || !inputText.trim() 
                        ? 'bg-gray-200 cursor-not-allowed shadow-none text-gray-400' 
                        : 'bg-[#3C478F] hover:bg-[#2A3266] shadow-[0_4px_14px_rgba(60,71,143,0.39)]'}`}
                  >
                    <SearchCode className="w-4 h-4" />
                    <span>데이터 일괄 추출</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 단일 결과 영역 */}
            <div className="flex flex-col h-72 lg:h-[360px]">
              {status === 'idle' && (
                <div className="flex-1 rounded-3xl flex items-center justify-center flex-col text-gray-400 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100">
                  <TableIcon className="w-12 h-12 mb-4 text-gray-200" />
                  <p className="text-sm font-medium text-gray-400 tracking-wide">좌측 텍스트 에어리어에 문구를 입력해 주세요.</p>
                </div>
              )}

              <AnimatePresence>
                {status === 'complete' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden h-full"
                  >
                    <div className="bg-white px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                      <div className="font-black text-[#111827] text-lg tracking-tight flex items-center">
                        <TableIcon className="w-5 h-5 mr-3 text-[#FCC243]" />
                        최근 추출 결과
                      </div>
                      <div className="flex space-x-2 items-center">
                        <button onClick={() => setIsProjectModalOpen(true)} className="px-5 py-2.5 bg-[#FCC243] text-yellow-900 text-[13px] font-bold rounded-full hover:bg-yellow-400 transition-colors shadow-sm whitespace-nowrap">프로젝트 바로 저장</button>
                        <div className="text-[11px] font-bold text-[#3C478F] bg-[#FAFAFA] px-3 py-2 rounded-full uppercase tracking-widest h-fit whitespace-nowrap">보관함 자동 저장됨</div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                      <table className="w-full text-[14px] text-center">
                        <thead className="text-[12px] text-gray-400 bg-white border-b border-gray-100 uppercase tracking-wider sticky top-0">
                          <tr>
                            <th className="px-6 py-4 font-bold text-center">이름</th>
                            <th className="px-6 py-4 font-bold text-center">주민번호</th>
                            <th className="px-6 py-4 font-bold text-center">은행명</th>
                            <th className="px-6 py-4 font-bold text-center">계좌번호</th>
                            <th className="px-6 py-4 font-bold text-center">소득구분</th>
                          </tr>
                        </thead>
                        <tbody>
                          {extractedData.map((row) => (
                            <tr key={row.id || Math.random()} className="border-b border-gray-50 bg-white hover:bg-[#FAFAFA] transition-colors">
                              <td className="px-6 py-5 font-black text-[#111827] whitespace-nowrap text-center">{row.name}</td>
                              <td className="px-6 py-5 font-mono text-gray-600 whitespace-nowrap text-center">{row.residentId}</td>
                              <td className="px-6 py-5 font-bold text-[#3C478F] whitespace-nowrap text-center">{row.bank}</td>
                              <td className="px-6 py-5 font-mono text-gray-600 whitespace-nowrap text-center">{row.account}</td>
                              <td className="px-6 py-5 text-xs font-bold whitespace-nowrap text-center">
                                <span className={`px-3 py-1.5 rounded-full ${row.incomeCategory === '기타 소득' ? 'bg-[#FCC243]/20 text-yellow-800' : 'bg-[#FAFAFA] text-[#3C478F]'}`}>
                                  {row.incomeCategory}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-5 bg-white border-t border-gray-100 flex justify-end">
                       <button 
                         onClick={() => setActiveTab('archive')}
                         className="text-sm text-[#3C478F] font-bold hover:underline underline-offset-4"
                       >
                         보관함에서 내용 확인/수정하기 →
                       </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          /* 보관함 탭 (In-line Edit 기능 포함) - Minimal Card */
          <motion.div 
            key="archive"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-[550px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-gray-50"
          >
             <div className="px-8 py-6 border-b border-gray-100 flex flex-col space-y-4 bg-white">
               <div className="flex items-center justify-between">
                 <div className="flex items-center text-[#111827] font-black text-lg relative group">
                   <Save className="w-5 h-5 mr-3 text-[#FCC243]" />
                   보관함
                   <span className="ml-3 px-2.5 py-1 rounded-full bg-[#FAFAFA] text-[#3C478F] text-xs font-bold">{archivedData.length}건</span>
                   <div className="absolute left-0 -bottom-8 bg-[#111827] text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                     수정 후에는 저장(Ctrl+S)하여 영구 반영하세요
                   </div>
                 </div>
                 
                 <div className="flex items-center space-x-3">
                    <button 
                      onClick={deleteSelected}
                      disabled={selectedIds.length === 0}
                      className={`flex items-center px-4 py-2 text-sm font-bold rounded-full transition-colors ${selectedIds.length > 0 ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'text-gray-400 cursor-not-allowed'}`}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      삭제
                    </button>
                    <button 
                      onClick={exportSelectedToExcel}
                      disabled={selectedIds.length === 0}
                      className={`flex items-center px-6 py-2 text-sm font-bold rounded-full transition-all shadow-sm ${selectedIds.length > 0 ? 'bg-[#3C478F] text-white hover:bg-[#2A3266] shadow-[0_4px_14px_rgba(60,71,143,0.39)]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      엑셀
                    </button>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-gray-400 font-bold tracking-tight uppercase bg-[#FAFAFA] px-2 py-1 rounded-md">수정 후 저장: Ctrl + S</span>
                    </div>
                 </div>
               </div>

               <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                 <input
                   type="text"
                   ref={searchInputRef}
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="block w-full pl-11 pr-10 py-3 bg-[#F8F9FB] rounded-2xl text-sm font-bold transition-all outline-none"
                   placeholder="검색 (Ctrl + F)"
                 />
                 {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                      <span className="text-xl leading-none">&times;</span>
                    </button>
                 )}
               </div>
             </div>

             {archivedData.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-16 text-gray-400 bg-white">
                  <div className="w-20 h-20 bg-[#FAFAFA] rounded-full flex items-center justify-center mb-6">
                    <TableIcon className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-xl font-bold text-[#111827]">보관함에 데이터가 없습니다.</p>
                  <p className="text-sm mt-2 text-gray-500">항목 추출을 먼저 진행해 주세요.</p>
                  <button onClick={() => setActiveTab('extract')} className="mt-8 px-6 py-2.5 bg-[#FAFAFA] text-[#3C478F] font-bold rounded-full hover:bg-gray-100 transition-colors">추출 시작하기</button>
                </div>
             ) : (
                <div className="flex-1 overflow-auto bg-white relative">
                  <table className="w-full text-[14px] text-left">
                    <thead className="text-[12px] text-gray-400 bg-white border-b border-gray-100 uppercase tracking-wider sticky top-0 z-10">
                      <tr>
                        <th scope="col" className="px-5 py-5 w-12 text-center">
                           <button onClick={toggleSelectAll} className="focus:outline-none transition-transform hover:scale-110">
                             {selectedIds.length === archivedData.length && archivedData.length > 0 ? (
                               <CheckSquare className="w-5 h-5 text-[#FCC243]" />
                             ) : (
                               <Square className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                             )}
                           </button>
                        </th>
                        <th className="px-5 py-5 font-bold cursor-pointer hover:bg-gray-50 transition-colors min-w-[100px] text-center" onClick={() => handleSort('name')}>
                          <div className="flex items-center justify-center">
                            이름 {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-2 text-[#FCC243]"/> : <ArrowDown className="w-3 h-3 ml-2 text-[#FCC243]"/>) : ''}
                          </div>
                        </th>
                        <th className="px-5 py-5 font-bold min-w-[160px] text-center">주민등록번호</th>
                        <th className="px-5 py-5 font-bold min-w-[140px] text-center">은행명</th>
                        <th className="px-5 py-5 font-bold min-w-[200px] text-center">계좌번호</th>
                        <th className="px-5 py-5 font-bold min-w-[150px] text-center">소득구분</th>
                        <th className="px-5 py-5 font-bold text-gray-400 cursor-pointer min-w-[140px] text-center" onClick={() => handleSort('createdAt')}>
                           <div className="flex items-center justify-center">
                            저장일시 {sortConfig.key === 'createdAt' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-2 text-[#FCC243]"/> : <ArrowDown className="w-3 h-3 ml-2 text-[#FCC243]"/>) : ''}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {processedData.length === 0 ? (
                        <tr><td colSpan="7" className="text-center py-10 text-gray-500">조건에 맞는 결과가 없습니다.</td></tr>
                      ) : (
                        processedData.map((row) => {
                          const isSelected = selectedIds.includes(row.archiveId);
                          const dateObj = row.createdAt ? new Date(row.createdAt) : new Date();
                          const dateStr = `${dateObj.getFullYear()}.${String(dateObj.getMonth()+1).padStart(2,'0')}.${String(dateObj.getDate()).padStart(2,'0')} ${String(dateObj.getHours()).padStart(2,'0')}:${String(dateObj.getMinutes()).padStart(2,'0')}`;
                          return (
                            <tr 
                              key={row.archiveId} 
                              className={`border-b border-gray-50 transition-colors ${isSelected ? 'bg-[#FAFAFA]' : 'bg-white'} hover:bg-[#FAFAFA] focus-within:bg-[#FAFAFA]`}
                            >
                              <td className="px-5 py-4 w-12 text-center">
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     toggleSelectRow(row.archiveId);
                                   }}
                                   className="focus:outline-none flex items-center justify-center w-full h-full transition-transform hover:scale-110"
                                 >
                                   {isSelected ? <CheckSquare className="w-5 h-5 text-[#FCC243]" /> : <Square className="w-5 h-5 text-gray-200 hover:text-gray-300" />}
                                 </button>
                              </td>
                              <td className="px-4 py-2 text-center">
                                <input
                                  type="text"
                                  value={row.name}
                                  onChange={(e) => handleEditCell(row.archiveId, 'name', e.target.value)}
                                  className={`w-full px-3 py-2 bg-transparent border-none focus:bg-white focus:ring-2 focus:ring-[#3C478F]/20 rounded-lg font-black text-[14px] text-center ${isSelected ? 'text-[#3C478F]' : 'text-[#111827]'} transition-all outline-none`}
                                />
                              </td>
                              <td className="px-4 py-2 text-center">
                                <input
                                  type="text"
                                  value={row.residentId}
                                  onChange={(e) => handleEditCell(row.archiveId, 'residentId', e.target.value)}
                                  className="w-full px-3 py-2 bg-transparent border-none focus:bg-white focus:ring-2 focus:ring-[#3C478F]/20 rounded-lg font-mono text-gray-600 text-center transition-all outline-none"
                                />
                              </td>
                              <td className="px-4 py-2 align-middle">
                                <div className="flex flex-col gap-1 min-w-[120px] items-center">
                                  {(BANK_OPTIONS.includes(row.bank || '') || (row.bank || '') === '') ? (
                                      <select
                                      value={row.bank || ''}
                                      onChange={(e) => {
                                        if (e.target.value === 'custom') {
                                          handleEditCell(row.archiveId, 'bank', '직접 입력');
                                        } else {
                                          handleEditCell(row.archiveId, 'bank', e.target.value);
                                        }
                                      }}
                                      className={`w-full px-3 py-2 bg-transparent border-none focus:bg-white focus:ring-2 focus:ring-[#3C478F]/20 rounded-lg font-bold text-[14px] text-center ${isSelected ? 'text-[#3C478F]' : 'text-[#3C478F]'} transition-all outline-none cursor-pointer`}
                                    >
                                      <option value="" disabled>은행 선택</option>
                                      {BANK_OPTIONS.map(bank => (
                                        <option key={bank} value={bank}>{bank}</option>
                                      ))}
                                      <option value="custom">직접 입력 (여기를 눌러 입력)</option>
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      placeholder="은행명 입력 (지우면 복귀)"
                                      value={row.bank === '직접 입력' ? '' : (row.bank || '')}
                                      onChange={(e) => handleEditCell(row.archiveId, 'bank', e.target.value)}
                                      onBlur={(e) => {
                                        if (!e.target.value.trim()) handleEditCell(row.archiveId, 'bank', '');
                                      }}
                                      className={`w-full px-3 py-2 bg-white border border-gray-200 focus:ring-2 focus:ring-[#3C478F]/20 rounded-lg text-[14px] font-bold text-center ${isSelected ? 'text-[#3C478F]' : 'text-[#3C478F]'} transition-all outline-none shadow-sm`}
                                      autoFocus
                                    />
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2 text-center">
                                <input
                                  type="text"
                                  value={row.account}
                                  onChange={(e) => handleEditCell(row.archiveId, 'account', e.target.value)}
                                  className="w-full px-3 py-2 bg-transparent border-none focus:bg-white focus:ring-2 focus:ring-[#3C478F]/20 rounded-lg font-mono text-gray-600 text-center transition-all outline-none tracking-tight"
                                />
                              </td>
                              <td className="px-4 py-2 text-center">
                                <select
                                  value={row.incomeCategory}
                                  onChange={(e) => handleEditCell(row.archiveId, 'incomeCategory', e.target.value)}
                                  className={`w-full px-3 py-2 bg-transparent border-none focus:bg-white focus:ring-2 focus:ring-[#3C478F]/20 rounded-lg font-bold text-[14px] text-center transition-all outline-none cursor-pointer ${row.incomeCategory === '기타 소득' ? 'text-yellow-700' : 'text-[#3C478F]'}`}
                                >
                                  <option value="사업 소득">사업 소득</option>
                                  <option value="기타 소득">기타 소득</option>
                                </select>
                              </td>
                              <td className="px-4 py-3 font-mono text-gray-400 text-xs bg-gray-50/50 text-center">
                                {dateStr}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
           </motion.div>
        )}
      </div>

      {/* 중복 알림 모달 */}
      <AnimatePresence>
        {duplicatesInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4 mx-auto">
                  <RefreshCw className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                  기존 입금 정보 업데이트 알림
                </h3>
                <p className="text-sm text-center text-gray-500 mb-6">
                  새롭게 추출한 입금 정보 중 브라우저 보관함에 <br/> 이미 저장된 <strong>{duplicatesInfo.count}명</strong>의 정보가 발견되어 <br/>
                  <strong className="text-blue-600">최신 데이터로 성공적으로 덮어씌워졌습니다.</strong>
                </p>

                <div className="bg-gray-50 rounded-lg p-3 mb-6 max-h-32 overflow-y-auto border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-2">업데이트된 위원 명단:</p>
                  <div className="flex flex-wrap gap-2">
                    {duplicatesInfo.names.map((name, idx) => (
                      <span key={idx} className="bg-white border border-gray-200 text-gray-700 text-xs px-2 py-1 rounded-md shadow-sm">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setDuplicatesInfo(null)}
                  className="w-full bg-primary-600 text-white font-medium py-2.5 rounded-lg hover:bg-primary-700 transition duration-150"
                >
                  확인했습니다
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProjectSaveModal 
        isOpen={isProjectModalOpen} 
        onClose={() => setIsProjectModalOpen(false)} 
        dataToSave={extractedData} 
        sourceType="bank" 
        onSaveSuccess={(projName) => {
          setProjectSaveSuccessMessage(`'${projName}' 폴더에 정보가 모두 병합되었습니다!`);
          setTimeout(() => setProjectSaveSuccessMessage(''), 3000);
        }} 
      />
    </div>
  );
};

export default BankExtractor;
