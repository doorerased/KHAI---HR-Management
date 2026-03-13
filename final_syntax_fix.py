import os

file_path = r'frontend\src\pages\ProjectManager.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if i == 1295: # 1296 in 1-indexed
        new_lines.append(line)
        # Next few lines are guaranteed to be the broken part
        new_lines.append('                ) : (\n')
        new_lines.append('                  <div className="w-full flex justify-end">\n')
        new_lines.append('                    <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">닫기</button>\n')
        new_lines.append('                  </div>\n')
        new_lines.append('                )}\n')
        continue
    
    # Skip the broken lines (1297-1300)
    if 1296 <= i <= 1301:
        continue

    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("ProjectManager.jsx FINAL syntax fix applied.")
