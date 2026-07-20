---
feature-id: F-014
document: lean-spec
output-mode: lean
last-updated: 2026-06-27
---
# Quan ly Ben cang - Tao moi

## Summary

He thong quan ly tai san KCHTGT hang hai chua co co che so hoa viec dang ky Ben cang (don vi ha tang chi tiet ben trong Cang bien) theo chuan VN-301, dan den rui ro sai so phan loai va kho tong hop nang luc phuc vu tau. Tinh nang nay cho phep nguoi dung co tham quyen tao moi mot Ben cang vao he thong voi day du thong tin ma so, ten, cang me, vi tri, kich thuoc, loai ben va thuoc tinh ky thuat theo chuan du lieu quoc gia, kem xac thuc hop le truoc khi luu. Thanh cong khi moi Ben cang duoc luu chinh xac vao CSDL voi trang thai "Cho phe duyet", khong co ban ghi ma ben trung lap, va ghi nhat ky day du.

## Scope

| | Items |
|---|---|
| In scope | Bieu mau tao moi Ben cang (truong bat buoc + mo rong); Kiem tra hop le ma ben VN-301 (6-10 ky tu); Kiem tra trung lap ma ben; Danh sach chon Cang me tu Cang bien da ton tai (trang thai Hien hanh hoac Tam ngung); Luu ban ghi voi trang thai mac dinh "Cho phe duyet"; Thong bao ket qua thanh cong / loi cho nguoi dung; Ghi nhat ky tao moi (audit log) |
| Out of scope | Quy trinh phe duyet Ben cang (F-017); Cap nhat thong tin Ben cang sau khi tao (F-015); Xoa Ben cang (F-016); Tich hop API he thong cang quoc gia; Nhap/Xuat du lieu hang loat |
| Assumptions | Ma ben VN-301 la chuan ma hoa quoc gia cho Ben cang Viet Nam; He thong da co Cang bien trong CSDL truoc khi tao Ben cang; He thong da co co che xac thuc / phan quyen nguoi dung truoc khi den tinh nang nay; CSDL ho tro rang buoc unique tren cot ma_ben |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Chuyen vien (A-003) | Tao moi mot Ben cang voi day du thong tin bat buoc va gan vao Cang me phu hop | Dang ky chinh thuc Ben cang vao he thong quan ly tai san quoc gia, cho phep theo doi nang luc phuc vu tau | Must Have |
| US-002 | Chuyen vien (A-003) | Nhan thong bao loi ro rang khi ma ben da ton tai | Tranh trung lap du lieu, bao ve tinh toan ven cua CSDL | Must Have |
| US-003 | Quan tri he thong (A-001) | Truy cap chuc nang tao moi Ben cang tuong tu Chuyen vien | Cho phep quan tri vien can thiep khi can thiet ma khong phu thuoc Chuyen vien | Must Have |
| US-004 | Chuyen vien (A-003) | Xem phan hoi xac thuc theo tung truong ngay khi nhap lieu | Giam thieu loi nhap lieu, tang toc do dang ky ben | Should Have |
| US-005 | Chuyen vien (A-003) | Chon Cang me tu danh sach cac Cang bien hien hanh / tam ngung | Duy tri tinh nhat quan du lieu - Ben cang luon gan voi Cang bien hop le | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001, US-003 | Truy cap chuc nang tao moi thanh cong | Given nguoi dung da dang nhap voi vai tro Chuyen vien (A-003) hoac Quan tri he thong (A-001); When truy cap menu "Quan ly tai san > Ben cang > Tao moi"; Then he thong hien thi bieu mau tao moi Ben cang | Chi A-001 va A-003 co quyen; nguoi dung khac nhan HTTP 403 |
| AC-002 | US-001, US-005 | Luu thanh cong khi du truong bat buoc hop le | Given bieu mau da dien day du: ma ben (hop le VN-301, chua ton tai), ten ben, Cang me (chon tu danh sach Cang bien trang thai Hien hanh hoac Tam ngung), chieu dai ben (> 0), chieu rong ben (> 0), loai ben, do sau luong truoc ben (>= 3m); When nguoi dung nhan "Luu"; Then he thong luu ban ghi moi voi trang thai "Cho phe duyet", ghi nhan createdAt tu dong, tra ve thong bao thanh cong | Trang thai mac dinh = cho_phe_duyet; createdAt khong duoc phep nguoi dung chinh sua |
| AC-003 | US-002 | Tu choi khi ma ben da ton tai | Given ma ben nhap vao da co trong CSDL; When nguoi dung nhan "Luu"; Then he thong tra ve loi HTTP 409 kem thong bao ro rang "Ma ben [X] da ton tai trong he thong", khong tao ban ghi moi | Kiem tra unique phai la server-side; thong bao loi hien thi o truong ma ben |
| AC-004 | US-004 | Xac thuc tung truong bat buoc khi bo trong | Given bieu mau con truong bat buoc trong; When nguoi dung nhan "Luu"; Then he thong hien thi thong bao loi tai tung truong tuong ung, khong gui request len server | Xac thuc client-side truoc; server-side validation la tuyen phong thu thu hai |
| AC-005 | US-004 | Xac thuc dinh dang ma ben VN-301 | Given ma ben nhap vao khong dung dinh dang VN-301 (6-10 ky tu); When nguoi dung roi khoi truong hoac nhan "Luu"; Then he thong hien thi loi "Ma ben phai co dinh dang VN-301 (6-10 ky tu)" | Pattern: [A-Z0-9]{6,10} - can xac nhan lai voi chu dau tu; tam thoi gia dinh uppercase alphanumeric |
| AC-006 | US-004 | Xac thuc chieu dai va chieu rong ben phai duong | Given chieu dai hoac chieu rong ben nhap gia tri <= 0 hoac vuot qua 2000m; When nguoi dung roi khoi truong hoac nhan "Luu"; Then he thong hien thi loi cu the cho tung truong kich thuoc | Server-side validation bat buoc |
| AC-007 | US-004 | Xac thuc do sau luong truoc ben toi thieu | Given do sau luong truoc ben nhap gia tri < 3m hoac <= 0; When nguoi dung roi khoi truong hoac nhan "Luu"; Then he thong hien thi loi "Do sau luong truoc ben khong duoc nho hon 3m" | Server-side validation bat buoc; gia tri phai la so thuc duong |
| AC-008 | US-005 | Danh sach Cang me chi hien thi Cang bien hop le | Given nguoi dung mo dropdown chon Cang me; When he thong tai danh sach; Then chi hien thi cac Cang bien co trang thai "Hien hanh" hoac "Tam ngung"; Cang bien co trang thai "Cho phe duyet" hoac "Da xoa" khong xuat hien | Kiem tra trang thai Cang me phai la server-side de tranh race condition |
| AC-009 | US-001, US-003 | Tu choi nguoi dung khong co quyen | Given nguoi dung dang nhap voi vai tro Lanh dao (A-002), Nguoi dung tai Cang (A-004), hoac Cong chung (A-005); When truy cap URL tao moi Ben cang; Then he thong tra ve HTTP 403 Forbidden | Phan quyen dua tren role; chi A-001, A-003 co quyen CREATE_BEN_CANG |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Ma ben phai tuan thu chuan ma hoa VN-301, do dai tu 6 den 10 ky tu alphanumeric (uppercase), duy nhat tren toan he thong | AC-002, AC-003, AC-005 | Khong co ngoai le; ma ben la khoa nghiep vu bat bien sau khi tao |
| BR-002 | Cang me phai la mot Cang bien da ton tai voi trang thai "Hien hanh" hoac "Tam ngung"; khong duoc chon Cang bien co trang thai "Cho phe duyet" hoac "Da xoa" | AC-002, AC-008 | Khong co ngoai le; dam bao tinh toan ven lien ket du lieu cha-con |
| BR-003 | Chieu dai va chieu rong ben phai la gia tri duong (> 0), don vi met, khong vuot qua 2000m | AC-006 | Khong co ngoai le; dam bao du lieu vat ly co ly |
| BR-004 | Do sau luong truoc ben phai la gia tri duong (> 0), don vi met, khong nho hon 3m | AC-007 | Khong co ngoai le; 3m la nguong ky thuat toi thieu theo quy chuan hang hai |
| BR-005 | Trang thai mac dinh cua Ben cang sau khi tao moi luon la "Cho phe duyet" (cho_phe_duyet); nguoi tao khong duoc tu thiet lap trang thai "Hien hanh" | AC-002, AC-009 | Khong co ngoai le; chi quy trinh phe duyet (F-017) moi doi trang thai |
| BR-006 | Moi hanh dong tao moi Ben cang phai duoc ghi vao bang audit log: actor, thoi gian UTC, du lieu ban ghi, IP nguon | AC-002 | Ngay ca khi tao that bai do loi ung dung, van ghi log that bai |
| BR-007 | Chi nguoi dung co vai tro Chuyen vien (A-003) hoac Quan tri he thong (A-001) duoc phep tao moi Ben cang | AC-001, AC-009 | Quan tri he thong (A-001) co toan quyen ke ca khi don vi to chuc khong phu hop |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | API tao moi Ben cang phai tra ket qua (thanh cong hoac loi) trong thoi gian chap nhan duoc | <= 2 giay voi tai trong binh thuong (< 100 nguoi dung dong thoi) |
| Security | Kiem tra phan quyen server-side tren moi request; du lieu nhap phai duoc sanitize de ngan SQL injection va XSS; HTTPS bat buoc; JWT xac thuc | Khong co request nao bypass phan quyen; tuan thu OWASP Top 10 |
| Reliability | He thong phai dam bao tinh nhat quan du lieu khi co loi xay ra o giua qua trinh tao moi | Transaction atomicity: neu bat ky buoc nao that bai (luu ban ghi, ghi log), rollback toan bo |
| Audit/Logging | Ghi nhat ky day du moi hanh dong tao moi Ben cang bao gom actor, thoi gian UTC, du lieu duoc tao, IP nguon | 100% coverage; log phai duoc giu toi thieu 2 nam theo quy dinh nha nuoc |
| Operability | API endpoint tra ve loi co cau truc (error code + message) de DevOps giam sat; khong lo stack trace | Loi server tra ve HTTP 4xx/5xx voi JSON body chuan |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | Chuyen vien dang nhap va truy cap bieu mau tao moi Ben cang thanh cong | Acceptance |
| TS-002 | AC-009 | Nguoi dung Lanh dao nhan 403 khi truy cap chuc nang tao moi | Security / Negative |
| TS-003 | AC-002 | Dien day du truong bat buoc hop le, luu thanh cong, kiem tra CSDL co ban ghi moi voi trang thai cho_phe_duyet | Integration |
| TS-004 | AC-003 | Nhap ma ben da ton tai, he thong tra ve loi 409 va thong bao dung truong | Integration / Negative |
| TS-005 | AC-004 | Bo trong truong ten ben, nhan Luu, kiem tra loi hien thi tai truong ten ben | UI / Negative |
| TS-006 | AC-005 | Nhap ma ben 5 ky tu (qua ngan), kiem tra loi dinh dang VN-301 | Unit / Negative |
| TS-007 | AC-005 | Nhap ma ben 11 ky tu (qua dai), kiem tra loi dinh dang VN-301 | Unit / Negative |
| TS-008 | AC-006 | Nhap chieu dai ben = 0, kiem tra loi xac thuc "phai lon hon 0" | Unit / Negative |
| TS-009 | AC-006 | Nhap chieu rong ben = 2001m, kiem tra loi xac thuc "vuot qua 2000m" | Unit / Negative |
| TS-010 | AC-007 | Nhap do sau luong truoc ben = 2.5m, kiem tra loi "khong nho hon 3m" | Unit / Negative |
| TS-011 | AC-008 | Kiem tra dropdown Cang me khong hien thi Cang bien co trang thai "Cho phe duyet" | Integration |
| TS-012 | AC-008 | Kiem tra dropdown Cang me khong hien thi Cang bien co trang thai "Da xoa" | Integration |
| TS-013 | AC-002 | Kiem tra audit log duoc ghi sau khi tao Ben cang thanh cong | Integration |
| TS-014 | AC-009 | Gui POST request khong co JWT token, kiem tra 401 Unauthorized | Security / Negative |
| TS-015 | AC-002 | Kiem tra trang thai luon la cho_phe_duyet du nguoi dung co co gang truyen trang thai khac qua API | Security / Negative |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes | Tao moi Aggregate Root BenCang chua ton tai; can dinh nghia entity, trang thai, invariants, FK toi CangBien |
| Architecture affected? | Yes | Can thiet ke REST endpoint moi, database table moi (ben_cang), audit log mechanism, RBAC permission moi (BEN_CANG_CREATE), FK constraint voi cang_bien |
| Implementation clear? | No | Chua co SA artifacts cho M-002 (F-014 truoc F-015); can SA quyet dinh pattern REST, transaction boundary, permission seed, FK enforcement strategy |
| **Verdict** | `Ready for solution architecture` | Phase 2 (Domain Analysis) khong bat buoc vi cau truc domain don gian (1 aggregate root, 1 bounded context co FK den CangBien); SA du kha nang xu ly truc tiep |

