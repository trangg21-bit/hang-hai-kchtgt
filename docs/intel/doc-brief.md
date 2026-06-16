# TAI LIEU PHAN TICH TKCT - LAYER 1

> **Nguon:** TKCT_CucHH_KetCauHaTangGiaoThong.docx
> **Ngay:** 2026-06-16
> **Phan loai:** Thiet ke chi tiet - Pham mem noi bo + Ha tang ky thuat
> **Quy mo:** LARGE (670 chunks, ~457K tokens)

---

## 1. THONG TIN DU AN

| Thuoc tinh | Gia tri |
|---|---|
| Ten du an | Xay dung He thong thong tin quan ly ket cau ha tang giao thong hang hai |
| Ma he thong | KCHTGTHH |
| Chu dau tu | Cuc Hang hai Viet Nam |
| Don vi tu van TKCT | Trung tam Cong nghe so Quoc gia, Bo TTTT |
| Tong muc dau tu | 22,446,571,000 VND |
| Thoi gian | 2021-2025 |
| Nguyen von | Ngan sach nha nuoc |
| Ho so quet | ~5,240 trang A4 |

---

## 2. KIEN TRUC TONG THE

### Mo hinh 6 lop (Khung CPDT Bo GTVT)
1. Nguoi su dung: Lanh dao, Can bo, Ca nhan/Doanh nghiep, Bo GTVT, To chuc quoc te, Cang vu
2. Nghiep vu: Quan ly tai san KCHT (vong doi), Bao cao dinh ky
3. Ung dung: Quan ly KCHT, Quan ly tai san, Phan tich/Bao cao BI
4. Cong nghe: Luu tru dien tu, GIS (GeoServer), BI, SIEM
5. CSDL: Thuoc tinh + Khong gian
6. Ha tang: May chu, thiet bi mang, truyen dan, bao mat

### Kien truc Microservice
- Firewall Cluster -> Nginx Proxy -> 2x App Servers (ReactJS + Spring Boot Docker)
- App Servers -> DB (MSSQL 2022 + SAN), GIS (GeoServer), MinIO, SIEM

### Thiet bi ha tang (17 hang muc)
- Firewall HA Active-Standby x2, App Server x2, DB Server x2, GIS x1, SIEM x2, Proxy x2
- SAN Switch x2, SAN Storage x1, Core Switch x1, Distribute Switch x2, UPS x2, Rack x1

---

## 3. ACTORS / ROLES

| Vai tro | Quyen han | Ghi chu |
|---|---|---|
| Quan tri he thong | Tai khoan, nhom, don vi, admin, log, ban do, lien thong | Admin |
| Lanh dao | Duyet du lieu, phe duyet tai san, xem bao cao | |
| Chuyen vien | Khoi tao, cap nhat, quan ly, kiem ke, bao cao | Cang vu, Chi cuc, Cuc |
| Nguoi dung tai Cang | Khai thac, cap nhat du lieu duoc cap quyen | |
| Ca nhan/To chuc ben ngoai | Tra cuu thong tin KCHT qua web | Cong dan, doanh nghiep |
| HTTT-DV | Lien thong du lieu qua API | TCT, Cang vu |
| Truc LGSP | Dong bo du lieu -> CSDL Bo GTVT | External system |

---

## 4. MODULES (12 module chinh)

### M-001: Quan tri he thong
- Tai khoan, nhom, don vi, admin (3 muc: thuong/su dung/van hanh), log (5 nhom), bieu tuong ban do, ket noi lien thong (LGSP/NDXP/API)
- **Features:** 7 (F-001 to F-007) | **Actors:** A-001

