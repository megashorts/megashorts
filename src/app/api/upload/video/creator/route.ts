import { validateRequest } from '@/auth';

export async function POST(request: Request) {
  const { user } = await validateRequest();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { videoId } = await request.json();
    if (!videoId) {
      return new Response("Video ID is required", { status: 400 });
    }

    // Cloudflare 계정 ID 추출
    const accountId = process.env.CLOUDFLARE_STREAM_API?.split('/accounts/')[1]?.split('/')[0];
    if (!accountId) {
      throw new Error("Cloudflare account ID not found");
    }

    // 크리에이터 정보 업데이트
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}/creator`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          creator: {
            id: user.id,        // 사용자 ID 사용
            name: user.username // 사용자 이름 유지
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errors?.[0]?.message || "Failed to update creator");
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Creator update error:", error);
    return new Response(
      error instanceof Error ? error.message : "Failed to update creator",
      { status: 500 }
    );
  }
}