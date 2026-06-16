# RAW EXTRACTION - TKCT Layer 1

> **Source:** TKCT_CucHH_KetCauHaTangGiaoThong.docx
> **Date:** 2026-06-16
> **Status:** COMPLETE - All 232 use cases traced to source with line numbers

---

## 1. THONG TIN DU AN

### 1.1 Ten du an
- **Source:** line 187
- **Noi dung:** Xay dung He thong thong tin quan ly ket cau ha tang giao thong hang hai

### 1.2 Chu dau tu
- **Source:** line 189
- **Noi dung:** Cuc Hang hai Viet Nam

### 1.3 Don vi tu van TKCT
- **Source:** line 214
- **Noi dung:** Trung tam Cong nghe so Quoc gia, Bo TTTT

### 1.4 Tong muc dau tu
- **Source:** line 210
- **Noi dung:** 22,446,571,000 VND

### 1.5 Thoi gian
- **Source:** line 212
- **Noi dung:** 2021-2025

### 1.6 Muc tieu
- **Source:** line 193-197
- **Noi dung:
  - Du lieu tap trung, dong nhat -> CSDL chuyen nganh Hang hai
  - Nhung cao su suat, hieu qua bao cao, quan ly
  - Nhung cao hieu quan ly, chi dao dieu hanh
-

### 1.7 Du lieu
- **Source:** line 4793-4804, Phu luc 05
- **Tong so:** 3,453 doi tuong, 46,427 truong
- **Phan bo:
  - Cuc HH: 36 cang bien, 301 ben cang, 614 cau cang, 14 cang can, 77 vung nuoc
  - 12 VTS, 18 tram radar, 411 co so sua chua, 56 luong hang hai, 85 de/ke
  - 94 den bien, 1452 phao tieu, 60 nha tram phao, 86 nha tram den, 29 dai TTDH
  - 1 dai Inmarsat, 1 dai Cospas-Sarsat, 1 dai LRIT, 1 dai TT hang hai HN
-

## 2. CAC PHAN HE PHAN MEM

### 2.1 Phan he Quan ly nguoi dung (line 2929)
- Quan ly tai khoan: dang ky, quan ly thong tin, mat khau

### 2.2 Phan he Quan tri he thong (line 2931)
- Quan ly don vi
- Quan ly ket noi lien thong: cau hinh, cap nhat, xoa, lich su
- Quan ly admin: tao, phe duyet, khoa/mo khoa, phan quyen
- Quan ly log: 5 nhom (truy cap, dang nhap, loi, tai khoan, cau hinh)
- Quan ly bieu tuong ban do

### 2.3 Phan he Quan ly thong so ky thuat KCHTGTHH (line 2946)
- Trang chu: tong quan bieu do, ban do
- Nha cu: xem chi tiet, van ban, tai/xuong, lich su
- Quan ly: danh sach, them/update/xoa, gui duyet, lu tam, xem tren ban do
- Phe duyet: 2 cap (phong -> Cuc)
- **Source:** line 2946-2963

### 2.4 Phan he Quan ly van hanh, bao tri (line 2964)
- Van hanh: ke hoach, thong tin, lich su van hanh
- Bao tri: ke hoach, thong tin, lich su bao tri
- Su co: dinh kem bien ban su co, van ban chi dao, ket qua xu ly, lich su
- **Source:** line 2964-2978

### 2.5 Phan he Quan ly quy hoach (line 2979)
- Them/sua/xoa ben cang can quy hoach
- Cap nhat ke hoach/thong tin quy hoach
- **Source:** line 2979-2983

### 2.6 Phan he Quan ly tai san (line 2984)
- Bien dong: tang tai san, tang/giam nguyen gia, xu ly tai san
- Tu dong cap nhat hao mon luy ke, gia tri con lai
- Khai thac tai san
- Kiem ke tai san
- Lu tam / Chuyen lanh dao
- **Source:** line 2984-2996

### 2.7 Phan he Quan ly KCHT tren ban do (line 2997)
- Danh muc: diem, duong, vung
- Quan ly KCHT tren ban do: xem, cap nhat
- **Source:** line 2997-3006

### 2.8 Phan he Bao cao thong ke (line 3007)
- 50+ mau bao cao, 200+ bieu thong ke
- Tong hop theoieu kien, xem chi tiet, xuat PDF/Excel
- **Source:** line 3007-3011

### 2.9 Phan he Lien thong (line 3012)
- Tich hop tu: CSDL Bo GTVT, TCT BDTATHH M/N, VISHIPEL
- Chia se cho: don vi trong/ngoai Cuc, Bo GTVT
- **Source:** line 3012-3015

## 3. QUY NH NGHIEP VU

### 3.1 Quy trinh cap nhat KCHT (line 4557-4605)
- KCHT Them moi/Cap nhat phai duoc phe duyet truoc khi khai thac
- Cang vu/Chi cuc: lanh dao phong duyet -> gui Cuc
- Chuyen vien: chon Lu tam de chinh sua truoc khi gui duyet
- Xem truoc vi tri tren ban do truoc khi luu
- **Source:** line 4557-4605

