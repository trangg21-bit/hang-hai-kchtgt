# CONSULTATION LOG - TKCT Layer 1 Analysis

> **Nguon:** TKCT_CucHH_KetCauHaTangGiaoThong.docx
> **Ngay:** 2026-06-16
> **Phan:** Layer 1 - TKCT Extract

---

## 1. LENS PHAN TICH

### 1.1 Domain Lens (Bach thu hang hai)
- **Finding:** He thong quan ly 19 loai doi tuong KCHT hang hai, tu cang bien den dai thong tin
- **Evidence:** Phuc luc 05-06, bang tong hop muc 3453 doi tuong, 46427 truong
- **Gap:** Chua hieu day du yeu cau nghiep vu tu URD chua duoc doc

### 1.2 SA Lens (Architect)
- **Finding:** Kien truc Microservice dung chuan, phan vung mang DMZ/App/DB chuan
- **Evidence:** Section 2885-2934, phan kien truc ung dung
- **Recommendation:** Kiem tra IP white-listing, JWT expiry policy

### 1.3 Designer Lens (UI/UX)
- **Finding:** Yeu cau UI Web, tieng Viet, tong xanh-trang-den, DD/MM/YYYY
- **Evidence:** Section 4622-4629
- **Recommendation:** Can them Figma/Wireframe de kiem tra UX

### 1.4 Security Lens
- **Finding:** MFA TOTP, JWT, Cap do 3, OWASP - nhu cau cao
- **Evidence:** Section 4687-4739, 3150-3204
- **Risk:** Chua co thong tin ve key management cho TOTP secret

---

## 2. VALIDATION CHECKLIST

| Check | Status | Ghi chu |
|---|---|---|
| All actors identified | Pass | 8 actors (internal + external + system) |
| All modules extracted | Pass | 12 modules from 232 use cases |
| Tech stack identified | Pass | Java, React, MSSQL, Docker, Nginx, MinIO, GeoServer |
| NFR documented | Pass | 90% uptime, MFA, IPv6, 5 log types |
| Data model identified | Pass | 8 data groups, 6 databases |
| Integration points | Pass | LGSP, NDXP, 3 external systems |
| Security requirements | Pass | Cap do 3, OWASP, MFA |
| Anti-hallucination | Pass | Every item traced to TKCT source |

---

## 3. NOTES

- Phuong phap phan rÃ£ module 19 doi tuong KCHT: 1x CRUD + 1x Approval + 1x Asset CRUD + 1x Asset Approval = ~76 functions
- 200+ mau bao cao duoc lie tu Phu luc 02 (use cases)
- 28 doi tuong dong bo LGSP + 16 chi tieu tai san cong NDXP
- Can URD de lay chi tiet nghiep vu (business rules, validation, workflow chi tiet)
