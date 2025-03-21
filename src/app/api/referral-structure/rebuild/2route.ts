// import { NextRequest, NextResponse } from 'next/server';
// import { validateRequest } from '@/auth';
// import { USER_ROLE } from '@/lib/constants';
// import prisma from '@/lib/prisma';
// import { callReferralStructureWorker } from '../utils';

// /**
//  * 추천인 구조 재구성 API 라우트
//  */
// export async function POST(request: NextRequest) {
//   try {
//     // 사용자 인증
//     const { user } = await validateRequest();
    
//     if (!user || user.userRole < USER_ROLE.TEAM_MASTER) {
//       return NextResponse.json(
//         { success: false, message: '인증 실패: 권한이 없습니다.' },
//         { status: 401 }
//       );
//     }
    
//     // 요청 본문 파싱
//     const body = await request.json();
    
//     // 필수 파라미터 확인
//     const { masterUserId, options } = body;
    
//     if (!masterUserId) {
//       return NextResponse.json(
//         { success: false, message: '필수 파라미터 누락: masterUserId' },
//         { status: 400 }
//       );
//     }
    
//     // 사용자 정보 조회
//     const userInfo = await prisma.user.findUnique({
//       where: { id: masterUserId },
//       select: { 
//         username: true, 
//         // displayName: true,
//         // email: true
//       }
//     });
    
//     if (!userInfo) {
//       return NextResponse.json(
//         { 
//           success: false, 
//           message: `사용자 정보를 찾을 수 없음: ${masterUserId}` 
//         },
//         { status: 404 }
//       );
//     }
    
//     // 팀마스터 설정 조회 (정확한 키 사용)
//     const teamMasterSettings = await prisma.systemSetting.findFirst({
//       where: {
//         key: `agencySettings_${masterUserId}`
//       }
//     });
    
//     // 팀마스터에 속한 회원 조회 (masterName이 팀마스터의 username인 회원)
//     const members = await prisma.user.findMany({
//       where: {
//         masterName: userInfo.username
//       },
//       select: {
//         id: true,
//         username: true,
//         // displayName: true,
//         // email: true,
//         referredBy: true,
//         createdAt: true,
//         userRole: true
//       }
//     });
    
//     // 회원 정보 변환
//     const memberInfos = members.map(member => ({
//       userId: member.id,
//       username: member.username,
//       // displayName: member.displayName || undefined,
//       // email: member.email || undefined,
//       level: 0, // 기본 레벨 - 자격 없음
//       subLevel: 0,
//       userRole: member.userRole,
//       referrerId: member.referredBy || undefined,
//       joinedAt: member.createdAt.toISOString(),
//       status: 'active' as 'active' | 'inactive' | 'deleted'
//     }));
    
//     // 로그 추가: 워커에 전달할 정보 확인
//     console.log('워커에 전달할 정보:', {
//       masterUserId,
//       userInfo,
//       settings: teamMasterSettings?.value || { masterType: 'regular', settings: {} },
//       members: memberInfos,
//       options: options || {}
//     });
    
//     // 워커 호출 (사용자 정보, 설정, 회원 정보 포함)
//     const result = await callReferralStructureWorker('/rebuild', {
//       masterUserId,
//       userInfo,
//       settings: teamMasterSettings?.value || { masterType: 'regular', settings: {} },
//       members: memberInfos,
//       options: options || {}
//     });
    
//     // 결과 반환
//     return NextResponse.json({
//       success: true,
//       result,
//       timestamp: new Date().toISOString()
//     });
//   } catch (error) {
//     console.error('추천인 구조 재구성 API 오류:', error);
    
//     return NextResponse.json(
//       {
//         success: false,
//         message: `추천인 구조 재구성 API 오류: ${error instanceof Error ? error.message : String(error)}`,
//         timestamp: new Date().toISOString()
//       },
//       { status: 500 }
//     );
//   }
// }

