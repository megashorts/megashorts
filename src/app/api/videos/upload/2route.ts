// // import { validateRequest } from '@/lib/auth';
// import { validateRequest } from '@/auth';

// export async function POST(request: Request) {
//   const { user } = await validateRequest();
//   if (!user) {
//     return new Response("Unauthorized", { status: 401 });
//   }

//   try {
//     const formData = await request.formData();
//     const file = formData.get("file") as File;
//     if (!file) {
//       return new Response("No file provided", { status: 400 });
//     }

//     const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
//     if (!accountId) {
//       throw new Error("Cloudflare account ID not found");
//     }

//     // 1. 비디오 업로드
//     const uploadResponse = await fetch(
//       `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`,
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
//         },
//         body: formData,
//       }
//     );

//     if (!uploadResponse.ok) {
//       const errorData = await uploadResponse.json();
//       console.error("Cloudflare upload error:", errorData);
//       throw new Error("Failed to upload to Cloudflare Stream");
//     }

//     const result = await uploadResponse.json();
//     const videoId = result.result.uid;

//     // 2. 크리에이터 정보 즉시 업데이트
//     const creatorResponse = await fetch(
//       `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}`,
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//           creator: user.username  // 이메일만 전달
//           // creator: JSON.stringify({  // creator 정보를 문자열로 변환
//           //   id: user.id,
//           //   name: user.username
//           // })
//         })
//       }
//     );

//     if (!creatorResponse.ok) {
//       console.error("Failed to update creator info");
//     }

//     // 3. HLS 매니페스트 URL 생성
//     const hlsUrl = `https://videodelivery.net/${videoId}/manifest/video.m3u8`;

//     return Response.json({
//       id: videoId,
//       url: hlsUrl,
//       filename: file.name
//     });
//   } catch (error) {
//     console.error("Video upload error:", error);
//     return new Response(
//       error instanceof Error ? error.message : "Upload failed",
//       { status: 500 }
//     );
//   }
// }