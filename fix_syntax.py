with open('src/components/admin/ResourcesManager.tsx', 'r') as f:
    content = f.read()

# We need to find the `  );\n\n            <Modal isOpen={!!viewingResource}`
# and move `  );\n}` to the very end of the file.

# Find the end of the previous modal
import re
content = re.sub(r'(\s*</div>\s*);\s*<Modal isOpen=\{!!viewingResource\}', r'\n<Modal isOpen={!!viewingResource}', content)

if not content.endswith('}'):
    content = content.strip()
    if content.endswith(')'):
        pass # wait
        
with open('src/components/admin/ResourcesManager.tsx', 'w') as f:
    f.write(content)

print("Fixed syntax")
