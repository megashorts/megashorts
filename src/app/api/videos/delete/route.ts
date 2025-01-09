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
  
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      if (!accountId) {
        throw new Error("Cloudflare account ID not found");
      }
  
      // Cloudflare에서 비디오 삭제
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          },
        }
      );
  
      if (!response.ok) {
        throw new Error("Failed to delete video from Cloudflare");
      }
  
      return Response.json({ success: true });
    } catch (error) {
      console.error("Video deletion error:", error);
      return new Response(
        error instanceof Error ? error.message : "Failed to delete video",
        { status: 500 }
      );
    }
  }