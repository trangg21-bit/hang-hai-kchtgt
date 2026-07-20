---
feature-id: F-008
document: lean-spec
output-mode: lean
last-updated: 2026-06-27
---
# Quan ly Cang bien - Tao moi

## Summary

He thong quan ly tai san KCHTGT hang hai chua co co che so hoa viec dang ky cang bien theo chuan VN-36, dan den rui ro sai so du lieu va kho tong hop bao cao tren pham vi quoc gia. Tinh nang nay cho phep nguoi dung co tham quyen nhap moi mot Cang bien vao he thong voi day du thong tin ma so, ten, vi tri dia ly va thuoc tinh ky thuat theo chuan du lieu quoc gia, kem xac thuc hop le truoc khi luu. Thanh cong khi moi Cang bien duoc luu chinh xac vao CSDL voi trang thai "Cho phe duyet", khong co ban ghi trung lap ma cang, va ghi nhat ky day du.

## Scope

| | Items |
|---|---|
| In scope | Bieu mau tao moi Cang bien; Kiem tra hop le ma cang VN-36; Kiem tra trung lap ma cang; Luu ban ghi voi trang thai mac dinh "Cho phe duyet"; Thong bao ket qua thanh cong / loi cho nguoi dung; Ghi nhat ky tao moi (audit log) |
| Out of scope | Quy trinh phe duyet Cang bien (F-011); Cap nhat thong tin sau khi tao (F-009); Xoa Cang bien (F-010); Tich hop API CSDL cang quoc gia; Nhap/Xuat du lieu hang loat |
| Assumptions | Ma cang VN-36 la chuan ma hoa quoc gia ap dung cho cang bien Viet Nam; He thong da co co che xac thuc / phan quyen nguoi dung truoc khi den tinh nang nay; CSDL PostgreSQL ho tro rang buoc unique tren cot ma_cang |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Chuyen vien (A-003) | Tao moi mot Cang bien voi day du thong tin bat buoc | Dang ky chinh thuc cang bien vao he thong quan ly tai san quoc gia | Must Have |
| US-002 | Chuyen vien (A-003) | Nhan thong bao loi ro rang khi ma cang da ton tai | Tranh trung lap du lieu, bao ve tinh toan ven cua CSDL | Must Have |
| US-003 | Quan tri he thong (A-001) | Truy cap chuc nang tao moi Cang bien tuong tu Chuyen vien | Cho phep quan tri vien can thiep khi can thiet | Must Have |
| US-004 | Chuyen vien (A-003) | Xem phan hoi xac thuc theo tung truong ngay khi nhap lieu | Giam thieu loi nhap lieu, tang toc do nhap du lieu | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001, US-003 | Truy cap chuc nang tao moi thanh cong | Given nguoi dung da dang nhap voi vai tro Chuyen vien hoac Quan tri he thong; When truy cap menu "Quan ly tai san > Cang bien > Tao moi"; Then he thong hien thi bieu mau tao moi Cang bien | Chi Chuyen vien (A-003) va Quan tri he thong (A-001) co quyen; Nguoi dung khac nhan HTTP 403 |
| AC-002 | US-001 | Luu thanh cong khi du truong bat buoc | Given bieu mau da dien day du: ma cang (hop le VN-36, chua ton tai), ten cang, tinh thanh pho, toa do GPS (vi do, kinh do), dien tich (km2), trang thai hoat dong; When nguoi dung nhan "Luu"; Then he thong luu ban ghi moi voi trang thai "Cho phe duyet", ghi nhan createdAt tu dong, tra ve thong bao thanh cong | Trang thai mac dinh = cho_phe_duyet bat ke nguoi dung chon gi; createdAt khong duoc phep nguoi dung chinh sua |
| AC-003 | US-002 | Tu choi khi ma cang da ton tai | Given ma cang nhap vao da co trong CSDL; When nguoi dung nhan "Luu"; Then he thong tra ve loi HTTP 409 kem thong bao ro rang "Ma cang [X] da ton tai trong he thong", khong tao ban ghi moi | Kiem tra unique phai la server-side; thong bao loi hien thi o truong ma cang |
| AC-004 | US-004 | Xac thuc tung truong bat buoc khi bo trong | Given bieu mau con truong bat buoc trong; When nguoi dung nhan "Luu"; Then he thong hien thi thong bao loi tai tung truong tuong ung, khong gui request len server | Xac thuc client-side (front-end) truoc; server-side validation la tuyen phong thu thu hai |
| AC-005 | US-004 | Xac thuc dinh dang ma cang VN-36 | Given ma cang nhap vao khong dung dinh dang VN-36 (6-10 ky tu); When nguoi dung roi khoi truong hoac nhan "Luu"; Then he thong hien thi loi "Ma cang phai co dinh dang VN-36 (6-10 ky tu)" | Pattern: [A-Z0-9]{6,10} - can lam ro them voi chu dau tu; tam thoi gia dinh uppercase alphanumeric |
| AC-006 | US-004 | Xac thuc khoang toa do GPS hop le | Given vi do nhap ngoai [-90, 90] hoac kinh do ngoai [-180, 180]; When nguoi dung roi khoi truong hoac nhan "Luu"; Then he thong hien thi loi cu the cho tung truong toa do | Server-side validation bat buoc de tranh du lieu sai vao CSDL |
| AC-007 | US-001 | Tu choi nguoi dung khong co quyen | Given nguoi dung dang nhap voi vai tro Lanh dao hoac Nguoi dung tai Cang hoac Public; When truy cap URL tao moi Cang bien; Then he thong tra ve HTTP 403 Forbidden | Phan quyen dua tren role: chi A-001, A-003 co quyen CREATE |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Ma cang phai tuan thu chuan ma hoa VN-36, do dai tu 6 den 10 ky tu alphanumeric, khong phan biet hoa-thuong (luu theo uppercase), duy nhat tren toan he thong | AC-002, AC-003, AC-005 | Khong co ngoai le; ma cang la khoa nghiep vu bat bien |
| BR-002 | Toa do GPS (vi do, kinh do) phai nam trong khoang chap nhan: vi do -90 den 90, kinh do -180 den 180; gia tri so thuc chinh xac toi 6 chu so thap phan | AC-006 | Khong co ngoai le; toa do sai se lam hu bieu do GIS |
| BR-003 | Dien tich cang phai la gia tri duong, don vi km2, khong vuot qua 5000 km2 | AC-002 | Neu dien tich chua xac dinh chinh thuc thi nhap tam gia tri 0 va ghi ro trong truong ghi chu |
| BR-004 | Trang thai mac dinh cua Cang bien sau khi tao moi luon la "Cho phe duyet" (cho_phe_duyet); nguoi tao khong duoc tu thiet lap trang thai "Hien hanh" | AC-002, AC-007 | Khong co ngoai le; chi quy trinh phe duyet (F-011) moi doi trang thai |
| BR-005 | Moi hanh dong tao moi Cang bien phai duoc ghi vao bang audit log: actor, thoi gian, du lieu truoc/sau, IP nguon | AC-002 | Ngay ca khi tao that bai do loi ung dung, van ghi log that bai |
| BR-006 | Chi nguoi dung co vai tro Chuyen vien (A-003) hoac Quan tri he thong (A-001) duoc phep tao moi Cang bien | AC-001, AC-007 | Quan tri he thong (A-001) co toan quyen ke ca khi don vi to chuc khong phu hop |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | API tao moi Cang bien phai tra ket qua (thanh cong hoac loi) trong thoi gian chap nhan duoc | <= 2 giay voi tai trong binh thuong (< 100 nguoi dung dong thoi) |
| Security | Kiem tra phan quyen server-side tren moi request; du lieu nhap phai duoc sanitize de ngan SQL injection va XSS; HTTPS bat buoc | Khong co request nao bypass phan quyen; OWASP Top 10 compliance |
| Reliability | He thong phai dam bao tinh nhat quan du lieu khi co loi xay ra o giua qua trinh tao moi | Transaction atomicity: neu bat ky buoc nao that bai (luu ban ghi, ghi log), rollback toan bo |
| Audit/Logging | Ghi nhat ky day du moi hanh dong tao moi Cang bien bao gom actor, thoi gian UTC, du lieu duoc tao, IP nguon | 100% coverage; log phai duoc giu toi thieu 2 nam theo quy dinh nha nuoc |
| Operability | API endpoint phai co health check va tra ve loi co cau truc (error code + message) de DevOps giam sat | Loi server tra ve HTTP 4xx/5xx voi JSON body chuan; khong lo stack trace ra ben ngoai |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | Chuyen vien dang nhap va truy cap bieu mau tao moi thanh cong | Acceptance |
| TS-002 | AC-001 | Nguoi dung khong co quyen (Lanh dao) nhan 403 khi truy cap | Security / Negative |
| TS-003 | AC-002 | Dien day du truong bat buoc hop le, luu thanh cong, kiem tra CSDL co ban ghi moi voi trang thai cho_phe_duyet | Integration |
| TS-004 | AC-003 | Nhap ma cang da ton tai, he thong tra ve loi 409 va thong bao dung truong | Integration / Negative |
| TS-005 | AC-004 | Bo trong truong ten cang, nhan Luu, kiem tra loi hien thi tai truong ten cang | UI / Negative |
| TS-006 | AC-005 | Nhap ma cang 5 ky tu (qua ngan), kiem tra loi dinh dang | Unit / Negative |
| TS-007 | AC-005 | Nhap ma cang 11 ky tu (qua dai), kiem tra loi dinh dang | Unit / Negative |
| TS-008 | AC-006 | Nhap vi do = 91 (ngoai khoang hop le), kiem tra loi xac thuc | Unit / Negative |
| TS-009 | AC-006 | Nhap kinh do = -181 (ngoai khoang hop le), kiem tra loi xac thuc | Unit / Negative |
| TS-010 | AC-002 | Kiem tra audit log duoc ghi sau khi tao Cang bien thanh cong | Integration |
| TS-011 | AC-007 | Gui POST request khong co JWT token, kiem tra 401 Unauthorized | Security / Negative |
| TS-012 | AC-002 | Dien tich nhap gia tri am, kiem tra loi xac thuc BR-003 | Unit / Negative |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes | Tao moi Aggregate Root CangBien chua ton tai trong he thong; can dinh nghia entity, trang thai, invariants |
| Architecture affected? | Yes | Can thiet ke REST endpoint moi, database table moi (cang_bien), audit log mechanism, RBAC permission moi (CANG_BIEN_CREATE) |
| Implementation clear? | No | Chua co SA artifacts cho M-002; can SA quyet dinh pattern (REST resource naming, transaction boundary, permission seed) |
| **Verdict** | `Ready for solution architecture` | Phase 2 (Domain Analysis) khong bat buoc vi cau truc domain don gian (1 aggregate root, 1 bounded context), SA du kha nang xu ly truc tiep |

