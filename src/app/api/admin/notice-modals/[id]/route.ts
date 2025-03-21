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
    
    console.log('PUT request received for modal ID:', modalId);
    console.log('Request data:', JSON.stringify(data, null, 2));

    // 기존 모달 정보 가져오기
    const existingModal = await prisma.noticeModal.findUnique({
      where: { id: modalId }
    });

    if (!existingModal) {
      return Response.json(
        { error: 'Modal not found' },
        { status: 404 }
      );
    }

    // 기존 i18nData 파싱
    const existingI18nData = typeof existingModal.i18nData === 'string'
      ? JSON.parse(existingModal.i18nData)
      : existingModal.i18nData;

    console.log('Existing i18nData:', JSON.stringify(existingI18nData, null, 2));

    // 새 i18nData 파싱
    let newI18nData = data.i18nData;
    if (typeof newI18nData === 'string') {
      try {
        newI18nData = JSON.parse(newI18nData);
      } catch (error) {
        console.error('Failed to parse i18nData string:', error);
        // 파싱 실패 시 원본 데이터 사용
        newI18nData = data.i18nData;
      }
    }

    console.log('New i18nData:', JSON.stringify(newI18nData, null, 2));

    // 삭제된 이미지 ID 찾기
    const deletedImageIds: string[] = [];

    // defaultImageId 확인
    if (existingI18nData.defaultImageId && !newI18nData.defaultImageId) {
      deletedImageIds.push(existingI18nData.defaultImageId);
    }

    // 각 언어별 이미지 확인
    Object.entries(existingI18nData).forEach(([locale, localeData]) => {
      if (locale !== 'defaultImageId' && locale !== 'defaultButtonText' && typeof localeData === 'object') {
        const oldData = localeData as any;
        const newData = newI18nData[locale] as any;

        // 이전에 이미지가 있었는데 새 데이터에 없거나, 새 데이터에 해당 언어가 없는 경우
        if (oldData?.imageId && (!newData || !newData.imageId)) {
          deletedImageIds.push(oldData.imageId);
        }
      }
    });

    console.log('Deleted image IDs:', deletedImageIds);

    // 삭제된 이미지가 있으면 Cloudflare에서 삭제
    if (deletedImageIds.length > 0) {
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const apiToken = process.env.CLOUDFLARE_API_TOKEN;

      if (accountId && apiToken) {
        await Promise.all(
          deletedImageIds.map(async (imageId) => {
            try {
              console.log(`Deleting image ${imageId} from Cloudflare`);
              const response = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${imageId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              if (!response.ok) {
                console.error(`Failed to delete image ${imageId}:`, await response.text());
              } else {
                console.log(`Successfully deleted image ${imageId}`);
              }
            } catch (error) {
              console.error(`Error deleting image ${imageId}:`, error);
            }
          })
        );
      }
    }

    // 중요: i18nData를 문자열로 변환하지 않고 객체 그대로 저장
    // 이 부분이 핵심 수정 사항입니다
    const modal = await prisma.noticeModal.update({
      where: { id: modalId },
      data: {
        title: data.title,
        priority: data.priority,
        hideOption: data.hideOption,
        linkUrl: data.linkUrl,
        buttonUrl: data.buttonUrl,
        i18nData: data.i18nData, // 객체 그대로 저장
      }
    });

    console.log('Updated modal:', JSON.stringify(modal, null, 2));
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

    // i18nData 파싱
    const i18nData = typeof modal.i18nData === 'string'
      ? JSON.parse(modal.i18nData)
      : modal.i18nData;

    // 이미지 ID 추출
    const imageIds: string[] = [];
    
    // defaultImageId가 있으면 추가
    if (i18nData.defaultImageId) {
      imageIds.push(i18nData.defaultImageId as string);
    }
    
    // 각 언어별 이미지 ID 추가
    Object.entries(i18nData).forEach(([locale, data]) => {
      if (locale !== 'defaultImageId' && locale !== 'defaultButtonText' && data && typeof data === 'object' && 'imageId' in data) {
        const imageId = (data as { imageId: string }).imageId;
        if (imageId) {
          imageIds.push(imageId);
        }
      }
    });

    console.log(`Found ${imageIds.length} images to delete:`, imageIds);

    // Cloudflare 이미지 삭제
    if (imageIds.length > 0) {
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const apiToken = process.env.CLOUDFLARE_API_TOKEN;

      if (accountId && apiToken) {
        await Promise.all(
          imageIds.map(async (imageId) => {
            try {
              console.log(`Deleting image ${imageId} from Cloudflare`);
              const response = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${imageId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              if (!response.ok) {
                console.error(`Failed to delete image ${imageId}:`, await response.text());
              } else {
                console.log(`Successfully deleted image ${imageId}`);
              }
            } catch (error) {
              console.error(`Error deleting image ${imageId}:`, error);
            }
          })
        );
      }
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