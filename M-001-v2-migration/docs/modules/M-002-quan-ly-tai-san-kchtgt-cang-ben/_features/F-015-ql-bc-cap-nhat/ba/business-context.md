---
feature-id: F-015
document: lean-spec
output-mode: lean
last-updated: 2026-06-27
---
# Quan ly Ben cang - Cap nhat

## Summary

He thong hien tai chua co co che cap nhat thong tin Ben cang sau khi tao, dan den nguy co du lieu khong phan anh dung trang thai ha tang thuc te (cai tao ben, nao vet luong, thay doi cong nang). Tinh nang nay cho phep nguoi dung co tham quyen chinh sua thong tin Ben cang da ton tai (tru ma ben) voi kiem soat rang buoc Cang me, kem ghi nhat ky thay doi day du. Thanh cong khi moi lan cap nhat duoc luu dung vao CSDL, nhat ky ghi nhan day du truong thay doi / gia tri cu / gia tri moi, va he thong canh bao khi Ben cang dang trong trang thai khong cho phep cap nhat truc tiep.

## Scope

| | Items |
|---|---|
| In scope | Giao dien tim kiem va chon Ben cang can cap nhat; Bieu mau cap nhat voi du lieu hien tai dien san; Validation cac truong co the thay doi (ten ben, kich thuoc, loai ben, do sau luong, ghiChu, toa do, tuyen duong thuy); Kiem tra rang buoc Cang me truoc khi luu; Ghi nhat ky thay doi (truong thay doi, gia tri cu, gia tri moi, nguoi cap nhat, thoi gian); Thong bao ket qua cap nhat cho nguoi dung; Canh bao khi Ben cang dang cho phe duyet hoac da bi xoa mem |
| Out of scope | Thay doi ma Ben cang sau khi da tao (khong cho phep); Quy trinh phe duyet thay doi lon (F-017); Xoa Ben cang (F-016); Lich su xem lai toan bo phien ban (F-019); Xuat bao cao lich su cap nhat; Nhap/xuat hang loat |
| Assumptions | He thong da co co che xac thuc / phan quyen truoc tinh nang nay; Entity BenCang da ton tai voi cac truong nhu feature-brief mo ta; Co che ghi audit log (LichSuThayDoi) da duoc dinh nghia hoac co the tai su dung tu F-008; Ma ben la khoa nghiep vu bat bien sau khi tao |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Chuyen vien (A-003) | Cap nhat thong tin ky thuat cua Ben cang (kich thuoc, do sau luong, loai ben) | Dam bao du lieu phan anh dung trang thai ha tang sau cai tao / nao vet | Must Have |
| US-002 | Quan tri he thong (A-001) | Truy cap chuc nang cap nhat Ben cang tuong tu Chuyen vien | Cho phep quan tri vien can thiep khi can thiet | Must Have |
| US-003 | Chuyen vien (A-003) | Nhan canh bao ro rang khi cap nhat Ben cang dang cho phe duyet hoac da xoa mem | Tranh thao tac nham, bao ve tinh nhat quan trang thai | Must Have |
| US-004 | Chuyen vien (A-003) | He thong tu dong ghi nhat ky thay doi moi lan cap nhat thanh cong | Dam bao minh bach va co the truy vet lai lich su thay doi | Must Have |
| US-005 | Chuyen vien (A-003) | Nhan phan hoi loi ro rang khi du lieu nhap vi pham rang buoc ky thuat | Giam thieu nhap lieu sai, tang toc do xu ly | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001, US-002 | Truy cap chuc nang cap nhat thanh cong | Given nguoi dung da dang nhap voi vai tro Chuyen vien (A-003) hoac Quan tri he thong (A-001); When truy cap trang cap nhat Ben cang (tu danh sach hoac trang chi tiet); Then he thong hien thi bieu mau cap nhat voi du lieu hien tai dien san, truong ma ben la read-only | Chi A-001 va A-003 co quyen; vai tro khac nhan HTTP 403 |
| AC-002 | US-001 | Luu thanh cong khi du lieu hop le | Given bieu mau da chinh sua it nhat mot truong hop le (ten ben, kich thuoc, loai ben, do sau luong, toa do, ghi chu); When nguoi dung nhan "Luu"; Then he thong luu thay doi, cap nhat updatedAt, ghi nhat ky thay doi day du (truong thay doi, gia tri cu, gia tri moi, nguoi cap nhat, thoi gian), tra ve thong bao thanh cong | updatedAt cap nhat tu dong; createdAt khong thay doi; ma ben khong duoc thay doi |
| AC-003 | US-003 | Hien thi canh bao khi Ben cang dang cho phe duyet | Given Ben cang co trang Thai = cho_phe_duyet; When nguoi dung truy cap trang cap nhat; Then he thong hien thi canh bao "Ben cang dang trong qua trinh phe duyet — thay doi co the bi ghi de khi phe duyet hoan tat"; nguoi dung co the xac nhan tiep tuc hoac huy | Canh bao, khong phai block; nguoi dung van co the luu |
| AC-004 | US-003 | Chan cap nhat khi Ben cang da bi xoa mem | Given Ben cang co trangThai = da_xoa; When nguoi dung truy cap URL cap nhat; Then he thong tra ve HTTP 403 / thong bao "Ben cang nay da bi xoa, khong the cap nhat" | Block tuyet doi; khong cho phep cap nhat record da xoa mem |
| AC-005 | US-001 | Tu choi thay doi Cang me khi co du lieu lien quan | Given Ben cang da co du lieu lien quan (luot tau, lich su phuc vu); When nguoi dung chon Cang me moi va nhan "Luu"; Then he thong hien thi loi "Khong the thay doi Cang me do Ben cang da co du lieu lien quan — vui long lien he quan tri vien de xu ly" | Server-side check; front-end nen an/disable dropdown Cang me neu phat hien du lieu lien quan |
| AC-006 | US-005 | Tu choi khi kich thuoc ben vuot nguong | Given chieu dai hoac chieu rong nhap gia tri <= 0 hoac > 2000m; When nguoi dung nhan "Luu"; Then he thong hien thi loi xac thuc tai tung truong tuong ung | Server-side validation bat buoc; client-side la tang phong thu thu hai |
| AC-007 | US-005 | Tu choi khi do sau luong nho hon muc toi thieu | Given do sau luong truoc ben nhap gia tri <= 0 hoac < 3m; When nguoi dung nhan "Luu"; Then he thong hien thi loi "Do sau luong phai >= 3m" | Server-side validation bat buoc |
| AC-008 | US-004 | Ghi nhat ky thay doi day du | Given nguoi dung luu thanh cong bat ky thay doi nao; When transaction hoan tat; Then he thong ghi vao LichSuThayDoi: benCangId, truong duoc cap nhat, gia tri cu, gia tri moi, nguoiCapNhat (userId), thoiGianCapNhat (UTC) | Ghi nhat ky phai nam trong cung transaction voi viec luu BenCang; neu log that bai thi rollback toan bo |
| AC-009 | US-001, US-002 | Tu choi nguoi dung khong co quyen | Given nguoi dung dang nhap voi vai tro Lanh dao (A-002), Port Operator (A-004) hoac Public (A-005); When gui PUT/PATCH request cap nhat Ben cang; Then he thong tra ve HTTP 403 Forbidden | Kiem tra phan quyen server-side; khong lo chi tiet loi ngoai |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Ma ben khong duoc phep thay doi sau khi Ben cang da duoc tao; moi yeu cau thay doi ma ben phai thong qua quy trinh huy bo va tao lai | AC-001 (read-only field), AC-002 | Khong co ngoai le; ma ben la khoa nghiep vu bat bien |
| BR-002 | Chieu dai va chieu rong ben phai la gia tri duong, khong vuot qua 2000m; don vi la met (m) | AC-006 | Khong co ngoai le |
| BR-003 | Do sau luong truoc ben phai la gia tri duong va khong nho hon 3m; don vi la met (m) | AC-007 | Khong co ngoai le; gia tri < 3m la ngoai le an toan hang hai |
| BR-004 | Thay doi Cang me chi duoc cho phep neu Ben cang chua co du lieu lien quan (luot tau, lich su phuc vu); neu co du lieu lien quan, he thong chan thao tac va yeu cau quy trinh dac biet | AC-005 | Chi quan tri vien co the xu ly qua quy trinh ngoai he thong |
| BR-005 | Nhat ky thay doi (LichSuThayDoi) phai duoc ghi nhan tu dong trong cung transaction cho moi lan cap nhat thanh cong; neu ghi log that bai, rollback toan bo transaction | AC-008 | Khong co ngoai le; nhat ky la yeu cau bat buoc phap ly |
| BR-006 | Ben cang co trangThai = da_xoa khong duoc phep cap nhat bat ky truong nao; he thong chan request ngay tu tang API | AC-004 | Khong co ngoai le |
| BR-007 | He thong hien thi canh bao (khong chan) khi Ben cang dang co trangThai = cho_phe_duyet; nguoi dung phai xac nhan truoc khi tiep tuc cap nhat | AC-003 | Nguoi dung co quyen xac nhan tiep tuc; thay doi van duoc luu |
| BR-008 | Chi nguoi dung co vai tro Chuyen vien (A-003) hoac Quan tri he thong (A-001) duoc phep cap nhat Ben cang | AC-001, AC-009 | A-001 co toan quyen ke ca khi don vi to chuc khong phu hop |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | API cap nhat Ben cang phai tra ket qua (thanh cong hoac loi) trong thoi gian chap nhan | <= 2 giay voi tai trong binh thuong (< 100 nguoi dung dong thoi) |
| Security | Kiem tra phan quyen server-side tren moi PUT/PATCH request; sanitize du lieu nhap de ngan SQL injection va XSS; HTTPS bat buoc | Khong co request nao bypass phan quyen; OWASP Top 10 compliance |
| Reliability | Dam bao tinh nhat quan du lieu: viec cap nhat BenCang va ghi LichSuThayDoi phai nam trong cung transaction, rollback neu bat ky buoc nao that bai | Transaction atomicity 100%; zero partial update |
| Audit/Logging | Ghi nhat ky day du moi lan cap nhat: actor (userId), thoi gian UTC, truong thay doi, gia tri cu/moi, IP nguon | 100% coverage; log luu toi thieu 2 nam theo quy dinh nha nuoc |
| Operability | API endpoint tra ve loi co cau truc (HTTP status code + JSON error body chuan); khong lo stack trace | Loi 4xx/5xx voi JSON body: {code, message, field (neu validation error)} |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | Chuyen vien dang nhap, chon Ben cang tu danh sach, bieu mau hien thi voi du lieu dien san, ma ben la read-only | Acceptance |
| TS-002 | AC-009 | Lanh dao (A-002) gui PUT request cap nhat Ben cang, kiem tra nhan HTTP 403 | Security / Negative |
| TS-003 | AC-002 | Chinh sua ten ben va do sau luong hop le, luu thanh cong, kiem tra CSDL va LichSuThayDoi co ban ghi moi | Integration |
| TS-004 | AC-003 | Cap nhat Ben cang co trangThai = cho_phe_duyet, kiem tra canh bao hien thi, xac nhan tiep tuc, luu thanh cong | Integration |
| TS-005 | AC-004 | Truy cap cap nhat Ben cang da xoa mem, kiem tra HTTP 403 va thong bao loi | Integration / Negative |
| TS-006 | AC-005 | Doi Cang me cua Ben cang da co du lieu lien quan, kiem tra loi bi chan | Integration / Negative |
| TS-007 | AC-006 | Nhap chieu dai ben = -1, kiem tra loi xac thuc tai truong tuong ung | Unit / Negative |
| TS-008 | AC-006 | Nhap chieu dai ben = 2500m (vuot 2000m), kiem tra loi xac thuc | Unit / Negative |
| TS-009 | AC-007 | Nhap do sau luong = 2.5m (< 3m), kiem tra loi xac thuc | Unit / Negative |
| TS-010 | AC-008 | Kiem tra LichSuThayDoi ghi dung: truong thay doi, gia tri cu, gia tri moi, userId, timestamp sau cap nhat thanh cong | Integration |
| TS-011 | AC-008 | Gia lap loi ghi nhat ky (LichSuThayDoi), kiem tra toan bo transaction duoc rollback, du lieu goc khong thay doi | Integration / Negative |
| TS-012 | AC-002 | Gui PUT request khong co JWT token, kiem tra HTTP 401 Unauthorized | Security / Negative |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Khong tao moi aggregate root; BenCang va LichSuThayDoi da ton tai (hoac duoc dinh nghia trong F-014); tinh nang nay chi them hanh vi cap nhat len aggregate root hien co |
| Architecture affected? | Yes | Can them PUT/PATCH endpoint moi, them permission seed BenCang:update, them logic kiem tra rang buoc Cang me, dam bao transaction boundary bao gom ca ghi LichSuThayDoi |
| Implementation clear? | No | Chua co SA artifacts cho M-002 (dang o trang thai proposed); SA can quyet dinh: REST resource naming cho update, transaction pattern, permission seed chinh xac |
| **Verdict** | `Ready for solution architecture` | SA can xu ly endpoint, permission seed, transaction boundary va rang buoc Cang me; domain model khong co gi moi nen Phase 2 (Domain Analysis) khong chay |

