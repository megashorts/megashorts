import { validateRequest } from '@/auth';

export async function POST(request: Request) {
  const { user } = await validateRequest();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return new Response("No file provided", { status: 400 });
    }

    // 크리에이터 메타데이터 추가
    const cloudflareFormData = new FormData();
    cloudflareFormData.append('file', file);
    cloudflareFormData.append('metadata', JSON.stringify({
      creator: {
        id: user.id,
        name: user.username
      }
    }));

    // Cloudflare 계정 ID 추출 (API URL에서)
    const accountId = process.env.CLOUDFLARE_STREAM_API?.split('/accounts/')[1]?.split('/')[0];
    if (!accountId) {
      throw new Error("Cloudflare account ID not found");
    }

    // 클라우드플레어 이미지 업로드
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("Cloudflare upload error:", errorData);
      throw new Error("Failed to upload to Cloudflare");
    }

    const result = await response.json();
    // return Response.json({
    //   url: result.result.variants[0],
    //   id: result.result.id,
    // });
    return Response.json({
      url: `${result.result.variants[0].replace('/public', '/thumbnail')}`,
      id: result.result.id,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return new Response("Upload failed", { status: 500 });
  }
}
