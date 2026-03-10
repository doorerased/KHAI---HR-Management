import React, { useState, useEffect } from 'react';
import { FolderOpen, Plus, X, CheckSquare, Save, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LOCAL_STORAGE_KEY = 'khai_projects';

const ProjectSaveModal = ({ isOpen, onClose, dataToSave, sourceType, onSaveSuccess }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    if (isOpen) {
      try {
        const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        setProjects(saved);
        if (saved.length > 0) {
          setSelectedProjectId(saved[0].id);
        } else {
          setIsCreatingNew(true);
        }
      } catch (e) {
        console.error('Failed to load projects', e);
        setProjects([]);
        setIsCreatingNew(true);
      }
    } else {
      setIsCreatingNew(false);
      setNewProjectName('');
      setSelectedProjectId('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    let currentProjects = [...projects];
    let targetProject = null;

    if (isCreatingNew) {
      if (!newProjectName.trim()) return;
      targetProject = {
        id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: newProjectName.trim(),
        description: `${dataToSave.length}명의 데이터 자동 연동됨`,
        createdAt: Date.now(),
        members: []
      };
      currentProjects.unshift(targetProject);
    } else {
      if (!selectedProjectId) return;
      targetProject = currentProjects.find(p => p.id === selectedProjectId);
    }

    if (!targetProject) return;

    // 데이터 병합 시작
    let targetMembers = [...(targetProject.members || [])];

    dataToSave.forEach(newItem => {
      if (!newItem.name) return;
      
      const existingIndex = targetMembers.findIndex(m => m.name === newItem.name);
      
      if (existingIndex >= 0) {
        // 기존 멤버 정보 업데이트
        let updatedMem = { ...targetMembers[existingIndex] };
        if (sourceType === 'profile') {
          if (newItem.birth) updatedMem.birth = newItem.birth;
          if (newItem.phone) updatedMem.phone = newItem.phone;
          if (newItem.email) updatedMem.email = newItem.email;
        } else if (sourceType === 'bank') {
          if (newItem.residentId) updatedMem.residentId = newItem.residentId;
          if (newItem.bank) updatedMem.bank = newItem.bank;
          if (newItem.account) updatedMem.account = newItem.account;
          if (newItem.incomeCategory) updatedMem.incomeCategory = newItem.incomeCategory;
        }
        targetMembers[existingIndex] = updatedMem;
      } else {
        // 새 멤버 추가
        let newMem = {
          id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: newItem.name,
          statusSelection: '대기',
          // 대상 프로젝트의 기관명을 신규 위원에게 자동 연동
          institution: targetProject.institution || '',
          type: '',
          field: '',
          date: '',
          addedAt: Date.now()
        };
        
        if (sourceType === 'profile') {
          newMem.birth = newItem.birth || '';
          newMem.phone = newItem.phone || '';
          newMem.email = newItem.email || '';
        } else if (sourceType === 'bank') {
          newMem.residentId = newItem.residentId || '';
          newMem.bank = newItem.bank || '';
          newMem.account = newItem.account || '';
          newMem.incomeCategory = newItem.incomeCategory || '사업 소득';
        }
        
        targetMembers.push(newMem);
      }
    });

    targetProject.members = targetMembers;
    
    // 로컬 스토리지에 반영
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentProjects));
    
    if (onSaveSuccess) {
      onSaveSuccess(targetProject.name);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-100 flex items-center justify-center bg-[#111827]/40 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-[#F8F9FB]">
            <h3 className="text-lg font-black text-[#111827] flex items-center">
              <FolderOpen className="w-5 h-5 mr-2 text-[#3C478F]" /> 
              프로젝트 바로 저장
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
          
          <div className="p-6">
            <p className="text-sm font-medium text-gray-500 mb-6">
              추출된 <strong className="text-[#3C478F]">{dataToSave.length}명</strong>의 정보를 프로젝트 폴더에 추가합니다. 이미 같은 이름의 위원이 있다면 정보가 <strong className="text-blue-600">업데이트</strong> 됩니다.
            </p>

            {projects.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-4 mb-4">
                  <label className="flex items-center cursor-pointer group">
                    <input 
                      type="radio" 
                      name="projectSelect" 
                      className="hidden" 
                      checked={!isCreatingNew} 
                      onChange={() => setIsCreatingNew(false)} 
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-2 transition-colors ${!isCreatingNew ? 'border-[#3C478F]' : 'border-gray-300 group-hover:border-gray-400'}`}>
                      {!isCreatingNew && <div className="w-2.5 h-2.5 bg-[#3C478F] rounded-full" />}
                    </div>
                    <span className={`text-[15px] font-bold ${!isCreatingNew ? 'text-[#111827]' : 'text-gray-500'}`}>기존 프로젝트에 추가</span>
                  </label>
                  
                  <label className="flex items-center cursor-pointer group">
                    <input 
                      type="radio" 
                      name="projectSelect" 
                      className="hidden" 
                      checked={isCreatingNew} 
                      onChange={() => setIsCreatingNew(true)} 
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-2 transition-colors ${isCreatingNew ? 'border-[#3C478F]' : 'border-gray-300 group-hover:border-gray-400'}`}>
                      {isCreatingNew && <div className="w-2.5 h-2.5 bg-[#3C478F] rounded-full" />}
                    </div>
                    <span className={`text-[15px] font-bold ${isCreatingNew ? 'text-[#111827]' : 'text-gray-500'}`}>새 프로젝트 생성</span>
                  </label>
                </div>
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {(!isCreatingNew && projects.length > 0) ? (
                <motion.div
                  key="existing"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-6"
                >
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">대상 프로젝트 선택</label>
                  <div className="relative">
                    <select 
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full bg-[#F8F9FB] px-4 py-3 border border-gray-200 focus:border-[#3C478F] focus:ring-1 focus:ring-[#3C478F] rounded-xl outline-none font-bold text-[#111827] appearance-none cursor-pointer"
                    >
                      <option value="" disabled>프로젝트를 선택하세요</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.members?.length || 0}명)</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      ▼
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="new"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-6"
                >
                  <label className="block text-xs font-bold text-[#3C478F] mb-2 uppercase tracking-wide">새 프로젝트 이름</label>
                  <div className="relative">
                    <PlusCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="예: 2026 1차 기술평가"
                      className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 focus:border-[#3C478F] focus:ring-1 focus:ring-[#3C478F] rounded-xl outline-none font-bold text-[#111827] transition-all"
                      autoFocus
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              onClick={handleSave}
              disabled={isCreatingNew ? !newProjectName.trim() : !selectedProjectId}
              className={`w-full flex justify-center items-center py-3.5 rounded-xl font-black text-[15px] transition-all
                ${(isCreatingNew ? newProjectName.trim() : selectedProjectId) 
                  ? 'bg-[#3C478F] text-white hover:bg-[#2A3266] shadow-[0_4px_14px_rgba(60,71,143,0.39)]' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              <Save className="w-5 h-5 mr-2" />
              프로젝트에 기록 병합하기
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProjectSaveModal;
