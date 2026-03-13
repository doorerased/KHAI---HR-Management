import os

file_path = r'frontend\src\pages\ProjectManager.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip_old_tag = False
for i, line in enumerate(lines):
    # 1. Insert tag at top-right
    if '<div className="flex items-center space-x-1">' in line:
        new_lines.append(line)
        new_lines.append('                          {/* 상태 표시 태그 (상단 이동) */}\n')
        new_lines.append('                          <span className={`px-2 py-1 rounded-full text-[10px] font-black tracking-tight flex items-center gap-1 mr-2 bg-white/80 backdrop-blur-sm shadow-sm border ${project.status === "완료" ? "text-green-600 border-green-200" : "text-yellow-600 border-yellow-200"}`}>\n')
        new_lines.append('                            {project.status === "완료" ? (\n')
        new_lines.append('                              <><CheckCircle2 className="w-3 h-3" /> 완료</>\n')
        new_lines.append('                            ) : (\n')
        new_lines.append('                              <><Loader2 className="w-3 h-3 animate-spin" /> 진행중</>\n')
        new_lines.append('                            )}\n')
        new_lines.append('                          </span>\n')
        continue

    # 2. Skip the old tag at the bottom
    if '{/* 상태 표시 태그 (진행중/완료) */}' in line:
        skip_old_tag = True
        continue
    
    if skip_old_tag:
        if '</div>' in line: # This is the end of the absolute div
            skip_old_tag = False
            continue
        continue

    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("UI Layout optimized: Status tag moved to top-right.")
