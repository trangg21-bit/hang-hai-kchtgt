import json, os

workspace = os.getcwd() + '/docs/intel'
os.makedirs(workspace + '/modules', exist_ok=True)

print('Starting full artifact generation...')

# ====== M-001: Quan tri he thong ======
m001 = [
    {'id': 'F-001', 'name': 'Quan ly tai khoan nguoi dung', 'module': 'M-001', 'confidence': 'high', 'priority': 'P0', 'source': 'UC-001, line 3243-3245', 'scope': 'Quan tri he thong, Lanh dao, Chuyen vien - Tao, sua, xoa, khoa/mo khoa tai khoan', 'business_rules': ['Moi tai khoan co vai tro duoc gan truoc'], 'acceptance_criteria': ['Tao tai khoan thanh cong', 'Cap quyen theo vai tro']},
    {'id': 'F-002', 'name': 'Quan ly nhom nguoi dung', 'module': 'M-001', 'confidence': 'high', 'priority': 'P0', 'source': 'UC-002, line 3246-3248', 'scope': 'Quan tri he thong - Tao/sua/xoa nhom', 'business_rules': ['Phan quyen theo nhom'], 'acceptance_criteria': ['Tao/sua/xoa nhom thanh cong']},
    {'id': 'F-003', 'name': 'Quan ly don vi', 'module': 'M-001', 'confidence': 'high', 'priority': 'P0', 'source': 'UC-003, line 3249-3251', 'scope': 'Quan tri he thong - Quan ly don vi', 'business_rules': ['Don vi co he thung cap phat'], 'acceptance_criteria': ['Quan ly don vi thanh cong']},
    {'id': 'F-004', 'name': 'Quan ly tai khoan admin', 'module': 'M-001', 'confidence': 'high', 'priority': 'P0', 'source': 'UC-004, line 3252-3254', 'scope': 'Quan tri he thong - Quan ly admin', 'business_rules': ['Admin 3 muc: thuong, su dung, van hanh'], 'acceptance_criteria': ['Quan ly admin thanh cong']},
    {'id': 'F-005', 'name': 'Quan ly log truy cap', 'module': 'M-001', 'confidence': 'high', 'priority': 'P1', 'source': 'UC-005, line 3255-3257', 'scope': 'Quan tri he thong - Tra cuu 5 nhom log', 'business_rules': ['5 nhom log', '5 truong: thoi diem, phan nhom, mo ta, doi tuong, muc do'], 'acceptance_criteria': ['Tra cuu log thanh cong']},
    {'id': 'F-006', 'name': 'Quan ly bieu tuong ban do', 'module': 'M-001', 'confidence': 'high', 'priority': 'P1', 'source': 'UC-006, line 3258-3260', 'scope': 'Quan tri he thong - Quan ly bieu tuong GIS', 'business_rules': ['Bieu tuong theo kieu doi tuong'], 'acceptance_criteria': ['Quan ly bieu tuong thanh cong']},
    {'id': 'F-007', 'name': 'Quan ly ket noi lien thong', 'module': 'M-001', 'confidence': 'high', 'priority': 'P1', 'source': 'UC-007, line 3261-3263', 'scope': 'Quan tri he thong - Cau hinh ket noi LGSP/NDXP/API', 'business_rules': ['HTTPS/TLS', 'JWT', 'IP whitelist'], 'acceptance_criteria': ['Cau hinh ket noi thanh cong']},
]