### M-002: Quan ly tai san KCHTGT - Cang & Ben
- Workflow: Quan ly -> Duyet -> Quan ly tai san
- 1. Cang bien (36) | 2. Ben cang (301) | 3. Cau cang (614) | 4. Cang can (14) | 5. Vung nuoc (77)
- Moi loai: CRUD (3) + Phe duyet (1) + Xem chi tiet (1) + Lich su (1) = 6 features x 5 types = 30 features
- **Features:** 30 (F-008 to F-037) | **Actors:** A-002, A-003, A-004

### M-003: Quan ly tai san KCHTGT - Khu nuoc & VTS
- 1. Luong hang hai (56) | 2. De/ke (85) | 3. Co so sua chua, dong tau (411) | 4. Tram radar (18) | 5. He thong VTS (12)
- Moi loai: CRUD (3) + Phe duyet (1) + Xem chi tiet (1) + Lich su (1) = 6 features x 5 types = 30 features
- **Features:** 30 (F-038 to F-067) | **Actors:** A-002, A-003, A-004

### M-004: Quan ly tai san Bao hieu & Thong tin
- 1. Den bien (94) | 2. Phao tieu (1452) | 3. Nha tram phao (60) | 4. Nha tram den (86) | 5. Dai TTDH (29) | 6. Dai Inmarsat (1) | 7. Dai Cospas-Sarsat (1) | 8. Dai LRIT (1) | 9. Dai TT hang hai HN (1)
- Moi loai: CRUD (3) + Phe duyet (1) + Xem chi tiet (1) + Lich su (1) = 6 features x 9 types = 54 features
- **Features:** 54 (F-068 to F-121) | **Actors:** A-002, A-003, A-004

### M-005: Quan ly bien dong tai san KCHTGT
- Bien dong (tang/giam/xu ly tai san), kiem ke tai san, khai thac tai san, phe duyet bien dong
- **Features:** 6 (F-122 to F-127) | **Actors:** A-002, A-003, A-004

### M-006: Quan ly van ban & Thong tin nghiep vu
- Van ban phap ly, van hanh, bao tri, su co, quy hoach ben cang, tim kiem van ban
- **Features:** 8 (F-080 to F-087) | **Actors:** A-003

### M-007: GIS / Ban do
- Danh muc doi tuong GIS (diem, duong, vung), quan ly KCHT tren ban do, tra cuu KCHT tren ban do
- **Features:** 5 (F-075 to F-079) | **Actors:** A-003, A-004

### M-008: Bao cao & Thong ke
- 50+ mau bao cao, bieu thong ke chuyen nganh (Bieu 01-N to Bao cao tinh hinh hoat dong)
- P0: Bao cao tang giam tai san, Mau B03/CCTT, Mau so 02-06
- P1: Bieu 01-N to 23-N, Bieu 28-T to 33-N
- P2: Bieu Tong hop (5 bieu), Bao cao ke khai, Bao cao tinh hinh hoat dong
- **Features:** 49 (F-088 to F-136) | **Actors:** A-003, A-002