## BA -> Handoff Summary

**Verdict:** Ready for solution architecture

**Phases completed:** BA only

**Triage rationale:** Tinh nang tao moi CangBien la 1 aggregate root don gian voi 6 business rules ro rang; khong co bounded context moi hay cross-domain event nao. SA can quyet dinh cac van de ky thuat: REST endpoint, DB schema, permission seed, transaction pattern.

**Business goal:** So hoa viec dang ky Cang bien theo chuan VN-36, dam bao tinh chinh xac va minh bach du lieu truoc khi phe duyet chinh thuc.

**Scope in:**
- Bieu mau tao moi Cang bien (6 truong bat buoc + truong tuy chon)
- Xac thuc ma cang VN-36 (6-10 ky tu alphanumeric, unique)
- Xac thuc toa do GPS va dien tich
- Luu ban ghi voi trang thai mac dinh cho_phe_duyet
- Audit log moi hanh dong tao moi

**Key business rules:** BR-001: ma cang VN-36 unique bat bien; BR-004: trang thai mac dinh cho_phe_duyet khong the bi ghi de; BR-006: chi Chuyen vien + Quan tri he thong co quyen tao moi

**Actors:** A-001 Quan tri he thong (Admin), A-003 Chuyen vien

**UI/UX impact:** Yes - designer required (bieu mau nhap lieu voi validation inline)

**Screen types:** Form tao moi Cang bien (single-page form with validation feedback)

**Open items (non-blocking):** Regex chinh xac cho ma cang VN-36 can xac nhan voi chu dau tu (tam thoi su dung [A-Z0-9]{6,10}); truong "kha nang tiep nhan tau" co bat buoc khong (feature-brief neu la optional nhung AC goc khong de cap)
