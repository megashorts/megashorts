// import { NextRequest, NextResponse } from 'next/server';
// import prisma from '@/lib/prisma';
// import { validateRequest } from '@/auth';

// /**
//  * 일일 비디오 조회 데이터 내보내기 API
//  * 
//  * 이 API는 워커에서 호출하여 특정 날짜의 비디오 조회 데이터를 가져와 R2에 저장합니다.
//  * 워커는 이 데이터를 기반으로 포인트 계산을 수행합니다.
//  */
// export async function POST(request: NextRequest) {
//   try {
//     // 엄격한 CORS 헤더 설정
//     const origin = request.headers.get('Origin');
    
//     // 개발 환경에서는 localhost만 허용, 프로덕션 환경에서는 megashorts.com만 허용
//     let corsOrigin = 'https://megashorts.com'; // 기본값
    
//     if (origin) {
//       if (origin.startsWith('http://localhost')) {
//         // 개발 환경 - localhost 도메인만 허용
//         corsOrigin = origin;
//       } else if (origin === 'https://megashorts.com' || origin === 'https://www.megashorts.com') {
//         // 프로덕션 환경 - megashorts.com 도메인만 허용
//         corsOrigin = origin;
//       }
//     }
    
//     console.log('요청 Origin:', origin);
//     console.log('CORS Origin 설정:', corsOrigin);
    
//     const corsHeaders = {
//       'Access-Control-Allow-Origin': corsOrigin,
//       'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
//       'Access-Control-Allow-Headers': 'Content-Type, Authorization, Origin, X-Requested-With',
//       'Access-Control-Max-Age': '86400',
//     };
    
//     // OPTIONS 요청 처리 (CORS preflight)
//     if (request.method === 'OPTIONS') {
//       return new NextResponse(null, { 
//         status: 204,
//         headers: corsHeaders
//       });
//     }
    
//     // 개선된 인증 로직 - 워커 요청을 위한 특별 처리
//     let isAuthenticated = false;
    
//     // 1. 워커 API 키 확인 (가장 먼저 확인)
//     const authHeader = request.headers.get('Authorization');
//     if (authHeader?.startsWith('Bearer ')) {
//       const providedKey = authHeader.split(' ')[1];
      
//       // 환경 변수로 설정된 API 키만 사용
//       const possibleKeys = [
//         process.env.WORKER_API_KEY,
//         process.env.CRON_SECRET
//       ].filter(Boolean);
      
//       console.log('API 키 확인 중...');
      
//       if (possibleKeys.includes(providedKey)) {
//         console.log('API 키로 인증 성공');
//         isAuthenticated = true;
//       } else {
//         console.log('API 키 불일치. 제공된 키:', providedKey);
//       }
//     }
    
//     // 2. API 키로 인증되지 않은 경우 세션 인증 시도
//     if (!isAuthenticated) {
//       try {
//         const { user } = await validateRequest();
//         if (user?.userRole && user.userRole >= 90) {
//           console.log('관리자 권한으로 인증됨:', user.username);
//           isAuthenticated = true;
//         }
//       } catch (authError) {
//         console.error('세션 인증 오류:', authError);
//         // 세션 인증 실패는 무시하고 계속 진행 (API 키 인증이 성공했을 수 있음)
//       }
//     }
    
//     // 3. 인증 실패 시 오류 응답
//     if (!isAuthenticated) {
//       console.log('인증 실패');
//       return NextResponse.json(
//         { success: false, error: 'Unauthorized' },
//         { 
//           status: 401,
//           headers: corsHeaders
//         }
//       );
//     }
    
//     // 요청 본문 파싱
//     const body = await request.json();
//     const { date } = body;
    
//     if (!date) {
//       return NextResponse.json(
//         { success: false, error: 'Missing date parameter' },
//         { status: 400 }
//       );
//     }
    
//     // 날짜 형식 검증
//     const targetDate = new Date(date);
//     if (isNaN(targetDate.getTime())) {
//       return NextResponse.json(
//         { success: false, error: 'Invalid date format' },
//         { status: 400 }
//       );
//     }
    
//     // 한국 시간 기준으로 날짜 범위 설정 (해당 날짜의 00:00:00부터 23:59:59까지)
//     // UTC+9 시간대 고려
//     const startDate = new Date(date);
//     startDate.setUTCHours(-9, 0, 0, 0); // 한국 시간 00:00:00 (UTC로는 전날 15:00:00)
    
//     const endDate = new Date(date);
//     endDate.setUTCHours(14, 59, 59, 999); // 한국 시간 23:59:59 (UTC로는 14:59:59)
    
//     console.log(`조회 날짜 범위: ${startDate.toISOString()} ~ ${endDate.toISOString()}`);
    
//     // 비디오 조회 데이터 가져오기
//     console.log('DB 쿼리 시작: 비디오 조회 데이터 가져오기');
//     let videoViews;
//     try {
//       videoViews = await prisma.videoView.findMany({
//         where: {
//           createdAt: {
//             gte: startDate,
//             lte: endDate
//           }
//         },
//         include: {
//           video: {
//             include: {
//               post: {
//                 select: {
//                   id: true,
//                   userId: true,
//                   title: true
//                 }
//               }
//             }
//           },
//           user: {
//             select: {
//               id: true,
//               username: true
//             }
//           }
//         }
//       });
//       console.log(`DB 쿼리 성공: ${videoViews.length}개의 비디오 조회 데이터 가져옴`);
//     } catch (dbError) {
//       console.error('DB 쿼리 오류:', dbError);
//       return NextResponse.json(
//         { success: false, error: 'Database query error', details: String(dbError) },
//         { status: 500 }
//       );
//     }
    