## BA -> Handoff Summary

**Verdict:** Ready for solution architecture

**Phases completed:** BA only

**Triage rationale:** Tinh nang tao moi BenCang la 1 aggregate root don gian voi 7 business rules ro rang va 1 FK dependency toi CangBien; khong co bounded context moi hay cross-domain event nao. SA can quyet dinh cac van de ky thuat: REST endpoint, DB schema, permission seed, transaction pattern, FK enforcement.

**Business goal:** So hoa viec dang ky Ben cang theo chuan VN-301, dam bao tinh chinh xac phan loai ben (loai, kich thuoc, do sau) va lien ket chinh xac voi Cang bien truoc khi phe duyet chinh thuc.

**Scope in:**
- Bieu mau tao moi Ben cang (7 truong bat buoc + truong tuy chon)
- Xac thuc ma ben VN-301 (6-10 ky tu alphanumeric uppercase, unique)
- Xac thuc kich thuoc ben (chieu dai, chieu rong > 0, <= 2000m) va do sau luong (>= 3m)
- Dropdown chon Cang me chi hien thi Cang bien trang thai Hien hanh/Tam ngung
- Luu ban ghi voi trang thai mac dinh cho_phe_duyet
- Audit log moi hanh dong tao moi

**Key business rules:** BR-001: ma ben VN-301 unique bat bien; BR-002: Cang me phai trang thai Hien hanh/Tam ngung; BR-004: do sau luong >= 3m (nguong ky thuat); BR-005: trang thai mac dinh cho_phe_duyet khong the bi ghi de; BR-007: chi Chuyen vien + Quan tri he thong co quyen tao moi

**Actors:** A-001 Quan tri he thong (Admin), A-003 Chuyen vien

**UI/UX impact:** Yes - designer required (bieu mau nhap lieu voi validation inline, dropdown Cang me, enum loai ben)

**Screen types:** Form tao moi Ben cang (single-page form with inline validation, dropdown Cang me, enum selection loai ben)

**Open items (non-blocking):** Regex chinh xac cho ma ben VN-301 can xac nhan voi chu dau tu (tam thoi [A-Z0-9]{6,10}); cac truong mo rong (tuyen duong thuy, toa do GPS) co bat buoc hay tuy chon can lam ro; gia tri toi da chieu dai/chieu rong 2000m la gia dinh - can xac nhan
