// import { NextResponse } from 'next/server';
// import { verifyPasswordResetToken, hashPassword } from '@/lib/auth';
// import prisma from '@/lib/prisma';


// export async function POST(req: Request, { params }: { params: { token: string } }) {
//   try {
//     const { password } = await req.json();
//     const { token } = params;

//     const userId = await verifyPasswordResetToken(token);
//     if (!userId) {
//       return NextResponse.json({ error: '유효하지 않거나 만료된 토큰입니다.' }, { status: 400 });
//     }

//     const hashedPassword = await hashPassword(password);

//     await prisma.user.update({
//       where: { id: userId },
//       data: { passwordHash: hashedPassword },
//     });

//     await prisma.passwordResetToken.deleteMany({ where: { user_id: userId } });

//     return NextResponse.json({ message: '비밀번호가 성공적으로 재설정되었습니다.' }, { status: 200 });
//   } catch (error) {
//     console.error('Password reset error:', error);
//     return NextResponse.json({ error: '비밀번호 재설정 중 오류가 발생했습니다.' }, { status: 500 });
//   }
// }
