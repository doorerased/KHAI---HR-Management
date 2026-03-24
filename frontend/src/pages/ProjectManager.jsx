import React, { useState, useEffect, useMemo } from 'react';
import { BriefcaseBusiness, FolderOpen, Plus, Search, MoreVertical, Table as TableIcon, Users, Calendar, Trash2, ArrowLeft, CheckSquare, Square, Download, CheckCircle2, X, Link as LinkIcon, UploadCloud, Loader2, Database, ShieldCheck, AlertTriangle, Copy, ClipboardPaste } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import ConfirmModal from '../components/ConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

const LOCAL_STORAGE_KEY = 'khai_projects';

const ProjectManager = () => {
  console.log('ProjectManager Loaded - 2026-03-12 10:55');
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse projects', e);
      return [];
    }
  });

  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'detail'
  const [selectedProject, setSelectedProject] = useState(null);
  
  // 새 프로젝트 생성/수정 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingProjectId, setEditingProjectId] = useState(null);
  
  const [newProjectInstitution, setNewProjectInstitution] = useState('');
  const [newProjectType, setNewProjectType] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');

  // 데이터 관리 모달 상태
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [dataActionStatus, setDataActionStatus] = useState({ type: '', message: '' });

  // 삭제 확인 모달 상태
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(null); // 삭제 대상 프로젝트 ID

  // projects 변경 시 로컬 스토리지 저장 (용량 초과 에러 방지)
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error('LocalStorage save failed:', e);
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        alert('⚠️ 브라우저 저장 공간이 가득 찼습니다. 데이터 관리에서 백업 후 불필요한 항목을 삭제해주세요.');
      }
    }
  }, [projects]);

  const handleCreateOrUpdateProject = () => {
    if (!newProjectInstitution.trim() || !newProjectType.trim()) return;
    
    // 기관명_평가구분 형식으로 프로젝트명 조합
    const combinedName = `${newProjectInstitution.trim()}_${newProjectType.trim()}`;
    
    if (modalMode === 'create') {
      const newProject = {
        id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: combinedName,
        institution: newProjectInstitution.trim(),
        type: newProjectType.trim(),
        description: newProjectDesc.trim(),
        createdAt: Date.now(),
        status: '진행중', // '진행중' | '완료'
        members: [], 
      };
      setProjects(prev => [newProject, ...prev]);
    } else {
      setProjects(prev => prev.map(p => {
        if (p.id === editingProjectId) {
          // 기관명이 변경되었을 경우 내부 위원들의 기관명도 일괄 업데이트
          const updatedMembers = (p.members || []).map(member => ({
            ...member,
            institution: newProjectInstitution.trim()
          }));
          
          return {
            ...p,
            name: combinedName,
            institution: newProjectInstitution.trim(),
            type: newProjectType.trim(),
            description: newProjectDesc.trim(),
            members: updatedMembers
          };
        }
        return p;
      }));
    }
    
    setIsModalOpen(false);
    resetModalFields();
  };

  const resetModalFields = () => {
    setNewProjectInstitution('');
    setNewProjectType('');
    setNewProjectDesc('');
    setEditingProjectId(null);
    setModalMode('create');
  };

  const handleEditProject = (project, e) => {
    e.stopPropagation();
    setModalMode('edit');
    setEditingProjectId(project.id);
    setNewProjectInstitution(project.institution || project.name.split('_')[0] || '');
    setNewProjectType(project.type || project.name.split('_')[1] || '');
    setNewProjectDesc(project.description || '');
    setIsModalOpen(true);
  };

  const handleDeleteProject = (id, e) => {
    e.stopPropagation();
    setConfirmDeleteProject(id);
  };

  const executeDeleteProject = () => {
    setProjects(prev => prev.filter(p => p.id !== confirmDeleteProject));
    setConfirmDeleteProject(null);
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // --- 통합 데이터 백업 및 복구 로직 ---
  const handleExportAllData = () => {
    try {
      const allData = {
        khai_projects: JSON.parse(localStorage.getItem('khai_projects') || '[]'),
        savedProfiles: JSON.parse(localStorage.getItem('savedProfiles') || '[]'),
        savedBankInfos: JSON.parse(localStorage.getItem('savedBankInfos') || '[]'),
        backupDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const dataStr = JSON.stringify(allData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `KHAI_Backup_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setDataActionStatus({ type: 'success', message: '데이터 백업 파일이 생성되었습니다.' });
    } catch (e) {
      console.error('Backup failed', e);
      setDataActionStatus({ type: 'error', message: '백업 중 오류가 발생했습니다.' });
    }
  };

  const handleImportAllData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        
        if (!importedData.khai_projects && !importedData.savedProfiles && !importedData.savedBankInfos) {
          throw new Error('유효한 백업 파일이 아닙니다.');
        }

        if (window.confirm('기존 데이터가 백업 파일 내용으로 대체됩니다. 계속하시겠습니까?')) {
          if (importedData.khai_projects) {
            localStorage.setItem('khai_projects', JSON.stringify(importedData.khai_projects));
            setProjects(importedData.khai_projects);
          }
          if (importedData.savedProfiles) localStorage.setItem('savedProfiles', JSON.stringify(importedData.savedProfiles));
          if (importedData.savedBankInfos) localStorage.setItem('savedBankInfos', JSON.stringify(importedData.savedBankInfos));
          
          setDataActionStatus({ type: 'success', message: '데이터 복구가 완료되었습니다. 페이지를 새로고침합니다.' });
          setTimeout(() => window.location.reload(), 2000);
        }
      } catch (err) {
        console.error('Import failed', err);
        setDataActionStatus({ type: 'error', message: '복구 실패: 올바른 JSON 형식이 아닙니다.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-full flex flex-col max-w-6xl mx-auto font-sans px-6 mt-10 pb-24">
      
      {activeView === 'dashboard' && (
        <>
          <header className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end pb-6 border-b border-gray-100">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-[#111827] tracking-tighter flex items-center gap-4">
                <span className="p-2.5 bg-[#111827] text-white rounded-2xl shadow-[0_4px_14px_rgba(17,24,39,0.3)]">
                  <BriefcaseBusiness className="w-6 h-6" />
                </span>
                프로젝트 관리
              </h2>
              <p className="text-gray-400 mt-2 text-sm font-medium tracking-wide">위원 정보와 정산 정보를 통합하여 폴더별로 관리합니다.</p>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-3 mt-4 md:mt-0">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#F8F9FB] border border-gray-100 rounded-full text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#111827]/20 transition-all"
                  placeholder="프로젝트 검색"
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                <button 
                  onClick={() => setIsDataModalOpen(true)}
                  className="flex items-center whitespace-nowrap px-4 py-2 bg-white border border-gray-200 text-gray-600 font-bold rounded-full hover:bg-gray-50 transition-colors shadow-sm text-xs"
                  title="데이터 백업 및 복구"
                >
                  <Database className="w-3.5 h-3.5 mr-1.5 text-[#3C478F]" />
                  데이터 관리
                </button>
                <button 
                  onClick={() => { resetModalFields(); setIsModalOpen(true); }}
                  className="flex items-center whitespace-nowrap px-5 py-2 bg-[#FCC243] text-yellow-900 font-black rounded-full hover:bg-yellow-400 transition-colors shadow-sm text-xs"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  새 폴더
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto pb-8">
            {projects.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-16 text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] h-[400px]">
                 <div className="w-20 h-20 bg-[#FAFAFA] rounded-full flex items-center justify-center mb-6">
                   <FolderOpen className="w-8 h-8 text-gray-300" />
                 </div>
                 <p className="text-lg font-bold text-[#111827]">진행 중인 프로젝트가 없습니다.</p>
                 <p className="text-xs mt-2 text-gray-500 text-center max-w-xs">'새 폴더' 버튼을 눌러 프로젝트를 생성해 보세요.</p>
                  <button onClick={() => { resetModalFields(); setIsModalOpen(true); }} className="mt-6 px-5 py-2 bg-[#111827] text-white font-bold rounded-full shadow-md transition-colors text-xs whitespace-nowrap">프로젝트 생성</button>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-gray-100 rounded-3xl p-6 cursor-pointer group hover:border-[#111827]/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 relative overflow-hidden"
                      onClick={() => { setSelectedProject(project); setActiveView('detail'); }}
                    >
                      {/* 윗쪽 장식선 */}
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-[#FCC243] to-yellow-300" />
                      
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-yellow-50 text-yellow-600 rounded-2xl group-hover:bg-[#FCC243] group-hover:text-yellow-900 transition-colors">
                          <FolderOpen className="w-6 h-6" />
                        </div>
                        <div className="flex items-center space-x-1">
                          {/* 상태 표시 태그 (상단 이동) */}
                          <div className={`px-2 py-1 rounded-full text-[10px] font-black tracking-tight flex items-center gap-1 mr-2 bg-white/90 backdrop-blur-sm shadow-sm border ${project.status === "완료" ? "text-green-600 border-green-200" : "text-yellow-600 border-yellow-200"}`}>
                            {project.status === "완료" ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Loader2 className="w-3 h-3 animate-spin text-yellow-500" />}
                            <span className="ml-0.5">{project.status === "완료" ? "완료" : "진행중"}</span>
                          </div>
                          <button onClick={(e) => handleEditProject(project, e)} className="p-2 text-gray-300 hover:text-[#3C478F] hover:bg-blue-50 rounded-full transition-colors">
                              <MoreVertical className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => handleDeleteProject(project.id, e)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                              <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-black text-[#111827] mb-1.5 truncate group-hover:text-[#3C478F] transition-colors">{project.name}</h3>
                      <p className="text-xs text-gray-500 font-medium mb-5 line-clamp-2 h-8 leading-relaxed">
                        {project.description || '설명 없음'}
                      </p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <div className="flex items-center text-gray-500 text-sm font-bold">
                          <Users className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{(project.members || []).length}명</span>
                        </div>
                        <div className="flex items-center text-gray-400 text-xs font-medium">
                          <Calendar className="w-3.5 h-3.5 mr-1" />
{new Date(project.createdAt).toLocaleDateString('ko-KR')}
                        </div>
                      </div>

                    </motion.div>
                  ))}
                </div>
             )}
           </div>
         </>
       )}

      {activeView === 'detail' && selectedProject && (
        <ProjectDetailBoard 
          project={selectedProject} 
          onBack={() => { setActiveView('dashboard'); setSelectedProject(null); }}
          onUpdateProject={(updatedProject) => {
            setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
            setSelectedProject(updatedProject);
          }}
          onToggleStatus={(projectId) => {
            setProjects(prev => prev.map(p => {
              if (p.id === projectId) {
                const isNowComplete = p.status !== '완료';
                const nextStatus = isNowComplete ? '완료' : '진행중';
                
                let updatedMembers = [...(p.members || [])];
                
                // 완료로 변경할 때 스냅샷 저장
                if (isNowComplete) {
                  let bankInfos = [];
                  let profileInfos = [];
                  try {
                    bankInfos = JSON.parse(localStorage.getItem('savedBankInfos') || '[]');
                    profileInfos = JSON.parse(localStorage.getItem('savedProfiles') || '[]');
                  } catch (e) {}

                  updatedMembers = updatedMembers.map(member => {
                    const matchedBank = bankInfos.find(b => b.name === member.name);
                    const matchedProfile = profileInfos.find(p => p.name === member.name);
                    
                    return {
                      ...member,
                      birthDate: matchedProfile ? (matchedProfile.birth || matchedProfile.birthDate || member.birthDate) : member.birthDate || '',
                      phone: matchedProfile ? (matchedProfile.phone || member.phone) : member.phone || '',
                      email: matchedProfile ? (matchedProfile.email || member.email) : member.email || '',
                      bank: matchedBank ? matchedBank.bank : member.bank || '정보 없음',
                      account: matchedBank ? matchedBank.account : member.account || '정보 없음',
                      residentId: matchedBank ? matchedBank.residentId : member.residentId || '정보 없음',
                      incomeCategory: matchedBank ? matchedBank.incomeCategory : member.incomeCategory || '-',
                      _isSnapshot: true // 스냅샷 데이터임을 표시
                    };
                  });
                } else {
                  // 다시 진행중으로 바꿀 때는 스냅샷 표시 제거 (동기화 재개)
                  updatedMembers = updatedMembers.map(m => {
                    const { _isSnapshot, ...rest } = m;
                    return rest;
                  });
                }

                const updated = { ...p, status: nextStatus, members: updatedMembers };
                if (selectedProject?.id === projectId) setSelectedProject(updated);
                return updated;
              }
              return p;
            }));
          }}
        />
      )}

      {/* 새 프로젝트 생성 모달 */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-black text-[#111827] flex items-center">
                  <FolderOpen className="w-5 h-5 mr-2 text-[#FCC243]" /> {modalMode === 'create' ? '새 프로젝트 폴더' : '프로젝트 정보 수정'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold text-[#111827] mb-2">기관명 <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={newProjectInstitution}
                      onChange={(e) => setNewProjectInstitution(e.target.value)}
                      placeholder="예) 신용보증기금"
                      className="w-full bg-[#F8F9FB] px-4 py-3 border border-gray-200 focus:border-[#111827] focus:ring-1 focus:ring-[#111827] rounded-xl outline-none font-bold text-gray-800 transition-colors text-sm"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#111827] mb-2">평가구분 <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={newProjectType}
                      onChange={(e) => setNewProjectType(e.target.value)}
                      placeholder="예) 서류 평가"
                      className="w-full bg-[#F8F9FB] px-4 py-3 border border-gray-200 focus:border-[#111827] focus:ring-1 focus:ring-[#111827] rounded-xl outline-none font-bold text-gray-800 transition-colors text-sm"
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-[#111827] mb-2">상세 설명 (선택)</label>
                  <textarea 
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="프로젝트 관련 메모를 남겨주세요."
                    className="w-full bg-[#F8F9FB] px-4 py-3 border border-gray-200 focus:border-[#111827] focus:ring-1 focus:ring-[#111827] rounded-xl outline-none text-sm text-gray-700 resize-none h-24 transition-colors"
                  />
                </div>
                <button 
                  onClick={handleCreateOrUpdateProject}
                  disabled={!newProjectInstitution.trim() || !newProjectType.trim()}
                  className={`w-full py-3.5 rounded-xl font-black text-[15px] transition-colors ${ (newProjectInstitution.trim() && newProjectType.trim()) ? 'bg-[#111827] text-white hover:bg-gray-800 shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                >
                  {modalMode === 'create' ? '폴더 생성하기' : '수정 완료'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 데이터 관리(백업/복구) 모달 */}
      <AnimatePresence>
        {isDataModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#111827]/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-[#F8F9FB]">
                <h3 className="text-lg font-black text-[#111827] flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2 text-[#3C478F]" /> 데이터 안전 관리
                </h3>
                <button onClick={() => { setIsDataModalOpen(false); setDataActionStatus({type:'', message:''}); }} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
              </div>
              <div className="p-6">
                <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-xs text-blue-700 font-bold leading-relaxed">
                    <AlertTriangle className="w-3.5 h-3.5 inline mr-1 mb-0.5" /> 
                    도메인이 바뀌거나 브라우저를 초기화하면 데이터가 유실될 수 있습니다. 정기적으로 백업 파일을 다운로드하여 보관하세요.
                  </p>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={handleExportAllData}
                    className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-[#3C478F] hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center">
                      <div className="p-2.5 bg-gray-50 rounded-xl mr-4 group-hover:bg-blue-50 transition-colors">
                        <Download className="w-5 h-5 text-gray-400 group-hover:text-[#3C478F]" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-[#111827] text-sm">내보내기 (백업)</p>
                        <p className="text-xs text-gray-400 mt-0.5">현재 모든 정보를 파일로 저장합니다.</p>
                      </div>
                    </div>
                  </button>

                  <label className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-[#FCC243] hover:shadow-md transition-all group cursor-pointer">
                    <div className="flex items-center">
                      <div className="p-2.5 bg-gray-50 rounded-xl mr-4 group-hover:bg-yellow-50 transition-colors">
                        <UploadCloud className="w-5 h-5 text-gray-400 group-hover:text-yellow-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-[#111827] text-sm">가져오기 (복구)</p>
                        <p className="text-xs text-gray-400 mt-0.5">백업 파일을 불러와 데이터를 복원합니다.</p>
                      </div>
                    </div>
                    <input type="file" accept=".json" className="hidden" onChange={handleImportAllData} />
                  </label>
                </div>

                {dataActionStatus.message && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={`mt-6 p-4 rounded-xl text-xs font-bold flex items-center ${dataActionStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {dataActionStatus.message}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmDeleteProject !== null}
        title="프로젝트 삭제"
        message="이 프로젝트와 내부의 연동 데이터를 모두 삭제하시겠습니까? (원본 위원/정산 정보는 삭제되지 않습니다)"
        onConfirm={executeDeleteProject}
        onCancel={() => setConfirmDeleteProject(null)}
      />

    </div>
  );
};

// 개별 상태(상황)들에 대한 색상 매핑
const STATUS_COLORS = {
  '선정': 'bg-green-100 text-green-700',
  '미선정': 'bg-red-100 text-red-700',
  '대기': 'bg-gray-100 text-gray-500',
  '완료': 'bg-blue-100 text-blue-700',
  '미완료': 'bg-yellow-100 text-yellow-700',
};

const ProjectDetailBoard = ({ project, onBack, onUpdateProject, onToggleStatus }) => {
  const [members, setMembers] = useState(project.members || []);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 위원 추가 모달 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalTab, setAddModalTab] = useState('archive'); // 'archive' | 'upload'
  const [availableProfiles, setAvailableProfiles] = useState([]);
  const [selectedProfileIds, setSelectedProfileIds] = useState([]);

  // 자동 추출 관련 상태
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [tempExtractedData, setTempExtractedData] = useState([]);

  // 정렬 상태
  const [sortConfig, setSortConfig] = useState({ key: 'statusSelection', direction: 'desc' }); // 기본 선정여부 내림차순

  // 토스트 메시지 상태
  const [saveToast, setSaveToast] = useState({ show: false, message: '' });

  // 일정 복사/붙여넣기 상태
  const [copiedSchedule, setCopiedSchedule] = useState(null);

  // 멤버 삭제 확인 모달 상태
  const [confirmRemoveMembers, setConfirmRemoveMembers] = useState(false);

  // 토스트 표시 함수
  const showToast = (message) => {
    setSaveToast({ show: true, message });
    setTimeout(() => setSaveToast({ show: false, message: '' }), 3000);
  };

  // Ctrl+S 단축키 핸들러
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // 이미 members 변경 시 useEffect로 자동 저장이 되고 있으므로, 
        // 여기서는 저장 중임을 시각적으로 알려주는 피드백 제공에 집중
        showToast("프로젝트의 변경 사항이 안전하게 저장되었습니다.");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 컴포넌트 마운트 시 위원 보관함(LocalStorage)에서 데이터 로드
  useEffect(() => {
    try {
      const savedProfiles = JSON.parse(localStorage.getItem('savedProfiles') || '[]');
      setAvailableProfiles(savedProfiles);
    } catch (e) {
      console.error('Failed to load profiles', e);
    }
  }, []);

  // members 상태가 변경되면 부모(대시보드)에 업데이트 이벤트를 쏴서 로컬스토리지 동기화
  useEffect(() => {
    onUpdateProject({ ...project, members });
  }, [members]);

  // --- 인라인 수정 핸들러 ---
  const handleMemberChange = (memberId, field, value) => {
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, [field]: value } : m));
  };

  // --- 멤버 데이터 매핑 및 최신화 로직 (핵심) ---
  // 위원 정보/정산 정보 보관함에서 동일 '이름'의 데이터를 가져와 병합
  // useMemo로 캐싱하여 불필요한 localStorage 재파싱 방지
  const currentMembers = useMemo(() => {
    let bankInfos = [];
    let profileInfos = [];
    try {
      bankInfos = JSON.parse(localStorage.getItem('savedBankInfos') || '[]');
      profileInfos = JSON.parse(localStorage.getItem('savedProfiles') || '[]');
    } catch (e) {
      console.error('Failed to parse storage data', e);
    }

    // 프로젝트가 '완료' 상태이면 이미 저장된 멤버 데이터를 그대로 사용
    if (project.status === '완료') {
      return members
        .filter(m => 
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.institution && m.institution.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .sort((a, b) => {
          const { key, direction } = sortConfig;
          let valA = a[key] || '';
          let valB = b[key] || '';

          if (key === 'statusSelection') {
            const weight = { '선정': 3, '미선정': 2, '대기': 1 };
            valA = weight[valA] || 0;
            valB = weight[valB] || 0;
          }

          if (valA < valB) return direction === 'asc' ? -1 : 1;
          if (valA > valB) return direction === 'asc' ? 1 : -1;
          return 0;
        });
    }

    return members.map(member => {
      const matchedBank = bankInfos.find(b => b.name === member.name);
      const matchedProfile = profileInfos.find(p => p.name === member.name);
      
      return {
        ...member,
        birthDate: matchedProfile ? (matchedProfile.birth || matchedProfile.birthDate || member.birthDate) : member.birthDate || '',
        phone: matchedProfile ? (matchedProfile.phone || member.phone) : member.phone || '',
        email: matchedProfile ? (matchedProfile.email || member.email) : member.email || '',
        bank: matchedBank ? matchedBank.bank : member.bank || '정보 없음',
        account: matchedBank ? matchedBank.account : member.account || '정보 없음',
        residentId: matchedBank ? matchedBank.residentId : member.residentId || '정보 없음',
        incomeCategory: matchedBank ? matchedBank.incomeCategory : member.incomeCategory || '-',
      };
    })
    .filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.institution && m.institution.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      const { key, direction } = sortConfig;
      let valA = a[key] || '';
      let valB = b[key] || '';

      if (key === 'statusSelection') {
        const weight = { '선정': 3, '미선정': 2, '대기': 1 };
        valA = weight[valA] || 0;
        valB = weight[valB] || 0;
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [members, searchQuery, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleOpenAddModal = () => {
    const existingIds = members.map(m => m.id);
    const completlyAvailable = availableProfiles.filter(p => !existingIds.includes(p.id));
    setAvailableProfiles(completlyAvailable);
    setSelectedProfileIds([]);
    setIsAddModalOpen(true);
  };

  const handleAddSelectedProfiles = () => {
    const profilesToAdd = availableProfiles.filter(p => selectedProfileIds.includes(p.id));
    
    const newMembers = profilesToAdd.map(p => ({
      id: p.id || `member_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: p.name,
      institution: project.institution || p.institution || '',
      type: '',
      field: '',
      statusSelection: '대기',
      birthDate: p.birth || p.birthDate || '',
      phone: p.phone || '',
      email: p.email || '',
    }));
    
    setMembers(prev => [...prev, ...newMembers]);
    setIsAddModalOpen(false);
    showToast(`${newMembers.length}명의 위원이 프로젝트에 추가되었습니다.`);
  };

  // --- 자동 추출 관련 핸들러 ---
  const traverseFileTree = (entry) => {
    return new Promise((resolve) => {
      if (entry.isFile) {
        entry.file(file => resolve([file]));
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        dirReader.readEntries(async (entries) => {
          const promises = entries.map(e => traverseFileTree(e));
          const filesArrays = await Promise.all(promises);
          resolve(filesArrays.flat());
        });
      } else {
        resolve([]);
      }
    });
  };

  const handleFileUpload = async (selectedFiles) => {
    setIsAnalyzing(true);
    setUploadError('');
    setTempExtractedData([]);
    
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
        const response = await fetch(API_ENDPOINTS.EXTRACT_PROFILE, {
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
          setTempExtractedData([...allData]);
        }
      } catch (err) {
        errorDetails.push(`[${file.name}] ${err.message}`);
      }
    }

    if (!anySuccess) {
      setUploadError(`추출 실패: ${errorDetails.join(' / ')}`);
      setIsAnalyzing(false);
    } else {
      if (errorDetails.length > 0) setUploadError(`일부 파일 실패: ${errorDetails.join(' / ')}`);
      setIsAnalyzing(false);
      
      // 추출 성공 시 데이터 병합 및 저장
      if (allData.length > 0) {
        handleSaveExtractedToProjectAndArchive(allData);
      }
    }
  };

  const handleSaveExtractedToProjectAndArchive = (extractedData) => {
    // 1. 전역 보관함(savedProfiles)에 저장
    try {
      const globalProfiles = JSON.parse(localStorage.getItem('savedProfiles') || '[]');
      const newGlobalProfiles = [...globalProfiles];
      
      extractedData.forEach(newItem => {
        const existingIdx = newGlobalProfiles.findIndex(p => p.name === newItem.name);
        if (existingIdx >= 0) {
          newGlobalProfiles[existingIdx] = { ...newGlobalProfiles[existingIdx], ...newItem, updatedAt: Date.now() };
        } else {
          newGlobalProfiles.push({ ...newItem, id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, createdAt: Date.now() });
        }
      });
      localStorage.setItem('savedProfiles', JSON.stringify(newGlobalProfiles));
      // 보관함 목록 갱신
      setAvailableProfiles(newGlobalProfiles);
    } catch (e) {
      console.error('Failed to update global profiles', e);
    }

    // 2. 현재 프로젝트 멤버에 추가
    const newMembers = extractedData.map(p => ({
      id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: p.name,
      institution: project.institution || '',
      type: '서류',
      field: '',
      statusSelection: '대기',
      statusGuide: '미완료',
      statusReply: '미완료',
      statusRemind: '미완료',
      birthDate: p.birth || '',
      phone: p.phone || '',
      email: p.email || '',
    }));

    setMembers(prev => [...prev, ...newMembers]);
    showToast(`${newMembers.length}명의 위원 정보가 프로젝트와 보관함에 동시 등록되었습니다.`);
    
    // 모달 닫기 및 상태 초기화
    setTimeout(() => {
      setIsAddModalOpen(false);
      setAddModalTab('archive');
      setTempExtractedData([]);
    }, 1500);
  };

  const toggleStatus = (memberId, field, nextValueOptions) => {
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        const currentIndex = nextValueOptions.indexOf(m[field]);
        const nextIndex = (currentIndex + 1) % nextValueOptions.length;
        return { ...m, [field]: nextValueOptions[nextIndex] };
      }
      return m;
    }));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === currentMembers.length && currentMembers.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentMembers.map(d => d.id));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]);
  };

  const removeSelectedMembers = () => {
    setConfirmRemoveMembers(true);
  };

  const executeRemoveMembers = () => {
    setMembers(prev => prev.filter(m => !selectedIds.includes(m.id)));
    setSelectedIds([]);
    setConfirmRemoveMembers(false);
  };

  // 모든(또는 선택된) 위원의 구분을 일괄 변경하는 함수
  const handleBulkUpdateType = (newType) => {
    // 사용자의 요청에 따라 '모든 위원'의 구분을 변경함
    setMembers(prev => prev.map(m => ({ ...m, type: newType })));
  };

  // 모든 위원의 기관명을 일괄 변경하는 함수
  const handleBulkUpdateInstitution = () => {
    const newInstitution = window.prompt('전체 위원에게 적용할 기관명을 입력하세요:');
    if (newInstitution !== null) {
      setMembers(prev => prev.map(m => ({ ...m, institution: newInstitution.trim() })));
    }
  };

  const handleExportExcel = () => {
    if (selectedIds.length === 0) return;
    const itemsToExport = currentMembers.filter(m => selectedIds.includes(m.id));
    
    const excelData = itemsToExport.map(row => ({
      '기관명': row.institution,
      '구분': row.type,
      '분야': row.field,
      '일정': row.schedule || '',
      '선정여부': row.statusSelection,
      '이름': row.name,
      '생년월일': row.birthDate ? row.birthDate.replace(/\./g, '-') : '',
      '연락처': row.phone,
      '이메일': row.email,
      '은행명': row.bank !== '정보 없음' ? row.bank : '',
      '계좌번호': row.account !== '정보 없음' ? row.account : '',
      '주민번호': row.residentId !== '정보 없음' ? row.residentId : '',
      '소득구분': row.incomeCategory !== '-' ? row.incomeCategory : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "프로젝트_통합명단");
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}_통합데이터.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden relative">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center">
          <button 
            onClick={onBack}
            className="p-2 mr-3 bg-gray-50 text-gray-500 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h3 className="text-xl font-black text-[#111827] flex items-center">
              {project.name}
            </h3>
            <span className="text-xs text-gray-400 font-medium">{project.description || '프로젝트 상세 보드'}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#F8F9FB] rounded-full text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#111827]/10 transition-all w-40"
              placeholder="이름/기관 검색"
            />
          </div>

          <div className="h-4 w-px bg-gray-200 mx-1"></div>

          <button 
            onClick={removeSelectedMembers}
            disabled={selectedIds.length === 0}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center ${selectedIds.length > 0 ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'text-gray-300 cursor-not-allowed'}`}
          >
            <Trash2 className="w-4 h-4 mr-1" /> 제외
          </button>
          <button 
            onClick={handleExportExcel}
            disabled={selectedIds.length === 0}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center ${selectedIds.length > 0 ? 'bg-[#3C478F] text-white hover:bg-[#2A3266] shadow-[0_4px_10px_rgba(60,71,143,0.3)]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          >
            <Download className="w-4 h-4 mr-1" /> 엑셀
          </button>
          <button 
            onClick={() => onToggleStatus(project.id)}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center shadow-md group ${
              project.status === '완료' 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-white border-2 border-yellow-400 text-yellow-700 hover:bg-yellow-50'
            }`}
            title={project.status === '완료' ? "클릭하여 진행중으로 변경 (데이터 동기화 재개)" : "클릭하여 완료로 처리 (당시 데이터 고정)"}
          >
            {project.status === "완료" ? (
              <><CheckCircle2 className="w-4 h-4 mr-1.5 text-white" /> 완료됨</>
            ) : (
              <><Loader2 className="w-4 h-4 mr-1.5 group-hover:animate-spin text-yellow-600" /> 완료하기</>
            )}
          </button>

          <button 
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-[#111827] text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors shadow-[0_4px_10px_rgba(17,24,39,0.3)] flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" /> 위원 추가
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#F8F9FB]">
        {currentMembers.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-10 text-gray-400">
            <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mb-4 border border-gray-100">
              <LinkIcon className="w-6 h-6 text-gray-300" />
            </div>
            <p className="font-bold text-[#111827]">이 프로젝트에 추가된 위원이 없습니다.</p>
            <p className="text-sm mt-1">상단의 '위원 추가' 버튼을 눌러 보관함의 데이터를 연동하세요.</p>
          </div>
        ) : (
          <table className="w-full text-[13px] text-left border-collapse">
            <thead className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
              <tr className="text-[11px] text-gray-400 tracking-wider">
                <th className="px-4 py-3 w-10 text-center bg-white sticky left-0 z-20 border-b border-gray-100">
                  <button onClick={toggleSelectAll} className="focus:outline-none">
                     {selectedIds.length === currentMembers.length && currentMembers.length > 0 ? (
                       <CheckSquare className="w-4 h-4 text-[#FCC243]" />
                      ) : (
                       <Square className="w-4 h-4 text-gray-300" />
                     )}
                   </button>
                </th>
                 <th 
                  className="px-4 py-3 bg-white font-bold border-b border-gray-100 whitespace-nowrap min-w-[120px] text-center cursor-pointer hover:text-[#FCC243] transition-colors group"
                  onClick={handleBulkUpdateInstitution}
                  title="클릭하여 기관명 일괄 설정"
                >
                  기관명
                </th>
                <th 
                  className="px-4 py-3 bg-white font-bold border-b border-gray-100 whitespace-nowrap min-w-[100px] text-center cursor-pointer hover:bg-gray-50 transition-colors group text-[13px]"
                  onClick={() => requestSort('type')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <select 
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleBulkUpdateType(e.target.value)}
                      value=""
                      className="bg-transparent border-none text-[13px] font-bold text-[#111827] focus:outline-none cursor-pointer appearance-none text-center hover:text-[#FCC243] transition-colors"
                    >
                      <option value="" disabled>구분</option>
                      <option value="서류">일괄 서류</option>
                      <option value="면접">일괄 면접</option>
                      <option value="논술">일괄 논술</option>
                    </select>
                    <span className={`transition-opacity ${sortConfig.key === 'type' ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`}>
                      {sortConfig.key === 'type' && sortConfig.direction === 'asc' ? '▲' : '▼'}
                    </span>
                  </div>
                </th>
                <th 
                  className="px-4 py-3 bg-white font-bold border-b border-gray-100 whitespace-nowrap min-w-[130px] text-center cursor-pointer hover:bg-gray-50 transition-colors group text-[13px]"
                  onClick={() => requestSort('field')}
                >
                  <div className="flex items-center justify-center gap-1">
                    분야
                    <span className={`transition-opacity ${sortConfig.key === 'field' ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`}>
                      {sortConfig.key === 'field' && sortConfig.direction === 'asc' ? '▲' : '▼'}
                    </span>
                  </div>
                </th>
                <th 
                  className="px-4 py-3 bg-white font-bold border-b border-gray-100 whitespace-nowrap text-center min-w-[160px] cursor-pointer hover:bg-gray-50 transition-colors group text-[13px]"
                  onClick={() => {
                    if (copiedSchedule) {
                      if (selectedIds.length > 0) {
                        setMembers(prev => prev.map(m => selectedIds.includes(m.id) ? { ...m, schedule: copiedSchedule } : m));
                        showToast(`${selectedIds.length}명에게 일정(${copiedSchedule})을 일괄 적용했습니다.`);
                      } else {
                        if (window.confirm(`전체 위원에게 일정(${copiedSchedule})을 적용하시겠습니까?`)) {
                          setMembers(prev => prev.map(m => ({ ...m, schedule: copiedSchedule })));
                          showToast(`전체 위원에게 일정(${copiedSchedule})을 일괄 적용했습니다.`);
                        }
                      }
                    } else {
                      requestSort('schedule');
                    }
                  }}
                  title={copiedSchedule ? `클릭하여 ${selectedIds.length > 0 ? '선택된 위원' : '전체 위원'}에게 복사된 일정(${copiedSchedule}) 일괄 적용` : '클릭하여 정렬'}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    {copiedSchedule ? (
                      <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 shadow-sm animate-pulse">
                        <ClipboardPaste className="w-3.5 h-3.5 text-[#3C478F]" />
                        <span className="text-[#3C478F] font-black text-[13px]">일정 붙여넣기</span>
                      </div>
                    ) : (
                      <>
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        일정
                        <span className={`transition-opacity ${sortConfig.key === 'schedule' ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`}>
                          {sortConfig.key === 'schedule' && sortConfig.direction === 'asc' ? '▲' : '▼'}
                        </span>
                      </>
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 bg-white font-bold border-b border-gray-100 border-r whitespace-nowrap text-center min-w-[100px] cursor-pointer hover:bg-gray-50 transition-colors group text-[13px]"
                  onClick={() => requestSort('statusSelection')}
                >
                  <div className="flex items-center justify-center gap-1">
                    선정 여부
                    <span className={`transition-opacity ${sortConfig.key === 'statusSelection' ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`}>
                      {sortConfig.key === 'statusSelection' && sortConfig.direction === 'asc' ? '▲' : '▼'}
                    </span>
                  </div>
                </th>

                <th className="px-4 py-3 bg-white font-bold border-b border-gray-100 whitespace-nowrap text-center text-[13px]">이름</th>
                <th className="px-4 py-3 bg-white font-bold border-b border-gray-100 whitespace-nowrap text-center text-[13px]">생년월일</th>
                <th className="px-4 py-3 bg-white font-bold border-b border-gray-100 whitespace-nowrap text-center text-[13px]">연락처</th>
                <th className="px-4 py-3 bg-white font-bold border-b border-gray-100 border-r whitespace-nowrap text-center text-[13px]">이메일</th>

                <th className="px-4 py-3 bg-white font-bold border-b border-gray-100 whitespace-nowrap text-center text-[13px]">은행명</th>
                <th className="px-4 py-3 bg-white font-bold border-b border-gray-100 whitespace-nowrap text-center text-[13px]">계좌번호</th>
                <th className="px-4 py-3 bg-white font-bold border-b border-gray-100 whitespace-nowrap text-center text-[13px]">주민등록번호</th>
                <th className="px-4 py-3 bg-white font-bold border-b border-gray-100 whitespace-nowrap text-center text-[13px]">소득구분</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {currentMembers.map((row) => {
                const isSelected = selectedIds.includes(row.id);
                const hasBankInfo = row.bank && row.bank !== '정보 없음';

                return (
                  <tr key={row.id} className={`border-b border-gray-50 hover:bg-[#F8F9FB] transition-colors ${isSelected ? 'bg-blue-50/30' : ''} ${row.statusSelection === '선정' ? 'bg-yellow-100 bg-opacity-50!' : ''}`}>
                    <td className="px-4 py-3 text-center sticky left-0 bg-inherit z-10">
                       <button onClick={(e) => { e.stopPropagation(); toggleSelectRow(row.id); }} className="focus:outline-none">
                         {isSelected ? <CheckSquare className="w-4 h-4 text-[#FCC243]" /> : <Square className="w-4 h-4 text-gray-200" />}
                       </button>
                    </td>
                    
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input 
                        type="text"
                        value={row.institution || ''}
                        onChange={(e) => handleMemberChange(row.id, 'institution', e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-200 rounded px-1 transition-shadow font-bold text-[#111827] text-[13px] text-center"
                      />
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <select 
                        value={row.type || '서류'}
                        onChange={(e) => handleMemberChange(row.id, 'type', e.target.value)}
                        className="bg-transparent border-none text-[13px] text-gray-500 focus:outline-none cursor-pointer text-center appearance-none"
                      >
                        <option value="서류">서류</option>
                        <option value="면접">면접</option>
                        <option value="논술">논술</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap min-w-[130px]">
                      <input 
                        type="text"
                        value={row.field || ''}
                        onChange={(e) => handleMemberChange(row.id, 'field', e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-200 rounded px-1 transition-shadow text-[13px] text-gray-500 text-center"
                      />
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap group/cell">
                      <div className="flex items-center justify-center gap-1">
                        <input 
                          type="date"
                          value={row.schedule || ''}
                          onChange={(e) => handleMemberChange(row.id, 'schedule', e.target.value)}
                          className="bg-transparent border-none text-[13px] text-gray-500 focus:outline-none text-center focus:bg-white focus:ring-1 focus:ring-blue-100 rounded"
                        />
                        {row.schedule ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCopiedSchedule(row.schedule);
                              showToast(`일정(${row.schedule})이 복사되었습니다. 다른 위원에게 붙여넣기 하세요.`);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#3C478F] transition-all shadow-sm bg-gray-50 border border-gray-100"
                            title="이 일정을 복사"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          // 일정이 없어도 호버 시엔 복사 아이콘이 아주 연하게 보이게 하여 기능 존재를 알림
                          <div className="p-1.5 opacity-0 group-hover/cell:opacity-20 cursor-default" title="일정을 입력하면 복사 버튼이 나타납니다.">
                            <Copy className="w-3.5 h-3.5 text-gray-400" />
                          </div>
                        )}
                        {copiedSchedule && copiedSchedule !== row.schedule && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMemberChange(row.id, 'schedule', copiedSchedule);
                              showToast(`${row.name}에게 일정(${copiedSchedule})을 적용했습니다.`);
                            }}
                            className="p-1.5 rounded-lg text-emerald-500 hover:text-white hover:bg-emerald-500 transition-all shadow-sm bg-emerald-50 border border-emerald-100 animate-bounce"
                            title={`복사된 일정(${copiedSchedule}) 붙여넣기`}
                          >
                            <ClipboardPaste className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center border-r border-gray-50">
                      <select 
                        value={row.statusSelection || '대기'}
                        onChange={(e) => handleMemberChange(row.id, 'statusSelection', e.target.value)}
                        className={`text-[13px] font-bold px-3 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer appearance-none text-center bg-white border border-gray-100 hover:border-[#FCC243] focus:outline-none ${STATUS_COLORS[row.statusSelection || '대기']}`}
                        style={{ width: 'fit-content', minWidth: '54px' }}
                      >
                        <option value="대기" className="bg-white text-gray-500 py-1">대기</option>
                        <option value="선정" className="bg-white text-emerald-600 py-1">선정</option>
                        <option value="미선정" className="bg-white text-red-600 py-1">미선정</option>
                      </select>
                    </td>

                    <td className="px-4 py-3 font-black text-center text-[#111827] whitespace-nowrap text-[13px]">{row.name}</td>
                    <td className="px-4 py-3 text-center text-gray-600 whitespace-nowrap text-[13px]">{row.birthDate ? row.birthDate.replace(/\./g, '-') : ''}</td>
                    <td className="px-4 py-3 text-center font-mono text-[13px] text-gray-600 whitespace-nowrap">{row.phone}</td>
                    <td className="px-4 py-3 text-center text-[13px] text-gray-500 border-r border-gray-50 whitespace-nowrap">{row.email}</td>

                    <td className="px-4 py-3 text-center whitespace-nowrap text-[13px]">
                      {hasBankInfo ? <span className="font-bold text-emerald-700 text-[13px]">{row.bank}</span> : <span className="text-[13px] text-red-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-[13px] text-gray-500 whitespace-nowrap">
                      {hasBankInfo ? row.account : '-'}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-[13px] text-gray-500 whitespace-nowrap">
                      {hasBankInfo ? row.residentId : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {hasBankInfo ? (
                        <span className="text-[13px] font-bold px-2 py-1 rounded-md bg-gray-100 text-gray-600 whitespace-nowrap">{row.incomeCategory}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 저장 완료 토스트 알림 */}
      <AnimatePresence>
        {saveToast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-100 flex items-center px-6 py-3 bg-[#111827] text-white rounded-2xl shadow-2xl border border-white/10"
          >
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight">{saveToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col h-[600px] overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-lg font-black text-[#111827] flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-[#3C478F]" /> 위원 추가
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
              </div>
              
              <div className="flex border-b border-gray-100 bg-white px-6">
                <button 
                  onClick={() => setAddModalTab('archive')}
                  className={`py-3 text-[13px] font-bold border-b-2 transition-all mr-6 ${addModalTab === 'archive' ? 'border-[#3C478F] text-[#3C478F]' : 'border-transparent text-gray-400'}`}
                >
                  기존 보관함에서 선택
                </button>
                <button 
                  onClick={() => setAddModalTab('upload')}
                  className={`py-3 text-[13px] font-bold border-b-2 transition-all ${addModalTab === 'upload' ? 'border-[#3C478F] text-[#3C478F]' : 'border-transparent text-gray-400'}`}
                >
                  새 파일에서 자동 추출
                </button>
              </div>

              {addModalTab === 'archive' ? (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-white">
                    <p className="text-sm text-gray-500 mb-3"><strong className="text-[#3C478F]">위원 정보 보관함</strong>에 저장된 명단입니다.</p>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-[#F8F9FB] border border-gray-200 rounded-xl text-sm font-bold focus:outline-none" 
                        placeholder="이름 또는 기관 검색..." 
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 bg-white">
                    {availableProfiles.length === 0 ? (
                      <div className="h-full flex items-center justify-center flex-col text-gray-400 text-sm">
                         <p>추가할 수 있는 위원이 없습니다.</p>
                         <p className="text-xs mt-1">이미 추가되었거나 보관함이 비어있습니다.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2">
                        {availableProfiles.map(profile => (
                          <div 
                            key={profile.id} 
                            onClick={() => {
                              setSelectedProfileIds(prev => prev.includes(profile.id) ? prev.filter(id => id !== profile.id) : [...prev, profile.id])
                            }}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center ${selectedProfileIds.includes(profile.id) ? 'bg-blue-50 border-[#3C478F] shadow-[0_4px_10px_rgba(60,71,143,0.1)]' : 'bg-white border-gray-100 hover:border-gray-300'}`}
                          >
                            <div className="mr-3">
                              {selectedProfileIds.includes(profile.id) ? <CheckCircle2 className="w-5 h-5 text-[#3C478F]" /> : <Square className="w-5 h-5 text-gray-200" />}
                            </div>
                            <div className="flex flex-col flex-1 overflow-hidden">
                               <span className="font-black text-[13px] text-[#111827]">{profile.name}</span>
                               <span className="text-[11px] text-gray-500 truncate">{profile.institution} | {profile.phone}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 p-6 flex flex-col bg-white">
                  <div 
                    className={`flex-1 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center p-8 transition-all relative
                      ${isAnalyzing ? 'bg-gray-50 border-gray-200' : 'bg-[#F8F9FB] border-gray-200 hover:border-[#3C478F] hover:bg-white'}
                    `}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                      e.preventDefault();
                      if (isAnalyzing) return;
                      const promises = [];
                      if (e.dataTransfer.items) {
                        for (let i = 0; i < e.dataTransfer.items.length; i++) {
                          const item = e.dataTransfer.items[i];
                          if (item.kind === 'file') {
                            const entry = item.webkitGetAsEntry();
                            if (entry) promises.push(traverseFileTree(entry));
                          }
                        }
                        const filesArrays = await Promise.all(promises);
                        const allFiles = filesArrays.flat().filter(f => f.name && !f.name.startsWith('.DS_Store'));
                        if (allFiles.length > 0) handleFileUpload(allFiles);
                      }
                    }}
                  >
                    {isAnalyzing ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-[#3C478F] animate-spin mb-4" />
                        <p className="font-black text-[#111827]">분석 중...</p>
                        <p className="text-xs text-gray-400 mt-2">파일이 많을수록 시간이 더 걸릴 수 있습니다.</p>
                      </div>
                    ) : tempExtractedData.length > 0 ? (
                      <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <p className="font-black text-[#111827] text-lg">추출 성공!</p>
                        <p className="text-sm text-gray-500 mt-1">{tempExtractedData.length}명의 위원이 식별되었습니다.</p>
                        <div className="mt-4 flex flex-wrap justify-center gap-2 max-h-24 overflow-y-auto">
                          {tempExtractedData.map((d, i) => (
                            <span key={i} className="text-[11px] font-bold bg-[#3C478F] text-white px-2 py-1 rounded-md">{d.name}</span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-4">잠시 후 창이 닫히며 목록에 추가됩니다.</p>
                      </div>
                    ) : (
                      <>
                        <div className="p-5 bg-white rounded-3xl shadow-sm mb-4">
                          <UploadCloud className="w-10 h-10 text-[#3C478F]" />
                        </div>
                        <p className="text-lg font-black text-[#111827]">프로필 파일 드래그</p>
                        <p className="text-sm text-gray-500 mt-1 mb-6 text-center">PPT, 이미지, PDF 등 자동 추출을 지원합니다.<br/>(복수 파일 처리 가능)</p>
                        <label className="cursor-pointer bg-[#3C478F] text-white px-8 py-3 rounded-full text-sm font-bold shadow-md hover:bg-gray-800 transition-all">
                          파일 찾아보기
                          <input 
                            type="file" 
                            multiple 
                            className="hidden" 
                            onChange={(e) => {
                              if (e.target.files.length > 0) handleFileUpload(Array.from(e.target.files));
                            }} 
                          />
                        </label>
                      </>
                    )}
                    
                    {uploadError && (
                      <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">
                        ⚠️ {uploadError}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                {addModalTab === 'archive' ? (
                  <>
                    <span className="text-sm font-bold text-gray-600"><span className="text-[#3C478F]">{selectedProfileIds.length}</span>명 선택됨</span>
                    <div className="space-x-2">
                      <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">취소</button>
                      <button 
                        onClick={handleAddSelectedProfiles}
                        disabled={selectedProfileIds.length === 0}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${selectedProfileIds.length > 0 ? "bg-[#3C478F] text-white shadow-md hover:bg-[#2A3266]" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                      >
                        위원 추가하기
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full flex justify-end">
                    <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">닫기</button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmModal
        isOpen={confirmRemoveMembers}
        title="위원 제외"
        message={`선택한 ${selectedIds.length}명의 위원을 프로젝트에서 제외하시겠습니까? (원본 데이터는 삭제되지 않습니다)`}
        onConfirm={executeRemoveMembers}
        onCancel={() => setConfirmRemoveMembers(false)}
      />
    </div>
  );
};

export default ProjectManager;

