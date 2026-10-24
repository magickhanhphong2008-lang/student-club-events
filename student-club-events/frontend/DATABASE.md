# Thiết kế cơ sở dữ liệu - Student Hub

Tài liệu mô tả cơ sở dữ liệu của hệ thống quản lý câu lạc bộ và sinh viên.
Tên bảng và tên cột giữ bằng tiếng Anh để dùng trực tiếp trong code và SQL, phần giải thích viết bằng tiếng Việt.

## Sơ đồ quan hệ thực thể (ERD)

```mermaid
erDiagram
  FACULTY ||--o{ STUDENT : "có sinh viên"
  CATEGORY ||--o{ CLUB : "gồm"
  STUDENT ||--o{ CLUB_MEMBER : "tham gia"
  CLUB ||--o{ CLUB_MEMBER : "có thành viên"
  CLUB ||--o{ EVENT : "tổ chức"
  EVENT ||--o{ EVENT_REGISTRATION : "có đăng ký"
  STUDENT ||--o{ EVENT_REGISTRATION : "đăng ký"

  FACULTY {
    int faculty_id PK "Mã khoa"
    string name UK "Tên khoa"
  }
  STUDENT {
    int student_id PK "Mã sinh viên"
    string mssv UK "Mã số sinh viên"
    string full_name "Họ và tên"
    string email UK "Email trường"
    string phone "Số điện thoại"
    string class_name "Lớp"
    int faculty_id FK "Khoa"
    string password_hash "Mật khẩu đã mã hóa"
    string role "student hoặc admin"
    datetime created_at "Ngày tạo"
  }
  CATEGORY {
    int category_id PK "Mã lĩnh vực"
    string name UK "Tên lĩnh vực"
  }
  CLUB {
    int club_id PK "Mã câu lạc bộ"
    string name UK "Tên câu lạc bộ"
    int category_id FK "Lĩnh vực"
    string description "Mô tả"
    string schedule "Lịch sinh hoạt"
    int fee "Phí tham gia (đồng)"
    string contact_email "Email liên hệ"
    string icon "Biểu tượng"
    datetime created_at "Ngày tạo"
  }
  CLUB_MEMBER {
    int club_id PK, FK "Mã câu lạc bộ"
    int student_id PK, FK "Mã sinh viên"
    string role "member hoặc leader"
    string status "pending, active hoặc left"
    datetime joined_at "Ngày tham gia"
  }
  EVENT {
    int event_id PK "Mã sự kiện"
    int club_id FK "Câu lạc bộ tổ chức"
    string title "Tên sự kiện"
    date event_date "Ngày diễn ra"
    time start_time "Giờ bắt đầu"
    time end_time "Giờ kết thúc"
    string location "Địa điểm"
    int capacity "Số chỗ tối đa"
  }
  EVENT_REGISTRATION {
    int event_id PK, FK "Mã sự kiện"
    int student_id PK, FK "Mã sinh viên"
    string status "registered, cancelled hoặc attended"
    datetime registered_at "Ngày đăng ký"
  }
```

Chú thích ký hiệu: `PK` là khóa chính, `FK` là khóa ngoại, `UK` là giá trị không được trùng.

## Từ điển dữ liệu

### FACULTY - Khoa

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| faculty_id | int | PK | Mã khoa |
| name | string | UK | Tên khoa |

### STUDENT - Sinh viên

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| student_id | int | PK | Mã sinh viên |
| mssv | string | UK | Mã số sinh viên (6-12 chữ số) |
| full_name | string | | Họ và tên |
| email | string | UK | Email trường |
| phone | string | | Số điện thoại |
| class_name | string | | Lớp |
| faculty_id | int | FK | Khoa của sinh viên |
| password_hash | string | | Mật khẩu đã mã hóa, không lưu mật khẩu thô |
| role | string | | `student` hoặc `admin` |
| created_at | datetime | | Ngày tạo tài khoản |

### CATEGORY - Lĩnh vực câu lạc bộ

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| category_id | int | PK | Mã lĩnh vực |
| name | string | UK | Học thuật, Thể thao, Nghệ thuật, Cộng đồng |

### CLUB - Câu lạc bộ

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| club_id | int | PK | Mã câu lạc bộ |
| name | string | UK | Tên câu lạc bộ |
| category_id | int | FK | Lĩnh vực |
| description | string | | Mô tả ngắn |
| schedule | string | | Lịch sinh hoạt |
| fee | int | | Phí tham gia mỗi học kỳ (đồng), 0 là miễn phí |
| contact_email | string | | Email liên hệ |
| icon | string | | Biểu tượng hiển thị trên thẻ |
| created_at | datetime | | Ngày tạo |

### CLUB_MEMBER - Thành viên câu lạc bộ

Bảng trung gian giữa sinh viên và câu lạc bộ (quan hệ nhiều-nhiều).
Khóa chính ghép `(club_id, student_id)` đảm bảo một sinh viên không tham gia cùng một câu lạc bộ hai lần.

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| club_id | int | PK, FK | Mã câu lạc bộ |
| student_id | int | PK, FK | Mã sinh viên |
| role | string | | `member` (thành viên) hoặc `leader` (chủ nhiệm) |
| status | string | | `pending` (chờ duyệt), `active` (đang tham gia), `left` (đã rời) |
| joined_at | datetime | | Ngày tham gia |

### EVENT - Sự kiện

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| event_id | int | PK | Mã sự kiện |
| club_id | int | FK | Câu lạc bộ tổ chức |
| title | string | | Tên sự kiện |
| event_date | date | | Ngày diễn ra |
| start_time | time | | Giờ bắt đầu |
| end_time | time | | Giờ kết thúc |
| location | string | | Địa điểm |
| capacity | int | | Số chỗ tối đa |

### EVENT_REGISTRATION - Đăng ký sự kiện

Bảng trung gian giữa sinh viên và sự kiện (quan hệ nhiều-nhiều).
Khóa chính ghép `(event_id, student_id)` đảm bảo một sinh viên chỉ đăng ký một lần cho mỗi sự kiện.

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| event_id | int | PK, FK | Mã sự kiện |
| student_id | int | PK, FK | Mã sinh viên |
| status | string | | `registered` (đã đăng ký), `cancelled` (đã hủy), `attended` (đã tham dự) |
| registered_at | datetime | | Ngày đăng ký |

## Quy tắc nghiệp vụ

- Hủy đăng ký hoặc rời câu lạc bộ chỉ đổi cột `status`, không xóa dòng, để giữ lại lịch sử.
- Số thành viên của một câu lạc bộ bằng số dòng `CLUB_MEMBER` có `status = 'active'`.
- Số chỗ còn lại của sự kiện bằng `capacity` trừ số dòng `EVENT_REGISTRATION` có `status = 'registered'`. Khi số này bằng 0, không cho đăng ký thêm.
- Chỉ tài khoản có `role = 'admin'` được thêm, sửa, xóa câu lạc bộ và sự kiện.

## Đối chiếu với mã nguồn hiện tại

| Trong `script.js` | Bảng tương ứng |
|---|---|
| Mảng `CLUBS` và đối tượng `DETAILS` | `CLUB` và `CATEGORY` |
| Mảng `EVENTS` | `EVENT` |
| Khóa `sh_clubs` trong `localStorage` | `CLUB_MEMBER` |
| Khóa `sh_events` trong `localStorage` | `EVENT_REGISTRATION` |
| Khóa `sh_profile` trong `localStorage` | `STUDENT` |
