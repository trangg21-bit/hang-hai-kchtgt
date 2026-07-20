---
feature-id: F-026
document: lean-spec
output-mode: lean
last-updated: 2026-06-27
---
# Quan ly Cang can - Tao moi

## Summary

He thong quan ly tai san KCHTGT hang hai chua co co che so hoa viec dang ky Cang can (ICD - Inland Container Depot) theo chuan ma hoa VN-14, dan den rui ro sai so du lieu va kho tong hop bao cao logistics quoc gia. Tinh nang nay cho phep nguoi dung co tham quyen nhap moi mot Cang can vao he thong voi day du thong tin ma so (VN-14), ten, vi tri dia ly, dien tich va cong suat xu ly container (TEU/nam), kem xac thuc hop le truoc khi luu. Thanh cong khi moi Cang can duoc luu chinh xac vao CSDL voi trang thai "Cho phe duyet", khong co ban ghi trung lap ma, va ghi nhat ky day du.

## Scope

| | Items |
|---|---|
| In scope | Bieu mau tao moi Cang can; Kiem tra hop le ma cang can VN-14; Kiem tra trung lap ma cang can va ten cang can; Luu ban ghi voi trang thai mac dinh "Cho phe duyet"; Thong bao ket qua thanh cong / loi cho nguoi dung; Ghi nhat ky tao moi (audit log) |
| Out of scope | Quy trinh phe duyet Cang can (F-029); Cap nhat thong tin sau khi tao (F-027); Xoa Cang can (F-028); Tich hop API CSDL cang quoc gia; Nhap/Xuat du lieu hang loat; Dinh kem giay to phap ly (scope rieng theo feature-brief - tach ra khoi AC cot loi) |
| Assumptions | Ma cang can VN-14 la chuan ma hoa quoc gia ap dung cho cang can (ICD) Viet Nam; He thong da co co che xac thuc / phan quyen nguoi dung truoc khi den tinh nang nay; CSDL PostgreSQL ho tro rang buoc unique tren cot ma_cang_can va ten_cang_can; Cong suat xu ly tinh theo don vi TEU/nam |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Chuyen vien (A-003) | Tao moi mot Cang can voi day du thong tin bat buoc | Dang ky chinh thuc Cang can (ICD) vao he thong quan ly tai san quoc gia | Must Have |
| US-002 | Chuyen vien (A-003) | Nhan thong bao loi ro rang khi ma cang can da ton tai | Tranh trung lap du lieu, bao ve tinh toan ven cua CSDL | Must Have |
| US-003 | Quan tri he thong (A-001) | Truy cap chuc nang tao moi Cang can tuong tu Chuyen vien | Cho phep quan tri vien can thiep khi can thiet | Must Have |
| US-004 | Chuyen vien (A-003) | Xem phan hoi xac thuc theo tung truong ngay khi nhap lieu | Giam thieu loi nhap lieu, tang toc do nhap du lieu | Should Have |
| US-005 | Chuyen vien (A-003) | Nhan thong bao loi khi ten cang can da ton tai | Tranh trung lap ten, dam bao de nhan dang duy nhat | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001, US-003 | Truy cap chuc nang tao moi thanh cong | Given nguoi dung da dang nhap voi vai tro Chuyen vien hoac Quan tri he thong; When truy cap menu "Quan ly tai san > Cang can > Tao moi"; Then he thong hien thi bieu mau tao moi Cang can | Chi Chuyen vien (A-003) va Quan tri he thong (A-001) co quyen; Nguoi dung khac nhan HTTP 403 |
| AC-002 | US-001 | Luu thanh cong khi du truong bat buoc | Given bieu mau da dien day du: ma cang can (hop le VN-14, chua ton tai, chua trung ten), ten cang can, tinh thanh pho, toa do GPS (vi do, kinh do), dien tich (m2 hoac ha), cong suat xu ly container (TEU/nam); When nguoi dung nhan "Luu"; Then he thong luu ban ghi moi voi trang thai "Cho phe duyet", ghi nhan createdAt tu dong, tra ve thong bao thanh cong | Trang thai mac dinh = cho_phe_duyet bat ke nguoi dung chon gi; createdAt khong duoc phep nguoi dung chinh sua |
| AC-003 | US-002 | Tu choi khi ma cang can da ton tai | Given ma cang can nhap vao da co trong CSDL; When nguoi dung nhan "Luu"; Then he thong tra ve loi HTTP 409 kem thong bao ro rang "Ma cang can [X] da ton tai trong he thong", khong tao ban ghi moi | Kiem tra unique phai la server-side; thong bao loi hien thi o truong ma cang can |
| AC-004 | US-004 | Xac thuc tung truong bat buoc khi bo trong | Given bieu mau con truong bat buoc trong; When nguoi dung nhan "Luu"; Then he thong hien thi thong bao loi tai tung truong tuong ung, khong gui request len server | Xac thuc client-side (front-end) truoc; server-side validation la tuyen phong thu thu hai |
| AC-005 | US-004 | Xac thuc dinh dang ma cang can VN-14 | Given ma cang can nhap vao khong dung dinh dang VN-14; When nguoi dung roi khoi truong hoac nhan "Luu"; Then he thong hien thi loi "Ma cang can phai dung dinh dang VN-14" | VN-14 ICD code format: can xac nhan chinh xac regex voi chu dau tu; tam thoi gia dinh alphanumeric uppercase, 5-12 ky tu |
| AC-006 | US-004 | Xac thuc khoang toa do GPS hop le | Given vi do nhap ngoai [-90, 90] hoac kinh do ngoai [-180, 180]; When nguoi dung roi khoi truong hoac nhan "Luu"; Then he thong hien thi loi cu the cho tung truong toa do | Server-side validation bat buoc de tranh du lieu sai vao CSDL; Viet Nam: vi do 8-23, kinh do 102-109 la khoang thuc te |
| AC-007 | US-001 | Tu choi nguoi dung khong co quyen | Given nguoi dung dang nhap voi vai tro Lanh dao hoac Nguoi dung tai Cang hoac Public; When truy cap URL tao moi Cang can; Then he thong tra ve HTTP 403 Forbidden | Phan quyen dua tren role: chi A-001, A-003 co quyen CANG_CAN_CREATE |
| AC-008 | US-005 | Tu choi khi ten cang can da ton tai | Given ten cang can nhap vao da co trong CSDL; When nguoi dung nhan "Luu"; Then he thong tra ve loi HTTP 409 kem thong bao "Ten cang can [X] da ton tai", khong tao ban ghi moi | Kiem tra unique ten la server-side; so sanh khong phan biet hoa thuong |
| AC-009 | US-004 | Xac thuc cong suat xu ly container | Given cong suat TEU/nam nhap gia tri am hoac bang 0; When nguoi dung roi khoi truong hoac nhan "Luu"; Then he thong hien thi loi "Cong suat xu ly phai la so nguyen duong" | Cong suat toi da khong gioi han cung; truong hop chua biet nhap tam 0 va ghi chu |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Ma cang can phai tuan thu chuan ma hoa VN-14, duy nhat tren toan he thong, luu theo uppercase | AC-002, AC-003, AC-005 | Khong co ngoai le; ma cang can la khoa nghiep vu bat bien |
| BR-002 | Ten cang can phai duy nhat tren toan he thong, so sanh khong phan biet hoa thuong | AC-002, AC-008 | Khong co ngoai le; phong ngua nham lan khi tim kiem |
| BR-003 | Toa do GPS (vi do, kinh do) phai nam trong khoang chap nhan: vi do -90 den 90, kinh do -180 den 180; gia tri so thuc chinh xac toi 6 chu so thap phan | AC-006 | Khong co ngoai le; toa do sai se lam hu bieu do GIS |
| BR-004 | Dien tich Cang can phai la gia tri duong, don vi m2 hoac ha (can thong nhat don vi voi chu dau tu); khong duoc am | AC-002 | Neu dien tich chua xac dinh chinh thuc thi nhap tam gia tri 0 va ghi ro trong truong ghi chu |
| BR-005 | Cong suat xu ly container phai la so nguyen duong, don vi TEU/nam | AC-002, AC-009 | Neu chua xac dinh chinh thuc thi nhap tam gia tri 0 va ghi ro trong truong ghi chu |
| BR-006 | Trang thai mac dinh cua Cang can sau khi tao moi luon la "Cho phe duyet" (cho_phe_duyet); nguoi tao khong duoc tu thiet lap trang thai "Hien hanh" | AC-002, AC-007 | Khong co ngoai le; chi quy trinh phe duyet (F-029) moi doi trang thai |
| BR-007 | Moi hanh dong tao moi Cang can phai duoc ghi vao bang audit log: actor, thoi gian UTC, du lieu truoc/sau, IP nguon | AC-002 | Ngay ca khi tao that bai do loi ung dung, van ghi log that bai |
| BR-008 | Chi nguoi dung co vai tro Chuyen vien (A-003) hoac Quan tri he thong (A-001) duoc phep tao moi Cang can | AC-001, AC-007 | Quan tri he thong (A-001) co toan quyen ke ca khi don vi to chuc khong phu hop |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | API tao moi Cang can phai tra ket qua (thanh cong hoac loi) trong thoi gian chap nhan duoc | <= 2 giay voi tai trong binh thuong (< 100 nguoi dung dong thoi) |
| Security | Kiem tra phan quyen server-side tren moi request; du lieu nhap phai duoc sanitize de ngan SQL injection va XSS; HTTPS bat buoc | Khong co request nao bypass phan quyen; OWASP Top 10 compliance |
| Reliability | He thong phai dam bao tinh nhat quan du lieu khi co loi xay ra o giua qua trinh tao moi | Transaction atomicity: neu bat ky buoc nao that bai (luu ban ghi, ghi log), rollback toan bo |
| Audit/Logging | Ghi nhat ky day du moi hanh dong tao moi Cang can bao gom actor, thoi gian UTC, du lieu duoc tao, IP nguon | 100% coverage; log phai duoc giu toi thieu 2 nam theo quy dinh nha nuoc |
| Operability | API endpoint phai co health check va tra ve loi co cau truc (error code + message) de DevOps giam sat | Loi server tra ve HTTP 4xx/5xx voi JSON body chuan; khong lo stack trace ra ben ngoai |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | Chuyen vien dang nhap va truy cap bieu mau tao moi thanh cong | Acceptance |
| TS-002 | AC-001, AC-007 | Nguoi dung khong co quyen (Lanh dao) nhan 403 khi truy cap | Security / Negative |
| TS-003 | AC-002 | Dien day du truong bat buoc hop le, luu thanh cong, kiem tra CSDL co ban ghi moi voi trang thai cho_phe_duyet | Integration |
| TS-004 | AC-003 | Nhap ma cang can da ton tai, he thong tra ve loi 409 va thong bao dung truong | Integration / Negative |
| TS-005 | AC-008 | Nhap ten cang can da ton tai, he thong tra ve loi 409 va thong bao dung truong | Integration / Negative |
| TS-006 | AC-004 | Bo trong truong ten cang can, nhan Luu, kiem tra loi hien thi tai truong ten cang can | UI / Negative |
| TS-007 | AC-005 | Nhap ma cang can sai dinh dang VN-14, kiem tra loi dinh dang | Unit / Negative |
| TS-008 | AC-006 | Nhap vi do = 91 (ngoai khoang hop le), kiem tra loi xac thuc | Unit / Negative |
| TS-009 | AC-006 | Nhap kinh do = -181 (ngoai khoang hop le), kiem tra loi xac thuc | Unit / Negative |
| TS-010 | AC-002 | Kiem tra audit log duoc ghi sau khi tao Cang can thanh cong | Integration |
| TS-011 | AC-007 | Gui POST request khong co JWT token, kiem tra 401 Unauthorized | Security / Negative |
| TS-012 | AC-009 | Nhap cong suat TEU/nam bang 0 hoac am, kiem tra loi xac thuc BR-005 | Unit / Negative |
| TS-013 | AC-004 | Bo trong truong toa do GPS, nhan Luu, kiem tra loi hien thi tai truong toa do | UI / Negative |
| TS-014 | AC-002 | Nhap dien tich am, kiem tra loi xac thuc BR-004 | Unit / Negative |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes | Tao moi Aggregate Root CangCan chua ton tai trong he thong; can dinh nghia entity, trang thai, invariants (unique ma + ten, trang thai mac dinh cho_phe_duyet) |
| Architecture affected? | Yes | Can thiet ke REST endpoint moi, database table moi (cang_can), audit log mechanism, RBAC permission moi (CANG_CAN_CREATE) |
| Implementation clear? | No | Chua co SA artifacts cho CangCan trong M-002; can SA quyet dinh pattern (REST resource naming, transaction boundary, permission seed, don vi dien tich) |
| **Verdict** | `Ready for solution architecture` | Phase 2 (Domain Analysis) khong bat buoc vi cau truc domain don gian (1 aggregate root, 1 bounded context); SA du kha nang xu ly truc tiep |

