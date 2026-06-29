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

  // Course Category
  CourseCategoryPage: {
    route: 'course-categories',
    path: '/course-categories',
  },
  CourseCategoryCreatePage: {
    route: 'create',
    path: '/course-categories/create',
  },
  CourseCategoryDetailPage: {
    route: ':id',
    path: '/course-categories/:id',
    getPath: (id: string) => `/course-categories/${id}`,
  },

  // Course Tag
  CourseTagPage: {
    route: 'course-tags',
    path: '/course-tags',
  },
  CourseTagCreatePage: {
    route: 'create',
    path: '/course-tags/create',
  },
  CourseTagDetailPage: {
    route: ':id',
    path: '/course-tags/:id',
    getPath: (id: string) => `/course-tags/${id}`,
  },

  // Quiz
  QuizDetailPage: {
    route: 'quizzes/:id',
    path: '/quizzes/:id',
    getPath: (id: string) => `/quizzes/${id}`,
  },

  // Enrollment
  EnrollmentPage: {
    route: 'enrollments',
    path: '/enrollments',
  },
  EnrollmentDetailPage: {
    route: ':id',
    path: '/enrollments/:id',
    getPath: (id: string) => `/enrollments/${id}`,
  },

  // Certificate
  CertificatePage: {
    route: 'certificates',
    path: '/certificates',
  },

  // Order
  OrderPage: {
    route: 'orders',
    path: '/orders',
  },
  OrderDetailPage: {
    route: ':id',
    path: '/orders/:id',
    getPath: (id: string) => `/orders/${id}`,
  },

  // Video Library
  VideoLibraryPage: {
    route: 'videos',
    path: '/videos',
  },

  // Settings
  SettingsPage: {
    route: 'settings',
    path: '/settings',
  },
  GeneralSettingsPage: {
    route: 'general',
    path: '/settings/general',
  },
}
