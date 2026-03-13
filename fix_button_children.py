import os

file_path = r'frontend\src\pages\ProjectManager.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip_next = 0
for i, line in enumerate(lines):
    if skip_next > 0:
        skip_next -= 1
        continue

    if 'project.status === "완료" ? <CheckCircle2' in line and 'mr-1.5' in line:
        # This is the broken button children part
        new_lines.append('            {project.status === "완료" ? (\n')
        new_lines.append('              <><CheckCircle2 className="w-4 h-4 mr-1.5 text-white" /> 완료됨</>\n')
        new_lines.append('            ) : (\n')
        new_lines.append('              <><Loader2 className="w-4 h-4 mr-1.5 group-hover:animate-spin text-yellow-600" /> 완료하기</>\n')
        new_lines.append('            )}\n')
        # Skip the next 2 lines (broken span and closing parenthesis)
        skip_next = 2
        continue

    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("ProjectManager.jsx Detail button children fixed.")
