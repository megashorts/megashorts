# 포스트 API 상세 구현

구현 파일:
- src/app/api/posts/[postId]/route.ts
- src/app/api/posts/by-category/route.ts
- src/app/api/posts/search/route.ts
- src/app/api/posts/recommended/route.ts
- src/app/api/posts/for-you/route.ts
- src/components/posts/actions.ts
- src/components/posts/editor/mutations.ts

## 1. 포스트 수정 API (/api/posts/[postId])

### 1.1 개요
```typescript
목적:
- 포스트 정보 업데이트
- 연관 비디오 관리
- 트랜잭션 처리

특징:
- 트랜잭션 보장
- 비디오 재생성
- 권한 검증
```

### 1.2 요청 구조
```typescript
PUT /api/posts/[postId]
{
  title: string;
  titleOriginal: string;
  content: string;
  thumbnailId: string;
  status: 'DRAFT' | 'PUBLISHED';
  categories: string[];
  ageLimit: number;
  featured: boolean;
  priority: number;
  postLanguage: string;
  videos?: {
    url: string;
    filename: string;
    sequence: number;
    isPremium: boolean;
    subtitle?: string[];
  }[];
}

응답:
{
  id: string;
  title: string;
  // ... 업데이트된 포스트 정보
  videos: Video[];
}
```

### 1.3 데이터베이스 처리
```typescript
const updatedPost = await prisma.$transaction(async (tx) => {
  // 1. 기존 비디오 삭제
  await tx.video.deleteMany({
    where: { postId: postId }
  });

  // 2. 포스트 업데이트
  const post = await tx.post.update({
    where: { id: postId },
    data: {
      title: validatedData.title,
      titleOriginal: validatedData.titleOriginal,
      content: validatedData.content,
      thumbnailId: validatedData.thumbnailId,
      status: validatedData.status,
      categories: validatedData.categories,
      ageLimit: validatedData.ageLimit,
      featured: validatedData.featured,
      priority: validatedData.priority,
      postLanguage: validatedData.postLanguage,
      videoCount: validatedData.videos?.length || 0,
      updatedAt: new Date(),
      publishedAt: validatedData.status === 'PUBLISHED' ? new Date() : null,
    },
    include: {
      videos: true
    }
  });

  // 3. 새 비디오 생성
  if (validatedData.videos?.length > 0) {
    await Promise.all(
      validatedData.videos.map((video) =>
        tx.video.create({
          data: {
            postId: post.id,
            url: video.url,
            filename: video.filename,
            sequence: video.sequence,
            isPremium: video.isPremium,
            subtitle: video.subtitle || []
          },
        })
      )
    );
  }

  return post;
});
```

### 1.4 권한 검증
```typescript
1. 사용자 인증
   const { user } = await validateRequest();
   if (!user) {
     return new Response("Unauthorized", { status: 401 });
   }

2. 포스트 존재 확인
   const post = await prisma.post.findUnique({
     where: { id: postId },
     include: { videos: true }
   });
   if (!post) {
     return new Response("Post not found", { status: 404 });
   }

3. 소유권 확인
   if (post.userId !== user.id) {
     return new Response("Forbidden", { status: 403 });
   }
```

### 1.5 데이터 검증
```typescript
const postSchema = z.object({
  title: z.string().min(1),
  titleOriginal: z.string().optional(),
  content: z.string(),
  thumbnailId: z.string(),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  categories: z.array(z.string()),
  ageLimit: z.number(),
  featured: z.boolean(),
  priority: z.number(),
  postLanguage: z.string(),
  videos: z.array(z.object({
    url: z.string(),
    filename: z.string(),
    sequence: z.number(),
    isPremium: z.boolean(),
    subtitle: z.array(z.string()).optional()
  })).optional()
});

const validatedData = postSchema.parse(data);
```

