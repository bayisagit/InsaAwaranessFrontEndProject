import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Matches 'flex items-center justify-end gap-X'
    content = re.sub(r'flex\s+items-center\s+justify-end\s+gap-(\d+(?:\.\d+)?)', 
                     r'flex flex-wrap items-center justify-end gap-\1 min-w-fit', content)
                     
    # Matches 'flex justify-end gap-X' where it wasn't already matched
    # Be careful not to match things that already have flex-wrap
    def replace_flex(match):
        full_match = match.group(0)
        if 'flex-wrap' in full_match:
            return full_match
        return re.sub(r'flex\s+justify-end', r'flex flex-wrap justify-end', full_match) + ' min-w-fit'

    # We need a custom regex to safely target flex containers without double-wrapping
    # First, let's fix standard patterns safely:
    # 1. "flex items-center justify-end gap-2" -> "flex flex-wrap items-center justify-end gap-2 min-w-fit"
    # 2. "flex justify-end gap-2" -> "flex flex-wrap justify-end gap-2 min-w-fit"
    # 3. "pt-4 flex justify-end gap-3" -> "pt-4 flex flex-wrap justify-end gap-3 min-w-fit"
    
    # Reset content to original to use a unified replacement approach
    content = original
    
    def replacer(m):
        prefix = m.group(1) # anything before flex (like pt-4 )
        classes = m.group(2) # e.g. "flex items-center justify-end gap-2"
        
        # Avoid double replacing
        if 'flex-wrap' in classes:
            return m.group(0)
            
        new_classes = classes.replace('flex', 'flex flex-wrap')
        if 'min-w-fit' not in new_classes:
            new_classes += ' min-w-fit'
            
        return f'{prefix}{new_classes}'

    # Match class="..." containing flex and justify-end and gap-
    # We'll split the file line by line for safer replacement
    lines = content.split('\n')
    new_lines = []
    changed = False
    
    for line in lines:
        if 'className="' in line and 'flex' in line and 'justify-end' in line and 'gap-' in line:
            # We want to replace inside the className quotes
            def class_repl(m):
                cls_str = m.group(1)
                if 'flex-wrap' not in cls_str:
                    cls_str = cls_str.replace('flex ', 'flex flex-wrap ')
                    if 'min-w-fit' not in cls_str:
                        cls_str = cls_str + ' min-w-fit'
                return f'className="{cls_str}"'
            
            new_line = re.sub(r'className="([^"]+)"', class_repl, line)
            if new_line != line:
                changed = True
            new_lines.append(new_line)
        else:
            new_lines.append(line)
            
    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write('\n'.join(new_lines))
        print(f"Updated {filepath}")

def scan_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                process_file(os.path.join(root, file))

if __name__ == '__main__':
    base_dir = '/home/byd/Desktop/InsaProjects/AwaranessProject/INSA_Learning_Management/src/app'
    scan_directory(base_dir)
    print("Done scanning.")
