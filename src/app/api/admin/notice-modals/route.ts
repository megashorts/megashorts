import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { USER_ROLE } from '@/lib/constants';

export async function GET() {
  try {
    const modals = await prisma.noticeModal.findMany({
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    return Response.json(modals);
  } catch (error) {
    console.error('Failed to fetch modals:', error);
    return Response.json(
      { error: 'Failed to fetch modals' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await validateRequest();
    if (!user || user.userRole < USER_ROLE.OPERATION1) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    console.log('Creating modal with data:', JSON.stringify(data, null, 2));

    const modal = await prisma.noticeModal.create({
      data: {
        ...data,
        isActive: true,
        createdBy: user.username
      }
    });

    console.log('Created modal:', JSON.stringify(modal, null, 2));
    return Response.json(modal);
  } catch (error) {
    console.error('Failed to create modal:', error);
    return Response.json(
      { error: 'Failed to create modal' },
      { status: 500 }
    );
  }
}
