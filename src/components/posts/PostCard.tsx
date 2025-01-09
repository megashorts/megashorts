"use client";


import Image from "next/image";
import { useState } from "react";
import BookmarkButton from "./BookmarkButton";
import PostMoreButton from "./PostMoreButton";
import PostModal from "./PostModal";
import LikeButtonOnly from "./LikeButtonOnly";
import { PostData } from "@/lib/types";
import { useSession } from "@/components/SessionProvider";

interface PostProps {
  post: PostData;
}

export default function PostCard({ post }: PostProps) {
  const { user } = useSession();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="w-full">
        <article 
          role="button"
          tabIndex={0}
          onClick={() => setShowModal(true)}
          onKeyDown={(e) => e.key === 'Enter' && setShowModal(true)}
          className="relative aspect-[2/3] rounded-md overflow-hidden cursor-pointer group"
        >
          <Image
            src={post.thumbnailUrl || '/post-placeholder.jpg'}
            alt={post.content || ''}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-sm text-white font-medium line-clamp-2">
                {post.title}
              </h3>
            </div>
          </div>

          {/* {user && ( // 로그인한 경우에만 오버레이와 버튼들을 표시
            <div 
              className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent 
                opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              {post.user.id === user.id && (
                <div 
                  className="absolute top-2 right-2 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <PostMoreButton post={post} />
                </div>
              )}
              
              <div 
                className="absolute bottom-0 left-0 right-0 p-4"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <LikeButtonOnly
                      postId={post.id}
                      initialState={{
                        likes: post._count.likes,
                        isLikedByUser: post.likes.some((like) => like.userId === user.id),
                      }}
                    />
                  </div>
                  <BookmarkButton
                    postId={post.id}
                    initialState={{
                      isBookmarkedByUser: post.bookmarks.some(
                        (bookmark) => bookmark.userId === user.id,
                      ),
                    }}
                  />
                </div>
              </div>
            </div>
          )} */}
        </article>
      </div>

      {showModal && (
        <PostModal 
          post={post} 
          handleClose={() => setShowModal(false)} 
        />
      )}
    </>
  );
}

// "use client";

// import { useSession } from "@/app/(main)/SessionProvider";
// import { PostData } from "@/lib/types";
// import { Media } from "@prisma/client";
// import Image from "next/image";
// import { useState } from "react";
// import BookmarkButton from "./BookmarkButton";
// import PostMoreButton from "./PostMoreButton";
// import PostModal from "./PostModal";
// import LikeButtonOnly from "./LikeButtonOnly";

// interface PostProps {
//   post: PostData;
// }

// export default function PostCard({ post }: PostProps) {
//   const { user } = useSession();
//   const [showModal, setShowModal] = useState(false);

//   if (!user) return null;

//   return (
//     <>
//       <div className="w-full">
//         <article 
//           role="button"
//           tabIndex={0}
//           onClick={() => setShowModal(true)}
//           onKeyDown={(e) => e.key === 'Enter' && setShowModal(true)}
//           className="relative aspect-[2/3] rounded-md overflow-hidden cursor-pointer group"
//         >
//           <Image
//             src={post.thumbnailUrl || '/post-placeholder.jpg'}
//             alt={post.content || ''}
//             fill
//             className="object-cover transition-transform duration-300 group-hover:scale-105"
//             sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
//             loading="lazy"
//           />
          
//           <div 
//             className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent 
//               opacity-0 group-hover:opacity-100 transition-opacity duration-300"
//           >
//             {post.user.id === user.id && (
//               <div 
//                 className="absolute top-2 right-2 z-10"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   e.preventDefault();
//                 }}
//               >
//                 <PostMoreButton post={post} />
//               </div>
//             )}
            
//             <div 
//               className="absolute bottom-0 left-0 right-0 p-4"
//               onClick={(e) => {
//                 e.stopPropagation();
//                 e.preventDefault();
//               }}
//             >
//               <div className="flex justify-between items-center">
//                 <div className="flex items-center gap-3">
//                   <LikeButtonOnly
//                     postId={post.id}
//                     initialState={{
//                       likes: post._count.likes,
//                       isLikedByUser: post.likes.some((like) => like.userId === user.id),
//                     }}
//                   />
//                 </div>
//                 <BookmarkButton
//                   postId={post.id}
//                   initialState={{
//                     isBookmarkedByUser: post.bookmarks.some(
//                       (bookmark) => bookmark.userId === user.id,
//                     ),
//                   }}
//                 />
//               </div>
//             </div>
//           </div>
//         </article>
//       </div>

//       {showModal && (
//         <PostModal 
//           post={post} 
//           handleClose={() => setShowModal(false)} 
//         />
//       )}
//     </>
//   );
// }