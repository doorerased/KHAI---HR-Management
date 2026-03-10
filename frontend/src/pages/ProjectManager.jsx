import React, { useState, useEffect } from 'react';
import { BriefcaseBusiness, FolderOpen, Plus, Search, MoreVertical, Table as TableIcon, Users, Calendar, Trash2, ArrowLeft, CheckSquare, Square, Download, CheckCircle2, X, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

const LOCAL_STORAGE_KEY = 'khai_projects';

const ProjectManager = () => {
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

  // projects 변경 시 로컬 스토리지 저장
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
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
    if (window.confirm('이 프로젝트와 내부의 연동 데이터를 모두 삭제하시겠습니까?\n(원본 위원/정산 정보는 삭제되지 않습니다)')) {
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
              <p className="text-gray-400 mt-2 text-sm font-medium tracking-wide">
                폴더를 생성하여 위원들의 기본 정보와 정산 정보, 연락/안내 현황을 통합해서 관리할 수 있습니다.
              </p>
            </div>
            
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
               <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                 <input
                   type="text"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="pl-10 pr-4 py-2 bg-[#F8F9FB] border border-gray-100 rounded-full text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#111827]/20 transition-all w-48 md:w-64"
                   placeholder="프로젝트 검색"
                 />
               </div>
               <button 
                 onClick={() => setIsModalOpen(true)}
                 className="flex items-center px-5 py-2.5 bg-[#FCC243] text-yellow-900 font-black rounded-full hover:bg-yellow-400 transition-colors shadow-sm"
               >
                 <Plus className="w-5 h-5 mr-1" />
                 새 폴더
               </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto pb-8">
            {projects.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-16 text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] h-[400px]">
                 <div className="w-20 h-20 bg-[#FAFAFA] rounded-full flex items-center justify-center mb-6">
                   <FolderOpen className="w-8 h-8 text-gray-300" />
                 </div>
                 <p className="text-xl font-bold text-[#111827]">진행 중인 프로젝트가 없습니다.</p>
                 <p className="text-sm mt-2 text-gray-500 text-center max-w-sm">'새 폴더' 버튼을 눌러 프로젝트를 생성한 후,<br/>위원 및 정산 정보를 연동해 보세요.</p>
                  <button onClick={() => { resetModalFields(); setIsModalOpen(true); }} className="mt-8 px-6 py-2.5 bg-[#111827] text-white font-bold rounded-full shadow-md transition-colors">프로젝트 생성</button>
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
                        <button onClick={(e) => handleEditProject(project, e)} className="p-2 text-gray-300 hover:text-[#3C478F] hover:bg-blue-50 rounded-full transition-colors">
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleDeleteProject(project.id, e)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                       </div>
                     </div>
                     
                     <h3 className="text-xl font-black text-[#111827] mb-2 truncate group-hover:text-[#3C478F] transition-colors">{project.name}</h3>
                     <p className="text-sm text-gray-500 font-medium mb-6 line-clamp-2 h-10">
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

    </div>
  );
};

// 미지원 아이콘 임시 렌더링용
const DatabaseIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>;

// 개별 상태(상황)들에 대한 색상 매핑
const STATUS_COLORS = {
  '선정': 'bg-green-100 text-green-700',
  '미선정': 'bg-red-100 text-red-700',
  '대기': 'bg-gray-100 text-gray-500',
  '완료': 'bg-blue-100 text-blue-700',
  '미완료': 'bg-yellow-100 text-yellow-700',
};

const ProjectDetailBoard = ({ project, onBack, onUpdateProject }) => {
  const [members, setMembers] = useState(project.members || []);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 위원 추가 모달 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [availableProfiles, setAvailableProfiles] = useState([]);
  const [selectedProfileIds, setSelectedProfileIds] = useState([]);

  // 정렬 상태
  const [sortConfig, setSortConfig] = useState({ key: 'statusSelection', direction: 'desc' }); // 기본 선정여부 내림차순

  // 토스트 메시지 상태
  const [saveToast, setSaveToast] = useState({ show: false, message: '' });

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
  const getMergedMembers = () => {
    let bankInfos = [];
    let profileInfos = [];
    try {
      bankInfos = JSON.parse(localStorage.getItem('savedBankInfos') || '[]');
      profileInfos = JSON.parse(localStorage.getItem('savedProfiles') || '[]');
    } catch (e) {
      console.error('Failed to parse storage data', e);
    }

    return members.map(member => {
      // 은행 정보 찾기 (이름 기준 단순 매칭)
      const matchedBank = bankInfos.find(b => b.name === member.name);
      // 위원 프로필 정보 찾기 (이름 기준 단순 매칭)
      const matchedProfile = profileInfos.find(p => p.name === member.name);
      
      return {
        ...member,
        // 보관함의 생년월일(birth)이 있으면 birthDate에 우선 순위로 병합
        birthDate: matchedProfile ? (matchedProfile.birth || matchedProfile.birthDate || member.birthDate) : member.birthDate || '',
        phone: matchedProfile ? (matchedProfile.phone || member.phone) : member.phone || '',
        email: matchedProfile ? (matchedProfile.email || member.email) : member.email || '',
        bank: matchedBank ? matchedBank.bank : member.bank || '정보 없음',
        account: matchedBank ? matchedBank.account : member.account || '정보 없음',
        residentId: matchedBank ? matchedBank.residentId : member.residentId || '정보 없음',
        incomeCategory: matchedBank ? matchedBank.incomeCategory : member.incomeCategory || '-',
      };
    });
  };

  const currentMembers = getMergedMembers()
    .filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.institution.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortConfig.key === 'statusSelection') {
        // 선정 > 미선정 > 대기 순서로 임의 가중치 부여 또는 단순 문자열 정렬
        const weight = { '선정': 3, '미선정': 2, '대기': 1 };
        const valA = weight[a.statusSelection] || 0;
        const valB = weight[b.statusSelection] || 0;
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });

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
      ...p,
      statusSelection: '대기',      
      statusGuide: '미완료',         
      statusReply: '미완료',         
      statusRemind: '미완료',        
    }));

    setMembers([...members, ...newMembers]);
    setIsAddModalOpen(false);
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
    if (window.confirm(`선택한 ${selectedIds.length}명의 위원을 프로젝트에서 제외하시겠습니까? (원본 데이터는 삭제되지 않습니다)`)) {
      setMembers(prev => prev.filter(m => !selectedIds.includes(m.id)));
      setSelectedIds([]);
    }
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
      '생년월일': row.birthDate,
      '연락처': row.phone,
      '이메일': row.email,
      '은행명': row.bank !== '정보 없음' ? row.bank : '',
      '계좌번호': row.account !== '정보 없음' ? row.account : '',
      '주민번호': row.residentId !== '정보 없음' ? row.residentId : '',
      '소득구분': row.incomeCategory !== '-' ? row.incomeCategory : '',
    }));

    if(XLSX) {
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "프로젝트_통합명단");
      XLSX.writeFile(workbook, `${project.name}_통합데이터.xlsx`);
    } else {
      alert("엑셀 다운로드 라이브러리가 로드되지 않았습니다.");
    }
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
                <th className="px-4 py-3 bg-white font-bold border-b border-gray-100 whitespace-nowrap min-w-[100px] text-center">
                  <select 
                    onChange={(e) => handleBulkUpdateType(e.target.value)}
                    value=""
                    className="bg-transparent border-none text-[11px] font-bold text-[#111827] focus:outline-none cursor-pointer appearance-none text-center hover:text-[#FCC243] transition-colors"
                  >
                    <option value="" disabled>구분</option>
                    <option value="서류">일괄 서류</option>
                    <option value="면접">일괄 면접</option>
                    <option value="논술">일괄 논술</option>
                  </select>
                </th>
                <th className="px-4 py-3 bg-white font-bold border-b border-gray-100 whitespace-nowrap min-w-[100px] text-center">분야</th>
                <th className="px-4 py-3 bg-white font-bold border-b border-gray-100 whitespace-nowrap text-center min-w-[120px]">일정</th>
                <th 
                  className="px-4 py-3 bg-white font-bold border-b border-gray-100 border-r whitespace-nowrap text-center min-w-[100px] cursor-pointer hover:bg-gray-50 transition-colors group"
                  onClick={() => requestSort('statusSelection')}
                >
                  <div className="flex items-center justify-center gap-1">
                    선정 여부
                    <span className={`transition-opacity ${sortConfig.key === 'statusSelection' ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`}>
                      {sortConfig.key === 'statusSelection' && sortConfig.direction === 'asc' ? '▲' : '▼'}
                    </span>
                  </div>
                </th>

                <th className="px-4 py-3 bg-white font-bold border-b border-gray-100 whitespace-nowrap text-center">이름</th>
                <th className="px-4 py-3 bg-white font-bold border-b border-gray-100 whitespace-nowrap text-center">생년월일</th>
                <th className="px-4 py-3 bg-white font-bold border-b border-gray-100 whitespace-nowrap text-center">연락처</th>
                <th className="px-4 py-3 bg-white font-bold border-b border-gray-100 border-r whitespace-nowrap text-center">이메일</th>

                <th className="px-4 py-3 bg-white font-bold border-b border-gray-100 whitespace-nowrap text-center">은행명</th>
                <th className="px-4 py-3 bg-white font-bold border-b border-gray-100 whitespace-nowrap text-center">계좌번호</th>
                <th className="px-4 py-3 bg-white font-bold border-b border-gray-100 whitespace-nowrap text-center">주민등록번호</th>
                <th className="px-4 py-3 bg-white font-bold border-b border-gray-100 whitespace-nowrap text-center">소득구분</th>
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
                        className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-200 rounded px-1 transition-shadow font-bold text-[#111827] text-xs text-center"
                      />
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <select 
                        value={row.type || '서류'}
                        onChange={(e) => handleMemberChange(row.id, 'type', e.target.value)}
                        className="bg-transparent border-none text-[11px] text-gray-500 focus:outline-none cursor-pointer text-center appearance-none"
                      >
                        <option value="서류">서류</option>
                        <option value="면접">면접</option>
                        <option value="논술">논술</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input 
                        type="text"
                        value={row.field || ''}
                        onChange={(e) => handleMemberChange(row.id, 'field', e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-200 rounded px-1 transition-shadow text-[11px] text-gray-500 text-center"
                      />
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <input 
                        type="date"
                        value={row.schedule || ''}
                        onChange={(e) => handleMemberChange(row.id, 'schedule', e.target.value)}
                        className="bg-transparent border-none text-[11px] text-gray-500 focus:outline-none text-center"
                      />
                    </td>
                    <td className="px-4 py-3 text-center border-r border-gray-50">
                      <select 
                        value={row.statusSelection || '대기'}
                        onChange={(e) => handleMemberChange(row.id, 'statusSelection', e.target.value)}
                        className={`text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer appearance-none text-center bg-white border border-gray-100 hover:border-[#FCC243] focus:outline-none ${STATUS_COLORS[row.statusSelection || '대기']}`}
                        style={{ width: 'fit-content', minWidth: '54px' }}
                      >
                        <option value="대기" className="bg-white text-gray-500 py-1">대기</option>
                        <option value="선정" className="bg-white text-emerald-600 py-1">선정</option>
                        <option value="미선정" className="bg-white text-red-600 py-1">미선정</option>
                      </select>
                    </td>

                    <td className="px-4 py-3 font-black text-center text-[#111827] whitespace-nowrap">{row.name}</td>
                    <td className="px-4 py-3 text-center text-gray-600 whitespace-nowrap text-xs">{row.birthDate}</td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-gray-600 whitespace-nowrap">{row.phone}</td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500 border-r border-gray-50 whitespace-nowrap">{row.email}</td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {hasBankInfo ? <span className="font-bold text-emerald-700 text-xs">{row.bank}</span> : <span className="text-xs text-red-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-[11px] text-gray-500 whitespace-nowrap">
                      {hasBankInfo ? row.account : '-'}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-gray-500 whitespace-nowrap">
                      {hasBankInfo ? row.residentId : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {hasBankInfo ? (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-gray-100 text-gray-600 whitespace-nowrap">{row.incomeCategory}</span>
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
                  <DatabaseIcon className="w-5 h-5 mr-2 text-[#3C478F]" /> 보관함에서 위원 추가
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
              </div>
              
              <div className="p-4 border-b border-gray-100 bg-white">
                <p className="text-sm text-gray-500 mb-3"><strong className="text-[#3C478F]">위원 정보 보관함</strong>에 저장된 명단입니다. 추가할 위원을 선택해 주세요.</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <input type="text" className="w-full pl-9 pr-4 py-2.5 bg-[#F8F9FB] border border-gray-200 rounded-xl text-sm font-bold focus:outline-none" placeholder="이름 또는 기관 검색..." />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 bg-white">
                {availableProfiles.length === 0 ? (
                  <div className="h-full flex items-center justify-center flex-col text-gray-400 text-sm">
                     <p>추가할 수 있는 위원이 없습니다.</p>
                     <p className="text-xs mt-1">위원 정보 가져오기 탭에서 데이터를 먼저 추출하세요.</p>
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

              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-600"><span className="text-[#3C478F]">{selectedProfileIds.length}</span>명 선택됨</span>
                <div className="space-x-2">
                  <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">취소</button>
                  <button 
                    onClick={handleAddSelectedProfiles} 
                    disabled={selectedProfileIds.length === 0}
                    className={`px-6 py-2 rounded-xl text-sm font-black transition-colors ${selectedProfileIds.length > 0 ? 'bg-[#111827] text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                  >
                    프로젝트에 추가
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectManager;
