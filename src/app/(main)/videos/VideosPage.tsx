import { Suspense } from 'react';
import VideoFeed from './VideoFeed';

export default async function VideosPage() {
  return (
    <div className="relative w-full">
      <Suspense fallback={<div>Loading...</div>}>
        <VideoFeed />
      </Suspense>
    </div>
  );
}
