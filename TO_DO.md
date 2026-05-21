1. Hiện tại phần xem video qua api stream dành cho admin vẫn đang bị lỗi

```
:3000/api/v1/videos/b03ec1cc-7d5c-4cb3-816e-602d0c88be6a/stream-url:1  Failed to load resource: the server responded with a status of 404 (Not Found)Understand this error
API: http://localhost:3000/api/v1/videos/b03ec1cc-7d5c-4cb3-816e-602d0c88be6a/stream-url
{
    "statusCode": 404,
    "message": "Không tìm thấy video hoặc chưa có file",
    "error": "Not Found",
    "requestId": "c44d29a3-6788-4160-b243-b8668dc70546",
    "timestamp": "2026-05-20T23:38:55.565Z",
    "path": "/api/v1/videos/b03ec1cc-7d5c-4cb3-816e-602d0c88be6a/stream-url"
}
```

- Kiểm tra lại BE xem tại sao lại bị lỗi Not Found
- Hiện chưa có phần FFMGE cho BE nên khi upload thành công là video đã cần chuyển qua Ready để sử dụng

2. Phần upload tài liệu cũng đang gặp vấn đề

- Để upload là mặc định ( thay cho chọn tài liệu đang có trong hệ thông )
- Sau khi tải tài liệu thì báo lỗi không hiển thị được

```
http://localhost:3000/api/v1/documents
{
    "statusCode": 404,
    "message": "Resource with ID \"08ba54c8-839c-4936-8baf-0908788edd0f\" not found",
    "error": "Not Found",
    "requestId": "dfb796d6-8b44-4056-86d5-b58f7cff3120",
    "timestamp": "2026-05-20T23:42:20.270Z",
    "path": "/api/v1/documents"
}
```

Trước đó có 1 api trả về như sau:

```
http://localhost:3000/api/v1/assets/08ba54c8-839c-4936-8baf-0908788edd0f/url?expires=900
{
    "statusCode": 200,
    "message": "Lấy URL truy cập thành công",
    "data": {
        "url": "/svykhoa/assets/documents/08ba54c8-839c-4936-8baf-0908788edd0f/4.%20Booklet.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=minioadmin%2F20260520%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260520T234220Z&X-Amz-Expires=900&X-Amz-SignedHeaders=host&X-Amz-Signature=9ff5c53314ce3363011aea77a01100fb26529030f93ea59a3bc4927f15013bfb"
    },
    "requestId": "0c1675dc-726b-4888-bc75-f4fd631d3f6c",
    "timestamp": "2026-05-20T23:42:20.262Z"
}
```

3. Phần thông báo sau khi upload video thành công

```
Upload hoàn tất
quản lý siêu thị.mp4

```

- Cần điều chỉnh lại vì nó đang bị có 1 khoảng trắng phía top, nên để nó lên trên thay vì để ở bottom

4. Update hiển thị danh mục module, bài học

- Không cần hiện content ID vì sẽ không ai hiểu, cần hiển thị các thông tin hữu ích như ngày giờ tạo, ...
- Với từng loại:
  - Quiz: Cần hiển thị bản preview cho quiz không phải hiển thị "Quiz đã được tạo Quiz ID: 18ddb15e-4447-4ea7-a196-e3ffc51c79ea" => Hiển thị preview cho quiz & các thông tin như điểm số ( chỗ này cần hiển thị để người dùng xem giống 1 bài thi ) & có nút "Chỉnh sửa" => khi đó mới sang trang chỉnh sửa
  - Tài liệu & Video thì lỗi ở phần 1-2

5. Tạo danh mục mới

- Phần này tôi muốn chỗ icon mình có thể để họ chọn thay vì bắt họ ghi - Tìm hiểu xem Antd có hỗ trợ phần nào cho chọn icon không
- Fallback nếu không có thì làm selection chọn icon - Icon thì tạm thời để khoảng 10 cái liên quan tới y tế.

6. DataTable

- Mục này đang sai `Hiển thị từ {from} đến {to} của {total} bản ghi` vì chưa được điền số vào

NOTE: Mục tiêu chính là update giao diện và các hành động trên giao diện trở nên chuẩn xác với logic nghiệp vụ. Nhưng cần check cả phần BE để xem cách thực hiện ở server và ứng dụng cho FE. Nếu thiếu có thể sửa BE.