### 1.6 에러 처리
```typescript
try {
  // 데이터 검증
  const validatedData = postSchema.parse(data);
} catch (error) {
  // Zod 검증 에러
  return new Response(
    error instanceof Error ? error.message : "Invalid data",
    { status: 400 }
  );
}

try {
  // 트랜잭션 처리
  const updatedPost = await prisma.$transaction(async (tx) => {
    // ...
  });
} catch (error) {
  // DB 에러
  console.error("Error updating post:", error);
  return new Response(
    error instanceof Error ? error.message : "Failed to update post",
    { status: 500 }
  );
}
```

### 1.7 호출 예시
```typescript
// src/components/posts/editor/mutations.ts
async function updatePost(postId: string, data: PostUpdateData) {
  const response = await fetch(`/api/posts/${postId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}
```

### 1.8 성능 고려사항
```typescript
1. 트랜잭션 관리
   - 원자성 보장
   - 롤백 처리
   - 데드락 방지

2. 비디오 처리
   - 병렬 생성
   - Promise.all 사용
   - 순서 보장

3. 검증 최적화
   - 스키마 재사용
   - 조기 검증
   - 타입 안정성
```

## 2. 포스트 북마크 API (/api/posts/[postId]/bookmark)

### 2.1 개요
```typescript
목적:
- 포스트 북마크 관리
- 북마크 상태 조회
- 알림 처리

지원 메서드:
- GET: 북마크 상태 조회
- POST: 북마크 추가
- DELETE: 북마크 제거
```

### 2.2 상태 조회 (GET)
```typescript
요청:
GET /api/posts/[postId]/bookmark

응답:
interface BookmarkInfo {
  isBookmarkedByUser: boolean;
}

처리 과정:
1. 사용자 인증
2. 북마크 조회
3. 상태 반환
```

### 2.3 북마크 추가 (POST)
```typescript
요청:
POST /api/posts/[postId]/bookmark

처리 과정:
1. 사용자 인증
2. 포스트 존재 확인
3. 북마크 생성/업데이트
4. 알림 생성 (자신의 포스트가 아닌 경우)

데이터베이스:
await prisma.bookmark.upsert({
  where: {
    userId_postId: {
      userId: loggedInUser.id,
      postId,
    }
  },
  create: {
    userId: loggedInUser.id,
    postId,
  },
  update: {},
});

// 알림 생성
if (loggedInUser.id !== post.userId) {
  await prisma.notification.create({
    data: {
      issuerId: loggedInUser.id,
      recipientId: post.userId,
      postId,
      type: "BOOKMARK",
    },
  });
}
```

### 2.4 북마크 제거 (DELETE)
```typescript
요청:
DELETE /api/posts/[postId]/bookmark

처리 과정:
1. 사용자 인증
2. 포스트 존재 확인
3. 북마크 삭제
4. 관련 알림 삭제

데이터베이스:
await prisma.bookmark.deleteMany({
  where: {
    userId: loggedInUser.id,
    postId,
  }
});

await prisma.notification.deleteMany({
  where: {
    issuerId: loggedInUser.id,
    recipientId: post.userId,
    postId,
    type: "BOOKMARK",
  }
});
```

### 2.5 에러 처리
```typescript
1. 인증 에러
   if (!loggedInUser) {
     return NextResponse.json(
       { error: 'Unauthorized' }, 
       { status: 401 }
     );
   }

2. 리소스 없음
   if (!post) {
     return NextResponse.json(
       { error: "Post not found" }, 
       { status: 404 }
     );
   }

3. 서버 에러
   catch (error) {
     console.error(error);
     return NextResponse.json(
       { error: 'Internal server error' }, 
       { status: 500 }
     );
   }
```

### 2.6 호출 예시
```typescript
// src/components/posts/BookmarkButton.tsx
async function toggleBookmark(postId: string) {
  const isBookmarked = await getBookmarkState(postId);
  
  const response = await fetch(
    `/api/posts/${postId}/bookmark`,
    {
      method: isBookmarked ? 'DELETE' : 'POST'
    }
  );

  if (!response.ok) {
    throw new Error('Failed to toggle bookmark');
  }
}