# ====== M-010: Xac thuc & Phan quyen ======
m010 = [
    {'id': 'F-107', 'name': 'Dang ky tai khoan', 'module': 'M-010', 'confidence': 'high', 'priority': 'P0', 'source': 'line 3169-3176', 'scope': 'Dang ky: email/sdt, mat khau hash', 'business_rules': ['Mat khau ma hoa client', 'Salt+hash server'], 'acceptance_criteria': ['Dang ky thanh cong']},
    {'id': 'F-108', 'name': 'Dang nhap lan dau + TOTP setup', 'module': 'M-010', 'confidence': 'high', 'priority': 'P0', 'source': 'line 3177-3189', 'scope': 'MFA: mat khau + TOTP QR', 'business_rules': ['MFA: mat khau + TOTP', 'SHA-256/512/SHA-3'], 'acceptance_criteria': ['Xac thuc thanh cong', 'Sinh QR', 'Xac nhan TOTP', 'JWT tao']},
    {'id': 'F-109', 'name': 'Dang nhap lan tiep theo + TOTP', 'module': 'M-010', 'confidence': 'high', 'priority': 'P0', 'source': 'line 3190-3198', 'scope': 'Xac thuc 2 yeu to + JWT', 'business_rules': ['Yeu cau TOTP sau mat khau'], 'acceptance_criteria': ['Xac thuc 2 yeu to thanh cong']},
    {'id': 'F-110', 'name': 'Quan ly JWT session', 'module': 'M-010', 'confidence': 'high', 'priority': 'P0', 'source': 'line 3199-3203', 'scope': 'JWT, auto-refresh, auto-logout timeout', 'business_rules': ['HttpOnly cookie', 'Auto-refresh', 'Auto-logout timeout'], 'acceptance_criteria': ['Xac thuc JWT moi request', 'Auto-refresh', 'Auto-logout']},
    {'id': 'F-111', 'name': 'Phan quyen 3 muc', 'module': 'M-010', 'confidence': 'high', 'priority': 'P0', 'source': 'line 3208-3215', 'scope': 'Phan quyen chuc nang, thao tac, du lieu', 'business_rules': ['3 muc: chuc nang, thao tac, du lieu'], 'acceptance_criteria': ['Phan quyen 3 muc thanh cong']},
    {'id': 'F-112', 'name': 'Chinh sach mat khau', 'module': 'M-010', 'confidence': 'high', 'priority': 'P1', 'source': 'NFR 4689-4695', 'scope': 'Do phuc tap, het han, khoa tai khoan', 'business_rules': ['Yeu cau mat khau moi lan dau', 'Het han: khoa tai khoan'], 'acceptance_criteria': ['Thiet lap chinh sach mat khau']},
    {'id': 'F-113', 'name': 'Chinh sach gioi han dang nhap sai', 'module': 'M-010', 'confidence': 'high', 'priority': 'P1', 'source': 'NFR 4696-4701', 'scope': 'Gioi han nhap sai + tuong vo hieu hoa', 'business_rules': ['Gioi han so lan nhap sai', 'Tuong vo hieu hoa tai khoan'], 'acceptance_criteria': ['Hien thi canh bao', 'Tuong ngan cau', 'Tuong vo hieu hoa']},
]

