'use client';

import { Language, Video, VideoView } from "@prisma/client";
import VideoButtons from "./VideoButtons";
import { useState } from "react";

interface VideoSectionProps {
  videos: (Video & {
    views: VideoView[];
    subtitle: Language[];
  })[];
  userId?: string;
  postId: string;  // postId 추가
}

export default function VideoSection({ videos, userId, postId }: VideoSectionProps) {
  const [selectedSequence, setSelectedSequence] = useState(videos[0]?.sequence);

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4">
        <VideoButtons
          videos={videos}
          userId={userId}
          postId={postId}  // postId 전달
          onVideoSelect={(sequence) => {
            setSelectedSequence(sequence);
          }}
        />
      </div>
    </div>
  );
}

// 'use client';

// import { Language, Video, VideoView } from "@prisma/client";
// import VideoButtons from "./VideoButtons";
// import { useState } from "react";

// interface VideoSectionProps {
//   videos: (Video & {
//     views: VideoView[];
//     subtitle: Language[]; // any[] -> Subtitle[]
//   })[];
//   userId?: string;
// }

// export default function VideoSection({ videos, userId }: VideoSectionProps) {
//   const [selectedSequence, setSelectedSequence] = useState(videos[0]?.sequence);

//   return (
//     <div className="space-y-4">
//       <div className="border rounded-lg p-4">
//         <VideoButtons
//           videos={videos}
//           userId={userId}
//           onVideoSelect={(sequence) => {
//             setSelectedSequence(sequence);
//           }}
//         />
//       </div>
//     </div>
//   );
// }