async function getBookmarkState(postId: string) {
  const response = await fetch(
    `/api/posts/${postId}/bookmark`
  );

  if (!response.ok) {
    throw new Error('Failed to get bookmark state');
  }

  const data = await response.json();
  return data.isBookmarkedByUser;
}
```

### 2.7 성능 고려사항
```typescript
1. 데이터베이스
   - 복합 인덱스 활용
   - 불필요한 조회 최소화
   - 벌크 삭제 활용

2. 알림 처리
   - 비동기 처리 가능성
   - 실패 시 재시도
   - 중복 방지

3. 상태 관리
   - 클라이언트 캐싱
   - 낙관적 업데이트
   - 실시간 동기화
```

## 3. 포스트 좋아요 API (/api/posts/[postId]/likes)

### 3.1 개요
```typescript
목적:
- 포스트 좋아요 관리
- 좋아요 상태/개수 조회
- 알림 처리

지원 메서드:
- GET: 좋아요 상태 조회
- POST: 좋아요 추가
- DELETE: 좋아요 제거
```

### 3.2 상태 조회 (GET)
```typescript
요청:
GET /api/posts/[postId]/likes

응답:
{
  likes: number;          // 전체 좋아요 수
  isLikedByUser: boolean; // 현재 사용자의 좋아요 여부
}

데이터베이스:
const post = await prisma.post.findUnique({
  where: { id: postId },
  select: {
    likes: {
      where: {
        userId: loggedInUser.id,
      },
      select: {
        userId: true,
      },
    },
    _count: {
      select: {
        likes: true,
      },
    },
  },
});
```

### 3.3 좋아요 추가 (POST)
```typescript
요청:
POST /api/posts/[postId]/likes

처리 과정:
1. 사용자 인증
2. 포스트 존재 확인
3. 트랜잭션 처리:
   - 좋아요 생성
   - 알림 생성
   - 상태 조회

데이터베이스:
const result = await prisma.$transaction(async (tx) => {
  // 좋아요 생성
  await tx.like.upsert({
    where: {
      userId_postId: {
        userId: loggedInUser.id,
        postId,
      },
    },
    create: {
      userId: loggedInUser.id,
      postId,
    },
    update: {},
  });

  // 알림 생성
  if (loggedInUser.id !== post.userId) {
    await tx.notification.create({
      data: {
        issuerId: loggedInUser.id,
        recipientId: post.userId,
        postId,
        type: "LIKE",
      },
    });
  }

  // 상태 조회
  return await tx.post.findUnique({
    where: { id: postId },
    select: {
      _count: { select: { likes: true } }
    },
  });
});
```

### 3.4 좋아요 제거 (DELETE)
```typescript
요청:
DELETE /api/posts/[postId]/likes

처리 과정:
1. 사용자 인증
2. 포스트 존재 확인
3. 트랜잭션 처리:
   - 좋아요 삭제
   - 알림 삭제
   - 상태 조회

데이터베이스:
const result = await prisma.$transaction(async (tx) => {
  // 좋아요 삭제
  await tx.like.deleteMany({
    where: {
      userId: loggedInUser.id,
      postId,
    },
  });

  // 알림 삭제
  await tx.notification.deleteMany({
    where: {
      issuerId: loggedInUser.id,
      recipientId: post.userId,
      postId,
      type: "LIKE",
    },
  });

  // 상태 조회
  return await tx.post.findUnique({
    where: { id: postId },
    select: {
      _count: { select: { likes: true } }
    },
  });
});
```

### 3.5 에러 처리
```typescript
1. 인증 에러
   if (!loggedInUser) {
     return NextResponse.json(
       { error: "Unauthorized" }, 
       { status: 401 }
     );
   }

2. 리소스 없음
   if (!post) {
     return NextResponse.json(
       { error: "Post not found" }, 
       { status: 404 }
     );
   }

3. 서버 에러
   catch (error) {
     console.error('Like operation error:', error);
     return NextResponse.json(
       { error: "Internal server error" }, 
       { status: 500 }
     );
   }
```

### 3.6 호출 예시
```typescript
// src/components/posts/LikeButton.tsx
async function toggleLike(postId: string) {
  const isLiked = await getLikeState(postId);
  
  const response = await fetch(
    `/api/posts/${postId}/likes`,
    {
      method: isLiked ? 'DELETE' : 'POST'
    }
  );

  if (!response.ok) {
    throw new Error('Failed to toggle like');
  }

  const data = await response.json();
  return {
    likes: data.likes,
    isLikedByUser: data.isLikedByUser
  };
}

