"""
Fix ALL structural issues in page.tsx.
Line-by-line approach to handle every broken pattern.
"""

filepath = r'c:\Vant\frontend\src\app\app\page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

fixes = 0
i = 0
new_lines = []

while i < len(lines):
    line = lines[i]
    stripped = line.rstrip('\n').rstrip()
    
    # Pattern 1: "    ) \" followed by "}" -- from broken regex
    # Merge into "    )}"
    if (stripped.endswith(') \\') and 
        i + 1 < len(lines) and 
        lines[i + 1].rstrip('\n').strip() == '}'):
        indent = '    '
        new_lines.append(indent + ')}\n')
        i += 2
        fixes += 1
        print(f"  Fixed 'backslash-close' at line {i}")
        
        # Also check if next non-empty line is a standalone { that starts a stage block
        # Pattern: blank line, then "{", then "    stage === ..."
        # Convert to: blank line, then "    {stage === ..."
        while i < len(lines) and lines[i].strip() == '':
            new_lines.append(lines[i])
            i += 1
        
        if (i < len(lines) and lines[i].rstrip('\n').strip() == '{' and
            i + 1 < len(lines) and 'stage ===' in lines[i + 1]):
            stage_line = lines[i + 1]
            new_lines.append('    {' + stage_line.lstrip())
            i += 2
            fixes += 1
            print(f"  Fixed standalone '{{' + stage block at line {i}")
        continue
    
    # Pattern 2: Standalone ")" followed by "}" (normal premature close)
    if (stripped.strip() == ')' and 
        i + 1 < len(lines) and 
        lines[i + 1].rstrip('\n').strip() == '}'):
        indent = '    '
        new_lines.append(indent + ')}\n')
        i += 2
        fixes += 1
        print(f"  Fixed premature close at line {i}")
        
        # Same: check for standalone { + stage block
        while i < len(lines) and lines[i].strip() == '':
            new_lines.append(lines[i])
            i += 1
        
        if (i < len(lines) and lines[i].rstrip('\n').strip() == '{' and
            i + 1 < len(lines) and 'stage ===' in lines[i + 1]):
            stage_line = lines[i + 1]
            new_lines.append('    {' + stage_line.lstrip())
            i += 2
            fixes += 1
            print(f"  Fixed standalone '{{' + stage block at line {i}")
        continue
    
    # Pattern 3: Standalone "{" followed by "    stage ===" (not preceded by closing)
    if (stripped.strip() == '{' and 
        i + 1 < len(lines) and 
        'stage ===' in lines[i + 1]):
        stage_line = lines[i + 1]
        new_lines.append('    {' + stage_line.lstrip())
        i += 2
        fixes += 1
        print(f"  Fixed standalone '{{' + stage at line {i}")
        continue

    new_lines.append(line)
    i += 1

content = ''.join(new_lines)

# Final fix: </main > -> </main>
if '</main >' in content:
    content = content.replace('</main >', '</main>')
    fixes += 1

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\nTotal fixes: {fixes}")

# Verify
with open(filepath, 'r', encoding='utf-8') as f:
    verify_lines = f.readlines()
problems = 0
for i, line in enumerate(verify_lines, 1):
    s = line.rstrip('\n').rstrip()
    if s.endswith(') \\'):
        print(f"  REMAINING: backslash at line {i}")
        problems += 1
    if s.strip() == ')' and i < len(verify_lines) and verify_lines[i].rstrip('\n').strip() == '}':
        print(f"  REMAINING: premature close at line {i}")
        problems += 1
    if s.strip() == '{' and i < len(verify_lines) and 'stage ===' in verify_lines[i]:
        print(f"  REMAINING: standalone {{ at line {i}")
        problems += 1

if problems == 0:
    print("All structural issues resolved!")
else:
    print(f"WARNING: {problems} issues remain")
