import os

filepath = 'src/pages/Landing/index.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the escaped quotes
content = content.replace('\\"', '"')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed escaped quotes.")