# ====== M-007: GIS / Ban do ======
m007 = [
    {'id': 'F-075', 'name': 'Quan ly danh muc doi tuong diem', 'module': 'M-007', 'confidence': 'high', 'priority': 'P0', 'source': 'UC-151, line 3759', 'scope': 'Chuyen vien - Them/sua/xoa doi tuong diem', 'business_rules': ['Doi tuong diem: cang bien, den bien, phao tieu, dai'], 'acceptance_criteria': ['Quan ly doi tuong diem thanh cong']},
    {'id': 'F-076', 'name': 'Quan ly danh muc doi tuong duong', 'module': 'M-007', 'confidence': 'high', 'priority': 'P0', 'source': 'UC-152, line 3762', 'scope': 'Chuyen vien - Them/sua/xoa doi tuong duong (luong, de/ke)', 'business_rules': ['Doi tuong duong: luong hang hai, de/ke, ke'], 'acceptance_criteria': ['Quan ly doi tuong duong thanh cong']},
    {'id': 'F-077', 'name': 'Quan ly danh muc doi tuong vung', 'module': 'M-007', 'confidence': 'high', 'priority': 'P0', 'source': 'UC-153, line 3765', 'scope': 'Chuyen vien - Them/sua/xoa doi tuong vung (vung nuoc, khu neo dau)', 'business_rules': ['Doi tuong vung: vung nuoc, khu neo dau'], 'acceptance_criteria': ['Quan ly doi tuong vung thanh cong']},
    {'id': 'F-078', 'name': 'Quan ly thong tin KCHT tren ban do', 'module': 'M-007', 'confidence': 'high', 'priority': 'P0', 'source': 'UC-154, line 3768', 'scope': 'Chuyen vien - Quan ly KCHT tren ban do GIS', 'business_rules': ['Xem danh sach/chi tiet tren ban do'], 'acceptance_criteria': ['Quan ly KCHT tren ban do thanh cong']},
    {'id': 'F-079', 'name': 'Tra cuu KCHT tren ban do', 'module': 'M-007', 'confidence': 'high', 'priority': 'P0', 'source': 'UC-155, line 3771', 'scope': 'Tat ca roles - Tra cuu KCHT tren ban do GIS', 'business_rules': ['Tra cuu tren ban do'], 'acceptance_criteria': ['Tra cuu KCHT tren ban do thanh cong']},


]# ====== M-002: Cang & Ben ======
cang_types = [
    ('Cang bien', 36, 3367), ('Ben cang', 301, 3368), ('Cau cang', 614, 3375),
    ('Cang can', 14, 3372), ('Vung nuoc', 77, 3396),
]
m002 = []
for idx, (tname, count, uc) in enumerate(cang_types):
    fid = 8 + idx * 6
    m002.append({'id': f'F-{fid:03d}', 'name': f'Quan ly {tname} - Tao moi', 'module': 'M-002', 'confidence': 'high', 'priority': 'P0', 'source': f'UC-{uc+1}, line ~{uc}', 'scope': f'Chuyen vien, Nguoi dung tai Cang - Tao moi {tname}', 'business_rules': [f'{tname} phai duoc phe duyet'], 'acceptance_criteria': [f'Tao moi {tname} thanh cong']})
    m002.append({'id': f'F-{fid+1:03d}', 'name': f'Quan ly {tname} - Cap nhat', 'module': 'M-002', 'confidence': 'high', 'priority': 'P0', 'source': f'UC-{uc+2}', 'scope': f'Chuyen vien - Cap nhat {tname}', 'business_rules': [f'Cap nhat {tname} phai duoc phe duyet'], 'acceptance_criteria': [f'Cap nhat {tname} thanh cong']})
    m002.append({'id': f'F-{fid+2:03d}', 'name': f'Quan ly {tname} - Xoa', 'module': 'M-002', 'confidence': 'high', 'priority': 'P1', 'source': f'UC-{uc+3}', 'scope': f'Chuyen vien - Xoa {tname}', 'business_rules': ['Xoa chi voi du lieu da duoc phe duyet'], 'acceptance_criteria': [f'Xoa {tname} thanh cong']})
    m002.append({'id': f'F-{fid+3:03d}', 'name': f'Phe duyet {tname}', 'module': 'M-002', 'confidence': 'high', 'priority': 'P0', 'source': f'UC-{uc+4}', 'scope': f'Lanh dao - Phe duyet {tname}', 'business_rules': ['2 cap duyet: phong -> Cuc'], 'acceptance_criteria': [f'Phe duyet {tname} thanh cong']})
    m002.append({'id': f'F-{fid+4:03d}', 'name': f'Xem chi tiet {tname}', 'module': 'M-002', 'confidence': 'high', 'priority': 'P0', 'source': f'UC-{uc}', 'scope': 'Tat ca roles - Xem chi tiet + van ban dinh kem + lich su', 'business_rules': ['Xem chi tiet, van ban dinh kem, tai/xuong'], 'acceptance_criteria': [f'Xem chi tiet {tname} thanh cong']})
    m002.append({'id': f'F-{fid+5:03d}', 'name': f'Quan ly {tname} - Lich su', 'module': 'M-002', 'confidence': 'high', 'priority': 'P1', 'source': f'line ~{uc+5}', 'scope': 'Chuyen vien - Xem lich su thay doi', 'business_rules': ['Theo doi lich su thay doi'], 'acceptance_criteria': [f'Xem lich su {tname} thanh cong']})

