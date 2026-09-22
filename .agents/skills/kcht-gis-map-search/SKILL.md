---
name: kcht-gis-map-search
description: >-
  Quy chuẩn toàn diện cho tính năng và menu Tra cứu thông tin kết cấu hạ tầng hàng hải trên bản đồ (/gis/map).
  Bao gồm chuẩn hóa Map Popup Details (chống đè tên cha con, mapping alias zobjDataSub sang DTO camelCase, format tỉnh thành/ngày/trạng thái),
  quy chuẩn nhúng form chỉnh sửa (Embedded Action Protocol qua CLOSE_KCHT_MODAL chống màn hình trắng),
  cấu trúc module vmdPopupFields không phụ thuộc Leaflet, và checklist kiểm thử GIS.
---

# Quy Chuẩn Tra Cứu Thông Tin Kết Cấu Hạ Tầng Hàng Hải Trên Bản Đồ (GIS Map Standard)

## 1. Mục đích & Phạm vi áp dụng

Skill này là tài liệu quy chuẩn kỹ thuật bắt buộc áp dụng cho màn hình **Tra cứu thông tin kết cấu hạ tầng hàng hải trên bản đồ** (`frontend/src/pages/gis/GISChartView.tsx` tại route `/gis/map`) và toàn bộ các thành phần liên quan (Popup chi tiết, form nhúng thao tác CRUD từ bản đồ, bộ lọc không gian và lớp dữ liệu).

Màn hình này trực quan hóa và tra cứu toàn diện **28 loại tài sản KCHT Hàng hải**:
1. Cảng biển (`SEAPORT`)
2. Bến cảng (`PORT_TERMINAL`)
3. Cầu cảng (`PIER`)
4. Bến phao (`BUOY_BERTH`)
5. Khu tránh trú bão (`STORM_SHELTER_AREA`)
6. Khu chuyển tải (`TRANSSHIPMENT_AREA`)
7. Khu neo đậu (`ANCHORAGE_AREA`)
8. Cơ sở sửa chữa, đóng tàu (`SHIP_REPAIR_FACILITY` / `SHIP_REPAIR_YARD`)
9. Đèn biển (`LIGHTHOUSE`)
10. Nhà trạm quản lý luồng/phao tiêu (`BUOY_STATION`)
11. Hệ thống VTS (`VTS_SYSTEM`)
12. Trung tâm điều hành VTS (`VTS_OPERATION_CENTER`)
13. Trạm radar (`RADAR_STATION` / `RADAR_STATION_LEGACY`)
14. Thiết bị AIS (`AIS_SYSTEM`)
15. Thiết bị CCTV (`CCTV`)
16. Thiết bị SCADA (`SCADA`)
17. Thiết bị truyền dẫn (`TRANSMISSION`)
18. Thiết bị hỗ trợ VTS (`VTS_ASSIST`)
19. Đê kè (`DIKE_REVETMENT`)
20. Luồng hàng hải (`NAVIGATION_CHANNEL`)
21. Vùng nước cảng biển (`WATER_AREA`)
22. Đài thông tin duyên hải (`DAI_TTDH` / `COASTAL_RADIO_STATION`)
23. Đài thông tin vệ tinh Inmarsat (`INMARSAT_STATION`)
24. Đài Cospas-Sarsat (`COSPAS_SARSAT_STATION`)
25. Đài LRIT (`LRIT_STATION`)
26. Đài TTXLTT Hà Nội (`HANOI_STATION`)
27. Cảng cạn (`DRY_PORT`)
28. Phao tiêu báo hiệu hàng hải (`BUOY`)

---

## 2. Kiến Trúc Tách Bạch Schema Map Popup (`vmdPopupFields.ts`)

### Nguyên tắc Single Source of Truth & Zero DOM/Leaflet Dependency
Toàn bộ cấu hình trường, nhãn, thứ tự hiển thị, alias và hàm resolve trường dữ liệu cho Map Popup **BẮT BUỘC** được khai báo tại `frontend/src/pages/gis/vmdPopupFields.ts`:

