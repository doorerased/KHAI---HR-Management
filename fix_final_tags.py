import os

file_path = r'frontend\src\pages\ProjectManager.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if i == 1305: # line 1306 in 1-indexed, which was empty
        new_lines.append('      </AnimatePresence>\n')
        continue
    
    # Preserve everything else but adjust line 1314 if needed
    if i == 1313: # line 1314 in 1-indexed
        # Check if it matches existing content
        if '</div>' in line:
            new_lines.append(line)
        continue

    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("ProjectManager.jsx FINAL tag mismatch fix applied.")
