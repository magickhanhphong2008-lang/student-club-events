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

Lỗi:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Thiếu trường name"
  }
}
```

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
| POST | `/auth/login` | Đăng nhập, trả về JWT |
| GET | `/auth/me` | Lấy thông tin người đang đăng nhập |

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
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "full_name": "Võ Hoàng Khánh Phong",
      "role": "student"
    }
  }
}
```

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

## 5. Quy tắc nghiệp vụ

- Một sinh viên không thể đăng ký cùng một sự kiện hai lần (trả về `409`).
- Không đăng ký được khi sự kiện đã đủ `max_participants` hoặc đã `finished`/`cancelled`.
- `club_leader` chỉ được sửa/xóa sự kiện và quản lý thành viên của CLB mình.
- Sinh viên chỉ được xem và sửa thông tin của chính mình, trừ `admin`.
- `end_time` phải sau `start_time`.
- Xóa CLB sẽ xóa các thành viên liên quan; các sự kiện của CLB chuyển sang `cancelled` hoặc bị xóa theo quy định của nhóm.

---

## 6. Mã lỗi (error code)

| Code | HTTP | Ý nghĩa |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Dữ liệu không hợp lệ |
| `UNAUTHORIZED` | 401 | Chưa đăng nhập |
| `FORBIDDEN` | 403 | Không đủ quyền |
| `NOT_FOUND` | 404 | Không tìm thấy |
| `ALREADY_REGISTERED` | 409 | Đã đăng ký sự kiện này |
| `EVENT_FULL` | 409 | Sự kiện đã đầy |
| `EMAIL_EXISTS` | 409 | Email đã được sử dụng |
| `INTERNAL_ERROR` | 500 | Lỗi máy chủ |