async function getLikeState(postId: string) {
  const response = await fetch(
    `/api/posts/${postId}/likes`
  );

  if (!response.ok) {
    throw new Error('Failed to get like state');
  }

  const data = await response.json();
  return {
    likes: data.likes,
    isLikedByUser: data.isLikedByUser
  };
}
```

### 5.5 카테고리별 포스트 API (/api/posts/by-category)
```typescript
목적:
- 카테고리별 포스트 목록 제공
- 디바이스 최적화
- 무한 스크롤 지원

요청:
GET /api/posts/by-category?category={string}&cursor={string}&isMobile={boolean}

특징:
1. 페이지 크기 최적화
   - 모바일: 12개
   - 데스크톱: 20개

2. 필터링
   - status: PostStatus.PUBLISHED
   - category: CategoryType enum 사용

데이터베이스:
const where = {
  status: PostStatus.PUBLISHED,
  ...(category ? {
    categories: {
      has: category.toUpperCase() as CategoryType
    }
  } : {})
};

const posts = await prisma.post.findMany({
  where,
  include: getPostDataInclude(""),
  orderBy: { 
    createdAt: "desc"
  },
  take: pageSize + 1,
  cursor: cursor ? { id: cursor } : undefined,
});

응답:
interface PostsPage {
  posts: PostData[];
  nextCursor: string | null;
}
```

### 5.6 호출 예시
```typescript
// src/components/posts/CategoryPosts.tsx
async function loadCategoryPosts(category: string, cursor?: string) {
  const url = new URL('/api/posts/by-category', window.location.origin);
  url.searchParams.set('category', category);
  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }
  url.searchParams.set('isMobile', isMobileDevice().toString());

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to load category posts');
  }

  const data: PostsPage = await response.json();
  return {
    posts: data.posts,
    nextCursor: data.nextCursor
  };
}
```

### 5.7 성능 고려사항
```typescript
1. 데이터베이스
   - 카테고리 인덱스
   - 복합 정렬 최적화
   - 페이지 크기 제한

2. 응답 최적화
   - 필요한 필드만 포함
   - 디바이스별 최적화
   - 증분 로딩

3. 캐싱 전략
   - 카테고리별 캐싱
   - 무효화 정책
   - 부분 업데이트
```

### 5.8 검색 API (/api/search)
```typescript
목적:
- 포스트 전문 검색
- 다중 필드 검색
- 관련도 기반 정렬

요청:
GET /api/search?q={string}&cursor={string}

특징:
1. 검색 범위
   - 제목 (title)
   - 내용 (content)
   - 작성자 이름 (displayName)
   - 작성자 아이디 (username)

2. 검색 최적화
   - OR 검색 지원
   - 공백 무시 검색
   - 대소문자 무시

데이터베이스:
const searchTerms = q.split(/\s+/).filter(Boolean);
const searchQuery = searchTerms.join(' | '); // OR 검색
const containsQuery = q.replace(/\s+/g, ''); // 공백 제거

const posts = await prisma.post.findMany({
  where: {
    OR: [
      // 제목 검색 (search 연산자)
      {
        title: {
          search: searchQuery,
        },
      },
      // 제목 검색 (공백 무시 contains)
      {
        title: {
          contains: containsQuery,
          mode: 'insensitive'
        },
      },
      // 내용 검색
      {
        content: {
          search: searchQuery,
        },
      },
      // 작성자 검색
      {
        user: {
          OR: [
            { displayName: { search: searchQuery } },
            { username: { search: searchQuery } }
          ]
        },
      }
    ],
    status: 'PUBLISHED',
  },
  orderBy: [
    // 검색 관련도순
    {
      _relevance: {
        fields: ['title', 'content'],
        search: searchQuery,
        sort: 'desc',
      },
    },
    { createdAt: 'desc' }, // 최신순
  ],
  take: pageSize + 1,
  cursor: cursor ? { id: cursor } : undefined,
});
```

### 5.9 호출 예시
```typescript
// src/components/SearchField.tsx
function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  const form = e.currentTarget;
  const q = (form.q as HTMLInputElement).value.trim();
  if (!q) return;
  router.push(`/search?q=${encodeURIComponent(q)}`);
}