1. **Không phụ thuộc thư viện UI/DOM**: `vmdPopupFields.ts` là file pure TypeScript (không `import L from 'leaflet'`, không dùng `window`, `document`).
2. **Khả năng kiểm thử độc lập**: Mọi hàm resolve (`resolveVmdPopupFields`, `getPopupValueByPath`, `getOrderedKeysAndLabels`, `getVmdPopupFields`) đều có thể chạy trực tiếp trong môi trường Node.js / Vitest với tốc độ < 50ms mà không gây lỗi `ReferenceError: window is not defined`.
3. **Module GISChartView**: `GISChartView.tsx` chỉ import các hàm schema từ `vmdPopupFields.ts` và tập trung vào quản lý bản đồ Leaflet, render layer, marker cluster và sự kiện tương tác.

---

## 3. Quy Chuẩn Map Popup Chi Tiết: Chống Trùng Đè & Alias Mapping

### 3.1. Nguyên tắc chống trùng đè Tên và Mã (Anti-Name-Collision Standard)
**Vấn đề thường gặp**: Bản ghi con (như Cầu cảng, Bến phao, Khu neo đậu) thường chứa cả trường thông tin của đối tượng cha (ví dụ `portName`, `berthName`, `waterway`). Nếu dùng logic tìm kiếm lỏng lẻo (`candidates.find`) duyệt `portName` trước, tên Cảng biển ("Cảng biển nhỏ") sẽ đè lên tên Khu neo đậu ("Neo đậu 01 TB").

**Quy tắc bắt buộc**:
1. Luôn khai báo `PRIMARY_CODE_NAME_KEYS_BY_TYPE[infrastructureType]` định rõ danh sách trường mã và tên chính xác của riêng loại KCHT đó:
   ```ts
   ANCHORAGE_AREA: {
     codeKeys: ['anchorageCode', 'code'],
     nameKeys: ['anchorageName', 'name'],
   },
   PIER: {
     codeKeys: ['pierCode', 'code'],
     nameKeys: ['pierName', 'name'],
   },
   ```
2. Luôn cấu hình `SPECIFIC_LABEL_KEYS` cho từng nhãn tiếng Việt cụ thể:
   - Nhãn `"tên khu neo đậu"` -> ưu tiên `['anchorageName', 'name']`.
   - Nhãn `"tên cầu cảng"` -> ưu tiên `['pierName', 'name']`.
   - Nhãn `"thuộc cảng biển"` -> ưu tiên `['portName', 'tenCangBien', 'portId']`.
3. Trong hàm `resolveVmdPopupFields`, candidate resolution phải ưu tiên `SPECIFIC_LABEL_KEYS` và `PRIMARY_CODE_NAME_KEYS_BY_TYPE` **TRƯỚC** khi xét đến `genericNameKeys` (`['portName', ...]`).

### 3.2. Bảng ánh xạ trường Legacy VMD (`zobjDataSub.*`) sang DTO Spring Boot (CamelCase)
Khi dữ liệu được trả về từ Backend API RESTful, các trường nằm trực tiếp ở cấp gốc dạng camelCase. Bắt buộc duy trì danh sách `commonAliases` đầy đủ:

