import { PrismaClient, CategoryType } from '@prisma/client';

const prisma = new PrismaClient();

interface CloudflareVideo {
  uid: string;
  status: {
    state: string;
  };
  meta: {
    name: string;
  };
}

async function getCloudflareVideos(): Promise<CloudflareVideo[]> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`,
    {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Cloudflare videos');
  }

  const data = await response.json();
  return data.result;  // 사용 가능한 비디오 목록
}

async function migrateVideoIds() {
  try {
    console.log('샘플 포스트 비디오 마이그레이션 시작...');

    // 1. MSPOST나 NOTIFICATION 카테고리의 포스트에서 비디오 삭제
    const videosToDelete = await prisma.video.findMany({
      where: {
        id: {
          contains: '-'  // UUID 형식은 하이픈을 포함
        },
        post: {
          categories: {
            hasSome: [CategoryType.MSPOST, CategoryType.NOTIFICATION]
          }
        }
      }
    });

    console.log(`MSPOST/NOTIFICATION 카테고리에서 ${videosToDelete.length}개의 비디오 삭제 예정`);

    for (const video of videosToDelete) {
      await prisma.video.delete({
        where: { id: video.id }
      });
      console.log(`비디오 ${video.id} 삭제 완료`);
    }

    // 2. 클라우드플레어의 사용 가능한 비디오 목록 가져오기
    const cloudflareVideos = await getCloudflareVideos();
    console.log(`클라우드플레어에서 ${cloudflareVideos.length}개의 비디오 발견`);

    // 3. 남은 UUID 형식의 비디오 찾기 (샘플 포스트의 비디오)
    const sampleVideos = await prisma.video.findMany({
      where: {
        id: {
          contains: '-'  // UUID 형식은 하이픈을 포함
        }
      }
    });
    console.log(`${sampleVideos.length}개의 샘플 비디오 발견`);

    // 4. 현재 DB에서 사용 중인 비디오 ID 목록
    const usedVideoIds = new Set(
      (await prisma.video.findMany({
        where: {
          NOT: {
            id: {
              contains: '-'  // UUID가 아닌 비디오
            }
          }
        },
        select: { id: true }
      })).map(v => v.id)
    );

    // 5. 사용 가능한 클라우드플레어 비디오 필터링
    const availableVideos = cloudflareVideos.filter(
      (video: CloudflareVideo) => !usedVideoIds.has(video.uid)
    );
    console.log(`${availableVideos.length}개의 사용 가능한 비디오 발견`);

    // 6. 샘플 비디오 업데이트
    for (let i = 0; i < sampleVideos.length; i++) {
      if (i >= availableVideos.length) {
        console.warn(`경고: 비디오 ${sampleVideos[i].id}를 업데이트할 수 있는 실제 비디오가 부족합니다.`);
        continue;
      }

      const sampleVideo = sampleVideos[i];
      const cloudflareVideo = availableVideos[i];
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const newUrl = `https://customer-${accountId}.cloudflarestream.com/${cloudflareVideo.uid}/manifest/video.m3u8`;

      try {
        await prisma.video.update({
          where: { id: sampleVideo.id },
          data: {
            id: cloudflareVideo.uid,  // 클라우드플레어 비디오 ID로 업데이트
            url: newUrl
          }
        });
        console.log(`비디오 ${sampleVideo.id}: ID를 ${cloudflareVideo.uid}로, URL을 ${newUrl}로 업데이트 완료`);
      } catch (error) {
        console.error(`비디오 ${sampleVideo.id} 업데이트 실패:`, error);
      }
    }

    console.log('마이그레이션 완료!');
  } catch (error) {
    console.error('마이그레이션 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 환경 변수 체크
if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_TOKEN) {
  console.error('필요한 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

migrateVideoIds();
