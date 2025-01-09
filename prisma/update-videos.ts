import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const videoUrls = [
  'https://customer-2cdfxbmja64x0pqo.cloudflarestream.com/0718bd1e3537406586da9657e9080c47/manifest/video.m3u8',
  'https://customer-2cdfxbmja64x0pqo.cloudflarestream.com/b3689006f5a54b72b3a690d14f94f2e7/manifest/video.m3u8',
  'https://customer-2cdfxbmja64x0pqo.cloudflarestream.com/659c9a727e6f4baa9b6ddc536ccce2c5/manifest/video.m3u8'
];

// 비디오 ID 추출 함수
function getVideoId(url: string) {
  return url.split('/')[4];
}

async function main() {
  // 기존 비디오만 삭제
  await prisma.videoView.deleteMany();
  await prisma.video.deleteMany();

  // 모든 포스트 가져오기
  const posts = await prisma.post.findMany();

  // 각 포스트에 비디오 추가
  for (const post of posts) {
    const videoUrl = videoUrls[Math.floor(Math.random() * videoUrls.length)];
    const videoId = getVideoId(videoUrl);
    
    await prisma.video.create({
      data: {
        url: videoUrl,
        filename: `video-${videoId}.mp4`,
        sequence: 1,
        isPremium: false,
        postId: post.id,
        language: 'KOREAN',
      },
    });

    console.log(`Updated videos for post: ${post.title}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