// src/app/search/SearchResults.tsx
async function searchPosts(query: string, cursor?: string) {
  const url = new URL('/api/search', window.location.origin);
  url.searchParams.set('q', query);
  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to search posts');
  }

  const data: PostsPage = await response.json();
  return {
    posts: data.posts,
    nextCursor: data.nextCursor
  };
}
```

### 5.10 성능 고려사항
```typescript
1. 검색 최적화
   - 인덱스 활용
   - 검색 연산자 최적화
   - 관련도 정렬

2. 응답 최적화
   - 페이지 크기 제한
   - 필요한 필드만 포함
   - 증분 로딩

3. 사용자 경험
   - 검색어 처리
   - 디바운스 적용
   - 오타 허용
```

### 5.11 포스트 삭제 액션
```typescript
목적:
- 포스트 및 관련 리소스 삭제
- 연관 미디어 정리
- 트랜잭션 처리

처리 과정:
1. 권한 검증
   - 사용자 인증
   - 포스트 소유권 확인

2. 리소스 삭제
   - 썸네일 이미지 삭제
   - 비디오 및 자막 삭제
   - DB 레코드 삭제

데이터베이스:
const deletedPost = await prisma.$transaction(async (tx) => {
  // 포스트 삭제
  const deleted = await tx.post.delete({
    where: { id },
    include: getPostDataInclude(user.id),
  });

  // 사용자 포스트 카운트 업데이트
  await tx.user.update({
    where: { id: user.id },
    data: {
      postCount: {
        decrement: 1
      }
    }
  });

  return deleted;
});

Cloudflare API:
1. 이미지 삭제
DELETE https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${imageId}

2. 비디오 삭제
DELETE https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}
```

### 5.12 호출 예시
```typescript
// src/components/posts/PostActions.tsx
async function handleDelete(postId: string) {
  try {
    await deletePost(postId);
    router.refresh();
  } catch (error) {
    console.error('Failed to delete post:', error);
    throw error;
  }
}
```

### 5.13 성능 고려사항
```typescript
1. 리소스 정리
   - 병렬 삭제 처리
   - 실패 시 재시도
   - 고아 리소스 방지

2. 트랜잭션 관리
   - 원자성 보장
   - 롤백 처리
   - 정합성 유지

3. 에러 처리
   - 상세 로깅
   - 부분 실패 처리
   - 재시도 전략
```

### 5.14 포스트 생성/수정 액션
```typescript
목적:
- 포스트 생성 및 수정
- 연관 비디오 관리
- 자막 관리

처리 과정:
1. 데이터 검증
   - 사용자 인증
   - 스키마 검증
   - 권한 확인

2. 트랜잭션 처리
   - 포스트 생성/수정
   - 비디오 관리
   - 자막 관리

