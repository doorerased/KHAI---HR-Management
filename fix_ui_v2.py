import os

file_path = r'frontend\src\pages\ProjectManager.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    # Fix Dashboard Tag: more robust, no Fragment
    if '{/* 상태 표시 태그 (상단 이동) */}' in line:
        new_lines.append(line)
        continue
    
    if '<span className={`px-2 py-1 rounded-full text-[10px] font-black' in line:
        new_lines.append('                          <span className={`px-2 py-1 rounded-full text-[10px] font-black tracking-tight flex items-center gap-1 mr-2 bg-white/90 backdrop-blur-sm shadow-sm border ${project.status === "완료" ? "text-green-600 border-green-200" : "text-yellow-600 border-yellow-200"}`}>\n')
        new_lines.append('                            {project.status === "완료" ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Loader2 className="w-3 h-3 animate-spin text-yellow-500" />}\n')
        new_lines.append('                            <span className="ml-1">{project.status === "완료" ? "완료" : "진행중"}</span>\n')
        new_lines.append('                          </span>\n')
        continue
    
    # Fix Detail View Button: more robust
    if "project.status === '완료' ? (" in line or 'project.status === "완료" ? (' in line:
        new_lines.append('            {project.status === "완료" ? <CheckCircle2 className="w-4 h-4 mr-1.5 text-white" /> : <Loader2 className="w-4 h-4 mr-1.5 group-hover:animate-spin text-yellow-600" />}\n')
        new_lines.append('            <span>{project.status === "완료" ? "완료됨" : "완료하기"}</span>\n')
        continue
        
    # Skip lines we are replacing
    if '<><CheckCircle2 className="w-3 h-3" /> 완료</>' in line or '<><Loader2 className="w-3 h-3 animate-spin" /> 진행중</>' in line:
        continue
    if '<><CheckCircle2 className="w-4 h-4 mr-1.5" /> 완료됨</>' in line or '<><Loader2 className="w-4 h-4 mr-1.5 group-hover:animate-spin" /> 완료하기</>' in line:
        continue
    if ') : (' in line:
        continue
    if ')}' in line and (i > 0 and '</span>' in lines[i-1]):
        continue

    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("UI Logic stabilized: Fragments removed, explicit rendering used.")