## BA -> Handoff Summary

**Verdict:** Ready for solution architecture

**Phases completed:** BA only

**Triage rationale:** Tinh nang tao moi CangCan la 1 aggregate root don gian voi 8 business rules ro rang (tuong tu F-008 CangBien nhung them unique ten + cong suat TEU); khong co bounded context moi hay cross-domain event nao. SA can quyet dinh cac van de ky thuat: REST endpoint, DB schema (don vi dien tich m2/ha, kieu du lieu cong suat TEU), permission seed, transaction pattern.

**Business goal:** So hoa viec dang ky Cang can (ICD) theo chuan VN-14, dam bao tinh chinh xac va minh bach du lieu truoc khi phe duyet chinh thuc.

**Scope in:**
- Bieu mau tao moi Cang can (6 truong bat buoc: ma VN-14, ten, tinh/thanh pho, toa do GPS, dien tich, cong suat TEU/nam)
- Xac thuc ma cang can VN-14 (unique, format chuan)
- Xac thuc ten cang can (unique, case-insensitive)
- Xac thuc toa do GPS va dien tich, cong suat TEU
- Luu ban ghi voi trang thai mac dinh cho_phe_duyet
- Audit log moi hanh dong tao moi

**Key business rules:** BR-001: ma cang can VN-14 unique bat bien; BR-002: ten cang can unique case-insensitive; BR-006: trang thai mac dinh cho_phe_duyet khong the bi ghi de; BR-008: chi Chuyen vien + Quan tri he thong co quyen tao moi

**Actors:** A-001 Quan tri he thong (Admin), A-003 Chuyen vien

**UI/UX impact:** Yes - designer required (bieu mau nhap lieu voi validation inline, 6+ truong bat buoc)

**Screen types:** Form tao moi Cang can (single-page form with validation feedback)

**Open items (non-blocking):** Regex chinh xac cho ma cang can VN-14 can xac nhan voi chu dau tu; don vi dien tich (m2 hay ha) can thong nhat; truong cong suat toi da co gioi han tren khong (feature-brief khong de cap); co can ghi chu mo rong khong.
