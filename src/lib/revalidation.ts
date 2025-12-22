import { revalidatePath } from 'next/cache';

export const PATHS = {
  admin: ["/dashboard/admin", "/dashboard/admin/programs", "/dashboard/admin/forms"],
  parent: ["/dashboard/parent"],
  nurse: ["/dashboard/nurse"],
  staff: ["/dashboard/staff"],
} as const;

export function revalidateAdmin() {
  PATHS.admin.forEach(path => revalidatePath(path));
}

export function revalidateParent() {
  PATHS.parent.forEach(path => revalidatePath(path));
}