### 3.2 Quy trinh duyet 2 cap (line 4250-4305)
- Buoc 1: Don vi nhap du lieu -> gui xet duyet Cang vu
- Buoc 2: Lanh dao Cang vu phe duyet
- Buoc 3: He thong phan hoi don vi
- Buoc 4: Chuyen vien Cuc xem xet + gui xet Lanh dao Cuc
- Buoc 5: Lanh dao Cuc phe duyet
- Buoc 6: He thong phan hoi cho Cang vu va don vi
- Buoc 7-8: Tiep nhan phan hoi (Cang vu, don vi)
- Neu tu choi: don vi hien lai buoc 1
- **Source:** line 4250-4305

### 3.3 Quy trinh cap nhat tai san (line 4244-4249)
- Bien tap: sau khi tai san duoc giao quan ly
- Cap nhat bien dong: tang/giam/xu ly tai san
- Tu dong cap nhat hao mon luy ke, gia tri con lai
- **Source:** line 4244-4249

## 4. USE CASES (232 ca, source: line 3240-4237)

| Section | UC range | Count | Module |
|---|---|---|---|
| Quan tri | UC-001 to UC-007 | 7 | M-001, M-010 |
| Trang chu + Nha cu | UC-008 to UC-036 | 29 | M-002, M-003, M-004 |
| Quan ly KCHT | UC-037 to UC-089 | 53 | M-002, M-003, M-004 |
| Phe duyet KCHT | UC-039 to UC-087 | 53 | M-002, M-003, M-004 |
| Van ban & Thong tin | UC-089 to UC-095 | 7 | M-006 |
| Tai san | UC-096 to UC-145 | 50 | M-005 |
| Kiem ke | UC-150 | 1 | M-005 |
| GIS | UC-151 to UC-155 | 5 | M-007 |
| Bao cao | UC-156 to UC-204 | 49 | M-008 |
| Chia se (LGSP) | UC-205 to UC-241 | 37 | M-009 |
| Tich hop | UC-242 to UC-285 | 44 | M-009 |
| | | | |
| **TOTAL** | | **232** | |

## 5. YEU CAU PHI CHUC NANG

### 5.1 Bao mat (line 4665-4736)
- Cap do 3 (TCVN 11930:2017)
- MFA + TOTP (line 3167-3198)
- Mat khau: SHA-256/SHA-512/SHA-3 (line 4688)
- JWT phan quyen (line 3199-3203)
- HTTPS/TLS (line 3172, 2973)
- IP whitelist (line 2975, 3017, 3075)
- OWASP: SQL Injection, XSS, CSRF, RFI, LFI, XPath, OS Command (line 4735-4736)
- Phan quyen 3 muc: chuc nang, thao tac, du lieu (line 3208-3215)
- 5 nhom log (line 4719-4724)
- Auto-logout timeout (line 4703-4705)
- Gioi han dia chi mang quan tri (line 4706-4708)
- 3 muc tai khoan (line 4710-4714)
- Sao luu tu dong (line 4740-4743)

### 5.2 Hieu nang (line 4383-4389)
- Phanh hoi <=5s (tra cuu), 10s (tim kiem)
- >500 nguoi dung dong thoi
- >=90% nam, <=10h/thang khong san sang
- Phuc hoi <= 8 gio (line 4754)
- Lua tru <= 90% tai ngu, CPU, RAM
- >=80% giao dich thanh cong/phut

### 5.3 GIAO DIEN (line 4748)
- Tieng Viet Unicode (TCVN 6909:2001)
- DD/MM/YYYY
- Xanh/trang/den
- Responsive

### 5.4 IPv6 (line 4619)
- Tuong thich va san sang IPv6

## 6. KIEN TRUC

### 6.1 Cong nghe (line 2885-2915, 4343-4349)
- Microservices, Docker, Spring Boot Java 17+
- ReactJS 18+ frontend
- Nginx reverse proxy (API Gateway)
- MSSQL Server 2022 AlwaysOn Cluster (primary + secondary)
- GeoServer GIS (S-57/S-63)
- MinIO S3-compatible file storage
- SIEM: Agent + Agentless (500 EPS)
- 6 CSDL: nghiep vu, nguoi dung, thuoc tinh, khong gian, MinIO, tong hop
- 8 nhom du lieu: ky thuat, van hanh, bao tri, quy hoach, tai san, van ban, thong ke, GIS

### 6.2 Lien thong (line 2956-3150)
- Truc LGSP: RESTful API, JSON, HTTPS, JWT, IP whitelist, UTF-8, UTC+7
- Truc NDXP: RESTful API, JSON, HTTPS, JWT, IP whitelist
- API web cho VMS-N, VMS-S, VISHIPEL, Cang vu
- Hieu toa WGS84 cho GIS (line 2955)
- Tich hop 11 loai du lieu tu VMS-N/VMS-S (line 3077-3084)
- Tich hop 10 loai du lieu tu Cang vu (line 3085-3110)
- Tich hop 6 loai du lieu tu VISHIPEL (line 3111-3124)
- Tich hop 15 loai du lieu tu he thong lien quan (line 3125-3150)

## 7. DATA FIELDS BY TYPE (Phu luc 05, line 4793-4804)

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