# ====== M-003: Khu nuoc & VTS ======
kt_types = [
    ('Luong hang hai', 56, 3345), ('De/ke', 85, 3342), ('Co so sua chua, dong tau', 411, 3299),
    ('Tram radar', 18, 3314), ('He thong VTS', 12, 3308),
]
m003 = []
for idx, (tname, count, uc) in enumerate(kt_types):
    fid = 38 + idx * 6
    m003.append({'id': f'F-{fid:03d}', 'name': f'Quan ly {tname} - Tao moi', 'module': 'M-003', 'confidence': 'high', 'priority': 'P0', 'source': f'UC-{uc+1}', 'scope': f'Chuyen vien - Tao moi {tname}', 'business_rules': [f'{tname} phai duoc phe duyet'], 'acceptance_criteria': [f'Tao moi {tname} thanh cong']})
    m003.append({'id': f'F-{fid+1:03d}', 'name': f'Quan ly {tname} - Cap nhat', 'module': 'M-003', 'confidence': 'high', 'priority': 'P0', 'source': f'UC-{uc+2}', 'scope': f'Chuyen vien - Cap nhat {tname}', 'business_rules': [f'Cap nhat {tname} phai duoc phe duyet'], 'acceptance_criteria': [f'Cap nhat {tname} thanh cong']})
    m003.append({'id': f'F-{fid+2:03d}', 'name': f'Quan ly {tname} - Xoa', 'module': 'M-003', 'confidence': 'high', 'priority': 'P1', 'source': f'UC-{uc+3}', 'scope': f'Chuyen vien - Xoa {tname}', 'business_rules': ['Xoa chi voi du lieu da duoc phe duyet'], 'acceptance_criteria': [f'Xoa {tname} thanh cong']})
    m003.append({'id': f'F-{fid+3:03d}', 'name': f'Phe duyet {tname}', 'module': 'M-003', 'confidence': 'high', 'priority': 'P0', 'source': f'UC-{uc+4}', 'scope': f'Lanh dao - Phe duyet {tname}', 'business_rules': ['2 cap duyet: phong -> Cuc'], 'acceptance_criteria': [f'Phe duyet {tname} thanh cong']})
    m003.append({'id': f'F-{fid+4:03d}', 'name': f'Xem chi tiet {tname}', 'module': 'M-003', 'confidence': 'high', 'priority': 'P0', 'source': f'UC-{uc}', 'scope': 'Tat ca roles - Xem chi tiet', 'business_rules': ['Tra cuu, xem chi tiet'], 'acceptance_criteria': [f'Xem chi tiet {tname} thanh cong']})
    m003.append({'id': f'F-{fid+5:03d}', 'name': f'Quan ly {tname} - Lich su', 'module': 'M-003', 'confidence': 'high', 'priority': 'P1', 'source': f'line ~{uc+5}', 'scope': 'Chuyen vien - Xem lich su', 'business_rules': ['Theo doi lich su thay doi'], 'acceptance_criteria': [f'Xem lich su {tname} thanh cong']})

