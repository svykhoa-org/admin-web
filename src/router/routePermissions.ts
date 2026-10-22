import { Permission } from '@/models/Permission'

// Admin module that owns each route prefix — drives both the side menu and the
// in-layout 403 page. Longest prefix wins; `/` matches the dashboard only.
const ROUTE_PERMISSIONS: [prefix: string, permission: Permission][] = [
  ['/users', Permission.Users],
  ['/verifications', Permission.Verification],
  ['/courses', Permission.Courses],
  ['/course-categories', Permission.Courses],
  ['/course-tags', Permission.Courses],
  ['/enrollments', Permission.Courses],
  ['/certificates', Permission.Courses],
  ['/quizzes', Permission.Courses],
  ['/videos', Permission.Courses],
  ['/articles', Permission.Articles],
  ['/article-categories', Permission.Articles],
  ['/bulletins', Permission.Bulletins],
  ['/bulletin-categories', Permission.Bulletins],
  ['/documents', Permission.Documents],
  ['/document-classify', Permission.Documents],
  ['/document-licenses', Permission.Documents],
  ['/orders', Permission.Orders],
  ['/forum', Permission.Forum],
  ['/settings', Permission.SiteSettings],
]

export const getRoutePermission = (pathname: string): Permission | undefined => {
  if (pathname === '/') return Permission.Analytics
  return ROUTE_PERMISSIONS.filter(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  ).sort(([a], [b]) => b.length - a.length)[0]?.[1]
}
