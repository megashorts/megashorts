// import { NextRequest, NextResponse } from 'next/server';
// import prisma from '@/lib/prisma';
// import { validateRequest } from '@/auth';
// import crypto from 'crypto';

// /**
//  * 시스템 설정 내보내기 API
//  * 
//  * 이 API는 워커에서 호출하여 시스템 설정을 가져와 R2에 저장합니다.
//  * 워커는 이 데이터를 기반으로 포인트 계산을 수행합니다.
//  */
// export async function POST(request: NextRequest) {
//   try {
//     // 인증 확인
//     const { user } = await validateRequest();
//     const authHeader = request.headers.get('Authorization');
//     const apiKey = process.env.WORKER_API_KEY;
    
//     if (!user?.userRole || user.userRole < 100) { // 관리자 권한 확인
//       // API 키 확인
//       if (!authHeader?.startsWith('Bearer ') || authHeader.split(' ')[1] !== apiKey) {
//         return NextResponse.json(
//           { success: false, error: 'Unauthorized' },
//           { status: 401 }
//         );
//       }
//     }
    
//     // 시스템 설정 가져오기
//     const systemSettings = await prisma.systemSetting.findMany();
    
//     // 설정 데이터 변환
//     const formattedSettings: Record<string, any> = {
//       viewCoinAmount: 1, // 기본값
//       coinToPoint: 1, // 기본값
//       weeklySubscriptionFee: 8500, // 기본값
//       yearlySubscriptionFee: 190000, // 기본값
//       agencyShareRatios: {
//         level1: 10, // 기본값
//         level2: 5, // 기본값
//         level3: 3, // 기본값
//         level4: 2, // 기본값
//         level5: 1 // 기본값
//       },
//       uploaderShareRatios: {
//         level1: 30, // 기본값
//         level2: 40, // 기본값
//         level3: 50, // 기본값
//         level4: 60, // 기본값
//         level5: 70 // 기본값
//       }
//     };
    
//     // 설정 데이터 매핑
//     for (const setting of systemSettings) {
//       switch (setting.key) {
//         case 'viewCoinAmount':
//           formattedSettings.viewCoinAmount = Number(setting.value);
//           break;
//         case 'coinToPoint':
//           formattedSettings.coinToPoint = Number(setting.value);
//           break;
//         case 'weeklySubscriptionFee':
//           formattedSettings.weeklySubscriptionFee = Number(setting.value);
//           break;
//         case 'yearlySubscriptionFee':
//           formattedSettings.yearlySubscriptionFee = Number(setting.value);
//           break;
//         case 'agencyShareRatioLevel1':
//           formattedSettings.agencyShareRatios.level1 = Number(setting.value);
//           break;
//         case 'agencyShareRatioLevel2':
//           formattedSettings.agencyShareRatios.level2 = Number(setting.value);
//           break;
//         case 'agencyShareRatioLevel3':
//           formattedSettings.agencyShareRatios.level3 = Number(setting.value);
//           break;
//         case 'agencyShareRatioLevel4':
//           formattedSettings.agencyShareRatios.level4 = Number(setting.value);
//           break;
//         case 'agencyShareRatioLevel5':
//           formattedSettings.agencyShareRatios.level5 = Number(setting.value);
//           break;
//         case 'uploaderShareRatioLevel1':
//           formattedSettings.uploaderShareRatios.level1 = Number(setting.value);
//           break;
//         case 'uploaderShareRatioLevel2':
//           formattedSettings.uploaderShareRatios.level2 = Number(setting.value);
//           break;
//         case 'uploaderShareRatioLevel3':
//           formattedSettings.uploaderShareRatios.level3 = Number(setting.value);
//           break;
//         case 'uploaderShareRatioLevel4':
//           formattedSettings.uploaderShareRatios.level4 = Number(setting.value);
//           break;
//         case 'uploaderShareRatioLevel5':
//           formattedSettings.uploaderShareRatios.level5 = Number(setting.value);
//           break;
//       }
//     }
    
//     // R2 클라이언트 생성
//     const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
//     const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
//     const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
//     const R2_BUCKET_NAME = process.env.CLOUDFLARE_POINTS_SYSTEM_BUCKET_NAME || 'points-system-bucket';
    
//     // R2에 저장하는 함수 (AWS S3 V4 서명 사용)
//     const putToR2 = async (key: string, data: string) => {
//       try {
//         const url = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`;
//         const method = 'PUT';
//         const region = 'auto';
//         const service = 's3';
//         const contentType = 'application/json';
//         const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
//         const dateStamp = amzDate.substring(0, 8);
        
//         // 서명 생성
//         const canonicalUri = `/${R2_BUCKET_NAME}/${key}`;
//         const canonicalQueryString = '';
//         const canonicalHeaders = 
//           `content-type:${contentType}\n` +
//           `host:${R2_ACCOUNT_ID}.r2.cloudflarestorage.com\n` +
//           `x-amz-content-sha256:UNSIGNED-PAYLOAD\n` +
//           `x-amz-date:${amzDate}\n`;
//         const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
//         const payloadHash = 'UNSIGNED-PAYLOAD';
//         const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
        
//         const algorithm = 'AWS4-HMAC-SHA256';
//         const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
//         const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${crypto.createHash('sha256').update(canonicalRequest).digest('hex')}`;
        
//         // 서명 키 생성
//         const getSignatureKey = (key: string, dateStamp: string, regionName: string, serviceName: string) => {
//           const kDate = crypto.createHmac('sha256', `AWS4${key}`).update(dateStamp).digest();
//           const kRegion = crypto.createHmac('sha256', kDate).update(regionName).digest();
//           const kService = crypto.createHmac('sha256', kRegion).update(serviceName).digest();
//           const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
//           return kSigning;
//         };
        
//         const signingKey = getSignatureKey(R2_SECRET_ACCESS_KEY || '', dateStamp, region, service);
//         const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
        
//         const authorizationHeader = `${algorithm} Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
        
//         // 요청 전송
//         const response = await fetch(url, {
//           method,
//           headers: {
//             'Content-Type': contentType,
//             'X-Amz-Date': amzDate,
//             'X-Amz-Content-Sha256': 'UNSIGNED-PAYLOAD',
//             'Authorization': authorizationHeader
//           },
//           body: data
//         });
        
//         if (!response.ok) {
//           throw new Error(`R2 업로드 실패: ${response.status} ${response.statusText}`);
//         }
        
//         console.log(`R2 업로드 성공: ${key}`);
//         return true;
//       } catch (error) {
//         console.error(`R2 업로드 실패 (${key}):`, error);
        
//         // 개발 환경에서는 실패해도 성공으로 처리
//         if (process.env.NODE_ENV === 'development') {
//           console.log(`개발 환경에서는 R2 업로드 실패를 무시하고 계속 진행합니다.`);
//           return true;
//         }
        
//         throw error;
//       }
//     };
    
//     // 시스템 설정 저장
//     await putToR2(
//       'system-settings.json',
//       JSON.stringify(formattedSettings)
//     );
    
//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error('Error in settings-export API:', error);
//     return NextResponse.json(
//       { success: false, error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }
