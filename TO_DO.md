1. Đọc các model về course => Phân tích xem các trường nào cần dùng ở table thì hiển thị ra, cần đánh giá về giá trị hiển thị có phù hợp với người dùng không => hiện. Ví dụ khoá học có thể hiển thị tag ra nữa, nhưng trong chứng chỉ việc hiển thị id người dùng ra khiến việc đọc khó khăn => cần hiện tên người dùng
2. Đọc các model và xem các trường bắt buộc, các trường cần người dùng điền cần thêm vào các form ( nếu bắt buộc thì cần có \* và cần validate chuẩn ). Một số case BE xử lý thì không nên hiện ví dụ, slug hoặc code
3. Tag khoá học, thay vì phải điền text màu lúc tạo / sửa . Tôi muốn được chọn màu
4. Với danh mục khoá học, field khoá học trong table => 2 đã xuất bản / 10
5. Khi upload video xong cần có phần xem video, vì đây là web admin nên cần expose 1 api để lấy url private từ minio => đưa vào xem được video khi tải lên. Còn phía người dùng sẽ xử lý sau
6. Cần cho phép update các câu trong bài thi khi vào chế độ xem và update ( bài thi là 1 phần của lesson ).
7. Phần document trong khoá học ( 1 phần của lesson ), ngoài việc chọn file trong hệ thống, thì cũng cần upload lên được

NOTE: Mục tiêu chính là update giao diện và các hành động trên giao diện trở nên chuẩn xác với logic nghiệp vụ. Nhưng cần check cả phần BE để xem cách thực hiện ở server và ứng dụng cho FE. Nếu thiếu có thể sửa BE.