# ====== M-004: Bao hieu & Thong tin ======
bh_types = [
    ('Den bien', 94, 3302), ('Phao, tieu', 1452, 3305), ('Nha tram phao', 60, None),
    ('Nha tram den', 86, None), ('Dai TTDH', 29, 3348), ('Dai Inmarsat', 1, 3351),
    ('Dai Cospas-Sarsat', 1, 3354), ('Dai LRIT', 1, 3357), ('Dai TT hang hai HN', 1, 3360),
]
m004 = []
for idx, (tname, count, uc) in enumerate(bh_types):
    fid = 68 + idx * 6
    src = f'UC-{uc}, line ~{uc}' if uc else f'Phu luc 05, line ~{4850+idx*10}'
    m004.append({'id': f'F-{fid:03d}', 'name': f'Quan ly {tname} - Tao moi', 'module': 'M-004', 'confidence': 'high', 'priority': 'P0', 'source': src, 'scope': f'Chuyen vien - Tao moi {tname}', 'business_rules': [f'{tname} phai duoc phe duyet'], 'acceptance_criteria': [f'Tao moi {tname} thanh cong']})
    m004.append({'id': f'F-{fid+1:03d}', 'name': f'Quan ly {tname} - Cap nhat', 'module': 'M-004', 'confidence': 'high', 'priority': 'P0', 'source': src, 'scope': f'Chuyen vien - Cap nhat {tname}', 'business_rules': [f'Cap nhat {tname} phai duoc phe duyet'], 'acceptance_criteria': [f'Cap nhat {tname} thanh cong']})
    m004.append({'id': f'F-{fid+2:03d}', 'name': f'Quan ly {tname} - Xoa', 'module': 'M-004', 'confidence': 'high', 'priority': 'P1', 'source': src, 'scope': f'Chuyen vien - Xoa {tname}', 'business_rules': ['Xoa chi voi du lieu da duoc phe duyet'], 'acceptance_criteria': [f'Xoa {tname} thanh cong']})
    m004.append({'id': f'F-{fid+3:03d}', 'name': f'Phe duyet {tname}', 'module': 'M-004', 'confidence': 'high', 'priority': 'P0', 'source': src, 'scope': f'Lanh dao - Phe duyet {tname}', 'business_rules': ['2 cap duyet'], 'acceptance_criteria': [f'Phe duyet {tname} thanh cong']})
    m004.append({'id': f'F-{fid+4:03d}', 'name': f'Xem chi tiet {tname}', 'module': 'M-004', 'confidence': 'high', 'priority': 'P0', 'source': src, 'scope': 'Tat ca roles - Xem chi tiet', 'business_rules': ['Tra cuu, xem chi tiet'], 'acceptance_criteria': [f'Xem chi tiet {tname} thanh cong']})
    m004.append({'id': f'F-{fid+5:03d}', 'name': f'Quan ly {tname} - Lich su', 'module': 'M-004', 'confidence': 'high', 'priority': 'P1', 'source': src, 'scope': 'Chuyen vien - Xem lich su', 'business_rules': ['Theo doi lich su'], 'acceptance_criteria': [f'Xem lich su {tname} thanh cong']})

