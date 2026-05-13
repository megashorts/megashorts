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

  // Replace signature
  code = code.replace(/(\{.*?params.*?\}|context)\s*:\s*\{\s*params\s*:\s*\{\s*([a-zA-Z0-9_]+)\s*:\s*string\s*\}\s*\}/g, 'context: { params: Promise<{ $2: string }> }');

  // Inject await
  code = code.replace(/(export\s+async\s+function\s+[A-Z]+\s*\([^)]+context\s*:\s*\{\s*params\s*:\s*Promise<\{\s*([a-zA-Z0-9_]+)\s*:\s*string\s*\}>\s*\}\s*\)\s*\{)/g, (match, p1, p2) => {
    return `${p1}\n  const { ${p2} } = await context.params;`;
  });

  fs.writeFileSync(file, code);
});
console.log('done');
