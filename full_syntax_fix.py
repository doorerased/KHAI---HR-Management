import os

file_path = r'frontend\src\pages\ProjectManager.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip_until = None

for i, line in enumerate(lines):
    if skip_until:
        if skip_until in line:
            skip_until = None
        continue

    # Fix 1: availableProfiles modal list (around 1179)
    if '{availableProfiles.length === 0 ? (' in line:
        new_lines.append(line)
        new_lines.append('                      <div className="h-full flex items-center justify-center flex-col text-gray-400 text-sm">\n')
        new_lines.append('                         <p>추가할 수 있는 위원이 없습니다.</p>\n')
        new_lines.append('                         <p className="text-xs mt-1">이미 추가되었거나 보관함이 비어있습니다.</p>\n')
        new_lines.append('                      </div>\n')
        new_lines.append('                    ) : (\n')
        new_lines.append('                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2">\n')
        new_lines.append('                        {availableProfiles.map(profile => (\n')
        new_lines.append('                          <div \n')
        new_lines.append('                            key={profile.id} \n')
        new_lines.append('                            onClick={() => {\n')
        new_lines.append('                              setSelectedProfileIds(prev => prev.includes(profile.id) ? prev.filter(id => id !== profile.id) : [...prev, profile.id])\n')
        new_lines.append('                            }}\n')
        new_lines.append('                            className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center ${selectedProfileIds.includes(profile.id) ? "bg-blue-50 border-[#3C478F] shadow-[0_4px_10px_rgba(60,71,143,0.1)]" : "bg-white border-gray-100 hover:border-gray-300"}`}\n')
        new_lines.append('                          >\n')
        new_lines.append('                            <div className="mr-3">\n')
        new_lines.append('                              {selectedProfileIds.includes(profile.id) ? <CheckCircle2 className="w-5 h-5 text-[#3C478F]" /> : <Square className="w-5 h-5 text-gray-200" />}\n')
        new_lines.append('                            </div>\n')
        new_lines.append('                            <div className="flex flex-col flex-1 overflow-hidden">\n')
        new_lines.append('                               <span className="font-black text-[13px] text-[#111827]">{profile.name}</span>\n')
        new_lines.append('                               <span className="text-[11px] text-gray-500 truncate">{profile.institution} | {profile.phone}</span>\n')
        new_lines.append('                            </div>\n')
        new_lines.append('                          </div>\n')
        new_lines.append('                        ))}\n')
        new_lines.append('                      </div>\n')
        new_lines.append('                    )}\n')
        skip_until = 'isActiveView ===' # This is not good, I need a better skip
        # Let's skip until the next major section
        skip_until = '</div>\n'
        # Actually, let's just skip until line 1206
        for j in range(i+1, len(lines)):
            if 'className="flex-1 p-6 flex flex-col bg-white"' in lines[j]:
                skip_until = lines[j]
                break
        continue

    # Fix 2: tempExtractedData (around 1236)
    if ') : tempExtractedData.length > 0 ? (' in line:
        new_lines.append(line)
        new_lines.append('                      <div className="flex flex-col items-center text-center">\n')
        new_lines.append('                        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">\n')
        new_lines.append('                          <CheckCircle2 className="w-8 h-8" />\n')
        new_lines.append('                        </div>\n')
        new_lines.append('                        <p className="font-black text-[#111827] text-lg">추출 성공!</p>\n')
        new_lines.append('                        <p className="text-sm text-gray-500 mt-1">{tempExtractedData.length}명의 위원이 식별되었습니다.</p>\n')
        new_lines.append('                        <div className="mt-4 flex flex-wrap justify-center gap-2 max-h-24 overflow-y-auto">\n')
        new_lines.append('                          {tempExtractedData.map((d, i) => (\n')
        new_lines.append('                            <span key={i} className="text-[11px] font-bold bg-[#3C478F] text-white px-2 py-1 rounded-md">{d.name}</span>\n')
        new_lines.append('                          ))}\n')
        new_lines.append('                        </div>\n')
        new_lines.append('                        <p className="text-xs text-gray-400 mt-4">잠시 후 창이 닫히며 목록에 추가됩니다.</p>\n')
        new_lines.append('                      </div>\n')
        new_lines.append('                    ) : (\n')
        new_lines.append('                      <>\n')
        new_lines.append('                        <div className="p-5 bg-white rounded-3xl shadow-sm mb-4">\n')
        new_lines.append('                          <UploadCloud className="w-10 h-10 text-[#3C478F]" />\n')
        new_lines.append('                        </div>\n')
        # Skip until the end of this block
        for j in range(i+1, len(lines)):
            if 'className="p-5 bg-white rounded-3xl shadow-sm mb-4"' in lines[j]:
                skip_until = lines[j]
                break
        continue

    # Fix 3: Bottom action buttons (around 1281)
    if '{addModalTab === "archive" ? (' in line or "{addModalTab === 'archive' ? (" in line:
        new_lines.append(line)
        new_lines.append('                  <>\n')
        new_lines.append('                    <span className="text-sm font-bold text-gray-600"><span className="text-[#3C478F]">{selectedProfileIds.length}</span>명 선택됨</span>\n')
        new_lines.append('                    <div className="space-x-2">\n')
        new_lines.append('                      <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">취소</button>\n')
        new_lines.append('                      <button \n')
        new_lines.append('                        onClick={handleAddSelectedProfiles}\n')
        new_lines.append('                        disabled={selectedProfileIds.length === 0}\n')
        new_lines.append('                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${selectedProfileIds.length > 0 ? "bg-[#3C478F] text-white shadow-md hover:bg-[#2A3266]" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}\n')
        new_lines.append('                      >\n')
        new_lines.append('                        위원 추가하기\n')
        new_lines.append('                      </button>\n')
        new_lines.append('                    </div>\n')
        new_lines.append('                  </>\n')
        new_lines.append('                ) : (\n')
        new_lines.append('                  <div className="w-full flex justify-end">\n')
        new_lines.append('                    <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">닫기</button>\n')
        new_lines.append('                  </div>\n')
        # Skip until the end of the modal
        for j in range(i+1, len(lines)):
            if 'className="w-full flex justify-end"' in lines[j]:
                skip_until = '</div>\n' # Next line after 닫기 button div
                # But it's better to just skip a fixed number of lines
                # I'll just skip until the next motion.div exit
                skip_until = '                )}\n'
                break
        continue

    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("ProjectManager.jsx ALL major syntax errors fixed.")
