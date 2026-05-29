export interface RevenueByDayItem {
  date: string
  documentRevenue: number
  courseRevenue: number
  total: number
}

export interface DownloadsByDayItem {
  date: string
  count: number
}

export interface TopDocumentItem {
  documentId: string
  title: string
  sales: number
  revenue: number
}

export interface TopCourseItem {
  courseId: string
  title: string
  enrollments: number
  revenue: number
}

export interface AnalyticsDashboard {
  totalRevenue: number
  totalDocuments: number
  totalUsers: number
  newUsers: number
  totalDownloads: number
  revenueByDay: RevenueByDayItem[]
  downloadsByDay: DownloadsByDayItem[]
  topDocuments: TopDocumentItem[]
  pendingOrders: number
  totalActiveEnrollments: number
  newEnrollments: number
  totalPublishedCourses: number
  enrollmentsByDay: { date: string; count: number }[]
  topCourses: TopCourseItem[]
}
