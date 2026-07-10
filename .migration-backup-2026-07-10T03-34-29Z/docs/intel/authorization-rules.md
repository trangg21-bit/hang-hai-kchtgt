# Authorization Rules — Ghi nhớ nghiệp vụ

## 1. Phân quyền theo vai trò (RBAC)
- 1 user = 1 role duy nhất (ROLE_SYSTEM_ADMIN, ROLE_ADMIN, ROLE_LEADER, ROLE_SPECIALIST, ROLE_PORT_OPERATOR)
- Role có nhiều permissions (mặc định)
- Admin có thể **override per-user**: thêm 1-2 permission riêng cho từng user cụ thể mà không cần tạo role mới
- Model: Role + Per-User Override

## 2. Phân quyền theo dữ liệu (Org Unit Hierarchy)
- Chuyên viên đơn vị X chỉ thấy dữ liệu của đơn vị X
- Đơn vị cha (trưởng phòng) thấy dữ liệu của đơn vị con
- Cục thấy toàn bộ dữ liệu
- Ngoại lệ: Hải đồ/bản đồ → tất cả user thấy full (không filter)

## 3. Luồng phê duyệt
- Bước 1: Chuyên viên trình lãnh đạo
- Bước 2: Lãnh đạo đơn vị phê duyệt + lưu thông tin
- Luồng phê duyệt chi tiết cho từng loại tài sản/ kết cấu hạ tầng có thể làm rõ sau

## 4. Hệ thống liên thông
- HTTT-DV = Hệ thống Thông tin - Đơn vị (Cảng vụ, TCT, VISHIPEL)
- Trục LGSP = Liên thông - Chia sẻ dữ liệu KCHTGT với Bộ GTVT
- Trục NDXP = Liên thông Quốc gia
- HTTT-SIEM = Giám sát an toàn thông tin
- Các hệ thống này dùng **tài khoản user giống web** (không cần API Key riêng)
- Phân quyền: cấp cho user hệ thống đó một role phù hợp

## 5. Actor Registry (9 actors)
- Quan tri he thong (ROLE_SYSTEM_ADMIN)
- Lanh dao (ROLE_LEADER)
- Chuyen vien (ROLE_SPECIALIST)
- Nguoi dung tai Cang (ROLE_PORT_OPERATOR)
- Ca nhan/To chuc ben ngoai (Public User)
- HTTT-ĐV (External System)
- Truc LGSP (Integration Bus)
- Truc NDXP (National Bus)
- He SIEM (Security Monitoring)

## 6. RULE LÀM VIỆC
- ALWAYS hỏi NGHIỆP VỤ trước, KHÔNG HỎI kỹ thuật
- User xác nhận nghiệp vụ → Assistant đưa giải pháp kỹ thuật
- Không hỏi "nên dùng M-to-M hay 1-to-N?" — đó là lựa chọn kỹ thuật của assistant
- Không hỏi "AuthorizationManager nên extend class nào?" — đó là code structure
- Chỉ hỏi: "User có được nhiều roles không?", "Phân quyền theo đơn vị không?", "Có workflow phê duyệt không?"
