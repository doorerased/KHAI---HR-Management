import os

file_path = r'frontend\src\pages\ProjectManager.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

output_lines = []
for i, line in enumerate(lines):
    # Fix the conditional rendering syntax at line 248/249
    if 'projects.length === 0 ? (' in line:
        output_lines.append(line)
        continue
    
    if i > 0 and '진행 중인 프로젝트가 없습니다' in lines[i-3] and '</div>' in line:
        output_lines.append(line)
        # Check if next line is already the fix
        if i + 1 < len(lines) and ') : (' not in lines[i+1]:
            output_lines.append('             ) : (\n')
        continue

    output_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(output_lines)

print("ProjectManager.jsx syntax fixed (conditional rendering).")
