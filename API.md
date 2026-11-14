# API Design - Student Club Events

Hệ thống quản lý **câu lạc bộ** và **sinh viên**, cùng các **sự kiện diễn ra trong tuần & tháng**.

**Nhóm 12**
- Võ Hoàng Khánh Phong - 2606042061
- Nguyễn Hồ Minh Long - 2613042004

Các CLB trong hệ thống: CLB Công nghệ IT, CLB Bóng đá, CLB Truyền thông, CLB Tiếng Anh.

---

## 1. Quy ước chung

| Mục | Nội dung |
|---|---|
| Base URL | `/api/v1` |
| Định dạng dữ liệu | JSON (`Content-Type: application/json`) |
| Đặt tên field | `snake_case` |
| Xác thực | JWT, header `Authorization: Bearer <token>` |
| Thời gian | ISO 8601, múi giờ Việt Nam, ví dụ `2026-11-12T18:00:00+07:00` |
| Phân trang | `?page=1&limit=20` |

### Vai trò (roles)

| Role | Mô tả |
|---|---|
| `admin` | Quản trị hệ thống, quản lý toàn bộ sinh viên, CLB, sự kiện |
| `club_leader` | Chủ nhiệm CLB, quản lý thành viên và sự kiện của CLB mình |
| `student` | Sinh viên, xem CLB/sự kiện, đăng ký tham gia |

### Cấu trúc response

Thành công:

```json
{
  "data": {},
  "meta": { "page": 1, "limit": 20, "total": 57 }
}
```

Lỗi (mọi API đều trả về cùng một cấu trúc này):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "status": 400,
    "details": [
      { "field": "email", "message": "Email không đúng định dạng" }
    ],
    "timestamp": "2026-11-07T10:15:30+07:00",
    "path": "/api/v1/auth/login"
  }
}
```

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `error.code` | string | có | Mã lỗi cố định dạng `UPPER_SNAKE_CASE`, frontend dùng để xử lý logic |
| `error.message` | string | có | Thông báo tiếng Việt, hiển thị cho người dùng |
| `error.status` | number | có | Mã HTTP tương ứng |
| `error.details` | array | không | Chi tiết lỗi theo từng field, chỉ có khi lỗi là `VALIDATION_ERROR` |
| `error.details[].field` | string | có (trong details) | Tên field bị lỗi, ví dụ `email`, `password` |
| `error.details[].message` | string | có (trong details) | Mô tả lỗi của field đó |
| `error.timestamp` | string | có | Thời điểm xảy ra lỗi |
| `error.path` | string | có | Đường dẫn endpoint gọi bị lỗi |

### Mã trạng thái HTTP

| Mã | Ý nghĩa |
|---|---|
| 200 | Thành công |
| 201 | Tạo mới thành công |
| 204 | Xóa thành công, không có nội dung trả về |
| 400 | Dữ liệu gửi lên không hợp lệ |
| 401 | Chưa đăng nhập hoặc token hết hạn |
| 403 | Không đủ quyền |
| 404 | Không tìm thấy tài nguyên |
| 409 | Xung đột (đã đăng ký rồi, sự kiện đã đầy, trùng email...) |
| 500 | Lỗi máy chủ |

---

## 2. Mô hình dữ liệu

```
students (id, student_code, full_name, email, phone, faculty, class_name, password_hash, role, created_at)
clubs (id, name, description, category, created_at)
club_members (club_id, student_id, role, status, joined_at)
events (id, club_id, title, description, location, start_time, end_time, max_participants, status, created_at)
event_registrations (event_id, student_id, registered_at, attended)
```

Quan hệ:
- Một sinh viên tham gia nhiều CLB, một CLB có nhiều sinh viên (`club_members`)
- Một CLB tổ chức nhiều sự kiện (`events`)
- Một sinh viên đăng ký nhiều sự kiện, một sự kiện có nhiều người đăng ký (`event_registrations`)

---

## 3. Danh sách endpoint

### 3.1 Auth

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/auth/register` | Đăng ký tài khoản sinh viên |
| POST | `/auth/login` | Đăng nhập, trả về access token và refresh token |
| POST | `/auth/refresh` | Dùng refresh token để lấy access token mới |
| POST | `/auth/logout` | Đăng xuất, vô hiệu hóa refresh token |
| GET | `/auth/me` | Lấy thông tin người đang đăng nhập |
| PUT | `/auth/change-password` | Đổi mật khẩu (cần đăng nhập) |
| POST | `/auth/forgot-password` | Gửi email đặt lại mật khẩu |
| POST | `/auth/reset-password` | Đặt mật khẩu mới bằng token trong email |

