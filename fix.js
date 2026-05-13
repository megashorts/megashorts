const fs = require('fs');

const files = [
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
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace { params }: { params: { id: string } } -> context: { params: Promise<{ id: string }> }
  code = code.replace(/\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*([a-zA-Z0-9_]+)\s*:\s*string\s*\}\s*\}/g, 'context: { params: Promise<{ $1: string }> }');
  
  // Replace { params: { username } }: { params: { username: string } } -> context: { params: Promise<{ username: string }> }
  code = code.replace(/\{\s*params\s*:\s*\{\s*[a-zA-Z0-9_]+\s*\}\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*([a-zA-Z0-9_]+)\s*:\s*string\s*\}\s*\}/g, 'context: { params: Promise<{ $1: string }> }');

  // Replace context: { params: { id: string } } -> context: { params: Promise<{ id: string }> }
  code = code.replace(/context\s*:\s*\{\s*params\s*:\s*\{\s*([a-zA-Z0-9_]+)\s*:\s*string\s*\}\s*\}/g, 'context: { params: Promise<{ $1: string }> }');

  // Inject const { paramName } = await context.params;
  // This is tricky, let's just insert it after the function signature block.
  // We look for 'export async function GET(req, context: { params: Promise<{ xxx: string }> }) {'
  const regex = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(\s*[^,]+,\s*context\s*:\s*\{\s*params\s*:\s*Promise<\{\s*([a-zA-Z0-9_]+)\s*:\s*string\s*\}>\s*\}\s*\)\s*\{/g;
  
  code = code.replace(regex, (match, method, paramName) => {
    return `${match}\n  const { ${paramName} } = await context.params;`;
  });
  
  // For params that are already awaited or don't need context replacement:
  // if they use `params.id` instead of `{ id }`, we should also add `const params = await context.params;`
  // But let's see if the above covers most.

  fs.writeFileSync(file, code);
});
console.log('done');
