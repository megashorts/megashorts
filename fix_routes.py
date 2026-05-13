import re
import os

files = [
    'src/app/api/points/users/[userId]/bank-info/route.ts',
    'src/app/api/users/username/[username]/route.ts',
    'src/app/api/users/[userId]/payments/route.ts',
    'src/app/api/users/[userId]/followers/route.ts',
    'src/app/api/points/admin/withdrawals/[id]/memo/route.ts',
    'src/app/api/points/admin/withdrawals/[id]/reject/route.ts',
    'src/app/api/points/admin/withdrawals/[id]/approve/route.ts',
    'src/app/api/videos/[postId]/route.ts',
    'src/app/api/posts/[postId]/route.ts',
    'src/app/api/admin/notice-modals/[id]/route.ts',
    'src/app/api/creator-info/[userId]/route.ts',
    'src/app/api/admin/inquiry/[id]/response/route.ts',
    'src/app/api/admin/inquiry/[id]/status/route.ts'
]

for filepath in files:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r') as f:
        content = f.read()

    # Case A: context: { params: { id: string } }
    # Fix: change to Promise<{ id: string }> and replace context.params with (await context.params)
    if 'context: { params: {' in content or 'context: { params: { id: string } }' in content:
        content = re.sub(r'context\s*:\s*\{\s*params\s*:\s*\{\s*([a-zA-Z0-9_]+)\s*:\s*string\s*\}\s*\}', r'context: { params: Promise<{ \1: string }> }', content)
        content = re.sub(r'context\.params(?!\s*:)', r'(await context.params)', content)

    # Case B: { params: { id } }: { params: { id: string } }
    # Fix: change to context: { params: Promise<{ id: string }> } and inject const { id } = await context.params;
    def replacer_b(m):
        func_start = m.group(1)
        param_name = m.group(2)
        return f"{func_start}context: {{ params: Promise<{{ {param_name}: string }}> }}) {{\n  const {{ {param_name} }} = await context.params;"
    content = re.sub(r'(export\s+async\s+function\s+[A-Z]+\([^,]+,\s*)\{\s*params\s*:\s*\{\s*([a-zA-Z0-9_]+)\s*\}\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*[a-zA-Z0-9_]+\s*:\s*string\s*\}\s*\}[\s,]*\)\s*\{', replacer_b, content)

    # Case C: { params }: { params: { id: string } }
    # Fix: change to context: { params: Promise<{ id: string }> } and inject const params = await context.params;
    def replacer_c(m):
        func_start = m.group(1)
        param_name = m.group(2)
        return f"{func_start}context: {{ params: Promise<{{ {param_name}: string }}> }}) {{\n  const params = await context.params;"
    content = re.sub(r'(export\s+async\s+function\s+[A-Z]+\([^,]+,\s*)\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*([a-zA-Z0-9_]+)\s*:\s*string\s*\}\s*\}[\s,]*\)\s*\{', replacer_c, content)

    with open(filepath, 'w') as f:
        f.write(content)

print("done")