데이터베이스:
const newPost = await prisma.$transaction(async (tx) => {
  // 1. 포스트 번호 생성
  const lastPost = await tx.post.findFirst({
    orderBy: { postNum: 'desc' }
  });
  const nextPostNum = existingPost?.postNum || (lastPost?.postNum || 0) + 1;

  // 2. 포스트 생성/수정
  const post = existingPost ? 
    await tx.post.update({
      where: { id: existingPost.id },
      data: {
        title: validatedData.title,
        content: validatedData.content,
        thumbnailId: validatedData.thumbnailId,
        status: validatedData.status,
        categories: validatedData.categories,
        videoCount: input.videos?.length || 0,
        publishedAt: validatedData.status === 'PUBLISHED' 
          ? existingPost.publishedAt || new Date()
          : null
      }
    }) :
    await tx.post.create({
      data: {
        postNum: nextPostNum,
        title: validatedData.title,
        content: validatedData.content,
        thumbnailId: validatedData.thumbnailId,
        userId: user.id,
        status: validatedData.status,
        categories: validatedData.categories,
        videoCount: input.videos?.length || 0,
        publishedAt: validatedData.status === 'PUBLISHED' ? new Date() : null
      }
    });

  // 3. 비디오 관리
  if (input.videos?.length > 0) {
    // 기존 비디오 삭제
    if (existingPost) {
      await tx.video.deleteMany({
        where: { postId: post.id }
      });
    }

    // 새 비디오 생성
    for (const video of input.videos) {
      await tx.video.create({
        data: {
          id: video.id,
          postId: post.id,
          url: video.url,
          filename: video.filename,
          sequence: video.sequence,
          isPremium: video.isPremium,
          subtitle: video.subtitle || [],
        }
      });
    }
  }

  // 4. 포스트 카운트 업데이트
  if (!existingPost) {
    await tx.user.update({
      where: { id: user.id },
      data: {
        postCount: { increment: 1 }
      }
    });
  }

  return post;
});
```

### 5.15 클라이언트 상태 관리
```typescript
const mutation = useMutation({
  mutationFn: submitPost,
  onSuccess: async (newPost) => {
    // 1. 페이지 재검증
    const revalidatePaths = [
      '/',
      '/categories/recent',
      ...newPost.categories.map(c => `/categories/${c.toLowerCase()}`),
      newPost.id ? `/posts/${newPost.id}` : null
    ].filter(Boolean);

    await Promise.all(
      revalidatePaths.map(path =>
        fetch('/api/revalidate', {
          method: 'POST',
          body: JSON.stringify({ path })
        })
      )
    );

    // 2. 쿼리 캐시 업데이트
    queryClient.setQueriesData<InfiniteData<PostsPage>>(
      {
        queryKey: ["post-feed"],
        predicate: query => 
          query.queryKey.includes("for-you") ||
          (query.queryKey.includes("user-posts") && query.queryKey.includes(user.id))
      },
      oldData => {
        if (!oldData) return oldData;
        const firstPage = oldData.pages[0];
        if (!firstPage) return oldData;

        return {
          ...oldData,
          pages: [
            {
              posts: [newPost, ...firstPage.posts],
              nextCursor: firstPage.nextCursor,
            },
            ...oldData.pages.slice(1),
          ],
        };
      }
    );

    // 3. 페이지 이동
    router.push(`/posts/${newPost.id}?t=${Date.now()}`);
  }
});
```

### 5.16 성능 고려사항
```typescript
1. 트랜잭션 관리
   - 원자성 보장
   - 롤백 처리
   - 데드락 방지

2. 캐시 관리
   - 페이지 재검증
   - 쿼리 캐시 업데이트
   - 낙관적 업데이트

3. 리소스 관리
   - 자막 정리
   - 비디오 순서 관리
   - 고아 리소스 방지
```

### 3.7 성능 고려사항
```typescript
1. 데이터베이스
   - 복합 인덱스 활용
   - 트랜잭션 최적화
   - 필요한 필드만 조회

2. 알림 처리
   - 비동기 처리 가능성
   - 중복 방지
   - 배치 처리

3. 상태 관리
   - 낙관적 업데이트
   - 실시간 동기화
   - 캐시 무효화
```

## 4. 포스트 댓글 API (/api/posts/[postId]/comments)

### 4.1 개요
```typescript
목적:
- 포스트 댓글 조회
- 페이지네이션 처리
- 사용자 정보 포함

특징:
- 역순 페이지네이션
- 페이지당 5개 댓글
- 사용자 정보 포함
```

### 4.2 요청 구조
```typescript
요청:
GET /api/posts/[postId]/comments?cursor={commentId}

응답:
interface CommentsPage {
  comments: CommentData[];
  previousCursor: string | null;
}

type CommentData = {
  id: string;
  content: string;
  createdAt: Date;
  user: UserData;  // 댓글 작성자 정보
}
```

### 4.3 데이터베이스 조회
```typescript
// 댓글 작성자 정보 포함
const getCommentDataInclude = (loggedInUserId: string) => ({
  user: {
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      userRole: true,
      // ... 기타 사용자 정보
    }
  }
});