Chi tiết request/response và các lỗi đăng nhập xem ở mục 5.

### 3.2 Students (Sinh viên)

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| GET | `/students` | admin | Danh sách sinh viên. Lọc: `?q=&faculty=&class_name=` |
| POST | `/students` | admin | Thêm sinh viên |
| GET | `/students/{id}` | admin, chính chủ | Xem chi tiết |
| PUT | `/students/{id}` | admin, chính chủ | Cập nhật thông tin |
| DELETE | `/students/{id}` | admin | Xóa sinh viên |
| GET | `/students/{id}/clubs` | admin, chính chủ | CLB mà sinh viên đã tham gia |
| GET | `/students/{id}/events` | admin, chính chủ | Sự kiện sinh viên đã đăng ký |

### 3.3 Clubs (Câu lạc bộ)

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| GET | `/clubs` | mọi người | Danh sách CLB. Lọc: `?q=&category=` |
| POST | `/clubs` | admin | Tạo CLB |
| GET | `/clubs/{id}` | mọi người | Chi tiết CLB |
| PUT | `/clubs/{id}` | admin, club_leader | Cập nhật CLB |
| DELETE | `/clubs/{id}` | admin | Xóa CLB |
| GET | `/clubs/{id}/members` | admin, club_leader | Danh sách thành viên |
| POST | `/clubs/{id}/members` | student, club_leader | Xin tham gia / thêm thành viên |
| PATCH | `/clubs/{id}/members/{student_id}` | club_leader | Duyệt đơn, đổi vai trò thành viên |
| DELETE | `/clubs/{id}/members/{student_id}` | club_leader, chính chủ | Rời CLB / xóa thành viên |
| GET | `/clubs/{id}/events` | mọi người | Sự kiện của CLB |

### 3.4 Events (Sự kiện)

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| GET | `/events` | mọi người | Danh sách sự kiện |
| POST | `/events` | admin, club_leader | Tạo sự kiện |
| GET | `/events/{id}` | mọi người | Chi tiết sự kiện |
| PUT | `/events/{id}` | admin, club_leader | Cập nhật sự kiện |
| DELETE | `/events/{id}` | admin, club_leader | Hủy / xóa sự kiện |
| GET | `/events/week` | mọi người | Sự kiện trong tuần |
| GET | `/events/month` | mọi người | Sự kiện trong tháng |
| POST | `/events/{id}/registrations` | student | Đăng ký tham gia |
| GET | `/events/{id}/registrations` | admin, club_leader | Danh sách đăng ký |
| DELETE | `/events/{id}/registrations/{student_id}` | student, club_leader | Hủy đăng ký |
| POST | `/events/{id}/attendance` | club_leader | Điểm danh |

**Query params**

- `GET /events`: `?club_id=&from=2026-11-01&to=2026-11-30&status=upcoming&q=`
- `GET /events/week` và `GET /events/month`: `?date=2026-11-07` (xem tuần/tháng chứa ngày đó, mặc định là hôm nay) và `?club_id=`

**Giá trị `status` của sự kiện:** `upcoming`, `ongoing`, `finished`, `cancelled`

---

## 4. Ví dụ request / response

### Đăng nhập

`POST /api/v1/auth/login`

```json
{
  "email": "phong@example.com",
  "password": "matkhau123"
}
```

Response `200`:

```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "d1f4c0a8-7b3e-4f6a-9e21-...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": 1,
      "full_name": "Võ Hoàng Khánh Phong",
      "email": "phong@example.com",
      "role": "student"
    }
  }
}
```

Các trường lỗi khi đăng nhập thất bại xem tại mục 5.

### Tạo CLB

`POST /api/v1/clubs`

```json
{
  "name": "CLB Công nghệ IT",
  "description": "Chia sẻ kiến thức lập trình, tổ chức workshop",
  "category": "technology"
}
```

