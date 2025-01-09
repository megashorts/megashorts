import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { path, timestamp } = await request.json();
    
    if (path === '/') {
      // 메인 페이지 재생성 시 'main-content' 태그도 함께 무효화
      revalidateTag('main-content');
    }
    revalidatePath(path);
    
    return Response.json({ 
      revalidated: true, 
      timestamp 
    });
  } catch (err) {
    return Response.json({ error: 'Error revalidating' }, { status: 500 });
  }
}