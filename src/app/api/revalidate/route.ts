import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest } from 'next/server';
import { validateRequest } from '@/auth';
import { USER_ROLE } from '@/lib/constants';
import { localeCodes } from '@/i18n/config';
import { invalidateHomeContentFromAdmin } from '@/lib/content-revalidation';

export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user || user.userRole < USER_ROLE.OPERATION1) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      path,
      paths,
      tag,
      tags,
      scope,
      timestamp,
    } = body as {
      path?: string;
      paths?: string[];
      tag?: string;
      tags?: string[];
      scope?: string;
      timestamp?: number;
    };

    if (scope === "content" || path === "/" || (Array.isArray(paths) && paths.includes("/"))) {
      invalidateHomeContentFromAdmin();
      revalidateTag("main-content");
    }

    const requestTags = [
      ...(typeof tag === "string" ? [tag] : []),
      ...(Array.isArray(tags) ? tags : []),
    ].filter(Boolean);

    requestTags.forEach((item) => revalidateTag(item));

    const requestPaths = [
      ...(typeof path === "string" ? [path] : []),
      ...(Array.isArray(paths) ? paths : []),
    ].filter(Boolean);

    requestPaths.forEach((item) => {
      revalidatePath(item);

      // locale prefix가 없는 경로는 전체 locale 경로도 함께 무효화
      if (!/^\/(en|ko|zh)(\/|$)/.test(item)) {
        localeCodes.forEach((locale) => {
          if (locale === "en") return;
          revalidatePath(`/${locale}${item}`);
        });
      }
    });
    
    return Response.json({ 
      revalidated: true, 
      timestamp 
    });
  } catch (err) {
    return Response.json({ error: 'Error revalidating' }, { status: 500 });
  }
}