Response `201`:

```json
{
  "data": {
    "id": 1,
    "name": "CLB Công nghệ IT",
    "description": "Chia sẻ kiến thức lập trình, tổ chức workshop",
    "category": "technology",
    "member_count": 0
  }
}
```

### Tạo sự kiện

`POST /api/v1/events`

```json
{
  "club_id": 1,
  "title": "Workshop Git & GitHub",
  "description": "Hướng dẫn làm việc nhóm với Git",
  "location": "Phòng B2.05",
  "start_time": "2026-11-12T18:00:00+07:00",
  "end_time": "2026-11-12T20:00:00+07:00",
  "max_participants": 50
}
```

Response `201`:

```json
{
  "data": {
    "id": 7,
    "club_id": 1,
    "title": "Workshop Git & GitHub",
    "location": "Phòng B2.05",
    "start_time": "2026-11-12T18:00:00+07:00",
    "end_time": "2026-11-12T20:00:00+07:00",
    "max_participants": 50,
    "registered_count": 0,
    "status": "upcoming"
  }
}
```

### Xem sự kiện trong tuần

`GET /api/v1/events/week?date=2026-11-12`

```json
{
  "data": [
    {
      "id": 7,
      "title": "Workshop Git & GitHub",
      "club": { "id": 1, "name": "CLB Công nghệ IT" },
      "start_time": "2026-11-12T18:00:00+07:00",
      "location": "Phòng B2.05",
      "registered_count": 32,
      "max_participants": 50
    }
  ],
  "meta": { "from": "2026-11-09", "to": "2026-11-15", "total": 1 }
}
```

### Đăng ký tham gia sự kiện

`POST /api/v1/events/7/registrations`

Response `201`:

```json
{
  "data": {
    "event_id": 7,
    "student_id": 1,
    "registered_at": "2026-11-08T09:30:00+07:00"
  }
}
```

Lỗi khi sự kiện đã đầy, response `409`:

```json
{
  "error": {
    "code": "EVENT_FULL",
    "message": "Sự kiện đã đủ số lượng người tham gia"
  }
}
```

### Điểm danh

`POST /api/v1/events/7/attendance`

```json
{
  "student_ids": [1, 2, 5]
}
```

---

## 5. Auth chi tiết và xử lý lỗi đăng nhập

### 5.1 Đăng nhập

`POST /api/v1/auth/login`

**Request body**

| Field | Kiểu | Bắt buộc | Quy tắc |
|---|---|---|---|
| `email` | string | có | Đúng định dạng email, tối đa 100 ký tự |
| `password` | string | có | Tối thiểu 8 ký tự |

### 5.2 Các trường hợp lỗi khi đăng nhập

**a) Thiếu hoặc sai định dạng dữ liệu** - `400 VALIDATION_ERROR`

Trường `details` chỉ rõ field nào sai và sai vì sao.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "status": 400,
    "details": [
      { "field": "email", "message": "Email không được để trống" },
      { "field": "password", "message": "Mật khẩu phải có ít nhất 8 ký tự" }
    ],
    "timestamp": "2026-11-07T10:15:30+07:00",
    "path": "/api/v1/auth/login"
  }
}
```

**b) Sai email hoặc mật khẩu** - `401 INVALID_CREDENTIALS`

Chỉ trả một thông báo chung, không nói rõ email hay mật khẩu sai, để người lạ không dò được email nào có trong hệ thống.

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email hoặc mật khẩu không đúng",
    "status": 401,
    "timestamp": "2026-11-07T10:16:02+07:00",
    "path": "/api/v1/auth/login"
  }
}
```

**c) Tài khoản bị khóa hoặc bị vô hiệu hóa** - `403 ACCOUNT_DISABLED`

```json
{
  "error": {
    "code": "ACCOUNT_DISABLED",
    "message": "Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên",
    "status": 403,
    "timestamp": "2026-11-07T10:17:45+07:00",
    "path": "/api/v1/auth/login"
  }
}
```

**d) Nhập sai quá nhiều lần** - `429 TOO_MANY_ATTEMPTS`

Sau 5 lần sai liên tiếp, tạm khóa đăng nhập 15 phút. Trường `retry_after` (giây) cho biết bao lâu nữa được thử lại, đồng thời trả header `Retry-After`.