// /**
//  * 추천인 구조 재구성 데이터 제공 API
//  */
// export async function GET(request: NextRequest) {
//   try {
//     // 사용자 인증
//     const { user } = await validateRequest();
    
//     if (!user || user.userRole < USER_ROLE.TEAM_MASTER) {
//       return NextResponse.json(
//         { success: false, message: '인증 실패: 권한이 없습니다.' },
//         { status: 401 }
//       );
//     }
    
//     // URL 파라미터 파싱
//     const url = new URL(request.url);
//     const masterUserId = url.searchParams.get('masterUserId');
//     const action = url.searchParams.get('action');
    
//     if (!masterUserId) {
//       return NextResponse.json(
//         { success: false, message: '필수 파라미터 누락: masterUserId' },
//         { status: 400 }
//       );
//     }
    
//     if (action === 'fetch_members') {
//       // 회원 목록 조회 (직접 DB 쿼리)
//       try {
//         // 워커 호출 (워커에서 DB 쿼리 수행)
//         const result = await callReferralStructureWorker('/get', {
//           masterUserId,
//           action: 'fetch_members'
//         }, 'GET');
        
//         return NextResponse.json({
//           success: true,
//           ...result,
//           timestamp: new Date().toISOString()
//         });
//       } catch (dbError) {
//         console.error('회원 조회 오류:', dbError);
//         return NextResponse.json(
//           {
//             success: false,
//             message: `회원 조회 오류: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
//             timestamp: new Date().toISOString()
//           },
//           { status: 500 }
//         );
//       }
//     } else if (action === 'fetch_user_info') {
//       // 사용자 정보 조회 (직접 DB 쿼리)
//       try {
//         // 사용자 정보 조회
//         const user = await prisma.user.findUnique({
//           where: { id: masterUserId },
//           select: { 
//             username: true, 
//             displayName: true,
//             email: true
//           }
//         });
        
//         if (!user) {
//           return NextResponse.json(
//             { 
//               success: false, 
//               message: `사용자 정보를 찾을 수 없음: ${masterUserId}` 
//             },
//             { status: 404 }
//           );
//         }
        
//         return NextResponse.json({
//           success: true,
//           userInfo: {
//             username: user.username,
//             displayName: user.displayName || user.username,
//             email: user.email
//           },
//           timestamp: new Date().toISOString()
//         });
//       } catch (dbError) {
//         console.error('사용자 정보 조회 오류:', dbError);
//         return NextResponse.json(
//           {
//             success: false,
//             message: `사용자 정보 조회 오류: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
//             timestamp: new Date().toISOString()
//           },
//           { status: 500 }
//         );
//       }
//     } else if (action === 'fetch_settings') {
//       // 팀마스터 설정 조회 (직접 DB 쿼리)
//       try {
//         // 워커 호출 (워커에서 DB 쿼리 수행)
//         const result = await callReferralStructureWorker('/get', {
//           masterUserId,
//           action: 'fetch_settings'
//         }, 'GET');
        
//         return NextResponse.json({
//           success: true,
//           ...result,
//           timestamp: new Date().toISOString()
//         });
//       } catch (dbError) {
//         console.error('팀마스터 설정 조회 오류:', dbError);
//         return NextResponse.json(
//           {
//             success: false,
//             message: `팀마스터 설정 조회 오류: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
//             timestamp: new Date().toISOString()
//           },
//           { status: 500 }
//         );
//       }
//     }
    
//     return NextResponse.json(
//       { success: false, message: '지원되지 않는 작업 유형입니다.' },
//       { status: 400 }
//     );
//   } catch (error) {
//     console.error('추천인 구조 재구성 데이터 제공 API 오류:', error);
    
//     return NextResponse.json(
//       {
//         success: false,
//         message: `추천인 구조 재구성 데이터 제공 API 오류: ${error instanceof Error ? error.message : String(error)}`,
//         timestamp: new Date().toISOString()
//       },
//       { status: 500 }
//     );
//   }
// }
