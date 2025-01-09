
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { VideoViewClient } from './VideoViewClient';

interface PageProps {
    params: Promise<{ postId: string }>;
    searchParams: Promise<{ sequence?: string; t?: string }>;
  }
  
  export default async function VideoViewPage({
    params,
    searchParams
  }: PageProps) {
    // params와 searchParams await
    const { postId } = await params;
    const { sequence, t } = await searchParams;
  
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        ageLimit: true,
        title: true,
        videos: {
          select: {
            id: true,
            url: true,
            sequence: true,
            isPremium: true 
          },
          orderBy: {
            sequence: 'asc'
          }
        }
      }
    });
  
    if (!post) redirect('/');
  
    // sequence 파싱
    const initialSequence = sequence ? parseInt(sequence, 10) : 1;
    const initialTime = t ? parseInt(t, 10) : 0;
  
    return <VideoViewClient 
      post={post} 
      initialSequence={initialSequence}
      initialTime={initialTime}  // 추가
    />;
  }