### M-009: Lien thong & Tich hop du lieu
- **37 Chia se (LGSP):** Ben cang, Cau cang, Ben phao, Khu trÃ¡nh trÃº bÃ£o, Khu chuyen tai, Khu neo dau, Co so sua chua, Den bien, Phao tieu, He thong VTS, TT dieu hanh VTS, Tram Radar, He thong AIS, He thong CCTV, He thong SCADA, He thong thong tin VHF, He thong truyen dan, He thong phu tro VTS, De chan song/de chan cat/ke, Luong hang hai, Dai TTDH, Dai Inmarsat, Dai Cospas-Sarsat, Dai LRIT, Dai TT hang hai HN, Cang can, Trang thai hoat dong KCHTGT HH, Thong tin tai san KCHTGT HH, Thong tin tong hop KCHTGT hang hai, Thong tin bao tri KCHTGT hang hai, Tong hop KCHTGT (6 bieu: cang bien, ben cang/cau cang, luong hang hai, khu chuyen tai/khu neo dau, phao tieu, den bien, de/ke)
- **44 Tich hop:** Ben cang, Cau cang, Ben phao, Khu trÃ¡nh trÃº bÃ£o, Khu chuyen tai, Khu neo dau, Co so sua chua, TT Den bien, TT Phao tieu, He thong VTS, TT dieu hanh VTS, Tram Radar, He thong AIS, He thong CCTV, He thong SCADA, He thong thong tin VHF, He thong truyen dan, He thong phu tro VTS, De/ke, Luong hang hai, TT Dai TTDH, TT Dai Inmarsat, TT Dai Cospas-Sarsat, TT Dai LRIT, TT Dai TT hang hai HN, Cang can, Mang hai do dien tu, Tau bien ra vao cang, Phuong tien thuy noi dia, Tau bien nuoc ngoai, Tau bien VN van tai quoc te, Khoi luong hang hoa/hanh khach, Luot tau thuyá»n vao roi cang, Khoi luong hang hoa doi tau VN, Khoi luong hang hoa trong khu quan ly, Thuyen vien/hoa tieu, Tau bien co quoc tich VN, Tau thuyá»n lai dhat, Co so dong moi/sua chua, Nang luc thong qua ben cang, Nang luc thong qua cang, Khoi luong hang hoa theo thang, Khoi luong hang hoa theo nam, San luong dich vu van tai
- **Features:** 81 (F-106 to F-186) | **Actors:** A-007, A-006
- Lien thong: Truc LGSP, Truc NDXP, API web (VMS-N, VMS-S, VISHIPEL, Cang vu)
- Protocol: RESTful API, JSON, HTTPS, JWT, IP whitelist, UTF-8, UTC+7

### M-010: Xac thuc & Phan quyen
- Dang ky tai khoan (email/sdt, mat khau hash)
- Dang nhap lan dau + TOTP setup (MFA, SHA-256/512/SHA-3, QR, JWT)
- Dang nhap lan tiep theo + TOTP (xac thuc 2 yeu to)
- Quan ly JWT session (HttpOnly cookie, auto-refresh, auto-logout timeout)
- Phan quyen 3 muc: chuc nang, thao tac, du lieu (3 nhom: thuong/su dung/van hanh)
- Chinh sach mat khau (do phuc tap, het han, khoa tai khoan)
- Chinh sach gioi han dang nhap sai (canh bao, tuong ngan cau, tuong vo hieu hoa)
- **Features:** 7 (F-107 to F-113) | **Actors:** A-001

### M-011: Nhat ky & Backup
- 5 nhom log: truy cap phan mem, dang nhap, loi phat sinh, quan ly tai khoan, thay doi cau hinh
- 5 truong log: thoi diem, phan nhom, mo ta, doi tuong, muc do quan trong
- Tra cuu/loc/xuat log, sao luu CSDL tu dong, phuc hoi du lieu (<=8 gio)
- SIEM: thu thap tu Firewall/Switch/Server/DB (500 EPS, Agent+Agentless)
- Bao cao SIEM: xuat WORD/EXCEL/PDF/HTML/XML
- **Features:** 6 (F-121 to F-126) | **Actors:** A-001

### M-012: Hai do & GIS Integration
- Tich hop hai do S-57/S-63 tu VMS-N/VMS-S, hien thi S-52, quan ly lop GIS, tich hop CSDL khong gian, hieu toa WGS84
- **Features:** 6 (F-127 to F-132) | **Actors:** A-003

---

## 5. MODULE BOUNDARY NOTES

