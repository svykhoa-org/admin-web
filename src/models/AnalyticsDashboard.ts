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

export interface AnalyticsDashboard {
  totalRevenue: number
  totalDocuments: number
  totalUsers: number
  newUsers: number
  totalDownloads: number
  revenueByDay: RevenueByDayItem[]
  downloadsByDay: DownloadsByDayItem[]
  topDocuments: TopDocumentItem[]
}
