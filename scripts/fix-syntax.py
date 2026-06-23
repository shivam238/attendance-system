with open('public/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace the escaped backtick
new_c = c.replace('</student_list>\\`;', '</student_list>`;')

if c == new_c:
    print('Warning: Literal match not found, trying raw representation...')
    # Try finding \\`;
    new_c = c.replace('</student_list>\\`;', '</student_list>`;')

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(new_c)

print('Done!')