| Boundary | M-001 (Quan tri) | M-010 (Xac thuc) |
|---|---|---|
| Tai khoan | Tao/sua/xoa/khoa, phe duyet, gan quyen, admin 3 muc | Dang ky (mua hoa mat khau), MFA TOTP, JWT, logout, mat khau policy, gioi han dang nhap sai |
| Routes | /admin/* | /login, /register, /totp/* |

| Boundary | M-007 (GIS) | M-012 (Integration) |
|---|---|---|
| KCHT quan ly | CRUD doi tuong GIS (diem/duong/vung), xem KCHT tren ban do | Tich hop hai do S-57/S-63, hieu toa WGS84 |
| Map display | Hien thi doi tuong GIS theo bieu tuong | S-52 (ki hieu, mau sac, kieu duong) |

---

## 6. DU LIEU & CSDL

### 3,453 doi tuong, 46,427 truong

| Type | Count | Fields (approx) |
|---|---|---|
| Cang bien | 36 | ~1,287 |
| Ben cang | 301 | ~9,030 |
| Cau cang | 614 | ~12,280 |
| Cang can | 14 | ~196 |
| Vung nuoc | 77 | ~770 |
| VTS | 12 | ~360 |
| Tram radar | 18 | ~540 |
| Co so sua chua | 411 | ~12,330 |
| Luong hang hai | 56 | ~560 |
| De/ke | 85 | ~850 |
| Den bien | 94 | ~940 |
| Phao tieu | 1,452 | ~4,356 |
| Nha tram phao | 60 | ~360 |
| Nha tram den | 86 | ~774 |
| Dai TTDH | 29 | ~290 |
| Dai Inmarsat | 1 | ~10 |
| Dai Cospas-Sarsat | 1 | ~10 |
| Dai LRIT | 1 | ~10 |
| Dai TT hang hai HN | 1 | ~10 |
| **Tong** | **3,453** | **~46,427** |

### 6 CSDL: Nghiep vu (MSSQL), Nguoi dung (MSSQL), Thuoc tinh (MSSQL), Khong gian (MSSQL+GIS), MinIO (File), Tong hop (MSSQL)

### Quan he 1:N
- cang_bien 1:N ben_cang | cang_bien 1:N cau_cang | cang_bien 1:N cang_can | cang_bien 1:N vung_nuoc
- luong_hang_hai 1:N de/ke | cang_bien 1:N co_so_sua_chua

---

## 7. NFR

### Bao mat: Cap do 3 (TCVN 11930:2017), MFA+TOTP, SHA-256/512/SHA-3, JWT, HTTPS/TLS, IP whitelist, OWASP (SQL Injection, XSS, CSRF, RFI, LFI, XPath, OS Command)
### San sang: >=90%/nam, <=10h/thang, phuc hoi <=8 gio, IPv6
### Hieu nang: Phanh hoi <=5s (tra cuu), 10s (tim kiem), >500 nguoi dung dong thoi
### Giao dien: Web, tieng Viet Unicode (TCVN 6909:2001), tong xanh-trang-den, DD/MM/YYYY, Responsive
### Nhat ky: 5 nhom, sao luu tu dong, auto-logout timeout

---

## 8. TECH STACK

| Thanh phan | Cong nghe |
|---|---|
| Backend | Java Spring Boot (Docker) |
| Frontend | ReactJS 18+ |
| API Gateway | Nginx (Reverse Proxy) |
| Database | MSSQL Server 2022 AlwaysOn Cluster |
| File Storage | MinIO (S3-compatible) |
| GIS | GeoServer (S-57/S-63, WGS84) |
| OS | Windows Server 2022, Linux |
| Container | Docker |
| Security | SIEM (500 EPS), Firewall HA |

---

## 9. SITEMAP

- **Auth:** /login, /register, /totp-setup, /totp-verify, /totp-disable, /logout
- **Admin:** /admin/users, /admin/groups, /admin/orgs, /admin/admins, /admin/logs, /admin/icons, /admin/integration
- **KCHT CRUD:** /kcht/{cang_bien,ben_cang, cau_cang, cang_can, vung_nuoc, luong_hang_hai, de_ke, co_so_sua_chua, tram_radar, vts, den_bien, phao_tieu, nha_tram_phao, nha_tram_den, dai_ttdh, dai_inmarsat, dai_cospas_sarsat, dai_lrit, dai_tt_hn}/list, /create, /update, /detail, /approve
- **Asset:** /asset/manage, /asset/kiem-ke, /asset/bien-dong
- **Legal:** /legal/list, /legal/detail
- **Ops:** /ops/list, /ops/detail
- **Maint:** /maint/list, /maint/detail
- **Incident:** /incident/list, /incident/detail
- **Planning:** /planning/list, /planning/detail
- **GIS:** /gis/map, /gis/objects/{point,line,area}
- **Reports:** /reports/{template} (50+ templates)
- **Public:** /public/{type}/search, /public/{type}/detail
- **Integration:** /api/lgsp/*, /api/ndxp/*, /api/web/*

---

## 10. USE CASE COVERAGE (232 use cases)

| Section | UC range | Count | Module |
|---|---|---|---|
| Quan tri | UC-001 to UC-007 | 7 | M-001, M-010 |
| Nha cu | UC-008 to UC-036 | 29 | M-002, M-003, M-004 |
| Quan ly KCHT | UC-037 to UC-089 | 53 | M-002, M-003, M-004 |
| Phe duyet KCHT | UC-039 to UC-087 | 53 | M-002, M-003, M-004 |
| Van ban & Thong tin | UC-089 to UC-095 | 7 | M-006 |
| Tai san | UC-096 to UC-145 | 50 | M-005 |
| Kiem ke | UC-150 | 1 | M-005 |
| GIS | UC-151 to UC-155 | 5 | M-007 |
| Bao cao | UC-156 to UC-204 | 49 | M-008 |
| Chia se (LGSP) | UC-205 to UC-241 | 37 | M-009 |
| Tich hop | UC-242 to UC-285 | 44 | M-009 |
| **TOTAL** | | **232** | |

---

## 11. FEATURE SUMMARY

| Module | Name | Features | Priority |
|---|---|---|---|
| M-001 | Quan tri he thong | 7 | P0/P1 |
| M-002 | Cang & Ben | 30 | P0/P1 |
| M-003 | Khu nuoc & VTS | 30 | P0/P1 |
| M-004 | Bao hieu & Thong tin | 54 | P0/P1 |
| M-005 | Bien dong tai san | 6 | P0/P1 |
| M-006 | Van ban & Thong tin | 8 | P1/P2 |
| M-007 | GIS / Ban do | 5 | P0 |
| M-008 | Bao cao & Thong ke | 49 | P0/P1/P2 |
| M-009 | Lien thong & Tich hop | 81 | P0 |
| M-010 | Xac thuc & Phan quyen | 7 | P0/P1 |
| M-011 | Nhat ky & Backup | 6 | P0/P1/P2 |
| M-012 | Hai do & GIS Integration | 6 | P0/P1 |
| **TOTAL** | | **289** | |

---

## 12. SCOPE & NEXT STEPS

- **Da phan tich:** TKCT (Layer 1) - 232 use cases, 289 features across 12 modules
- **Chua extract:** Phu luc 05 (chi tiet truong du lieu) da co trong raw-extract.md
- **Chua phan tich:** URD (Layer 2), Survey (Layer 3)
- **Next:** Layer 2 URD se phan tich chi tiet cho moi module

---

## 13. DO TIN CAY

| Thanh phan | Confidence | Ghi chu |
|---|---|---|
| Kien truc | High | 6-layer microservice |
| Modules (12) | High | De boundary M-001/M-010, M-007/M-012 |
| Features (289) | High | 232 UC mapped to descriptive features |
| Actors | High | 7 roles |
| Tech stack | High | Spring Boot + ReactJS + MSSQL |
| NFR | High | 5 nhom log, MFA, OWASP, IPv6 |
| Data fields | Manual | 3,453 doi tuong, 46,427 truong |
| Source tracing | High | Line numbers in catalog.json + raw-extract.md |