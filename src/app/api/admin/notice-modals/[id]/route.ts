import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { USER_ROLE } from '@/lib/constants';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { user } = await validateRequest();
    if (!user || user.userRole < USER_ROLE.OPERATION1) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const modalId = parseInt(params.id);
    const modal = await prisma.noticeModal.findUnique({
      where: { id: modalId },
    });

    if (!modal) {
      return Response.json(
        { error: 'Modal not found' },
        { status: 404 }
      );
    }

    return Response.json(modal);
  } catch (error) {
    console.error('Failed to get modal:', error);
    return Response.json(
      { error: 'Failed to get modal' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { user } = await validateRequest();
    if (!user || user.userRole < USER_ROLE.OPERATION1) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const modalId = parseInt(params.id);
    const data = await request.json();

    const modal = await prisma.noticeModal.update({
      where: { id: modalId },
      data,
    });

    return Response.json(modal);
  } catch (error) {
    console.error('Failed to update modal:', error);
    return Response.json(
      { error: 'Failed to update modal' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { user } = await validateRequest();
    if (!user || user.userRole < USER_ROLE.OPERATION1) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const modalId = parseInt(params.id);

    // 모달 정보 가져오기
    const modal = await prisma.noticeModal.findUnique({
      where: { id: modalId }
    });

    if (!modal) {
      return Response.json(
        { error: 'Modal not found' },
        { status: 404 }
      );
    }

    // 이미지 ID 추출
    const imageIds = Object.values(modal.i18nData || {})
      .map(data => data?.imageId)
      .filter(Boolean);

    // Cloudflare 이미지 삭제
    if (imageIds.length > 0) {
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const apiToken = process.env.CLOUDFLARE_API_TOKEN;

      await Promise.all(
        imageIds.map(async (imageId) => {
          try {
            const response = await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${imageId}`,
              {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${apiToken}`,
                },
              }
            );

            if (!response.ok) {
              console.error(`Failed to delete image ${imageId}:`, await response.text());
            }
          } catch (error) {
            console.error(`Error deleting image ${imageId}:`, error);
          }
        })
      );
    }

    // 모달 삭제
    await prisma.noticeModal.delete({
      where: { id: modalId }
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete modal:', error);
    return Response.json(
      { error: 'Failed to delete modal' },
      { status: 500 }
    );
  }
}
