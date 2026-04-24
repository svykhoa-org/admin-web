export const RoutePath = {
  // Course
  CoursePage: {
    route: 'courses',
    path: '/courses',
  },
  CourseCreatePage: {
    route: 'create',
    path: '/courses/create',
  },
  CourseDetailPage: {
    route: ':id',
    path: '/courses/:id',
    getPath: (id: string) => `/courses/${id}`,
  },

  // Document Classify
  DocumentClassifyPage: {
    route: 'document-classify',
    path: '/document-classify',
  },
  DocumentClassifyCreatePage: {
    route: 'create',
    path: '/document-classify/create',
  },
  DocumentClassifyUpdatePage: {
    route: ':id/edit',
    path: '/document-classify/:id/edit',
    getPath: (id: string) => `/document-classify/${id}/edit`,
  },

  // Document
  DocumentPage: {
    route: 'documents',
    path: '/documents',
  },
  DocumentCreatePage: {
    route: 'create',
    path: '/documents/create',
  },
  DocumentUpdatePage: {
    route: ':id/edit',
    path: '/documents/:id/edit',
    getPath: (id: string) => `/documents/${id}/edit`,
  },

  // Document Order
  DocumentOrderPage: {
    route: 'document-orders',
    path: '/document-orders',
  },
  DocumentOrderDetailPage: {
    route: ':id',
    path: '/document-orders/:id',
    getPath: (id: string) => `/document-orders/${id}`,
  },

  // Document License
  DocumentLicensePage: {
    route: 'document-licenses',
    path: '/document-licenses',
  },
  DocumentLicenseDetailPage: {
    route: ':id',
    path: '/document-licenses/:id',
    getPath: (id: string) => `/document-licenses/${id}`,
  },

  // User
  UserPage: {
    route: 'users',
    path: '/users',
  },
  UserCreatePage: {
    route: 'create',
    path: '/users/create',
  },
  UserDetailPage: {
    route: ':id',
    path: '/users/:id',
    getPath: (id: string) => `/users/${id}`,
  },
}
