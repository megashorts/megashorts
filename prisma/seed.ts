import { PrismaClient, CategoryType, PostStatus, Language } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// 샘플 유저 ID (실제 데이터베이스에 있는 유저 ID로 변경 필요)
const SAMPLE_USER_ID = 'f4bcbbpch5otueip';

// 넷플릭스 스타일의 샘플 썸네일 이미지 (2:3 비율)
const thumbnailImages = [
  'https://imagedelivery.net/wuhPilUNWOdMaNWjMYkZJg/25c705bf-eb43-4bf8-344e-32c8b068c300/thumbnail',
  'https://imagedelivery.net/wuhPilUNWOdMaNWjMYkZJg/fa470dfd-22c5-4f22-faa5-845472cdaf00/thumbnail',
  'https://imagedelivery.net/wuhPilUNWOdMaNWjMYkZJg/67911399-bfb8-4710-74ad-45f6c23eb500/thumbnail',
  'https://imagedelivery.net/wuhPilUNWOdMaNWjMYkZJg/66b198ce-3298-40ab-ab96-2f86732c3000/thumbnail',
  'https://imagedelivery.net/wuhPilUNWOdMaNWjMYkZJg/2b572dc5-0136-4b83-40ac-e6fb2c7dc400/thumbnail',
];

// 샘플 비디오 URL
const sampleVideos = [
  'https://videodelivery.net/4bc7a8c13dfb496eb9337d7ccbee812f/manifest/video.m3u8',
  'https://videodelivery.net/9b187a17b8af459c9f699fd277887aaa/manifest/video.m3u8',
  'https://videodelivery.net/3e31175a4b6970ea1dff84d6456b698e/manifest/video.m3u8',
];

const getRandomThumbnail = () => thumbnailImages[Math.floor(Math.random() * thumbnailImages.length)];
const getRandomVideo = () => sampleVideos[Math.floor(Math.random() * sampleVideos.length)];