| Nhóm trường | Trường kế thừa VMD | Danh sách alias bắt buộc (DTO Spring Boot) |
|---|---|---|
| **Hình dạng** | `zobjDataSub.hinhDang` / `hinhDang` | `['shapeDescription', 'hinhDang']` |
| **Độ sâu hiện tại** | `zobjDataSub.doSauKhuNuocHienTai` | `['currentWaterDepth', 'doSauKhuNuocHienTai']` |
| **Độ sâu thiết kế** | `zobjDataSub.doSauKhuNuocTheoThietKe` | `['designWaterDepth', 'doSauKhuNuocTheoThietKe']` |
| **Cao độ đáy bến** | `zobjDataSub.caoDoDayBenThietKe` | `['bottomElevationDesign', 'caoDoDayBenThietKe']` |
| **Cỡ tàu lớn nhất (DWT)**| `zobjDataSub.coTauKhaiThacTheoCongBoDwt` | `['maxVesselDWT', 'maxVesselSize', 'maxTonnage', 'coTauKhaiThacTheoCongBoDwt']` |
| **Diện tích** | `zobjDataSub.dienTich` | `['area', 'dienTich', 'totalArea']` |
| **Tình trạng hoạt động**| `zobjDataSub.tinhTrangText` / `tinhTrangText` | `['operationalStatus', 'conditionStatus', 'condition', 'tinhTrang', 'isActive']` |
| **Trạng thái phê duyệt**| `zobjDataSub.statusText` / `statusText` | `['approvalStatus', 'trangThai', 'status']` |
| **Thời điểm công bố** | `zobjDataSub.thoiDiemCongBo` / `thoiDiemCongBoMo` | `['openingAnnouncementDate', 'thoiDiemCongBoMo', 'thoiDiemCongBo']` |
| **Quyết định công bố** | `zobjDataSub.quyetDinhCongBo` | `['publicDecision', 'openingDecision', 'quyetDinhCongBo']` |
| **Văn bản thỏa thuận** | `zobjDataSub.vanBanThoaThuanDauTuXayDung` | `['investmentAgreement', 'vanBanThoaThuanDauTu', 'vanBanThoaThuan']` |
| **Ghi chú** | `zobjDataSub.ghiChu` | `['remarks', 'note', 'ghiChu']` |
| **Số lượng đang khai thác**| `zobjDataSub.soLuongKhuNeoDauDangKhaiThac` | `['activeAnchorageCount', 'soLuongKhuNeoDauDangKhaiThac']` |
| **Số lượng đã công bố** | `zobjDataSub.soLuongKhuNeoDauDaCongBo` | `['publishedAnchorageCount', 'soLuongKhuNeoDauDaCongBo']` |

---

## 4. Quy Chuẩn Formatters & Hiển Thị Giá Trị Trên Popup

Mọi giá trị hiển thị trên Popup của bản đồ phải tuân thủ nghiêm ngặt các quy tắc định dạng:

### 4.1. Địa điểm Tỉnh/Thành phố (`provinceId` / `province` / `location`)
- Nếu giá trị là số nguyên (ID tỉnh thành từ 1 đến 63) hoặc chuỗi số, **BẮT BUỘC** gọi `getProvinceNameById(Number(value))` để lấy tên Tỉnh/Thành phố hiển thị (ví dụ: `43` -> `"Thành phố Đà Nẵng"`).
- Tuyệt đối không để lộ mã số ID thô `43`, `24` trên giao diện người dùng.

### 4.2. Trạng thái phê duyệt (`approvalStatus`)
Đồng bộ 100% với chuẩn 7 trạng thái phê duyệt của hệ thống KCHT:
```ts
const getApprovalStatusText = (status?: string) => {
  if (!status) return '—';
  const s = String(status).toUpperCase();
  if (s === 'DUOC_PHE_DUYET' || s === 'APPROVED' || s === 'DEPARTMENT_APPROVED' || s === '3') return 'Đã phê duyệt';
  if (s === 'CHO_PHE_DUYET' || s === 'PENDING' || s === 'PENDING_APPROVAL' || s === 'SUBMITTED' || s === 'PENDING_PORT_AUTHORITY' || s === '1') return 'Chờ phê duyệt cấp Cảng vụ/Chi cục';
  if (s === 'PENDING_DEPARTMENT' || s === 'PORT_AUTHORITY_APPROVED' || s === '2') return 'Chờ phê duyệt cấp Cục';
  if (s === 'DRAFT' || s === '0') return 'Lưu tạm';
  if (s === 'APPROVED_L1') return 'Đã phê duyệt cấp Cảng vụ/Chi cục';
  if (s === 'APPROVED_L2') return 'Đã phê duyệt';
  if (s === 'REJECTED_PORT_AUTHORITY' || s === 'REJECTED_LEVEL1' || s === '4') return 'Từ chối cấp Cảng vụ/Chi cục';
  if (s === 'REJECTED_DEPARTMENT' || s === 'REJECTED_LEVEL2' || s === '5') return 'Từ chối cấp Cục';
  if (s === 'REJECTED') return 'Từ chối';
  if (s === 'DELETED' || s === '6') return 'Đã xóa';
  if (s === 'PUBLISHED') return 'Đã công bố';
  return status;
};
```

