## Quy ước i18n

Tài liệu này dùng để chuẩn hóa cách tổ chức locale trong dự án, giúp khi thêm mới không bị lệch format.

## 1) Cấu trúc nhóm locale

- `_index`: file gom và export lại các nhóm locale.
- `CommonLocales`: các từ/cụm từ dùng chung nhiều nơi.
- `ComponentLocales`: locale cho component dùng lại.
- `ModelLocales`: locale cho field/trạng thái trong model.
- `Page...Locales`: locale riêng cho từng trang (thêm tiền tố `Page`).

## 2) Quy ước đặt tên

- Tên group: `UpperCamelCase`.
- Tên key bên trong group: `lowercase_with_underscore`.
- Không dùng khoảng trắng, không dùng kebab-case (`-`), không dùng camelCase cho key.

Ví dụ group hợp lệ:

- `CourseStatus`
- `Table`
- `PageCourseDetail`

Ví dụ key hợp lệ:

- `draft`
- `published_at`
- `created_by`

Ví dụ key không hợp lệ:

- `PublishedAt`
- `publishedAt`
- `published-at`

## 3) Mẫu khai báo chuẩn

```ts
export const CourseLocales = {
  CourseStatus: {
    draft: 'Bản nháp',
    published: 'Đã xuất bản',
    archived: 'Đã lưu trữ',
    published_at: 'Ngày xuất bản',
  },
}
```

## 4) Checklist khi thêm locale mới

- Chọn đúng group theo ngữ cảnh (Common/Component/Model/Page).
- Đặt tên group theo `UpperCamelCase`.
- Đặt tất cả key theo `lowercase_with_underscore`.
- Tránh trùng nghĩa giữa `CommonLocales` và locale đặc thù từng trang.
- Cập nhật `_index` để export nếu có thêm file/group mới.
