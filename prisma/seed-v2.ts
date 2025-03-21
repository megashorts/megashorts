import { PrismaClient, CategoryType, PostStatus, Language } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const SAMPLE_USER_ID = 'lzhb7xbyggmjrevn';

// Cloudflare 관련 인터페이스
interface CloudflareVideo {
  uid: string;
  status: {
    state: string;
  };
  meta: {
    name: string;
  };
}

// Cloudflare API를 통해 사용 가능한 비디오 목록 가져오기
async function getCloudflareVideos(): Promise<CloudflareVideo[]> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error('Cloudflare 환경 변수가 설정되지 않았습니다.');
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`,
    {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Cloudflare 비디오 목록을 가져오는데 실패했습니다.');
  }

  const data = await response.json();
  return data.result;
}

// 썸네일 ID 목록 (Cloudflare Images ID)
const thumbnailIds = [
  '25c705bf-eb43-4bf8-344e-32c8b068c300',
  'fa470dfd-22c5-4f22-faa5-845472cdaf00',
  '67911399-bfb8-4710-74ad-45f6c23eb500',
  '66b198ce-3298-40ab-ab96-2f86732c3000',
  '2b572dc5-0136-4b83-40ac-e6fb2c7dc400',
];

const getRandomThumbnailId = () => thumbnailIds[Math.floor(Math.random() * thumbnailIds.length)];

interface PostData {
  title: string;
  titleI18n: { en: string; zh: string };
  content: string;
  contentI18n: { en: string; zh: string };
  categories: CategoryType[];
  videoCount: number;
}

// PERIOD를 PERIODPLAY로 변경하고 새로운 카테고리 추가
const samplePosts: PostData[] = [
  {
    title: '첫사랑',
    titleI18n: { en: 'First Love', zh: '初恋' },
    content: '아름다운 첫사랑 이야기를 담은 감동적인 드라마',
    contentI18n: { en: 'A touching drama about beautiful first love', zh: '讲述美丽初恋故事的感人电视剧' },
    categories: [CategoryType.ROMANCE, CategoryType.DRAMA],
    videoCount: 3
  },
  {
    title: '마법사',
    titleI18n: { en: 'Wizard', zh: '魔法师' },
    content: '마법과 모험이 가득한 판타지 세계',
    contentI18n: { en: 'A fantasy world full of magic and adventure', zh: '充满魔法和冒险的奇幻世界' },
    categories: [CategoryType.FANTASY, CategoryType.ACTION],
    videoCount: 2
  },
  {
    title: '스무살',
    titleI18n: { en: 'Twenty', zh: '二十岁' },
    content: '달콤쌉싸름한 청춘들의 사랑 이야기',
    contentI18n: { en: 'A bittersweet love story of youth', zh: '青春期甜蜜苦涩的爱情故事' },
    categories: [CategoryType.ROMANCE, CategoryType.HIGHTEEN],
    videoCount: 4
  },
  {
    title: '조선',
    titleI18n: { en: 'Joseon', zh: '朝鲜' },
    content: '조선시대를 배경으로 한 역사 드라마',
    contentI18n: { en: 'A historical drama set in the Joseon Dynasty', zh: '以朝鲜时代为背景的历史剧' },
    categories: [CategoryType.PERIODPLAY, CategoryType.DRAMA],
    videoCount: 3
  },
  {
    title: '실종',
    titleI18n: { en: 'Missing', zh: '失踪' },
    content: '한 소녀의 실종을 파헤치는 미스터리 스릴러',
    contentI18n: { en: 'A mystery thriller about a girl\'s disappearance', zh: '调查一个女孩失踪的神秘惊悚片' },
    categories: [CategoryType.THRILLER, CategoryType.DRAMA],
    videoCount: 3
  },
  {
    title: '사내',
    titleI18n: { en: 'Office', zh: '职场' },
    content: '회사에서 피어나는 달콤한 사랑 이야기',
    contentI18n: { en: 'A sweet love story blooming in the office', zh: '在公司绽放的甜蜜爱情故事' },
    categories: [CategoryType.ROMANCE, CategoryType.COMEDY],
    videoCount: 2
  },
  {
    title: '도사',
    titleI18n: { en: 'Wizard', zh: '道士' },
    content: '조선시대를 배경으로 한 판타지 드라마',
    contentI18n: { en: 'A fantasy drama set in Joseon Dynasty', zh: '以朝鲜时代为背景的奇幻剧' },
    categories: [CategoryType.FANTASY, CategoryType.PERIODPLAY],
    videoCount: 4
  },
  {
    title: '밤',
    titleI18n: { en: 'Night', zh: '夜晚' },
    content: '도시의 어둠 속에서 펼쳐지는 액션 스릴러',
    contentI18n: { en: 'An action thriller unfolding in the city darkness', zh: '在城市黑暗中展开的动作惊悚片' },
    categories: [CategoryType.ACTION, CategoryType.THRILLER],
    videoCount: 3
  },
  {
    title: '대학',
    titleI18n: { en: 'College', zh: '大学' },
    content: '유쾌한 대학생들의 일상 이야기',
    contentI18n: { en: 'A fun daily life story of college students', zh: '愉快的大学生日常故事' },
    categories: [CategoryType.HIGHTEEN, CategoryType.COMEDY],
    videoCount: 2
  },
  {
    title: '궁',
    titleI18n: { en: 'Palace', zh: '宫廷' },
    content: '궁중을 배경으로 한 로맨스 드라마',
    contentI18n: { en: 'A romance drama set in the royal palace', zh: '以宫廷为背景的爱情剧' },
    categories: [CategoryType.PERIODPLAY, CategoryType.ROMANCE],
    videoCount: 3
  },
  {
    title: '저주',
    titleI18n: { en: 'Curse', zh: '诅咒' },
    content: '저주에 걸린 마법사의 미스터리한 이야기',
    contentI18n: { en: 'A mysterious story of a cursed wizard', zh: '被诅咒的魔法师的神秘故事' },
    categories: [CategoryType.FANTASY, CategoryType.THRILLER],
    videoCount: 4
  },
  {
    title: '실수',
    titleI18n: { en: 'Mistake', zh: '失误' },
    content: '실수투성이 특수요원의 코믹한 액션',
    contentI18n: { en: 'Comical action of a clumsy special agent', zh: '笨手笨脚的特工的搞笑动作' },
    categories: [CategoryType.ACTION, CategoryType.COMEDY],
    videoCount: 3
  },
  {
    title: '비밀',
    titleI18n: { en: 'Secret', zh: '秘密' },
    content: '대학교에서 일어나는 미스터리한 사건',
    contentI18n: { en: 'Mysterious incidents happening at university', zh: '发生在大学的神秘事件' },
    categories: [CategoryType.HIGHTEEN, CategoryType.THRILLER],
    videoCount: 3
  },
  {
    title: '마법',
    titleI18n: { en: 'Magic', zh: '魔法' },
    content: '마법학교에서 피어나는 사랑이야기',
    contentI18n: { en: 'A love story blooming in magic school', zh: '在魔法学校绽放的爱情故事' },
    categories: [CategoryType.FANTASY, CategoryType.ROMANCE],
    videoCount: 4
  },
  {
    title: '검객',
    titleI18n: { en: 'Sword', zh: '剑客' },
    content: '조선의 검객들이 펼치는 화려한 액션',
    contentI18n: { en: 'Spectacular action of Joseon swordsmen', zh: '朝鲜剑客展现的华丽动作' },
    categories: [CategoryType.PERIODPLAY, CategoryType.ACTION],
    videoCount: 3
  },
  {
    title: '위험',
    titleI18n: { en: 'Danger', zh: '危险' },
    content: '미스터리한 분위기의 로맨스 드라마',
    contentI18n: { en: 'A romance drama with mysterious atmosphere', zh: '充满神秘气氛的爱情剧' },
    categories: [CategoryType.ROMANCE, CategoryType.THRILLER],
    videoCount: 3
  },
  {
    title: '검사',
    titleI18n: { en: 'Judge', zh: '检察' },
    content: '조선시대 젊은 검사의 성장기',
    contentI18n: { en: 'Growth story of a young inspector in Joseon', zh: '朝鲜时代年轻巡察的成长记' },
    categories: [CategoryType.HIGHTEEN, CategoryType.PERIODPLAY],
    videoCount: 3
  },
  {
    title: '추리',
    titleI18n: { en: 'Mystery', zh: '推理' },
    content: '코미디와 스릴러가 만난 신개념 드라마',
    contentI18n: { en: 'New concept drama mixing comedy and thriller', zh: '喜剧与惊悚相遇的新概念剧' },
    categories: [CategoryType.COMEDY, CategoryType.THRILLER],
    videoCount: 2
  },
  {
    title: '학교',
    titleI18n: { en: 'School', zh: '学校' },
    content: '마법학교에서 벌어지는 좌충우돌 이야기',
    contentI18n: { en: 'Hilarious stories happening in magic school', zh: '魔法学校发生的搞笑故事' },
    categories: [CategoryType.FANTASY, CategoryType.COMEDY],
    videoCount: 3
  },
  {
    title: '형사',
    titleI18n: { en: 'Detective', zh: '侦探' },
    content: '고등학생 비밀 형사의 활약상',
    contentI18n: { en: 'Adventures of a high school secret detective', zh: '高中生秘密侦探的活跃表现' },
    categories: [CategoryType.ACTION, CategoryType.HIGHTEEN],
    videoCount: 3
  },
  {
    title: '미궁',
    titleI18n: { en: 'Maze', zh: '迷宫' },
    content: '조선 궁중에서 일어나는 미스터리',
    contentI18n: { en: 'Mysteries occurring in Joseon palace', zh: '朝鲜宫廷中发生的谜案' },
    categories: [CategoryType.PERIODPLAY, CategoryType.THRILLER],
    videoCount: 4
  },
  {
    title: '설렘',
    titleI18n: { en: 'Flutter', zh: '心动' },
    content: '고등학교에서 시작되는 첫사랑',
    contentI18n: { en: 'First love starting in high school', zh: '高中开始的初恋' },
    categories: [CategoryType.ROMANCE, CategoryType.HIGHTEEN],
    videoCount: 2
  },
  {
    title: '소녀',
    titleI18n: { en: 'Girl', zh: '少女' },
    content: '평범한 여고생의 마법소녀 변신기',
    contentI18n: { en: 'Transformation story of an ordinary high school girl', zh: '普通女高中生的魔法少女变身记' },
    categories: [CategoryType.FANTASY, CategoryType.HIGHTEEN],
    videoCount: 4
  },
  {
    title: '명탐',
    titleI18n: { en: 'Sleuth', zh: '名探' },
    content: '조선시대 명탐정의 코믹한 수사극',
    contentI18n: { en: 'Comic investigation of a Joseon detective', zh: '朝鲜时代名侦探的搞笑破案剧' },
    categories: [CategoryType.PERIODPLAY, CategoryType.COMEDY],
    videoCount: 3
  },
  {
    title: '요원',
    titleI18n: { en: 'Agent', zh: '特工' },
    content: '첩보원으로 활동하는 연인들의 이야기',
    contentI18n: { en: 'Story of lovers working as secret agents', zh: '特工情侣的故事' },
    categories: [CategoryType.ACTION, CategoryType.ROMANCE],
    videoCount: 3
  },
  {
    title: '괴담',
    titleI18n: { en: 'Ghost', zh: '怪谈' },
    content: '고등학교에서 일어나는 미스터리한 괴담',
    contentI18n: { en: 'Mysterious ghost stories happening in high school', zh: '高中发生的神秘怪谈' },
    categories: [CategoryType.THRILLER, CategoryType.HIGHTEEN],
    videoCount: 3
  },
  {
    title: '시간',
    titleI18n: { en: 'Time', zh: '时间' },
    content: '시간을 넘나드는 운명적인 사랑',
    contentI18n: { en: 'Destined love across time', zh: '跨越时间的命中注定之爱' },
    categories: [CategoryType.ROMANCE, CategoryType.FANTASY],
    videoCount: 4
  },
  {
    title: '일기',
    titleI18n: { en: 'Diary', zh: '日记' },
    content: '유쾌한 고등학교 생활의 기록',
    contentI18n: { en: 'Record of fun high school life', zh: '愉快的高中生活记录' },
    categories: [CategoryType.COMEDY, CategoryType.HIGHTEEN],
    videoCount: 2
  },
  {
    title: '전사',
    titleI18n: { en: 'Warrior', zh: '战士' },
    content: '초능력을 가진 전사들의 대결',
    contentI18n: { en: 'Battle of warriors with supernatural powers', zh: '超能力战士的对决' },
    categories: [CategoryType.ACTION, CategoryType.FANTASY],
    videoCount: 4
  },
  {
    title: '수라',
    titleI18n: { en: 'Scholar', zh: '书生' },
    content: '조선시대 청년들의 성장이야기',
    contentI18n: { en: 'Growth story of Joseon youth', zh: '朝鲜时代青年的成长故事' },
    categories: [CategoryType.PERIODPLAY, CategoryType.HIGHTEEN],
    videoCount: 3
  }
];

const msPosts: PostData[] = [
  {
    title: '공지',
    titleI18n: { en: 'Notice', zh: '公告' },
    content: 'MS메이킹의 주요 공지사항입니다.',
    contentI18n: { en: 'Important notice from MS Making', zh: 'MS Making的重要公告' },
    categories: [CategoryType.MSPOST],
    videoCount: 1
  },
  {
    title: '업데이트',
    titleI18n: { en: 'Update', zh: '更新' },
    content: '시스템 업데이트 안내입니다.',
    contentI18n: { en: 'System update notice', zh: '系统更新通知' },
    categories: [CategoryType.MSPOST],
    videoCount: 1
  },
  {
    title: '안내',
    titleI18n: { en: 'Guide', zh: '指南' },
    content: '서비스 이용 안내입니다.',
    contentI18n: { en: 'Service usage guide', zh: '服务使用指南' },
    categories: [CategoryType.MSPOST],
    videoCount: 1
  }
];

const notificationPosts: PostData[] = [
  {
    title: '이벤트',
    titleI18n: { en: 'Event', zh: '活动' },
    content: '신규 이벤트 안내입니다.',
    contentI18n: { en: 'New event notice', zh: '新活动通知' },
    categories: [CategoryType.NOTIFICATION],
    videoCount: 1
  },
  {
    title: '소식',
    titleI18n: { en: 'News', zh: '新闻' },
    content: 'MS메이킹의 새로운 소식입니다.',
    contentI18n: { en: 'News from MS Making', zh: 'MS Making的新闻' },
    categories: [CategoryType.NOTIFICATION],
    videoCount: 1
  },
  {
    title: '공개',
    titleI18n: { en: 'Release', zh: '发布' },
    content: '새로운 컨텐츠 공개 안내입니다.',
    contentI18n: { en: 'New content release notice', zh: '新内容发布通知' },
    categories: [CategoryType.NOTIFICATION],
    videoCount: 1
  }
];

async function getNextPostNum() {
  const lastPost = await prisma.post.findFirst({
    orderBy: {
      postNum: 'desc'
    }
  });
  return (lastPost?.postNum || 0) + 1;
}

async function createSamplePost(
  postData: PostData,
  postNum: number,
  availableVideos: CloudflareVideo[]
) {
  if (postData.videoCount > availableVideos.length) {
    console.warn(`경고: ${postData.title}에 필요한 비디오 수가 부족합니다.`);
    return null;
  }

  // 이 포스트에 사용할 비디오들
  const videosForPost = availableVideos.splice(0, postData.videoCount);

  const videos = videosForPost.map((video, index) => ({
    id: video.uid,
    subtitle: [Language.KOREAN],
    sequence: index + 1,
    filename: `video-${postNum}-${index + 1}.mp4`,
    isPremium: index > 1, // 첫 2개 동영상만 무료
  }));

  const post = await prisma.post.create({
    data: {
      id: uuidv4(),
      postNum: postNum,
      title: postData.title,
      titleI18n: postData.titleI18n,
      content: postData.content,
      contentI18n: postData.contentI18n,
      thumbnailId: getRandomThumbnailId(),
      status: PostStatus.PUBLISHED,
      featured: postNum <= 5,
      priority: Math.floor(Math.random() * 10) + 1,
      userId: SAMPLE_USER_ID,
      categories: postData.categories,
      ageLimit: 15,
      viewCount: Math.floor(Math.random() * 10000),
      publishedAt: new Date(),
      videos: {
        create: videos
      }
    },
  });

  console.log(`포스트 생성 완료: ${post.title} (비디오 ${videos.length}개)`);
  return post;
}

async function createMultiVideoPost(
  postNum: number,
  availableVideos: CloudflareVideo[]
) {
  const videoCount = 70;
  
  if (videoCount > availableVideos.length) {
    console.warn(`경고: 다수 비디오 포스트에 필요한 비디오 수가 부족합니다.`);
    return null;
  }

  // 이 포스트에 사용할 비디오들
  const videosForPost = availableVideos.splice(0, videoCount);

  const videos = videosForPost.map((video, index) => ({
    id: video.uid,
    subtitle: [Language.KOREAN],
    sequence: index + 1,
    filename: `video-${postNum}-${index + 1}.mp4`,
    isPremium: index > 9, // 첫 10개 동영상만 무료
  }));

  const post = await prisma.post.create({
    data: {
      id: uuidv4(),
      postNum: postNum,
      title: '다수샘플',
      titleI18n: { en: 'Multiple Samples', zh: '多个样本' },
      content: '70개의 동영상이 포함된 샘플 포스트입니다.',
      contentI18n: { 
        en: 'Sample post containing 70 videos',
        zh: '包含70个视频的样本帖子'
      },
      thumbnailId: getRandomThumbnailId(),
      status: PostStatus.PUBLISHED,
      featured: false,
      priority: 5,
      userId: SAMPLE_USER_ID,
      categories: [CategoryType.DRAMA],
      ageLimit: 15,
      viewCount: Math.floor(Math.random() * 10000),
      publishedAt: new Date(),
      videos: {
        create: videos
      }
    },
  });

  console.log(`다수 비디오 포스트 생성 완료: ${post.title} (비디오 ${videos.length}개)`);
  return post;
}

async function main() {
  console.log('시드 데이터 생성 시작...');

  // 1. Cloudflare 비디오 목록 가져오기
  console.log('Cloudflare 비디오 목록 가져오는 중...');
  const cloudflareVideos = await getCloudflareVideos();
  console.log(`사용 가능한 Cloudflare 비디오: ${cloudflareVideos.length}개`);

  // 필요한 총 비디오 수 계산 (일반 포스트 + 70개 비디오 포스트)
  const regularVideosNeeded = [
    ...samplePosts,
    ...msPosts,
    ...notificationPosts
  ].reduce((sum, post) => sum + post.videoCount, 0);
  const totalVideosNeeded = regularVideosNeeded + 70; // 70개 비디오 포스트 추가

  if (cloudflareVideos.length < totalVideosNeeded) {
    throw new Error(`
      사용 가능한 비디오가 부족합니다.
      필요: ${totalVideosNeeded}개 (일반: ${regularVideosNeeded}개, 특별: 70개)
      사용 가능: ${cloudflareVideos.length}개
    `);
  }

  // 2. 포스트 생성
  let currentPostNum = await getNextPostNum();
  const availableVideos = [...cloudflareVideos]; // 배열 복사

  // 일반 샘플 포스트 생성
  for (const post of samplePosts) {
    await createSamplePost(post, currentPostNum++, availableVideos);
  }

  // MSPOST 카테고리 포스트 생성
  for (const post of msPosts) {
    await createSamplePost(post, currentPostNum++, availableVideos);
  }

  // NOTIFICATION 카테고리 포스트 생성
  for (const post of notificationPosts) {
    await createSamplePost(post, currentPostNum++, availableVideos);
  }

  // 70개 비디오가 포함된 특별 포스트 생성
  await createMultiVideoPost(currentPostNum, availableVideos);

  console.log('시드 데이터 생성 완료');
}

// 환경 변수 체크
if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_TOKEN) {
  console.error('필요한 Cloudflare 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
