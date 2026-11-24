const roleAccess = {
  student: [
    "/dashboard",
    "/laundry",
    "/notifications",
    "/disputes",
  ],

  staff: [
    "/dashboard",
    "/staff",
    "/batches",
    "/notifications",
    "/disputes",
  ],

  admin: [
    "/dashboard",
    "/admin",
    "/staff",
    "/batches",
    "/notifications",
    "/disputes",
  ],
};

export function canAccess(role, pathname) {
  if (!role || !pathname) {
    return false;
  }

  const allowedPages = roleAccess[role];

  if (!allowedPages) {
    return false;
  }

  return allowedPages.some(
    (page) =>
      pathname === page ||
      pathname.startsWith(`${page}/`)
  );
}

export default roleAccess;