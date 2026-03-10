import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, FileType2, Loader2, Download, Table as TableIcon, Trash2, CheckSquare, Square, Save, Search, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, FileSearch, FolderPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import ProjectSaveModal from '../components/ProjectSaveModal';

const LOCAL_STORAGE_KEY = 'savedProfiles';

const ProfileExtractor = () => {
  const [activeTab, setActiveTab] = useState('extract'); // 'extract' | 'archive'
  
  // -- 추출 탭 전용 상태 --
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('idle'); // idle, analyzing, complete
  const [extractedData, setExtractedData] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  // -- 보관함 탭 전용 상태 --
  const [archivedData, setArchivedData] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse saved profiles', e);
      return [];
    }
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [duplicatesInfo, setDuplicatesInfo] = useState(null); 
  const searchInputRef = useRef(null);

  const [showSaveToast, setShowSaveToast] = useState(false);
  
  // -- 모달 및 성공 알림 --
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [dataForProject, setDataForProject] = useState([]); // 프로젝트로 보낼 데이터
  const [projectSaveSuccessMessage, setProjectSaveSuccessMessage] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+F functionality
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        if (activeTab === 'archive') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
      // Ctrl+S functionality
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        if (activeTab === 'archive') {
          e.preventDefault();
          saveToLocalStorage(archivedData);
          setShowSaveToast(true);
          setTimeout(() => setShowSaveToast(false), 2000);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, archivedData]);

  const saveToLocalStorage = (data) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  };

  // 데이터 저장 및 마이그레이션: 모든 항목에 archiveId가 있는지 확인 (레거시 데이터 대응)
  useEffect(() => {
    let updated = false;
    const migratedData = archivedData.map((item, index) => {
      if (!item.archiveId) {
        updated = true;
        const timestamp = item.createdAt || (Date.now() + index);
        return {
          ...item,
          archiveId: `profile_migrated_${timestamp}_${Math.random().toString(36).substr(2, 5)}`
        };
      }
      return item;
    });

    if (updated) {
      setArchivedData(migratedData);
    }
  }, []);

  // archivedData 변경 시 로컬 스토리지 자동 저장
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(archivedData));
  }, [archivedData]);

  const saveToArchive = (newData) => {
    if (!newData || newData.length === 0) return;

    setArchivedData(prev => {
      let updatedData = [...prev];
      let foundDuplicates = [];
      
      newData.forEach((newItem, index) => {
        const isDuplicate = (a, b) => 
          a.name === b.name && a.birth === b.birth && a.phone === b.phone && a.email === b.email;
        
        const existingIndex = updatedData.findIndex(item => isDuplicate(item, newItem));
        
        const timestamp = Date.now() + index;
        const newItemWithMetadata = {
          ...newItem,
          createdAt: timestamp,
          archiveId: `profile_${timestamp}_${Math.random().toString(36).substr(2, 5)}`
        };

        if (existingIndex >= 0) {
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
      
      return updatedData;
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const traverseFileTree = (item) => {
    return new Promise((resolve) => {
      if (item.isFile) {
        item.file((file) => resolve([file]));
      } else if (item.isDirectory) {
        const dirReader = item.createReader();
        dirReader.readEntries(async (entries) => {
          const promises = entries.map(entry => traverseFileTree(entry));
          const filesArrays = await Promise.all(promises);
          resolve(filesArrays.flat());
        });
      } else {
        resolve([]);
      }
    });
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (e.dataTransfer.items) {
      const promises = [];
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          if (entry) promises.push(traverseFileTree(entry));
        }
      }
      const filesArrays = await Promise.all(promises);
      const allFiles = filesArrays.flat().filter(f => f.name && !f.name.startsWith('.DS_Store'));
      if (allFiles.length > 0) {
        handleFileUpload(allFiles);
      }
    } else {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.name && !f.name.startsWith('.DS_Store'));
      if (droppedFiles.length > 0) {
        handleFileUpload(droppedFiles);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      handleFileUpload(Array.from(e.target.files));
    }
  };

  const handleFileUpload = async (selectedFiles) => {
    setFiles(selectedFiles);
    setStatus('analyzing');
    setErrorMsg('');
    setExtractedData([]);
    
    let allData = [];
    let anySuccess = false;
    let errorDetails = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const formData = new FormData();
      const ext = file.name.split('.').pop();
      formData.append('file', file, `safe_upload.${ext}`);
      formData.append('realFilename', file.name);

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiUrl}/api/extract/profile`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          let errMessage = `HTTP ${response.status}`;
          try {
            const errData = await response.json();
            if (errData && errData.error) errMessage = errData.error;
          } catch (e) {}
          errorDetails.push(`[${file.name}] ${errMessage}`);
          continue;
        }

        const result = await response.json();
        if (result.success && result.data) {
          anySuccess = true;
          allData = [...allData, ...result.data];
          setExtractedData([...allData]);
        }
      } catch (err) {
        errorDetails.push(`[${file.name}] ${err.message}`);
      }
    }

    if (!anySuccess) {
      setErrorMsg(`업로드 실패: ${errorDetails.join(' / ')}`);
      setStatus('idle');
      setFiles([]);
    } else {
      if (errorDetails.length > 0) setErrorMsg(`일부 파일 실패: ${errorDetails.join(' / ')}`);
      setStatus('complete');
      if (allData.length > 0) saveToArchive(allData);
    }
  };

  const handleDownloadExcel = (dataToExport, fileName = "extracted_profiles.xlsx") => {
    if (!dataToExport || dataToExport.length === 0) return;
    const excelData = dataToExport.map(row => ({
      '이름': row.name,
      '생년월일': row.birth,
      '연락처': row.phone,
      '이메일': row.email
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "평가위원목록");
    XLSX.writeFile(workbook, fileName);
  };

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
    
    if (window.confirm(`선택한 ${count}명의 위원 정보를 삭제하시겠습니까?`)) {
      setArchivedData(prev => {
        const nextData = prev.filter(item => !selectedIds.includes(item.archiveId));
        return nextData;
      });
      setSelectedIds([]); 
    }
  };

  const exportSelectedToExcel = () => {
    if (selectedIds.length === 0) return;
    const itemsToExport = archivedData.filter(item => selectedIds.includes(item.archiveId));
    handleDownloadExcel(itemsToExport, `saved_profiles_${Date.now()}.xlsx`);
  };

  // 인라인 편집 핸들러
  const handleEditCell = (id, field, value) => {
    setArchivedData(prev => prev.map(item => 
      item.archiveId === id ? { ...item, [field]: value } : item
    ));
  };

  // 프로젝트로 데이터 내보내기 핸들러
  const handleExportToProject = () => {
    if (selectedIds.length === 0) return;
    const itemsToExport = archivedData.filter(item => selectedIds.includes(item.archiveId));
    setDataForProject(itemsToExport);
    setIsProjectModalOpen(true);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getProcessedArchiveData = () => {
    let result = [...archivedData];
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(item => 
        (item.name || '').toLowerCase().includes(lowerQuery) ||
        (item.birth || '').toLowerCase().includes(lowerQuery) ||
        (item.phone || '').toLowerCase().includes(lowerQuery) ||
        (item.email || '').toLowerCase().includes(lowerQuery)
      );
    }
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
      <header className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end pb-6 border-b border-gray-100">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-[#111827] tracking-tighter flex items-center gap-4">
            <span className="p-2.5 bg-[#111827] text-white rounded-2xl shadow-[0_4px_14px_rgba(17,24,39,0.3)]">
              <FileSearch className="w-6 h-6" />
            </span>
            위원 정보 가져오기
          </h2>
          <p className="text-gray-400 mt-2 text-sm font-medium tracking-wide">업로드된 파일에서 정보를 추출하고, 보관함에서 한 번에 관리하세요.</p>
        </div>
        
        <div className="flex space-x-6 mt-4 md:mt-0">
          <button 
            onClick={() => setActiveTab('extract')}
            className={`relative pb-3 text-[14px] font-bold transition-colors ${activeTab === 'extract' ? 'text-[#3C478F]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            추출하기
            {activeTab === 'extract' && (
              <motion.div layoutId="profileTabIndicator" className="absolute -bottom-px left-0 right-0 h-1 bg-[#FCC243] rounded-t-full" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('archive')}
            className={`relative pb-3 text-[14px] font-bold transition-colors flex items-center ${activeTab === 'archive' ? 'text-[#3C478F]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            내 보관함
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${activeTab === 'archive' ? 'bg-[#3C478F]/10 text-[#3C478F]' : 'bg-gray-100 text-gray-500'}`}>{archivedData.length}</span>
            {activeTab === 'archive' && (
              <motion.div layoutId="profileTabIndicator" className="absolute -bottom-px left-0 right-0 h-1 bg-[#FCC243] rounded-t-full" />
            )}
          </button>
        </div>
      </header>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium shadow-sm">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* 데이터 저장 토스트 팝업 */}
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
            수정된 위원 정보가 보관함에 안전하게 저장되었습니다.
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

      <div className="flex-1 flex flex-col overflow-y-auto pb-4">
        <AnimatePresence mode="wait">
          {activeTab === 'extract' ? (
            <motion.div 
              key="extract"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col space-y-4"
            >
              <div 
                className={`relative rounded-[2.5rem] p-8 flex flex-col items-center justify-center transition-all bg-[#F8F9FB] border border-gray-50 shadow-[0_8px_30px_rgb(0,0,0,0.02)]
                  ${status === 'idle' ? 'hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] cursor-pointer outline-none' : ''}
                `}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => status === 'idle' && document.getElementById('file-upload').click()}
              >
                <input 
                  type="file" id="file-upload" className="hidden" 
                  onChange={handleFileChange} disabled={status !== 'idle'}
                  accept=".ppt,.pptx,.pdf,image/*" multiple
                />
                
                <AnimatePresence mode="wait">
                  {status === 'idle' && (
                    <motion.div 
                      key="idle" 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ duration: 0.2 }}
                      className="flex flex-col items-center justify-center text-center"
                    >
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 transition-transform group-hover:scale-105">
                        <UploadCloud className="w-8 h-8 text-[#3C478F]" />
                      </div>
                      <h3 className="text-xl font-black text-[#111827] mb-2 tracking-tight">여기로 파일을 드래그하여 업로드</h3>
                      <p className="text-gray-400 text-sm font-medium mb-8">또는 클릭하여 내 PC에서 선택 (PPT, PDF, 이미지 지원)</p>
                      <label className="cursor-pointer bg-white text-[#3C478F] border-2 border-[#3C478F]/5 hover:border-[#3C478F]/20 px-8 py-3.5 rounded-xl font-black text-[15px] transition-all active:scale-95 shadow-sm">
                        파일 선택
                        <input type="file" className="hidden" multiple onChange={handleFileChange} />
                      </label>
                    </motion.div>
                  )}

                  {status === 'analyzing' && (
                    <motion.div 
                      key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="text-center w-full max-w-md mx-auto"
                    >
                      <Loader2 className="w-12 h-12 text-[#3C478F] animate-spin mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">분석 중...</h3>
                      <p className="text-sm text-gray-500 mb-4">총 {files.length}개 파일 분석중</p>
                      <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
                        <div className="bg-[#3C478F] h-2 rounded-full animate-pulse w-full"></div>
                      </div>
                    </motion.div>
                  )}

                  {status === 'complete' && (
                    <motion.div 
                      key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="text-center"
                    >
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileType2 className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">분석 성공</h3>
                      <p className="text-sm text-gray-500 mb-2">{extractedData.length}명의 프로필을 추출했습니다.</p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setStatus('idle'); setFiles([]); setExtractedData([]); }}
                        className="text-sm text-[#3C478F] font-bold hover:underline mt-4"
                      >
                        다른 파일 올리기
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {status === 'complete' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col"
                  >
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                      <div className="flex items-center text-[#111827] font-black text-lg">
                        <TableIcon className="w-5 h-5 mr-3 text-[#FCC243]" />
                        추출 결과
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => setIsProjectModalOpen(true)} className="px-5 py-2.5 bg-[#FCC243] text-yellow-900 text-sm font-bold rounded-full hover:bg-yellow-400 transition-colors shadow-sm">프로젝트 바로 저장</button>
                        <button onClick={() => setActiveTab('archive')} className="px-5 py-2.5 bg-[#3C478F] text-white text-sm font-bold rounded-full hover:bg-[#2A3266] transition-colors">보관함 이동</button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[15px] text-left">
                        <thead className="text-[13px] text-gray-400 border-b border-gray-100">
                          <tr>
                            <th className="px-8 py-5">이름</th>
                            <th className="px-8 py-5">생년월일</th>
                            <th className="px-8 py-5">연락처</th>
                            <th className="px-8 py-5">이메일</th>
                          </tr>
                        </thead>
                        <tbody>
                          {extractedData.map((row, idx) => (
                            <tr key={idx} className="border-b border-gray-50 hover:bg-[#FAFAFA] transition-colors">
                              <td className="px-8 py-3 font-black text-[#111827]">{row.name}</td>
                              <td className="px-8 py-3 font-mono text-gray-600">{row.birth}</td>
                              <td className="px-8 py-3 font-mono text-gray-600">{row.phone}</td>
                              <td className="px-8 py-3 text-[#3C478F]">{row.email}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
              key="archive" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full bg-[#F8F9FB] rounded-[2.5rem] border border-gray-50 overflow-hidden"
            >
               <div className="px-8 py-6 border-b border-gray-100 flex flex-col space-y-5 bg-white">
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
                         onClick={handleExportToProject} 
                         disabled={selectedIds.length === 0} 
                         className={`flex items-center px-4 py-2 text-sm font-bold rounded-full transition-all shadow-sm ${selectedIds.length > 0 ? 'bg-[#FCC243] text-yellow-900 hover:bg-yellow-400 shadow-[0_4px_14px_rgba(252,194,67,0.3)]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                       >
                         <FolderPlus className="w-4 h-4 mr-2" />
                         프로젝트 추가
                       </button>
                       <button 
                         onClick={deleteSelected} 
                         disabled={selectedIds.length === 0} 
                         className={`flex items-center px-4 py-2 text-sm font-bold rounded-full transition-colors ${selectedIds.length > 0 ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
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
                     type="text" ref={searchInputRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                     className="block w-full pl-11 pr-3 py-3 bg-[#F8F9FB] rounded-2xl text-sm font-bold transition-all outline-none"
                     placeholder="검색 (Ctrl + F)"
                   />
                 </div>
               </div>
               <div className="flex-1 overflow-auto bg-white">
                 <table className="w-full text-sm text-left">
                   <thead className="text-[13px] text-gray-400 bg-white border-b border-gray-100 sticky top-0">
                    <tr>
                      <th className="px-5 py-5 w-12 text-center">
                        <button onClick={toggleSelectAll} className="text-gray-300 hover:text-gray-400 transition-colors">
                          {selectedIds.length === archivedData.length && archivedData.length > 0 ? <CheckSquare className="w-5 h-5 text-[#FCC243]" /> : <Square className="w-5 h-5" />}
                        </button>
                      </th>
                      <th className="px-5 py-5 font-bold cursor-pointer text-center" onClick={() => handleSort('name')}>이름</th>
                      <th className="px-5 py-5 font-bold text-center">생년월일</th>
                      <th className="px-5 py-5 font-bold text-center">연락처</th>
                      <th className="px-5 py-5 font-bold text-center">이메일</th>
                      <th className="px-5 py-5 font-bold cursor-pointer text-center" onClick={() => handleSort('createdAt')}>저장일시</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedData.map((row) => {
                      const isSelected = selectedIds.includes(row.archiveId);
                       return (
                        <tr key={row.archiveId} className={`border-b border-gray-50 transition-colors ${isSelected ? 'bg-[#FAFAFA]' : 'bg-white hover:bg-[#FAFAFA] focus-within:bg-[#FAFAFA]'}`}>
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
                              value={row.birth}
                              onChange={(e) => handleEditCell(row.archiveId, 'birth', e.target.value)}
                              className="w-full px-3 py-2 bg-transparent border-none focus:bg-white focus:ring-2 focus:ring-[#3C478F]/20 rounded-lg font-mono text-gray-600 text-center transition-all outline-none"
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <input
                              type="text"
                              value={row.phone}
                              onChange={(e) => handleEditCell(row.archiveId, 'phone', e.target.value)}
                              className="w-full px-3 py-2 bg-transparent border-none focus:bg-white focus:ring-2 focus:ring-[#3C478F]/20 rounded-lg font-mono text-gray-600 text-center transition-all outline-none"
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <input
                              type="text"
                              value={row.email}
                              onChange={(e) => handleEditCell(row.archiveId, 'email', e.target.value)}
                              className="w-full px-3 py-2 bg-transparent border-none focus:bg-white focus:ring-2 focus:ring-[#3C478F]/20 rounded-lg text-gray-500 text-center text-[14px] transition-all outline-none"
                            />
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-400 text-[11px] bg-gray-50/50 text-center">
                            {row.createdAt ? new Date(row.createdAt).toLocaleString() : ''}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                 </table>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {duplicatesInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ duration: 0.2 }} 
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-10 text-center"
            >
              <RefreshCw className="w-16 h-16 text-[#FCC243] mx-auto mb-6" />
              <h3 className="text-2xl font-black mb-3">정보 업데이트됨</h3>
              <p className="text-gray-500 mb-8">{duplicatesInfo.count}명의 기록을 갱신했습니다.</p>
              <button onClick={() => setDuplicatesInfo(null)} className="w-full bg-[#3C478F] text-white font-bold py-4 rounded-full shadow-lg">확인</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProjectSaveModal 
        isOpen={isProjectModalOpen} 
        onClose={() => {
          setIsProjectModalOpen(false);
          setDataForProject([]);
        }} 
        dataToSave={dataForProject} 
        sourceType="profile" 
        onSaveSuccess={(projName) => {
          setProjectSaveSuccessMessage(`'${projName}' 폴더에 정보가 모두 병합되었습니다!`);
          setSelectedIds([]); // 성공 시 선택 해제
          setTimeout(() => setProjectSaveSuccessMessage(''), 3000);
        }} 
      />

    </div>
  );
};

export default ProfileExtractor;
