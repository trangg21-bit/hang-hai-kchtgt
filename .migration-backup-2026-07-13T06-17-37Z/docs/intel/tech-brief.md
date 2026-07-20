# TECH BRIEF - He thong thong tin quan ly KCHTGTHH

> **Nguon:** TKCT_CucHH_KetCauHaTangGiaoThong.docx
> **Ngay:** 2026-06-16
> **Phan:** Layer 1 - TKCT Extract

---

## 1. KIEN TRUC HE THONG

### 1.1 Mo hinh kien truc
- **Kien truu:** Microservice qua Docker container
- **Mau:** Client-Server, RESTful API
- **Muc do bao mat:** Cap do 3 (Nghi dinh 85/2016/NĐ-CP)

### 1.2 Luu luong truy cap
Internet/VPN -> Firewall (HA Active-Standby) -> Nginx Proxy
    |-- App Server 01 (ReactJS + Spring Boot)
    |-- App Server 02 (ReactJS + Spring Boot)
        |-- MSSQL 2022 (Cluster) + SAN
        |-- GIS (GeoServer)
        |-- MinIO (S3-compatible)
        |-- SIEM (Monitoring)

---

## 2. TECH STACK KHUYEN NGHI

### 2.1 Backend
- Framework: Java Spring Boot (Docker)
- API: RESTful JSON over HTTPS/TLS
- Language: Java

### 2.2 Frontend
- Framework: ReactJS
- Build: Webpack/Vite
- State: Redux/MobX

### 2.3 API Gateway
- Nginx (Reverse Proxy, Load Balancer, SSL Termination)

### 2.4 Database
- CSDL nghiep vu: MSSQL Server 2022
- CSDL nguoi dung: MSSQL Server 2022
- File storage: MinIO (S3-compatible)
- GIS: GeoServer (S-57/S-63)

### 2.5 Security
- Auth: JWT + TOTP (MFA)
- Hash: SHA-256/512/SHA-3
- Transport: HTTPS/TLS
- Firewall: HA Active-Standby
- SIEM: 500 events/sec
- OWASP: Anti-injection (SQLi, XSS, CSRF, RFI, LFI)

### 2.6 Network
- FC Storage: Fibre Channel 32Gbps
- Ethernet: 1Gbps / 10Gbps
- VPN: Site-to-Site (TCT, Cang vu)

---

## 3. INFRASTRUCTURE

| Type | Qty | Notes |
|---|---|---|
| App Server | 2 | Linux, Docker, HA |
| DB Server | 2 | MSSQL, Cluster |
| GIS Server | 1 | GeoServer |
| SIEM Server | 2 | |
| Proxy Server | 2 | Nginx, HA |
| SAN Storage | 1 | Dual-active |
| Core Switch | 1 | Stacking |
| Distribute Switch | 2 | Stacking |
| Firewall | 2 | HA Active-Standby |
| SAN Switch | 2 | FC 32Gbps |
| UPS | 2 | 10kVA |

---

## 4. NGUYEN VAC PHAT TRIEN

- Khung PT PM an toan v1.0 (Cong van 166/CATTT-ATHTTT)
- >=50% co kinh nghiem quy trinh
- >=40% co kinh ung dung tuong tu
- >=50% OO, >=60% lap trinh
- Truong nhóm >=5 du an
- Kiem thu OWASP

## 5. NFR YEEU CAU
- San sang >=90%/nam, <=10h/thang
- Phuc hoi <=8 gio
- IPv6 compatible
- Nhat ky 5 nhom
- Backup tu dong

## 6. DATA CONVENTIONS
- He toa do: WGS84
- Unicode: UTF-8, TCVN6909:2001
- Ngay: DD/MM/YYYY
- Gio: UTC+7 UNIX

## 7. MODULE STRUCTURE (Scaffold)
app-service/
  auth/       # JWT+TOTP
  user/       # User mgmt
  kcht/       # KCHTGT CRUD
  asset/      # Asset mgmt
  report/     # Reports
  gis/        # GIS
  integration/# LGSP/NDXP
  legal/      # Legal docs
web-ui/       # ReactJS
nginx/        # Proxy config
docker/       # Docker Compose
db/           # MSSQL migrations
minio/        # S3 config
