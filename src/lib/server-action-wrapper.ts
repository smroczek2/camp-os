import { getSession } from './auth-helper';

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function withAuth<T>(
  handler: (userId: string, role: string) => Promise<T>
): Promise<ActionResult<T>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }
  try {
    const result = await handler(session.user.id, session.user.role);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function withAdminAuth<T>(
  handler: (userId: string) => Promise<T>
): Promise<ActionResult<T>> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }
  if (session.user.role !== 'admin') {
    return { success: false, error: "Admin access required" };
  }
  try {
    const result = await handler(session.user.id);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
