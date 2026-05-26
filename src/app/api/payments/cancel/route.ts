import { validateRequest } from '@/auth';

export async function POST() {
  try {
    const { user } = await validateRequest();
    if (!user || user.userRole < 15) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return Response.json(
      {
        success: false,
        error: 'External payment cancellation is not implemented for the next global payment provider yet.',
      },
      { status: 501 }
    );
  } catch (err) {
    const error = err as Error;
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
