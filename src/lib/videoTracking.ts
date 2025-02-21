// import { videoDB } from './indexedDB';

// interface TrackViewParams {
//   videoId: string;
//   postId: string;
//   sequence: number;
//   timestamp: number;
// }

// export const videoTracking = {
//   async trackView(params: TrackViewParams) {
//     const { sequence, videoId, postId, timestamp } = params;

//     if (timestamp < 5) {
//       console.log('Skipping: timestamp < 5');
//       return;
//     }

//     try {
//       // 브라우저 저장과 서버 저장을 독립적으로 처리
//       // 브라우저 저장 (sequence와 관계없이 모든 비디오 저장)
//       videoDB.saveWatchedVideo(videoId)  // sequence 1번도 저장
//         .catch(error => console.error('IndexedDB saveWatchedVideo error:', error));
      
//       videoDB.saveLastView(postId, sequence, timestamp)
//         .catch(error => console.error('IndexedDB saveLastView error:', error));

//       // 서버 저장
//       const response = await fetch('/api/videos/view', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           ...params,
//           timestamp: timestamp
//         })
//       });

//       if (!response.ok) {
//         throw new Error(`Server error: ${response.status}`);
//       }
//     } catch (error) {
//       console.error('Error tracking view:', error);
//     }
//   },

// };
