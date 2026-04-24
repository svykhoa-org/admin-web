# Router

## Cấu trúc

```
src/router/
├── index.tsx        # Khai báo toàn bộ routes (React Router v7)
├── RoutePath.ts     # Single source of truth cho tất cả path
└── ProtectedRoute.tsx
```

## RoutePath — cách dùng

Mỗi route có 2 field cốt lõi:

| Field         | Dùng cho                                      | Ví dụ                             |
| ------------- | --------------------------------------------- | --------------------------------- |
| `route`       | Khai báo trong `index.tsx` (relative segment) | `'users'`, `':id'`                |
| `path`        | Navigation: `<Link to>`, `navigate()`         | `'/users'`, `'/users/:id'`        |
| `getPath(id)` | Navigation với dynamic param                  | `getPath('123')` → `'/users/123'` |

### Ví dụ

```tsx
// Navigation trong component
import { RoutePath } from '@/router/RoutePath'

// Link tĩnh
<Link to={RoutePath.UserPage.path}>Danh sách</Link>

// Link với param
<Link to={RoutePath.UserDetailPage.getPath(user.id)}>Chi tiết</Link>

// Programmatic navigation
navigate(RoutePath.UserCreatePage.path)
navigate(RoutePath.UserDetailPage.getPath(id))
```

### Khai báo trong router config (`index.tsx`)

```tsx
{
  path: RoutePath.UserPage.route,      // 'users'
  children: [
    { index: true, element: <UserListPage /> },
    { path: RoutePath.UserCreatePage.route, element: <UserCreatePage /> },   // 'create'
    { path: RoutePath.UserDetailPage.route, element: <UserDetailPage /> },   // ':id'
  ],
}
```

## Thêm route mới

**Bước 1** — Thêm vào `RoutePath.ts`:

```ts
// Với route tĩnh
NewPage: {
  route: 'new-page',
  path: '/new-page',
},

// Với route con có param
NewDetailPage: {
  route: ':id',
  path: '/new-page/:id',
  getPath: (id: string) => `/new-page/${id}`,
},
```

**Bước 2** — Đăng ký trong `index.tsx`:

```tsx
{
  path: RoutePath.NewPage.route,
  children: [
    { index: true, element: <NewListPage /> },
    { path: RoutePath.NewDetailPage.route, element: <NewDetailPage /> },
  ],
},
```

**Bước 3** — Tạo page component trong `src/pages/authentication/NewPage/`.

## Quy tắc đặt tên

- Key trong `RoutePath`: `<Domain>Page`, `<Domain>CreatePage`, `<Domain>DetailPage`, `<Domain>UpdatePage`
- `route`: kebab-case, không có `/` đầu (relative segment)
- `path`: kebab-case, có `/` đầu (absolute path)
