// import { NextResponse } from 'next/server';
// import { createPasswordResetToken } from '@/lib/auth';
// import prisma from '../../../lib/prisma';
// import { sendMail, EmailTemplate } from '../../../lib/email';

// export async function POST(req: Request) {
//   try {
//     const { email } = await req.json();

//     if (!email) {
//       return NextResponse.json({ error: '이메일 주소를 입력해주세요.' }, { status: 400 });
//     }

//     const user = await prisma.user.findUnique({ where: { email } });
//     if (!user) {
//       return NextResponse.json({ error: '입력하신 이메일 주소로 가입된 회원이 없습니다.' }, { status: 400 });
//     }

//     const token = await createPasswordResetToken(user.id);
    
//     if (!process.env.NEXT_PUBLIC_BASE_URL) {
//       throw new Error('NEXT_PUBLIC_BASE_URL is not set in the environment variables.');
//     }
    
//     const link = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password/${token}`;

//     await sendMail(email, EmailTemplate.PasswordReset, { link });

//     return NextResponse.json({ message: '비밀번호 재설정 링크가 이메일로 전송되었습니다. 이메일을 확인해주세요.' }, { status: 200 });
//   } catch (error) {
//     console.error('Password reset request error:', error);
//     if (error instanceof Error) {
//       return NextResponse.json({ error: `비밀번호 재설정 요청 중 오류가 발생했습니다: ${error.message}` }, { status: 500 });
//     }
//     return NextResponse.json({ error: '비밀번호 재설정 요청 중 알 수 없는 오류가 발생했습니다.' }, { status: 500 });
//   }
// }