### 4.3. Ngày tháng & Thời gian
- `DATE_TIME_FIELDS` (`createdAt`, `updatedAt`, `submittedForApprovalAt`, `portAuthorityApprovedAt`, `departmentApprovedAt`, `thoiDiemCongBoMo`...): format `DD/MM/YYYY HH:mm:ss`.
- `DATE_FIELDS` (`commissionedDate`, `lastRepairDate`, `announcementDecisionDate`, `ngayRaQuyetDinhCongBo`, `ngayVanBan`...): format `DD/MM/YYYY`.

### 4.4. Đối tượng cha & Cán bộ (Reference Fields & UUID Cleanup)
- Đối tượng cha (`fkCangBien`, `fkBenCang`, `fkLuongHh`, `fkNhaTram`, `fkBenPhao`, `fkDonViQl`): ưu tiên lấy tên đã resolve (`portName`, `berthName`, `waterway`, `buoyStationName`, `buoyBerthName`, `orgUnitName`).
- **Khử UUID trần (Anti-Raw-UUID)**: Nếu một trường liên kết chứa chuỗi UUID định dạng 36 ký tự (`/^[0-9a-f]{8}-[0-9a-f]{4}.../i`) mà không resolve được tên, **BẮT BUỘC hiển thị rỗng hoặc `—`**, tuyệt đối không in chuỗi UUID xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx ra popup.

---

## 5. Quy Chuẩn Nhúng Form Chỉnh Sửa Từ Bản Đồ (Embedded Action Protocol)

Khi người dùng nhấn nút **"Chỉnh sửa"** từ Popup hoặc Drawer bản đồ, hệ thống sẽ mở một Modal chứa `<iframe>` nhúng trang quản lý của loại KCHT đó kèm query parameter:
```
?embed=gis-action&action=edit&id=<recordId>
```

### 5.1. Quy tắc 1: Bảo toàn Trạng thái phê duyệt (Approval Status Preservation)
- Khi form nhận được `id` bản ghi từ URL, trang CRUD con (ví dụ: `PierListPage.tsx`, `AnchorageListPage.tsx`, `RadarStationList.tsx`...) sau khi fetch dữ liệu bản ghi **BẮT BUỘC** gán đúng trạng thái phê duyệt gốc vào state:
  ```ts
  setEditBaseStatus(record.approvalStatus);
  ```
- **Hành vi bắt buộc**:
  - Với bản ghi đã được phê duyệt (`APPROVED`), form chỉ hiển thị duy nhất **1 nút**: `[Lưu và phê duyệt]`.
  - Tuyệt đối không để `editBaseStatus` bị `undefined` hoặc fallback về `DRAFT` làm hiển thị sai cả 3 nút (`[Lưu tạm]`, `[Lưu và gửi phê duyệt]`, `[Lưu và phê duyệt]`).

### 5.2. Quy tắc 2: Giao thức Đóng Modal Chống Màn Hình Trắng (Zero Blank Modal Protocol)
- Khi người dùng click nút Lưu/Phê duyệt thành công hoặc click nút Hủy/Đóng:
  ```ts
  const notifyEmbeddedActionClosed = useCallback(() => {
    if (isEmbeddedAction) {
      window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
    }
  }, [isEmbeddedAction]);
  ```