//     // 고유한 사용자 ID와 업로더 ID 추출
//     const userIds = [...new Set(videoViews.map(view => view.userId))];
//     const uploaderIds = [...new Set(videoViews.map(view => view.video.post.userId))];
    
//     // 사용자 정보 가져오기 (추천인 정보 포함)
//     const users = await prisma.user.findMany({
//       where: {
//         id: {
//           in: userIds
//         }
//       },
//       select: {
//         id: true,
//         username: true,
//         referredBy: true,
//         teamMaster: true
//       }
//     });
    
//     // 업로더 정보 가져오기 (유저롤 정보 포함)
//     const uploaders = await prisma.user.findMany({
//       where: {
//         id: {
//           in: uploaderIds
//         }
//       },
//       select: {
//         id: true,
//         username: true,
//         userRole: true
//       }
//     });
    
//     // 추천인 ID 추출
//     const referrerUsernames = users
//       .map(user => user.referredBy)
//       .filter(username => username !== null && username !== undefined) as string[];
    
//     // 추천인 정보 가져오기
//     const referrers = await prisma.user.findMany({
//       where: {
//         username: {
//           in: referrerUsernames
//         }
//       },
//       select: {
//         id: true,
//         username: true,
//         teamMaster: true
//       }
//     });
    
//     // 각종 맵 생성
//     const userMap = new Map(users.map(user => [user.id, user]));
//     const uploaderMap = new Map(uploaders.map(uploader => [uploader.id, uploader]));
//     const referrerMap = new Map(referrers.map(referrer => [referrer.username, referrer]));
    
//     // 데이터 변환
//     const formattedViews = videoViews.map(view => {
//       const user = userMap.get(view.userId);
//       const uploader = uploaderMap.get(view.video.post.userId);
//       const referrerUsername = user?.referredBy || null;
//       const referrer = referrerUsername ? referrerMap.get(referrerUsername) : null;
      
//       return {
//         userId: view.userId,
//         username: user?.username || 'unknown',
//         uploaderId: view.video.post.userId,
//         uploaderUsername: uploader?.username || 'unknown',
//         uploaderUserRole: uploader?.userRole || 0,  // 업로더의 유저롤 추가
//         postId: view.video.post.id,
//         postTitle: view.video.post.title || '',
//         videoId: view.videoId,
//         accessMethod: view.accessMethod,
//         timestamp: view.createdAt.toISOString(),  // 시청시간 정보
//         viewCreatedAt: view.createdAt.toISOString(),  // 시청기록 생성 시간 명시적으로 추가
//         referrerId: referrer?.id || null,
//         referrerUsername: referrerUsername,
//         masterUsername: user?.teamMaster || referrer?.teamMaster || null
//       };
//     });
    
//     // 사용자별, 비디오별로 그룹화
//     const groupedViews = formattedViews.reduce((acc, view) => {
//       const key = `${view.userId}-${view.postId}-${view.accessMethod}`;
      
//       if (!acc[key]) {
//         acc[key] = {
//           userId: view.userId,
//           username: view.username,
//           uploaderId: view.uploaderId,
//           uploaderUsername: view.uploaderUsername,
//           uploaderUserRole: view.uploaderUserRole, // 업로더의 유저롤 추가
//           postId: view.postId,
//           postTitle: view.postTitle,
//           videoId: view.videoId,
//           accessMethod: view.accessMethod,
//           timestamp: view.timestamp, // 시청시간 정보 추가
//           viewCreatedAt: view.viewCreatedAt, // 시청기록 생성 시간 추가
//           referrerId: view.referrerId,
//           referrerUsername: view.referrerUsername,
//           masterUsername: view.masterUsername
//         };
//       }
      
//       return acc;
//     }, {} as Record<string, any>);
    
//     // 데이터 준비
//     const responseData = { 
//       success: true, 
//       data: Object.values(groupedViews),
//       filePath: `daily-views/${date}.json`
//     };
    
//     // 워커 호출 시도
//     try {
//       console.log('워커 호출 시도...');
      
//       // 워커 URL 설정 (올바른 워커 URL 사용)
//       const workerUrl = 'https://views-collector.msdevcm.workers.dev';
//       console.log(`워커 URL: ${workerUrl}`);
      
//       // 워커 호출
//       const workerResponse = await fetch(`${workerUrl}/collect-daily-data`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${process.env.WORKER_API_KEY}`
//         },
//         body: JSON.stringify({
//           date,
//           data: responseData
//         })
//       });
      
//       if (workerResponse.ok) {
//         const workerResult = await workerResponse.json();
//         console.log('워커 호출 성공:', workerResult);
        
//         // 워커 응답 반환
//         return NextResponse.json({
//           ...responseData,
//           workerResult
//         });
//       } else {
//         console.error('워커 호출 실패:', await workerResponse.text());
//       }
//     } catch (workerError) {
//       console.error('워커 호출 오류:', workerError);
//       // 워커 호출 실패는 무시하고 계속 진행 (데이터는 여전히 반환)
//     }
    
//     // 워커 호출에 실패하더라도 데이터 반환
//     return NextResponse.json(responseData);
//   } catch (error) {
//     console.error('Error in views-export API:', error);
//     return NextResponse.json(
//       { success: false, error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }
