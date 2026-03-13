import os

file_path = r'frontend\src\pages\ProjectManager.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

output_lines = []
for i, line in enumerate(lines):
    # Fix 1: Detail View members list conditional
    if 'currentMembers.length === 0 ? (' in line:
        output_lines.append(line)
        continue
    
    if i > 0 and '이 프로젝트에 추가된 위원이 없습니다' in lines[i-3] and '</div>' in line:
        output_lines.append(line)
        # Check if next line is already the fix
        if i + 1 < len(lines) and ') : (' not in lines[i+1]:
            output_lines.append('           ) : (\n')
        continue

    # Fix 2: Select all checkbox ternary
    if i > 0 and 'selectedIds.length === currentMembers.length' in lines[i-1] and '<CheckSquare' in lines[i]:
        output_lines.append(line)
        # Next line should be the colon
        if i + 1 < len(lines) and ' : (' not in lines[i+1] and ' : ' not in lines[i+1]:
            output_lines.append('                      ) : (\n')
        continue

    output_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(output_lines)

print("ProjectManager.jsx syntax fixed (detail view list & checkbox).")
