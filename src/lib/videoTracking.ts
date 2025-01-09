import { videoDB } from './indexedDB';

interface TrackViewParams {
  videoId: string;
  postId: string;
  sequence: number;
  timestamp: number;
}

export const videoTracking = {
  async trackView(params: TrackViewParams) {
    const { sequence, videoId, postId, timestamp } = params;

    if (timestamp < 3) {
      console.log('Skipping: timestamp < 3');
      return;
    }

    const flooredTimestamp = Math.floor(timestamp / 10) * 10;

    try {
      // 브라우저 저장과 서버 저장을 독립적으로 처리
      // 브라우저 저장 (sequence와 관계없이 모든 비디오 저장)
      videoDB.saveWatchedVideo(videoId)  // sequence 1번도 저장
        .catch(error => console.error('IndexedDB saveWatchedVideo error:', error));
      
      videoDB.saveLastView(postId, sequence, flooredTimestamp)
        .catch(error => console.error('IndexedDB saveLastView error:', error));

      // 서버 저장
      const response = await fetch('/api/videos/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          timestamp: flooredTimestamp
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }
};

// export const videoTracking = {
//   async trackView(params: TrackViewParams) {
//     const { sequence, videoId, postId, timestamp } = params;

//     // 3초 미만 시청은 무시
//     if (timestamp < 3) return;

//     try {
//       // 서버 API 호출 (로그인 체크는 서버에서 수행)
//       const response = await fetch('/api/videos/view', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(params)
//       });

//       // 401 Unauthorized는 비로그인 상태이므로 더 이상 진행하지 않음
//       if (response.status === 401) {
//         return;
//       }

//       if (!response.ok) {
//         throw new Error('Server API error');
//       }

//       // API 호출이 성공한 경우에만 (즉, 로그인된 경우에만) IndexedDB 저장
//       if (sequence > 1) {
//         await videoDB.saveWatchedVideo(videoId);
        
//         // 포스트별 마지막 시청 정보만 저장 (10초 단위)
//         const roundedTimestamp = Math.round(timestamp / 10) * 10;
//         await videoDB.saveLastView(postId, sequence, roundedTimestamp);
//       }
//     } catch (error) {
//       console.error('Error tracking view:', error);
//     }
//   }
// };