## BA -> Handoff Summary

**Verdict:** Ready for solution architecture

**Phases completed:** BA only

**Triage rationale:** Tinh nang cap nhat BenCang chi them hanh vi PUT/PATCH len aggregate root da ton tai tu F-014; khong co bounded context moi. SA can quyet dinh endpoint naming, RBAC permission seed (BenCang:update), transaction pattern bao gom audit log, va logic kiem tra rang buoc Cang me.

**Business goal:** Cho phep cap nhat thong tin ky thuat Ben cang theo bien dong thuc te (cai tao, nao vet, thay doi cong nang), dam bao CSDL luon phan anh dung trang thai ha tang hang hai.

**Scope in:**
- Bieu mau cap nhat BenCang voi du lieu hien tai dien san (ma ben read-only)
- Validation 5 rang buoc nghiep vu (kich thuoc, do sau, rang buoc Cang me, trang thai da_xoa, cho_phe_duyet)
- Ghi LichSuThayDoi trong cung transaction
- Canh bao (khong block) khi trang thai cho_phe_duyet; block tuyet doi khi trang thai da_xoa
- RBAC: chi A-001, A-003 co quyen

**Key business rules:** BR-001: ma ben bat bien; BR-004: rang buoc Cang me khi co du lieu lien quan; BR-005: nhat ky phai trong cung transaction; BR-006: da_xoa -> block tuyet doi; BR-008: chi A-001 va A-003 co quyen cap nhat

**Actors:** A-001 Quan tri he thong (Admin), A-003 Chuyen vien

**UI/UX impact:** Yes — designer required (bieu mau cap nhat co read-only field, canh bao trang thai, inline validation)

**Screen types:** Form cap nhat Ben cang (pre-filled form with read-only maBen, status warning modal, inline validation feedback)

**Open items (non-blocking):** Xac nhan dieu kien cu the "du lieu lien quan" de kiem tra rang buoc Cang me (so luot tau > 0? lich su phuc vu > 0?) — tam thoi gia su la bat ky du lieu nao trong bang LuotTau hoac LichSuPhucVu tham chieu benCangId; xac nhan voi chu dau tu co can approval workflow cho truong hop thay doi Cang me hay khong (feature-brief neu "quy trinh phe duyet dac biet" nhung chua co F cu the)