```json
{
  "error": {
    "code": "TOO_MANY_ATTEMPTS",
    "message": "Bạn đã nhập sai quá nhiều lần, vui lòng thử lại sau 15 phút",
    "status": 429,
    "retry_after": 900,
    "timestamp": "2026-11-07T10:20:11+07:00",
    "path": "/api/v1/auth/login"
  }
}
```

**Bảng tổng hợp lỗi đăng nhập**

| HTTP | `error.code` | Khi nào | Hiển thị cho người dùng |
|---|---|---|---|
| 400 | `VALIDATION_ERROR` | Thiếu field, sai định dạng | Hiện lỗi dưới từng ô nhập theo `details[].field` |
| 401 | `INVALID_CREDENTIALS` | Sai email hoặc mật khẩu | Thông báo chung phía trên form |
| 403 | `ACCOUNT_DISABLED` | Tài khoản bị khóa | Thông báo liên hệ quản trị viên |
| 429 | `TOO_MANY_ATTEMPTS` | Sai quá 5 lần | Thông báo chờ, dùng `retry_after` để đếm ngược |
| 500 | `INTERNAL_ERROR` | Lỗi máy chủ | "Có lỗi xảy ra, vui lòng thử lại sau" |

### 5.3 Lỗi liên quan đến token (mọi API cần đăng nhập)

Khi gọi API có yêu cầu đăng nhập, nếu token có vấn đề thì trả về `401`:

| `error.code` | Khi nào | Frontend nên làm gì |
|---|---|---|
| `TOKEN_MISSING` | Không gửi header `Authorization` | Chuyển về trang đăng nhập |
| `TOKEN_INVALID` | Token sai hoặc bị sửa | Xóa token, chuyển về trang đăng nhập |
| `TOKEN_EXPIRED` | Access token hết hạn | Gọi `/auth/refresh`, thử lại request |
| `REFRESH_TOKEN_INVALID` | Refresh token sai, hết hạn hoặc đã logout | Chuyển về trang đăng nhập |

Ví dụ:

```json
{
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Phiên đăng nhập đã hết hạn",
    "status": 401,
    "timestamp": "2026-11-07T11:20:00+07:00",
    "path": "/api/v1/students/1"
  }
}
```

Khi đã đăng nhập nhưng không đủ quyền (ví dụ `student` gọi API của `admin`), trả về `403 FORBIDDEN`:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Bạn không có quyền thực hiện thao tác này",
    "status": 403,
    "timestamp": "2026-11-07T11:21:10+07:00",
    "path": "/api/v1/students"
  }
}
```

### 5.4 Đăng ký

`POST /api/v1/auth/register`

| Field | Kiểu | Bắt buộc | Quy tắc |
|---|---|---|---|
| `student_code` | string | có | Mã sinh viên, duy nhất |
| `full_name` | string | có | 2 đến 100 ký tự |
| `email` | string | có | Đúng định dạng, duy nhất |
| `password` | string | có | Tối thiểu 8 ký tự, có cả chữ và số |
| `faculty` | string | không | Khoa |
| `class_name` | string | không | Lớp |

Lỗi có thể gặp:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "status": 400,
    "details": [
      { "field": "password", "message": "Mật khẩu phải có cả chữ và số" }
    ],
    "timestamp": "2026-11-07T10:30:00+07:00",
    "path": "/api/v1/auth/register"
  }
}
```

```json
{
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "Email đã được sử dụng",
    "status": 409,
    "details": [
      { "field": "email", "message": "Email này đã được đăng ký" }
    ],
    "timestamp": "2026-11-07T10:31:00+07:00",
    "path": "/api/v1/auth/register"
  }
}
```

`STUDENT_CODE_EXISTS` (409) có cùng cấu trúc, với `field` là `student_code`.

### 5.5 Làm mới token

`POST /api/v1/auth/refresh`

```json
{ "refresh_token": "d1f4c0a8-7b3e-4f6a-9e21-..." }
```

Response `200`:

```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

### 5.6 Đăng xuất

`POST /api/v1/auth/logout`

```json
{ "refresh_token": "d1f4c0a8-7b3e-4f6a-9e21-..." }
```

Response: `204 No Content`.

### 5.7 Đổi mật khẩu

`PUT /api/v1/auth/change-password`

```json
{
  "current_password": "matkhaucu123",
  "new_password": "matkhaumoi456"
}
```

Lỗi `400 WRONG_CURRENT_PASSWORD` nếu `current_password` sai:

```json
{
  "error": {
    "code": "WRONG_CURRENT_PASSWORD",
    "message": "Mật khẩu hiện tại không đúng",
    "status": 400,
    "details": [
      { "field": "current_password", "message": "Mật khẩu hiện tại không đúng" }
    ],
    "timestamp": "2026-11-07T10:40:00+07:00",
    "path": "/api/v1/auth/change-password"
  }
}
```

### 5.8 Quên mật khẩu và đặt lại mật khẩu

`POST /api/v1/auth/forgot-password`

```json
{ "email": "phong@example.com" }
```

Luôn trả `200` với cùng một nội dung dù email có tồn tại hay không, để không lộ thông tin tài khoản:

```json
{ "data": { "message": "Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu" } }
```

`POST /api/v1/auth/reset-password`

```json
{
  "token": "token-trong-email",
  "new_password": "matkhaumoi456"
}
```

Lỗi `400 RESET_TOKEN_INVALID` nếu token sai hoặc đã hết hạn.

---

## 6. Quy tắc nghiệp vụ

- Một sinh viên không thể đăng ký cùng một sự kiện hai lần (trả về `409`).
- Không đăng ký được khi sự kiện đã đủ `max_participants` hoặc đã `finished`/`cancelled`.
- `club_leader` chỉ được sửa/xóa sự kiện và quản lý thành viên của CLB mình.
- Sinh viên chỉ được xem và sửa thông tin của chính mình, trừ `admin`.
- `end_time` phải sau `start_time`.
- Xóa CLB sẽ xóa các thành viên liên quan; các sự kiện của CLB chuyển sang `cancelled` hoặc bị xóa theo quy định của nhóm.

---

## 7. Bảng mã lỗi (error code) đầy đủ

| Code | HTTP | Ý nghĩa |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Dữ liệu không hợp lệ (có `details` theo field) |
| `WRONG_CURRENT_PASSWORD` | 400 | Mật khẩu hiện tại không đúng |
| `RESET_TOKEN_INVALID` | 400 | Token đặt lại mật khẩu sai hoặc hết hạn |
| `INVALID_CREDENTIALS` | 401 | Sai email hoặc mật khẩu |
| `TOKEN_MISSING` | 401 | Không gửi token |
| `TOKEN_INVALID` | 401 | Token không hợp lệ |
| `TOKEN_EXPIRED` | 401 | Access token hết hạn |
| `REFRESH_TOKEN_INVALID` | 401 | Refresh token không hợp lệ hoặc hết hạn |
| `FORBIDDEN` | 403 | Không đủ quyền |
| `ACCOUNT_DISABLED` | 403 | Tài khoản bị khóa |
| `NOT_FOUND` | 404 | Không tìm thấy tài nguyên |
| `ALREADY_REGISTERED` | 409 | Đã đăng ký sự kiện này |
| `EVENT_FULL` | 409 | Sự kiện đã đủ người |
| `EMAIL_EXISTS` | 409 | Email đã được sử dụng |
| `STUDENT_CODE_EXISTS` | 409 | Mã sinh viên đã tồn tại |
| `ALREADY_MEMBER` | 409 | Đã là thành viên của CLB |
| `TOO_MANY_ATTEMPTS` | 429 | Thử đăng nhập sai quá nhiều lần |
| `INTERNAL_ERROR` | 500 | Lỗi máy chủ |

---

## 8. Bảo mật

- Mật khẩu lưu dưới dạng hash (bcrypt hoặc argon2), không bao giờ trả `password_hash` trong response.
- Access token sống ngắn (1 giờ), refresh token sống dài hơn (7 ngày) và bị vô hiệu hóa khi đăng xuất.
- Thông báo lỗi đăng nhập luôn dùng một câu chung, không nói rõ email hay mật khẩu sai.
- Giới hạn số lần đăng nhập sai (5 lần, khóa 15 phút) để chống dò mật khẩu.
- Chỉ dùng HTTPS khi triển khai thật.