- **Hành vi bắt buộc khi hoàn tất submit (`onFinish`)**:
  - **BẮT BUỘC** gọi hàm đóng chuẩn: `closeFormDrawer();` (hàm này vừa đóng form drawer nội bộ vừa kích hoạt `notifyEmbeddedActionClosed()`).
  - **TUYỆT ĐỐI CẤM** chỉ gọi `setCreateDrawerVisible(false);` riêng lẻ mà không gửi message, vì khi đó drawer trong iframe biến mất nhưng Modal cha của bản đồ GIS vẫn mở, dẫn đến lỗi **màn hình trắng trơn (Blank Modal)** không thể tắt.
- **Hành vi phía Parent (`GISChartView.tsx`)**:
  - Lắng nghe message event và đóng Modal:
    ```ts
    if (e.data && (e.data.type === 'CLOSE_KCHT_MODAL' || e.data.type === 'CLOSE_GIS_MODAL' || e.data.action === 'close')) {
      setIsActionModalVisible(false);
      setActionModalUrl(null);
    }
    ```

---

## 6. Checklist Kiểm Thử Trước Khi Release (Verification Checklist)

Mọi thay đổi trên menu Tra cứu thông tin KCHT trên bản đồ (`/gis/map`) hoặc các trang con liên quan phải pass 100% các tiêu chí sau:

- [ ] **1. Tên KCHT chính xác**: Mở popup của Khu neo đậu, Cầu cảng, Bến phao... kiểm tra tên đối tượng hiển thị chính xác tên của chính nó, không bị hiển thị tên Cảng biển hoặc Bến cảng cha.
- [ ] **2. Không thiếu trường dữ liệu**: Các trường thông số kỹ thuật (Độ sâu hiện tại, Độ sâu thiết kế, Hình dạng, Cỡ tàu DWT, Diện tích, Số lượng đang khai thác...) hiển thị giá trị thực tế, không bị rơi vào `—` do sai alias.
- [ ] **3. Tỉnh/Thành phố dạng text**: Địa điểm hiển thị đầy đủ tên tiếng Việt (ví dụ: `Thành phố Đà Nẵng`), không còn số ID nguyên (như `43`).
- [ ] **4. Trạng thái tiếng Việt chuẩn**: Trạng thái phê duyệt hiển thị chuẩn 7 trạng thái (`Lưu tạm`, `Chờ phê duyệt cấp Cảng vụ/Chi cục`, `Chờ phê duyệt cấp Cục`, `Đã phê duyệt`...), không còn mã raw `CHO_PHE_DUYET` hay `DUOC_PHE_DUYET`.
- [ ] **5. Khử sạch UUID**: Không có bất kỳ chuỗi UUID nào xuất hiện trong các ô giá trị của Popup.
- [ ] **6. Form nhúng đúng nút bấm**: Mở form chỉnh sửa từ bản đồ cho bản ghi đã duyệt (`APPROVED`), form chỉ hiển thị duy nhất nút `[Lưu và phê duyệt]`.
- [ ] **7. Đóng form không bị trắng màn hình**: Sau khi bấm `[Lưu và phê duyệt]` trên modal nhúng, Modal cha trên bản đồ tự động đóng lại, hiển thị lại giao diện bản đồ bình thường.
- [ ] **8. Vitest 100% passed**: Chạy lệnh `npm --prefix frontend test src/services/vmdPopupFields.test.ts` đạt kết quả xanh (passed tất cả các bài test kiểm tra mapping & collision).
- [ ] **9. Frontend build clean**: Chạy lệnh `npm --prefix frontend run build` kết thúc với mã 0 (zero errors & zero warnings).
- [ ] **10. Tách biệt kiến trúc**: File `vmdPopupFields.ts` không import Leaflet và có thể chạy trong mọi môi trường Node/Browser.
