---
feature-id: F-020
document: lean-spec
output-mode: lean
last-updated: 2026-06-27
---
# Quan ly Cau cang - Tao moi

## Summary

He thong quan ly tai san KCHTGT hang hai chua co co che so hoa viec dang ky Cau cang theo chuan VN-614, dan den rui ro sai so du lieu ky thuat (tai trong, ket cau) va kho tong hop bao cao an toan ket cau tren pham vi quoc gia. Tinh nang nay cho phep nguoi dung co tham quyen tao moi mot Cau cang vao he thong voi day du thong tin ma so (VN-614), ten, Ben cang me, loai ket cau, vat lieu, tai trong thiet ke, kich thuoc va kem xac thuc hop le truoc khi luu. Thanh cong khi moi Cau cang duoc luu chinh xac vao CSDL voi trang thai "Cho phe duyet", thuoc dung Ben cang me, khong co ban ghi trung lap ma cau, va ghi nhat ky day du.

## Scope

| | Items |
|---|---|
| In scope | Bieu mau tao moi Cau cang voi truong ky thuat chuyen biet; Kiem tra hop le ma cau theo chuan VN-614 (6-10 ky tu alphanumeric); Kiem tra trung lap ma cau toan he thong; Danh sach chon Ben cang me tu cac Ben cang co trang thai hop le; Luu ban ghi voi trang thai mac dinh "Cho phe duyet"; Thong bao ket qua thanh cong / loi cho nguoi dung; Ghi nhat ky tao moi (audit log) |
| Out of scope | Quy trinh phe duyet Cau cang (F-023); Cap nhat thong tin Cau cang sau khi tao (F-021); Xoa Cau cang (F-022); Tich hop API he thong ket cau cang quoc gia; Nhap/Xuat du lieu Cau cang hang loat; Tinh toan an toan ket cau tu dong |
| Assumptions | Ma cau VN-614 la chuan ma hoa quoc gia ap dung cho Cau cang Viet Nam; He thong da co co che xac thuc / phan quyen truoc khi den tinh nang nay; Ben cang me da duoc tao va co trang thai "Hien hanh" hoac "Tam ngung" truoc khi tao Cau cang; CSDL PostgreSQL ho tro rang buoc unique tren cot ma_cau |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Chuyen vien (A-003) | Tao moi mot Cau cang voi day du thong tin ky thuat bat buoc | Dang ky chinh thuc Cau cang vao he thong quan ly tai san quoc gia, dam bao thong tin tai trong va ket cau chinh xac | Must Have |
| US-002 | Chuyen vien (A-003) | Nhan thong bao loi ro rang khi ma cau da ton tai | Tranh trung lap du lieu, bao ve tinh toan ven cua CSDL | Must Have |
| US-003 | Quan tri he thong (A-001) | Truy cap chuc nang tao moi Cau cang tuong tu Chuyen vien | Cho phep quan tri vien can thiep khi can thiet | Must Have |
| US-004 | Chuyen vien (A-003) | Chon Ben cang me tu danh sach cac Ben cang hop le | Dam bao Cau cang luon gan voi Ben cang ton tai va hop le, tao quan he cha-con dung | Must Have |
| US-005 | Chuyen vien (A-003) | Nhan phan hoi xac thuc theo tung truong ngay khi nhap lieu | Giam thieu loi nhap lieu ky thuat (tai trong, kich thuoc), tang toc do nhap du lieu | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001, US-003 | Truy cap chuc nang tao moi thanh cong | Given nguoi dung da dang nhap voi vai tro Chuyen vien hoac Quan tri he thong; When truy cap menu "Quan ly tai san > Cau cang > Tao moi"; Then he thong hien thi bieu mau tao moi Cau cang voi day du truong bat buoc | Chi Chuyen vien (A-003) va Quan tri he thong (A-001) co quyen; Nguoi dung khac nhan HTTP 403 |
| AC-002 | US-001 | Luu thanh cong khi du truong bat buoc hop le | Given bieu mau da dien day du: ma cau (hop le VN-614, chua ton tai), ten cau, Ben cang me hop le, loai ket cau, vat lieu chinh, tai trong thiet ke (> 0, <= 20 T/m2), chieu dai (> 0, <= 500m), chieu rong (> 0, <= 500m); When nguoi dung nhan "Luu"; Then he thong luu ban ghi moi voi trang thai "Cho phe duyet", ghi nhan createdAt tu dong, tra ve thong bao thanh cong | Trang thai mac dinh = cho_phe_duyet bat ke nguoi dung chon gi; createdAt khong duoc phep nguoi dung chinh sua |
| AC-003 | US-002 | Tu choi khi ma cau da ton tai | Given ma cau nhap vao da co trong CSDL; When nguoi dung nhan "Luu"; Then he thong tra ve loi HTTP 409 kem thong bao ro rang "Ma cau [X] da ton tai trong he thong", khong tao ban ghi moi | Kiem tra unique phai la server-side; thong bao loi hien thi o truong ma cau |
| AC-004 | US-004 | Danh sach Ben cang me chi hien thi Ben cang hop le | Given nguoi dung mo dropdown chon Ben cang me; When he thong tai danh sach; Then chi hien thi cac Ben cang co trang thai "Hien hanh" hoac "Tam ngung"; Ben cang co trang thai "Cho phe duyet" hoac "Da xoa" khong xuat hien trong danh sach | Loc danh sach server-side; khong de nguoi dung bypass qua API |
| AC-005 | US-005 | Xac thuc tung truong bat buoc khi bo trong | Given bieu mau con truong bat buoc trong; When nguoi dung nhan "Luu"; Then he thong hien thi thong bao loi tai tung truong tuong ung, khong gui request len server | Xac thuc client-side truoc; server-side validation la tuyen phong thu thu hai |
| AC-006 | US-005 | Xac thuc dinh dang ma cau VN-614 | Given ma cau nhap vao khong dung dinh dang VN-614 (6-10 ky tu alphanumeric); When nguoi dung roi khoi truong hoac nhan "Luu"; Then he thong hien thi loi "Ma cau phai co dinh dang VN-614 (6-10 ky tu alphanumeric)" | Pattern: [A-Z0-9]{6,10} uppercase alphanumeric; server-side validation bat buoc |
| AC-007 | US-005 | Xac thuc khoang tai trong thiet ke | Given tai trong thiet ke nhap vao <= 0 hoac > 20 T/m2; When nguoi dung roi khoi truong hoac nhan "Luu"; Then he thong hien thi loi cu the "Tai trong thiet ke phai lon hon 0 va khong vuot qua 20 T/m2" | Server-side validation bat buoc; don vi T/m2 phai hien thi ro trong label truong nhap |
| AC-008 | US-005 | Xac thuc khoang chieu dai va chieu rong | Given chieu dai hoac chieu rong nhap <= 0 hoac > 500m; When nguoi dung roi khoi truong hoac nhan "Luu"; Then he thong hien thi loi "Gia tri phai lon hon 0 va khong vuot qua 500m" tai truong tuong ung | Server-side validation bat buoc cho ca hai truong |
| AC-009 | US-001, US-003 | Tu choi nguoi dung khong co quyen | Given nguoi dung dang nhap voi vai tro khac Chuyen vien va Quan tri he thong; When truy cap URL tao moi Cau cang; Then he thong tra ve HTTP 403 Forbidden | Phan quyen dua tren role: chi A-001, A-003 co quyen CREATE |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Ma cau phai tuan thu chuan ma hoa VN-614, do dai tu 6 den 10 ky tu alphanumeric (A-Z, 0-9), luu theo uppercase, duy nhat tren toan he thong | AC-002, AC-003, AC-006 | Khong co ngoai le; ma cau la khoa nghiep vu bat bien sau khi tao |
| BR-002 | Ben cang me phai la mot Ben cang da ton tai va co trang thai "Hien hanh" hoac "Tam ngung"; khong duoc chon Ben cang co trang thai "Cho phe duyet" hoac "Da xoa" | AC-004 | Khong co ngoai le; vi pham se lam mat quan he cha-con hop le trong du lieu |
| BR-003 | Tai trong thiet ke phai la gia tri duong, don vi T/m2, khong vuot qua 20 T/m2 | AC-007 | Neu tai trong chua xac dinh chinh thuc thi khong duoc de trong; phai nhap gia tri uoc tinh va ghi ro trong truong ghi chu |
| BR-004 | Chieu dai va chieu rong cau phai la gia tri duong, don vi met (m), khong vuot qua 500m cho moi truong | AC-008 | Khong co ngoai le; gia tri sai se anh huong den tinh toan nang luc cau cang |
| BR-005 | Trang thai mac dinh cua Cau cang sau khi tao moi luon la "Cho phe duyet" (cho_phe_duyet); nguoi tao khong duoc tu thiet lap trang thai "Hien hanh" | AC-002 | Khong co ngoai le; chi quy trinh phe duyet (F-023) moi doi trang thai |
| BR-006 | Moi hanh dong tao moi Cau cang phai duoc ghi vao bang audit log: actor, thoi gian UTC, du lieu duoc tao, IP nguon | AC-002 | Ngay ca khi tao that bai do loi ung dung, van ghi log that bai voi ma loi |
| BR-007 | Chi nguoi dung co vai tro Chuyen vien (A-003) hoac Quan tri he thong (A-001) duoc phep tao moi Cau cang | AC-001, AC-009 | Quan tri he thong (A-001) co toan quyen ke ca khi don vi to chuc khong phu hop |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | API tao moi Cau cang phai tra ket qua (thanh cong hoac loi) trong thoi gian chap nhan duoc | <= 2 giay voi tai trong binh thuong (< 100 nguoi dung dong thoi) |
| Security | Kiem tra phan quyen server-side tren moi request; du lieu nhap phai duoc sanitize de ngan SQL injection va XSS; HTTPS bat buoc | Khong co request nao bypass phan quyen; OWASP Top 10 compliance |
| Reliability | He thong phai dam bao tinh nhat quan du lieu khi co loi xay ra o giua qua trinh tao moi | Transaction atomicity: neu bat ky buoc nao that bai (luu ban ghi, ghi log), rollback toan bo |
| Audit/Logging | Ghi nhat ky day du moi hanh dong tao moi Cau cang bao gom actor, thoi gian UTC, du lieu duoc tao, IP nguon | 100% coverage; log phai duoc giu toi thieu 2 nam theo quy dinh nha nuoc |
| Operability | API endpoint phai tra ve loi co cau truc (error code + message) de DevOps giam sat | Loi server tra ve HTTP 4xx/5xx voi JSON body chuan; khong lo stack trace ra ben ngoai |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | Chuyen vien dang nhap va truy cap bieu mau tao moi Cau cang thanh cong | Acceptance |
| TS-002 | AC-009 | Nguoi dung khong co quyen (Lanh dao) nhan 403 khi truy cap | Security / Negative |
| TS-003 | AC-002 | Dien day du truong bat buoc hop le, luu thanh cong, kiem tra CSDL co ban ghi moi voi trang thai cho_phe_duyet | Integration |
| TS-004 | AC-003 | Nhap ma cau da ton tai, he thong tra ve loi 409 va thong bao dung truong | Integration / Negative |
| TS-005 | AC-004 | Dropdown Ben cang me khong hien thi Ben cang co trang thai "Cho phe duyet" | Integration |
| TS-006 | AC-005 | Bo trong truong ten cau, nhan Luu, kiem tra loi hien thi tai truong ten cau | UI / Negative |
| TS-007 | AC-006 | Nhap ma cau 5 ky tu (qua ngan), kiem tra loi dinh dang VN-614 | Unit / Negative |
| TS-008 | AC-006 | Nhap ma cau 11 ky tu (qua dai), kiem tra loi dinh dang VN-614 | Unit / Negative |
| TS-009 | AC-007 | Nhap tai trong thiet ke = 0, kiem tra loi xac thuc BR-003 | Unit / Negative |
| TS-010 | AC-007 | Nhap tai trong thiet ke = 21 T/m2 (vuot gioi han), kiem tra loi xac thuc | Unit / Negative |
| TS-011 | AC-008 | Nhap chieu dai = -1 (am), kiem tra loi xac thuc BR-004 | Unit / Negative |
| TS-012 | AC-008 | Nhap chieu rong = 501 (vuot gioi han), kiem tra loi xac thuc | Unit / Negative |
| TS-013 | AC-002 | Kiem tra audit log duoc ghi sau khi tao Cau cang thanh cong | Integration |
| TS-014 | AC-009 | Gui POST request khong co JWT token, kiem tra 401 Unauthorized | Security / Negative |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - existing | CauCang entity moi thuoc M-002 da co domain model; quan he Ben cang me (parent) da ton tai |
| Architecture affected? | Yes | REST API endpoint moi, validation logic chuyen biet (VN-614, tai trong, kich thuoc), parent-child relationship enforcement |
| Implementation clear? | No | Can SA xac dinh endpoint URL, request/response schema, transaction boundary voi audit log |
| **Verdict** | `Ready for solution architecture` | Feature co UI form, API moi, validation nghiep vu phuc tap, can SA truoc khi tech-lead planning |