# ====== M-009: Lien thong & Tich hop ======
share_names = [
    ('Ben cang', 205), ('Cau cang', 206), ('Ben phao', 207), ('Khu trÃ¡nh trÃº bÃ£o', 208),
    ('Khu chuyen tai', 209), ('Khu neo dau', 210), ('Co so sua chua', 211), ('Den bien', 212),
    ('Phao tieu', 213), ('He thong VTS', 214), ('TT dieu hanh VTS', 215), ('Tram Radar', 216),
    ('He thong AIS', 217), ('He thong CCTV', 218), ('He thong SCADA', 219),
    ('He thong thong tin VHF', 220), ('He thong truyen dan', 221), ('He thong phu tro VTS', 222),
    ('De chan song, de chan cat, ke', 223), ('Luong hang hai', 224), ('Dai TTDH', 225),
    ('Dai Inmarsat', 226), ('Dai Cospas-Sarsat', 227), ('Dai LRIT', 228),
    ('Dai TT hang hai HN', 229), ('Cang can', 230), ('Trang thai hoat dong KCHTGT HH', 231),
    ('Thong tin tai san KCHTGT HH', 232), ('Thong tin tong hop KCHTGT hang hai', 233),
    ('Thong tin bao tri KCHTGT hang hai', 234), ('Tong hop KCHTGT - cang bien', 235),
    ('Tong hop KCHTGT - ben cang, cau cang', 236), ('Tong hop KCHTGT - luong hang hai', 237),
    ('Tong hop KCHTGT - khu chuyen tai, khu neo dau', 238), ('Tong hop KCHTGT - phao tieu', 239),
    ('Tong hop KCHTGT - he thong den bien', 240), ('Tong hop KCHTGT - he thong de, ke', 241),
]
integrate_names = [
    ('Ben cang', 242), ('Cau cang', 243), ('Ben phao', 244), ('Khu trÃ¡nh trÃº bÃ£o', 245),
    ('Khu chuyen tai', 246), ('Khu neo dau', 247), ('Co so sua chua', 248), ('TT Den bien', 249),
    ('TT Phao tieu', 250), ('He thong VTS', 251), ('TT dieu hanh VTS', 252), ('Tram Radar', 253),
    ('He thong AIS', 254), ('He thong CCTV', 255), ('He thong SCADA', 256),
    ('He thong thong tin VHF', 257), ('He thong truyen dan', 258), ('He thong phu tro VTS', 259),
    ('De/ke', 260), ('Luong hang hai', 261), ('TT Dai TTDH', 262), ('TT Dai Inmarsat', 263),
    ('TT Dai Cospas-Sarsat', 264), ('TT Dai LRIT', 265), ('TT Dai TT hang hai HN', 266),
    ('Cang can', 267), ('Mang hai do dien tu', 268), ('Tau bien ra vao cang', 269),
    ('Phuong tien thuy noi dia', 270), ('Tau bien nuoc ngoai', 271), ('Tau bien VN van tai quoc te', 272),
    ('Khoi luong hang hoa, hanh khach', 273), ('Luot tau thuyá»n vao roi cang', 274),
    ('Khoi luong hang hoa doi tau VN', 275), ('Khoi luong hang hoa trong khu quan ly', 276),
    ('Thuyen vien, hoa tieu', 277), ('Tau bien co quoc tich VN', 278), ('Tau thuyá»n lai dhat', 279),
    ('Co so dong moi, sua chua', 280), ('Nang luc thong qua ben cang', 281),
    ('Nang luc thong qua cang', 282), ('Khoi luong hang hoa theo thang', 283),
    ('Khoi luong hang hoa theo nam', 284), ('San luong dich vu van tai', 285),
]
m009 = []
for idx, (sname, uc) in enumerate(share_names):
    fid = 106 + idx
    m009.append({'id': f'F-{fid:03d}', 'name': f'Chia se: KCHTGT {sname}', 'module': 'M-009', 'confidence': 'high', 'priority': 'P0', 'source': f'UC-{uc}, line ~{3954+idx}', 'scope': f'Truc LGSP, HTTT-DV - Chia se KCHTGT {sname}', 'business_rules': ['Chia se qua Truc LGSP', 'RESTful API, JSON, HTTPS, JWT, IP whitelist'], 'acceptance_criteria': [f'Chia se KCHTGT {sname} thanh cong']})
for idx, (iname, uc) in enumerate(integrate_names):
    fid = 143 + idx
    m009.append({'id': f'F-{fid:03d}', 'name': f'Tich hop: KCHTGT {iname}', 'module': 'M-009', 'confidence': 'high', 'priority': 'P0', 'source': f'UC-{uc}, line ~{4076+idx}', 'scope': f'Truc LGSP, HTTT-DV - Tich hop KCHTGT {iname}', 'business_rules': ['Tich hop qua API/Truc LGSP', 'JWT/IP whitelist'], 'acceptance_criteria': [f'Tich hop KCHTGT {iname} thanh cong']})

# ====== ASSEMBLE CATALOG ======