const samplePosts = [
  {
    title: '로맨스 드라마: 첫사랑의 기억',
    titleI18n: { en: 'Romance Drama: Memory of First Love', zh: '爱情剧：初恋的记忆' },
    content: '아름다운 첫사랑 이야기를 담은 감동적인 드라마',
    contentI18n: { en: 'A touching drama about beautiful first love', zh: '讲述美丽初恋故事的感人电视剧' },
    categories: [CategoryType.ROMANCE, CategoryType.DRAMA],
    videoCount: 3
  },
  {
    title: '판타지 액션: 마법사의 시대',
    titleI18n: { en: 'Fantasy Action: Age of Wizards', zh: '奇幻动作：魔法师时代' },
    content: '마법과 모험이 가득한 판타지 세계',
    contentI18n: { en: 'A fantasy world full of magic and adventure', zh: '充满魔法和冒险的奇幻世界' },
    categories: [CategoryType.FANTASY, CategoryType.ACTION],
    videoCount: 2
  },
  {
    title: '청춘 로맨스: 스무살의 설렘',
    titleI18n: { en: 'Youth Romance: Twenty Years Old Flutter', zh: '青春爱情：二十岁的心动' },
    content: '달콤쌉싸름한 청춘들의 사랑 이야기',
    contentI18n: { en: 'A bittersweet love story of youth', zh: '青春期甜蜜苦涩的爱情故事' },
    categories: [CategoryType.ROMANCE, CategoryType.HIGHTEEN],
    videoCount: 4
  },
  {
    title: '시대극: 조선시대 이야기',
    titleI18n: { en: 'Period Drama: Joseon Dynasty Story', zh: '古装剧：朝鲜时代的故事' },
    content: '조선시대를 배경으로 한 역사 드라마',
    contentI18n: { en: 'A historical drama set in the Joseon Dynasty', zh: '以朝鲜时代为背景的历史剧' },
    categories: [CategoryType.PERIOD, CategoryType.DRAMA],
    videoCount: 3
  },
  {
    title: '스릴러: 미스터리한 실종사건',
    titleI18n: { en: 'Thriller: Mysterious Disappearance', zh: '惊悚：神秘失踪事件' },
    content: '한 소녀의 실종을 파헤치는 미스터리 스릴러',
    contentI18n: { en: 'A mystery thriller about a girl\'s disappearance', zh: '调查一个女孩失踪的神秘惊悚片' },
    categories: [CategoryType.THRILLER, CategoryType.DRAMA],
    videoCount: 3
  },
  {
    title: '로맨틱 코미디: 직장인의 사랑',
    titleI18n: { en: 'Romantic Comedy: Office Love', zh: '浪漫喜剧：职场恋爱' },
    content: '회사에서 피어나는 달콤한 사랑 이야기',
    contentI18n: { en: 'A sweet love story blooming in the office', zh: '在公司绽放的甜蜜爱情故事' },
    categories: [CategoryType.ROMANCE, CategoryType.COMIC],
    videoCount: 2
  },
  {
    title: '판타지 시대극: 조선의 마법사',
    titleI18n: { en: 'Fantasy Period Drama: Joseon Wizard', zh: '奇幻古装剧：朝鲜魔法师' },
    content: '조선시대를 배경으로 한 판타지 드라마',
    contentI18n: { en: 'A fantasy drama set in Joseon Dynasty', zh: '以朝鲜时代为背景的奇幻剧' },
    categories: [CategoryType.FANTASY, CategoryType.PERIOD],
    videoCount: 4
  },
  {
    title: '액션 스릴러: 도시의 밤',
    titleI18n: { en: 'Action Thriller: City Night', zh: '动作惊悚：城市之夜' },
    content: '도시의 어둠 속에서 펼쳐지는 액션 스릴러',
    contentI18n: { en: 'An action thriller unfolding in the city darkness', zh: '在城市黑暗中展开的动作惊悚片' },
    categories: [CategoryType.ACTION, CategoryType.THRILLER],
    videoCount: 3
  },
  {
    title: '청춘 코미디: 대학생활',
    titleI18n: { en: 'Youth Comedy: College Life', zh: '青春喜剧：大学生活' },
    content: '유쾌한 대학생들의 일상 이야기',
    contentI18n: { en: 'A fun daily life story of college students', zh: '愉快的大学生日常故事' },
    categories: [CategoryType.HIGHTEEN, CategoryType.COMIC],
    videoCount: 2
  },
  {
    title: '시대 로맨스: 궁중 로맨스',
    titleI18n: { en: 'Period Romance: Palace Romance', zh: '古装爱情：宫廷恋爱' },
    content: '궁중을 배경으로 한 로맨스 드라마',
    contentI18n: { en: 'A romance drama set in the royal palace', zh: '以宫廷为背景的爱情剧' },
    categories: [CategoryType.PERIOD, CategoryType.ROMANCE],
    videoCount: 3
  },
  {
    title: '판타지 스릴러: 마법의 저주',
    titleI18n: { en: 'Fantasy Thriller: Magical Curse', zh: '奇幻惊悚：魔法诅咒' },
    content: '저주에 걸린 마법사의 미스터리한 이야기',
    contentI18n: { en: 'A mysterious story of a cursed wizard', zh: '被诅咒的魔法师的神秘故事' },
    categories: [CategoryType.FANTASY, CategoryType.THRILLER],
    videoCount: 4
  },
  {
    title: '액션 코미디: 특수요원의 실수',
    titleI18n: { en: 'Action Comedy: Special Agent\'s Mistake', zh: '动作喜剧：特工的失误' },
    content: '실수투성이 특수요원의 코믹한 액션',
    contentI18n: { en: 'Comical action of a clumsy special agent', zh: '笨手笨脚的特工的搞笑动作' },
    categories: [CategoryType.ACTION, CategoryType.COMIC],
    videoCount: 3
  },
  {
    title: '청춘 스릴러: 캠퍼스의 비밀',
    titleI18n: { en: 'Youth Thriller: Campus Secret', zh: '青春惊悚：校园秘密' },
    content: '대학교에서 일어나는 미스터리한 사건',
    contentI18n: { en: 'Mysterious incidents happening at university', zh: '发生在大学的神秘事件' },
    categories: [CategoryType.HIGHTEEN, CategoryType.THRILLER],
    videoCount: 3
  },
  {
    title: '판타지 로맨스: 마법사의 사랑',
    titleI18n: { en: 'Fantasy Romance: Wizard\'s Love', zh: '奇幻爱情：魔法师的爱情' },
    content: '마법학교에서 피어나는 사랑이야기',
    contentI18n: { en: 'A love story blooming in magic school', zh: '在魔法学校绽放的爱情故事' },
    categories: [CategoryType.FANTASY, CategoryType.ROMANCE],
    videoCount: 4
  },
  {
    title: '시대 액션: 조선 검객',
    titleI18n: { en: 'Period Action: Joseon Swordsman', zh: '古装动作：朝鲜剑客' },
    content: '조선의 검객들이 펼치는 화려한 액션',
    contentI18n: { en: 'Spectacular action of Joseon swordsmen', zh: '朝鲜剑客展现的华丽动作' },
    categories: [CategoryType.PERIOD, CategoryType.ACTION],
    videoCount: 3
  },
  {
    title: '로맨스 스릴러: 위험한 사랑',
    titleI18n: { en: 'Romance Thriller: Dangerous Love', zh: '爱情惊悚：危险的爱' },
    content: '미스터리한 분위기의 로맨스 드라마',
    contentI18n: { en: 'A romance drama with mysterious atmosphere', zh: '充满神秘气氛的爱情剧' },
    categories: [CategoryType.ROMANCE, CategoryType.THRILLER],
    videoCount: 3
  },
  {
    title: '청춘 시대극: 젊은 검사',
    titleI18n: { en: 'Youth Period Drama: Young Inspector', zh: '青春古装：年轻巡察' },
    content: '조선시대 젊은 검사의 성장기',
    contentI18n: { en: 'Growth story of a young inspector in Joseon', zh: '朝鲜时代年轻巡察的成长记' },
    categories: [CategoryType.HIGHTEEN, CategoryType.PERIOD],
    videoCount: 3
  },
  {
    title: '코믹 스릴러: 웃음가득 추리극',
    titleI18n: { en: 'Comic Thriller: Funny Mystery', zh: '喜剧惊悚：搞笑推理剧' },
    content: '코미디와 스릴러가 만난 신개념 드라마',
    contentI18n: { en: 'New concept drama mixing comedy and thriller', zh: '喜剧与惊悚相遇的新概念剧' },
    categories: [CategoryType.COMIC, CategoryType.THRILLER],
    videoCount: 2
  },
  {
    title: '판타지 코미디: 마법학교 일상',
    titleI18n: { en: 'Fantasy Comedy: Magic School Daily', zh: '奇幻喜剧：魔法学校日常' },
    content: '마법학교에서 벌어지는 좌충우돌 이야기',
    contentI18n: { en: 'Hilarious stories happening in magic school', zh: '魔法学校发生的搞笑故事' },
    categories: [CategoryType.FANTASY, CategoryType.COMIC],
    videoCount: 3
  },
  {
    title: '액션 하이틴: 고등학생 형사',
    titleI18n: { en: 'Action Highteen: High School Detective', zh: '动作青春：高中生侦探' },
    content: '고등학생 비밀 형사의 활약상',
    contentI18n: { en: 'Adventures of a high school secret detective', zh: '高中生秘密侦探的活跃表现' },
    categories: [CategoryType.ACTION, CategoryType.HIGHTEEN],
    videoCount: 3
  },
  {
    title: '시대 스릴러: 궁중 미스터리',
    titleI18n: { en: 'Period Thriller: Palace Mystery', zh: '古装惊悚：宫廷谜案' },
    content: '조선 궁중에서 일어나는 미스터리',
    contentI18n: { en: 'Mysteries occurring in Joseon palace', zh: '朝鲜宫廷中发生的谜案' },
    categories: [CategoryType.PERIOD, CategoryType.THRILLER],
    videoCount: 4
  },
  {
    title: '로맨스 하이틴: 첫사랑의 설렘',
    titleI18n: { en: 'Romance Highteen: First Love Flutter', zh: '爱情青春：初恋心动' },
    content: '고등학교에서 시작되는 첫사랑',
    contentI18n: { en: 'First love starting in high school', zh: '高中开始的初恋' },
    categories: [CategoryType.ROMANCE, CategoryType.HIGHTEEN],
    videoCount: 2
  },
  {
    title: '판타지 하이틴: 마법소녀',
    titleI18n: { en: 'Fantasy Highteen: Magical Girl', zh: '奇幻青春：魔法少女' },
    content: '평범한 여고생의 마법소녀 변신기',
    contentI18n: { en: 'Transformation story of an ordinary high school girl', zh: '普通女高中生的魔法少女变身记' },
    categories: [CategoryType.FANTASY, CategoryType.HIGHTEEN],
    videoCount: 4
  },
  {
    title: '시대 코미디: 조선 명탐정',
    titleI18n: { en: 'Period Comedy: Joseon Detective', zh: '古装喜剧：朝鲜名侦探' },
    content: '조선시대 명탐정의 코믹한 수사극',
    contentI18n: { en: 'Comic investigation of a Joseon detective', zh: '朝鲜时代名侦探的搞笑破案剧' },
    categories: [CategoryType.PERIOD, CategoryType.COMIC],
    videoCount: 3
  },
  {
    title: '액션 로맨스: 비밀요원의 사랑',
    titleI18n: { en: 'Action Romance: Secret Agent\'s Love', zh: '动作爱情：特工的恋爱' },
    content: '첩보원으로 활동하는 연인들의 이야기',
    contentI18n: { en: 'Story of lovers working as secret agents', zh: '特工情侣的故事' },
    categories: [CategoryType.ACTION, CategoryType.ROMANCE],
    videoCount: 3
  },
  {
    title: '스릴러 하이틴: 학교의 괴담',
    titleI18n: { en: 'Thriller Highteen: School Ghost Story', zh: '惊悚青春：校园怪谈' },
    content: '고등학교에서 일어나는 미스터리한 괴담',
    contentI18n: { en: 'Mysterious ghost stories happening in high school', zh: '高中发生的神秘怪谈' },
    categories: [CategoryType.THRILLER, CategoryType.HIGHTEEN],
    videoCount: 3
  },
  {
    title: '로맨스 판타지: 시간여행자의 사랑',
    titleI18n: { en: 'Romance Fantasy: Time Traveler\'s Love', zh: '爱情奇幻：时间旅行者的爱' },
    content: '시간을 넘나드는 운명적인 사랑',
    contentI18n: { en: 'Destined love across time', zh: '跨越时间的命中注定之爱' },
    categories: [CategoryType.ROMANCE, CategoryType.FANTASY],
    videoCount: 4
  },
  {
    title: '코미디 하이틴: 학교생활 일기',
    titleI18n: { en: 'Comedy Highteen: School Life Diary', zh: '喜剧青春：校园生活日记' },
    content: '유쾌한 고등학교 생활의 기록',
    contentI18n: { en: 'Record of fun high school life', zh: '愉快的高中生活记录' },
    categories: [CategoryType.COMIC, CategoryType.HIGHTEEN],
    videoCount: 2
  },
  {
    title: '액션 판타지: 초능력 전사',
    titleI18n: { en: 'Action Fantasy: Supernatural Warrior', zh: '动作奇幻：超能力战士' },
    content: '초능력을 가진 전사들의 대결',
    contentI18n: { en: 'Battle of warriors with supernatural powers', zh: '超能力战士的对决' },
    categories: [CategoryType.ACTION, CategoryType.FANTASY],
    videoCount: 4
  },
  {
    title: '시대 하이틴: 수라도셨습니다',
    titleI18n: { en: 'Period Highteen: Young Scholar', zh: '古装青春：少年书生' },
    content: '조선시대 청년들의 성장이야기',
    contentI18n: { en: 'Growth story of Joseon youth', zh: '朝鲜时代青年的成长故事' },
    categories: [CategoryType.PERIOD, CategoryType.HIGHTEEN],
    videoCount: 3
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

async function createSamplePost(postData: typeof samplePosts[0], postNum: number) {
  // 비디오 데이터 생성
  const videos = Array.from({ length: postData.videoCount }, (_, i) => ({
    id: uuidv4(),
    url: getRandomVideo(),
    language: Language.KOREAN,
    sequence: i + 1,
    filename: `video-${postNum}-${i + 1}.mp4`,
    isPremium: Math.random() > 0.7, // 30% 확률로 프리미엄 비디오
  }));

  const post = await prisma.post.create({
    data: {
      id: uuidv4(),
      postNum: postNum,
      title: postData.title,
      titleI18n: postData.titleI18n,
      content: postData.content,
      contentI18n: postData.contentI18n,
      thumbnailUrl: getRandomThumbnail(),
      adultpost: Math.random() > 0.8, // 20% 확률로 성인용 컨텐츠
      status: PostStatus.PUBLISHED,
      featured: postNum <= 10, // 상위 10개는 featured로 설정
      priority: Math.floor(Math.random() * 10) + 1, // 1-10 사이의 우선순위
      userId: SAMPLE_USER_ID,
      categories: postData.categories,
      viewCount: Math.floor(Math.random() * 10000), // 0-9999 사이의 조회수
      publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // 최근 30일 내의 랜덤 날짜
      videos: {
        create: videos
      }
    },
  });

  console.log(`Created post: ${post.title}`);
  return post;
}

async function main() {
  console.log('Start seeding...');

  let currentPostNum = await getNextPostNum();

  // 샘플 포스트 생성
  for (const post of samplePosts) {
    await createSamplePost(post, currentPostNum);
    currentPostNum++;
  }

  console.log('Seeding finished');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