// 댓글 조회
const comments = await prisma.comment.findMany({
  where: { postId },
  include: getCommentDataInclude(user.id),
  orderBy: { createdAt: "asc" },
  take: -pageSize - 1,  // 역순 페이지네이션
  cursor: cursor ? { id: cursor } : undefined,
});

// 이전 페이지 커서 계산
const previousCursor = comments.length > pageSize ? comments[0].id : null;

// 응답 데이터 구성
const data: CommentsPage = {
  comments: comments.length > pageSize ? comments.slice(1) : comments,
  previousCursor,
};
```

### 4.4 페이지네이션 처리
```typescript
특징:
1. 역순 페이지네이션
   - take: -pageSize - 1
   - 첫 번째 항목은 다음 페이지 커서용

2. 커서 기반
   - cursor: { id: cursor }
   - 마지막 댓글 ID 기준

3. 페이지 크기
   - pageSize: 5
   - 한 번에 5개 댓글 로드
```

### 4.5 에러 처리
```typescript
1. 인증 에러
   if (!user) {
     return NextResponse.json(
       { error: "Unauthorized" }, 
       { status: 401 }
     );
   }

2. 서버 에러
   catch (error) {
     console.error(error);
     return NextResponse.json(
       { error: "Internal server error" }, 
       { status: 500 }
     );
   }
```

### 4.6 호출 예시
```typescript
// src/components/comments/CommentList.tsx
async function loadComments(postId: string, cursor?: string) {
  const url = new URL(`/api/posts/${postId}/comments`, window.location.origin);
  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to load comments');
  }

  const data: CommentsPage = await response.json();
  return {
    comments: data.comments,
    hasMore: !!data.previousCursor,
    nextCursor: data.previousCursor
  };
}
```

### 4.7 성능 고려사항
```typescript
1. 데이터베이스
   - 인덱스 활용
   - 필요한 필드만 조회
   - 페이지 크기 제한

2. 응답 최적화
   - 사용자 정보 캐싱
   - 불필요한 조인 최소화
   - 응답 크기 최적화

3. 프론트엔드
   - 무한 스크롤
   - 낙관적 업데이트
   - 상태 관리
```

### 4.8 댓글 생성/삭제 액션
```typescript
목적:
- 댓글 생성 및 삭제
- 알림 처리
- 권한 검증

1. 댓글 생성
```typescript
처리 과정:
1. 데이터 검증
   - 사용자 인증
   - 스키마 검증
   - 권한 확인

2. 트랜잭션 처리
   - 댓글 생성
   - 알림 생성 (자신의 포스트가 아닌 경우)

데이터베이스:
const [newComment] = await prisma.$transaction([
  prisma.comment.create({
    data: {
      content: contentValidated,
      postId: post.id,
      userId: user.id,
    },
    include: getCommentDataInclude(user.id),
  }),
  ...(post.user.id !== user.id
    ? [
        prisma.notification.create({
          data: {
            issuerId: user.id,
            recipientId: post.user.id,
            postId: post.id,
            type: "COMMENT",
          },
        }),
      ]
    : []),
]);
```

2. 댓글 삭제
```typescript
처리 과정:
1. 권한 검증
   - 사용자 인증
   - 댓글 소유권 확인

2. 데이터베이스 처리
   - 댓글 삭제
   - 연관 데이터 정리

데이터베이스:
const deletedComment = await prisma.comment.delete({
  where: { id },
  include: getCommentDataInclude(user.id),
});
```

### 4.9 호출 예시
```typescript
// src/components/comments/CommentForm.tsx
async function handleSubmit(data: CommentFormData) {
  try {
    await submitComment({
      post,
      content: data.content
    });
    form.reset();
    router.refresh();
  } catch (error) {
    console.error('Failed to submit comment:', error);
    throw error;
  }
}

// src/components/comments/CommentActions.tsx
async function handleDelete(commentId: string) {
  try {
    await deleteComment(commentId);
    router.refresh();
  } catch (error) {
    console.error('Failed to delete comment:', error);
    throw error;
  }
}
```

