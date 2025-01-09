// "use server";

// import { validateRequest } from '@/lib/auth';
// import prisma from "@/lib/prisma";
// import { getPostDataInclude } from "@/lib/types";
// import { createPostSchema } from "@/lib/validation";

// // const { content, mediaIds } = createPostSchema.parse(input); => validation 거쳐서 
// // const newPost = await prisma.post.create({ => 포스트 생성
// export async function submitPost(input: {
//   content: string;
//   mediaIds: string[];
// }) {
//   const { user } = await validateRequest();

//   if (!user) throw new Error("Unauthorized");

//   const { title, content, thumbnailUrl, mediaIds } = createPostSchema.parse(input);

//   const newPost = await prisma.post.create({
//     data: {
//       title: title || "Untitled Post",
//       content,
//       // thumbnailUrl: thumbnailUrl || null,
//       thumbnailUrl: thumbnailUrl || "", 
//       userId: user.id,
//       attachments: {
//         connect: mediaIds.map((id) => ({ id })),
//       },
//     },
//     include: getPostDataInclude(user.id),
//   });

//   return newPost;
// }
