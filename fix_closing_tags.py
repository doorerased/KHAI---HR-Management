import os

file_path = r'frontend\src\pages\ProjectManager.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if i == 1301: # line 1302 in 1-indexed
        # This is where the broken closing tags are
        new_lines.append('              </div>\n')
        new_lines.append('            </motion.div>\n')
        new_lines.append('          </motion.div>\n')
        new_lines.append('        )}\n')
        continue
    
    # Skip the broken lines
    if i == 1302:
        continue

    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("ProjectManager.jsx modal closing tags fixed.")