### 4.10 성능 고려사항
```typescript
1. 트랜잭션 관리
   - 원자성 보장
   - 롤백 처리
   - 정합성 유지

2. 알림 처리
   - 비동기 처리
   - 중복 방지
   - 실패 처리

3. 상태 관리
   - 낙관적 업데이트
   - 실시간 동기화
   - 캐시 무효화
```

## 5. 포스트 피드 API

### 5.1 추천 포스트 API (/api/posts/recommended)
```typescript
목적:
- 추천 포스트 목록 제공
- 무료 컨텐츠 우선 노출
- 페이지네이션 지원

요청:
GET /api/posts/recommended?skip={number}&take={number}

필터링:
1. 상태 필터
   - status: 'PUBLISHED'
   - 공지/시스템 포스트 제외

2. 비디오 필터
   - sequence: 1 (첫 번째 에피소드)
   - isPremium: false (무료 컨텐츠)

정렬 기준:
orderBy: [
  { featured: 'desc' },  // 추천 포스트 우선
  { postNum: 'asc' },   // 포스트 번호 순
  { createdAt: 'desc' } // 최신순
]

데이터베이스:
const posts = await prisma.post.findMany({
  where: {
    status: 'PUBLISHED',
    NOT: {
      categories: {
        hasSome: [CategoryType.MSPOST, CategoryType.NOTIFICATION]
      }
    },
    videos: {
      some: {
        sequence: 1,
        isPremium: false,
      }
    }
  },
  select: {
    id: true,
    title: true,
    videos: {
      where: {
        sequence: 1,
        isPremium: false,
      },
      select: {
        id: true,
        url: true,
        sequence: true,
      }
    }
  },
  orderBy: [
    { featured: 'desc' },
    { postNum: 'asc' },
    { createdAt: 'desc' }
  ],
  skip,
  take
});
```

### 5.2 개인화 피드 API (/api/posts/for-you)
```typescript
목적:
- 사용자별 맞춤 피드 제공
- 디바이스 최적화
- 무한 스크롤 지원

요청:
GET /api/posts/for-you?cursor={string}&status={string}&isMobile={boolean}

특징:
1. 페이지 크기 최적화
   - 모바일: 12개
   - 데스크톱: 20개

2. 커서 기반 페이지네이션
   - cursor: 마지막 포스트 ID
   - take: pageSize + 1

3. 상태 필터링
   - status: 'PUBLISHED' | 'DRAFT'
   - 기본값: 'PUBLISHED'

데이터베이스:
const posts = await prisma.post.findMany({
  where: {
    userId: user.id,
    status: status as "PUBLISHED" | "DRAFT",
  },
  include: getPostDataInclude(user.id),
  orderBy: { createdAt: "desc" },
  take: pageSize + 1,
  cursor: cursor ? { id: cursor } : undefined,
});

응답:
interface PostsPage {
  posts: PostData[];
  nextCursor: string | null;
}
```

### 5.3 성능 최적화
```typescript
1. 데이터베이스
   - 필요한 필드만 조회
   - 복합 인덱스 활용
   - 페이지 크기 제한

2. 응답 최적화
   - 디바이스별 최적화
   - 증분 로딩
   - 데이터 압축

3. 캐싱 전략
   - 추천 포스트 캐싱
   - 무효화 정책
   - 부분 업데이트
```

### 5.4 호출 예시
```typescript
// src/components/MainContent.tsx
async function loadRecommendedPosts(page: number) {
  const skip = page * 20;
  const response = await fetch(
    `/api/posts/recommended?skip=${skip}&take=20`
  );

  if (!response.ok) {
    throw new Error('Failed to load posts');
  }

  return response.json();
}

// src/hooks/usePosts.ts
async function loadForYouPosts(cursor?: string) {
  const url = new URL('/api/posts/for-you', window.location.origin);
  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }
  url.searchParams.set('isMobile', isMobileDevice().toString());

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to load posts');
  }

  const data: PostsPage = await response.json();
  return {
    posts: data.posts,
    nextCursor: data.nextCursor
  };
}
```
