import os

file_path = r'frontend\src\pages\ProjectManager.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_content = """              <div className="flex border-b border-gray-100 bg-white px-6">
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
"""

# We'll use marker-based replacement to be more robust
start_marker = 'className="flex border-b border-gray-100 bg-white px-6"'
end_marker = 'className="flex-1 p-6 flex flex-col bg-white"'

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if start_marker in line and i > 1100: # Ensure we are in the modal section
        start_idx = i
        break

if start_idx != -1:
    for i in range(start_idx, len(lines)):
        if end_marker in lines[i]:
            end_idx = i
            break

if start_idx != -1 and end_idx != -1:
    # Preserve the line before the start marker (indentation etc.)
    # The start marker is part of the first div, so we replace from there
    # But wait, my new_content already includes the first div. 
    # Let's see the lines around start_idx.
    # Lines 1146 of view_file was "             <div className="flex border-b border-gray-100 bg-white px-6">"
    
    final_lines = lines[:start_idx] + [new_content] + lines[end_idx+1:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(final_lines)
    print("AddMemberModal structure restored successfully.")
else:
    print(f"Error: Markers not found. start_idx={start_idx}, end_idx={end_idx}")
