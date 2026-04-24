# FormHandler

`FormHandler` là tầng abstraction cho form CRUD dựa trên `react-hook-form` + `zod` + `antd`.

Mục tiêu chính:

- Giảm boilerplate khi tạo form mới.
- Chuẩn hoá lifecycle submit/success/error.
- Giữ type-safety giữa schema, field name và giá trị submit.
- Tách bạch phần render field theo `type` để mở rộng dễ.

## Ý tưởng thiết kế

`FormHandler` đi theo mô hình `render-props`:

- Core chịu trách nhiệm setup form, validate schema, submit và trạng thái (`isSubmitting`, `isDirty`, `isValid`).
- Consumer chỉ định nghĩa UI form qua `children`, nhận lại component `Field` đã bind sẵn `control`.

Điểm đáng chú ý:

- Field-level binding dùng `useController` để tránh re-render toàn form.
- `required` có thể tự suy ra từ `zod schema` theo `dot-path`.
- `fieldRegistry` tách map `type -> renderer`, giúp thêm loại input mới mà không đụng vào logic form core.
- `FormHeader` đọc loading từ store chung bằng `formId`, giúp nút submit/cancel sync với trạng thái submit.

## Cấu trúc file và ý nghĩa

- `FormHandler.tsx`
  - Component core của hệ thống form.
  - Setup `useForm` với `zodResolver`.
  - Xử lý `onSubmit`, `onSuccess`, `onError`, notification và `resetOnSuccess`.
  - Tạo `Field` wrapper để inject `control`, `disabled`, `required`.
  - Đồng bộ `isSubmitting` sang `formHandlerStore` khi có `formId`.

- `FormField.tsx`
  - Render một field đơn lẻ thông qua `useController`.
  - Lấy renderer từ `fieldRegistry` theo `type`.
  - Chuẩn hoá lỗi hiển thị qua `Form.Item` (`validateStatus`, `help`).

- `FieldRegistry/fieldRegistry.tsx`
  - Registry renderers cho các field type hiện có: `text`, `email`, `password`, `textarea`, `number`, `date`, `checkbox`, `price`.
  - Chuẩn hoá mapping value đặc thù:
    - `date`: `string ISO <-> dayjs`.
    - `checkbox`: `checked <-> boolean`.
    - `price`: bọc qua `PriceInput`.

- `FieldRegistry/fieldTypes.ts`
  - Định nghĩa discriminated union cho `FieldTypeConfig`.
  - Chặn override các prop do form quản lý (`value`, `onChange`, `onBlur`, `disabled`, `placeholder`).
  - Cung cấp utility type `FieldPropsOf<T>` để renderer có type đúng theo `type`.

- `FormHeader.tsx`
  - Header dùng chung cho create/update form.
  - Tự đổi title/button theo `isEditMode`.
  - Đọc loading state từ store để khoá `cancel` và hiển thị loading submit.

- `formHandlerStore.ts`
  - Store Zustand đơn giản cho `formLoadings: Record<formId, boolean>`.
  - Dùng để đồng bộ loading giữa `FormHandler` và `FormHeader`.

- `index.ts`
  - Public exports cho các thành phần và type chính.

## Cách dùng cơ bản

```tsx
import { z } from 'zod'
import { FormHandler } from '@/components/FormHandler'

const courseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  email: z.string().email(),
  isPublished: z.boolean(),
  price: z.number().min(0),
})

export function CourseForm() {
  return (
    <FormHandler
      schema={courseSchema}
      defaultValues={{
        title: '',
        email: '',
        isPublished: false,
        price: 0,
      }}
      formId="course-form"
      entityName="Course"
      onSubmit={async values => {
        // values đã là schema output type
        return await apiCreateCourse(values)
      }}
    >
      {({ Field, isSubmitting, isValid }) => (
        <>
          <Field name="title" label="Title" type="text" />
          <Field name="email" label="Contact email" type="email" />
          <Field name="isPublished" label="Published" type="checkbox" />
          <Field name="price" label="Price" type="price" fieldProps={{ currency: 'VND' }} />

          {/* Có thể dùng state để custom UI ngoài Field */}
          <div>{isSubmitting ? 'Submitting...' : isValid ? 'Ready' : 'Invalid'}</div>
        </>
      )}
    </FormHandler>
  )
}
```

## API chính

### `FormHandler`

Props quan trọng:

- `schema`: `ZodObject` dùng để validate và infer type.
- `defaultValues`: giá trị khởi tạo cho form.
- `onSubmit(values)`: bắt buộc, trả về `Promise<TResponse>`.
- `onSuccess(response)`, `onError(error)`: callback tuỳ chọn.
- `onInvalidSubmit`: handler khi submit invalid.
- `resetOnSuccess`: reset form sau submit thành công.
- `showNotification`: bật/tắt toast mặc định.
- `disabled`: khoá toàn bộ form.
- `formId`, `entityName`, `isEditMode`, `onCancel`: dùng cho `FormHeader`.

Render-props trả về:

- `Field`: component field đã bind sẵn `control`.
- `isSubmitting`, `isDirty`, `isValid`, `isDisabled`.

### `Field` (từ render-props)

Common props:

- `name`: path đúng với schema input (`Path<TValues>`).
- `type`: loại field (discriminated union).
- `label`, `placeholder`, `required`, `disabled`, `className`, `tooltip`.
- `fieldProps`: props riêng theo từng `type`.

Lưu ý:

- `required` nếu không truyền sẽ được suy ra từ schema.
- `placeholder` mặc định fallback về `label`.
- Khi form đang submit, field tự disable.

## Cơ chế infer `required`

`FormHandler` dùng `inferRequired(schema, dotPath)` để tự xác định field bắt buộc:

- Field top-level không phải `ZodOptional` => required.
- Với nested path (vd `video.url`), nếu parent là optional object thì sẽ unwrap rồi kiểm tra field con.

Điều này giúp giữ UX chính xác trong các section optional nhưng field con vẫn bắt buộc khi section được render.

## Mở rộng thêm field type mới

1. Thêm type mới vào `FieldRegistry/fieldTypes.ts`.
2. Khai báo `fieldProps` cho type đó (đã omit các managed props).
3. Thêm renderer tương ứng vào `FieldRegistry/fieldRegistry.tsx`.
4. Dùng ngay trong form qua `<Field type="newType" ... />`.

Không cần sửa `FormField.tsx` hay `FormHandler.tsx` nếu tuân theo contract hiện có.

## Khi nào dùng FormHandler

Nên dùng khi:

- Form CRUD chuẩn cần validation theo schema.
- Muốn tái sử dụng patterns submit + notification + loading.
- Cần type-safety xuyên suốt từ schema đến field.

Có thể không cần khi:

- Form siêu đơn giản, không cần resolver/schema.
- UI đặc thù cần control hoàn toàn custom cho từng input.
