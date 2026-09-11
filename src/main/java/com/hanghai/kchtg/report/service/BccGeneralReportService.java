package com.hanghai.kchtg.report.service;

import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.report.dto.Bcc157SearchRequest;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.repository.BccAssetReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BccGeneralReportService {
    private static final BigDecimal THOUSAND = new BigDecimal("1000");
    private static final List<String> METHODS = List.of("Cho thuê", "Sử dụng", "Nhận điều chuyển",
            "Điều chuyển đi", "Chuyển nhượng", "Thanh lý", "Bán", "Bị mất, bị hủy hoại", "Khác");
    private static final List<String> ASSET_HEADERS = List.of("STT", "Danh mục tài sản", "Đơn vị tính",
            "Số lượng", "Năm xây dựng", "Năm sử dụng", "Diện tích đất (m²)", "Sàn sử dụng (m²)",
            "Nguyên giá (nghìn đồng)", "Giá trị còn lại (nghìn đồng)", "Tình trạng tài sản");
    private final BccAssetReportRepository repository;
    private final BccReportScope scope;
    private final OrgUnitCacheService orgUnits;
    private final Bcc157Service savedReports;

    public boolean supports(String code) {
        return code != null && code.trim().toUpperCase(Locale.ROOT).matches("(?:F-14[1-7]|BCC_15[6-9]|BCC_16[0-2])");
    }

    public BccReportDataset load(ReportPreviewRequest request) {
        String code = request.getReportCode().trim().toUpperCase(Locale.ROOT);
        if (code.startsWith("BCC_")) code = "F-" + (Integer.parseInt(code.substring(4)) - 15);
        if (!supports(code)) throw new IllegalArgumentException("Mã báo cáo thống kê chung không hợp lệ");
        LocalDate start = request.getStartDate();
        LocalDate end = request.getEndDate();
        if (start != null && end != null && start.isAfter(end)) {
            throw new IllegalArgumentException("Ngày bắt đầu không được sau ngày kết thúc");
        }
        UUID unit = request.getOrgUnitId() == null || request.getOrgUnitId().isBlank()
                ? null : UUID.fromString(request.getOrgUnitId().trim());
        List<UUID> units = scope.resolve(unit);
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("fkDonViBcText", unit == null ? "Các đơn vị trong phạm vi được phân quyền" : orgUnits.getName(unit));
        metadata.put("fkDonViBcCapTrenText", "");
        if (unit != null) orgUnits.getList().stream().filter(o -> unit.equals(o.getId())).findFirst()
                .ifPresent(o -> metadata.put("fkDonViBcCapTrenText", orgUnits.getName(o.getParentId())));
        metadata.put("bcThoiGian", (start == null ? "" : start.toString()) + " - " + (end == null ? "" : end.toString()));
        metadata.put("bcMaText", Integer.toString(start == null ? LocalDate.now().getYear() : start.getYear()));
        metadata.put("dateReportText", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        if (code.equals("F-142")) return financial(request, units, metadata);
        if (code.equals("F-141")) return movement(repository.assets(units, start, end, null, true), start, metadata);
        if (code.equals("F-146")) return exploitation(repository.exploitations(units, start, end), metadata);
        if (code.equals("F-147")) return proposals(repository.proposals(units, processingMethods(request)), metadata);
        String content = null;
        if (code.equals("F-143")) {
            content = request.getBcNoiDung();
            if (!"1".equals(content) && !"2".equals(content)) {
                throw new IllegalArgumentException("Chọn nội dung kê khai lần đầu hoặc kê khai bổ sung");
            }
            metadata.put("reportContent", "1".equals(content) ? "Kê khai lần đầu" : "Kê khai bổ sung");
        }
        var assets = repository.assets(units, code.equals("F-143") ? null : start,
                code.equals("F-143") ? null : end, content, false);
        Map<Object, Map<String, Object>> revenue = new LinkedHashMap<>();
        if (code.equals("F-145")) for (var item : repository.revenues(units)) revenue.put(item.get("asset_id"), item);
        List<String> headers = new ArrayList<>(ASSET_HEADERS);
        if (code.equals("F-145")) headers.addAll(List.of("Hình thức xử lý", "Tổng số tiền thu được (nghìn đồng)",
                "Chi phí có liên quan (nghìn đồng)", "Nộp NSNN (nghìn đồng)"));
        headers.add("Ghi chú");
        List<BccReportDataset.Line> lines = new ArrayList<>();
        for (var a : assets) {
            List<Object> values = assetValues(a, lines.size() + 1);
            if (code.equals("F-145")) {
                values.add(methodLabel(a.get("disposal_method")));
                var money = revenue.get(a.get("id"));
                for (String key : List.of("total_revenue", "related_costs", "state_budget_payment")) {
                    values.add(money == null ? BigDecimal.ZERO : thousands(money.get(key)));
                }
            }
            values.add(null);
            lines.add(new BccReportDataset.Line(group(a), "", values));
        }
        return new BccReportDataset(code, headers, lines, metadata);
    }

    private BccReportDataset movement(List<Map<String, Object>> assets, LocalDate start, Map<String, Object> metadata) {
        List<String> headers = new ArrayList<>(List.of("STT", "Loại tài sản"));
        for (String period : List.of("Đầu kỳ", "Tăng trong kỳ", "Giảm trong kỳ", "Cuối kỳ")) {
            headers.addAll(List.of(period + " - Số lượng", period + " - Diện tích (m²)", period + " - Nguyên giá (nghìn đồng)"));
        }
        Map<String, BigDecimal[]> totals = new LinkedHashMap<>();
        for (var a : assets) {
            String group = group(a);
            var sums = totals.computeIfAbsent(group, ignored -> zeros(12));
            LocalDate created = date(a.get("created_at"));
            if (created == null) throw new IllegalStateException("Tài sản thiếu ngày ghi nhận: " + a.get("asset_code"));
            int offset;
            if (start == null || created.isBefore(start)) offset = 0;
            else {
                int method = methodCode(a.get("disposal_method"));
                if (method == 9) continue;
                offset = method <= 3 ? 3 : 6;
            }
            sums[offset] = sums[offset].add(number(a.get("quantity")));
            sums[offset + 1] = sums[offset + 1].add(number(a.get("land_area")));
            sums[offset + 2] = sums[offset + 2].add(number(a.get("original_value")).divide(THOUSAND));
        }
        List<BccReportDataset.Line> lines = new ArrayList<>();
        totals.forEach((group, sums) -> {
            for (int i = 0; i < 3; i++) sums[9 + i] = sums[i].add(sums[3 + i]).subtract(sums[6 + i]);
            List<Object> values = new ArrayList<>(List.of(lines.size() + 1, group));
            values.addAll(Arrays.asList(sums));
            lines.add(new BccReportDataset.Line("", "", values));
        });
        return new BccReportDataset("F-141", headers, lines, metadata);
    }

    private BccReportDataset financial(ReportPreviewRequest request, List<UUID> units, Map<String, Object> metadata) {
        int year = Integer.parseInt(metadata.get("bcMaText").toString());
        String source = request.getDataSource() == null ? "1" : request.getDataSource();
        if (!List.of("1", "2").contains(source)) throw new IllegalArgumentException("Nguồn báo cáo không hợp lệ");
        BigDecimal[] money = zeros(10);
        String[] codes = {"1.1", "1.2", "1.3", "1.4", "2.1", "2.2", "2.3", "2.4", "3.1", "3.2"};
        if (source.equals("1")) {
            UUID selected = request.getOrgUnitId() == null || request.getOrgUnitId().isBlank()
                    ? null : UUID.fromString(request.getOrgUnitId());
            var reports = savedReports.search(Bcc157SearchRequest.builder().orgUnitId(selected)
                    .reportYear(year).nguonDuLieu(source).build());
            if (reports.isEmpty()) return new BccReportDataset("F-142", financialHeaders(), List.of(), metadata);
            for (var r : reports) {
                BigDecimal[] values = {r.getAssetOpeningOriginalCost(), r.getAssetOriginalCostIncrease(), r.getAssetOriginalCostDecrease(),
                        r.getAssetClosingOriginalCost(), r.getAssetOpeningAccumulatedDepreciation(), r.getAssetDepreciationIncrease(),
                        r.getAssetDepreciationDecrease(), r.getAssetClosingDepreciation(), r.getAssetOpeningResidualValue(), r.getAssetClosingResidualValue()};
                for (int i = 0; i < values.length; i++) money[i] = money[i].add(number(values[i]));
                if (reports.size() == 1) codes = new String[]{r.getOpeningOriginalCostCode(), r.getOriginalCostIncreaseCode(),
                        r.getOriginalCostDecreaseCode(), r.getClosingOriginalCostCode(), r.getOpeningAccumulatedDepreciationCode(),
                        r.getDepreciationIncreaseCode(), r.getDepreciationDecreaseCode(), r.getClosingDepreciationCode(),
                        r.getOpeningResidualValueCode(), r.getClosingResidualValueCode()};
            }
        } else {
            for (var a : repository.assets(units, null, null, null, true)) {
                LocalDate depreciation = date(a.get("depreciation_start_date"));
                if (depreciation == null || depreciation.getYear() > year) continue;
                int offset;
                if (depreciation.getYear() < year) offset = 0;
                else {
                    int method = methodCode(a.get("disposal_method"));
                    if (method == 9) continue;
                    offset = method <= 3 ? 1 : 2;
                }
                money[offset] = money[offset].add(number(a.get("original_value")).divide(new BigDecimal("1000000000")));
                money[4 + offset] = money[4 + offset].add(number(a.get("accumulated_depreciation")).divide(new BigDecimal("1000000000")));
            }
        }
        // The VMD workbook calculates these values, so preview must use the same arithmetic.
        money[3] = money[0].add(money[1]).subtract(money[2]);
        money[7] = money[4].add(money[5]).subtract(money[6]);
        money[8] = money[0].subtract(money[4]);
        money[9] = money[3].subtract(money[7]);
        String[] labels = {"Nguyên giá - Số dư đầu năm", "Nguyên giá - Tăng trong năm", "Nguyên giá - Giảm trong năm",
                "Nguyên giá - Số dư cuối năm", "Hao mòn lũy kế - Số dư đầu năm", "Hao mòn lũy kế - Tăng trong năm",
                "Hao mòn lũy kế - Giảm trong năm", "Hao mòn lũy kế - Số dư cuối năm", "Giá trị còn lại - Đầu năm", "Giá trị còn lại - Cuối năm"};
        List<BccReportDataset.Line> lines = new ArrayList<>();
        for (int i = 0; i < money.length; i++) lines.add(new BccReportDataset.Line("", "",
                Arrays.asList(i + 1, labels[i], codes[i], money[i], money[i])));
        return new BccReportDataset("F-142", financialHeaders(), lines, metadata);
    }

    private List<String> financialHeaders() { return List.of("STT", "Chỉ tiêu", "Mã số", "TSHT hàng hải", "Tổng cộng"); }

    private BccReportDataset exploitation(List<Map<String, Object>> entries, Map<String, Object> metadata) {
        Map<Object, List<Map<String, Object>>> byAsset = new LinkedHashMap<>();
        for (var e : entries) byAsset.computeIfAbsent(e.get("id"), ignored -> new ArrayList<>()).add(e);
        List<BccReportDataset.Line> lines = new ArrayList<>();
        for (var history : byAsset.values()) {
            var a = history.get(0);
            int method = methodCode(a.get("disposal_method"));
            if (!List.of(1, 2, 5).contains(method)) continue;
            LocalDate deadline = null;
            var operators = new LinkedHashSet<String>();
            BigDecimal[] totals = zeros(4);
            for (var entry : history) {
                LocalDate value = date(entry.get("exploitation_deadline"));
                if (value != null && (deadline == null || value.isAfter(deadline))) deadline = value;
                Object operator = entry.get("operator_org_unit_id");
                if (operator instanceof UUID id) { String name = orgUnits.getName(id); if (name != null) operators.add(name); }
                String[] keys = {"total_revenue", "related_costs", "state_budget_payment", "project_amount"};
                for (int i = 0; i < keys.length; i++) totals[i] = totals[i].add(number(entry.get(keys[i])));
            }
            List<Object> values = new ArrayList<>(Arrays.asList(lines.size() + 1, a.get("asset_name"), a.get("quantity_unit"),
                    a.get("quantity"), a.get("land_area"), a.get("floor_area"), thousands(a.get("original_value")),
                    thousands(a.get("remaining_value")), deadline == null ? null : deadline.format(DateTimeFormatter.ofPattern("dd-MM-yyyy")),
                    String.join(", ", operators)));
            for (var total : totals) values.add(total.divide(THOUSAND));
            values.add(null);
            lines.add(new BccReportDataset.Line(group(a), Integer.toString(method), values));
        }
        lines.sort(Comparator.comparingInt((BccReportDataset.Line line) -> List.of("2", "1", "5").indexOf(line.block())).thenComparing(BccReportDataset.Line::group));
        return new BccReportDataset("F-146", List.of("STT", "Danh mục tài sản", "Đơn vị tính", "Số lượng", "Diện tích đất (m²)",
                "Sàn sử dụng (m²)", "Nguyên giá (nghìn đồng)", "Giá trị còn lại (nghìn đồng)", "Thời hạn khai thác", "Doanh nghiệp khai thác",
                "Tổng số tiền thu được (nghìn đồng)", "Chi phí có liên quan (nghìn đồng)", "Nộp NSNN (nghìn đồng)", "Tiền thực hiện dự án (nghìn đồng)", "Ghi chú"), lines, metadata);
    }

    private BccReportDataset proposals(List<Map<String, Object>> records, Map<String, Object> metadata) {
        List<BccReportDataset.Line> lines = new ArrayList<>();
        for (var a : records) lines.add(new BccReportDataset.Line(group(a), "", Arrays.asList(lines.size() + 1, a.get("asset_name"),
                a.get("address"), date(a.get("use_date")) == null ? null : date(a.get("use_date")).getYear(), a.get("technical_specs"),
                a.get("land_area"), a.get("floor_area"), a.get("original_value"), a.get("remaining_value"),
                a.get("asset_condition"), a.get("processing_reason"))));
        return new BccReportDataset("F-147", List.of("STT", "Danh mục tài sản", "Địa chỉ", "Năm sử dụng", "Thông số cơ bản", "Diện tích đất (m²)",
                "Sàn sử dụng (m²)", "Nguyên giá (đồng)", "Giá trị còn lại (đồng)", "Tình trạng tài sản", "Lý do đề nghị"), lines, metadata);
    }

    private List<String> processingMethods(ReportPreviewRequest request) {
        var methods = request.getProcessingMethods();
        if (methods == null && request.getBcNoiDung() != null) methods = Arrays.asList(request.getBcNoiDung().split(","));
        if (methods == null || methods.isEmpty()) throw new IllegalArgumentException("Chọn ít nhất một hình thức xử lý");
        return methods.stream().map(String::trim).map(value -> switch (value) {
            case "0", "DIEU_CHUYEN" -> "0";
            case "1", "BAN_GIAO" -> "1";
            case "2", "THANH_LY" -> "2";
            case "3", "TIEU_HUY" -> "3";
            default -> throw new IllegalArgumentException("Hình thức xử lý chưa có ánh xạ trong hồ sơ xử lý: " + value);
        }).distinct().toList();
    }

    private List<Object> assetValues(Map<String, Object> a, int index) {
        LocalDate useDate = date(a.get("use_date"));
        return new ArrayList<>(Arrays.asList(index, a.get("asset_name"), a.get("quantity_unit"), a.get("quantity"),
                a.get("construction_year"), useDate == null ? null : useDate.getYear(), a.get("land_area"), a.get("floor_area"),
                thousands(a.get("original_value")), thousands(a.get("remaining_value")), a.get("asset_condition")));
    }
    private String group(Map<String, Object> a) {
        Object group = a.get("asset_type");
        if (group == null) throw new IllegalStateException("Tài sản thiếu loại: " + a.get("asset_code"));
        return switch (group.toString()) {
            case "0", "BUOY" -> "Phao tiêu"; case "1", "RADAR_STATION" -> "Trạm radar";
            case "2", "LIGHTHOUSE" -> "Đèn biển"; case "3", "AUXILIARY_EQUIPMENT" -> "Thiết bị phụ trợ";
            case "4", "PORT_TERMINAL" -> "Bến cảng";
            default -> throw new IllegalStateException("Loại tài sản chưa được hỗ trợ: " + group);
        };
    }
    static int methodCode(Object value) {
        String text = value == null ? "" : value.toString().trim();
        if (text.matches("[1-9]")) return Integer.parseInt(text);
        for (int i = 0; i < METHODS.size(); i++) if (METHODS.get(i).equalsIgnoreCase(text)) return i + 1;
        throw new IllegalStateException("Hình thức xử lý chưa có ánh xạ VMD: '" + text + "'. Cần chuẩn hóa dữ liệu tài sản trước khi tổng hợp");
    }
    private Object methodLabel(Object value) { return value == null ? null : METHODS.get(methodCode(value) - 1); }
    private static BigDecimal number(Object value) { return value == null ? BigDecimal.ZERO : new BigDecimal(value.toString()); }
    private static BigDecimal thousands(Object value) { return value == null ? null : number(value).divide(THOUSAND); }
    private static BigDecimal[] zeros(int count) { var values = new BigDecimal[count]; Arrays.fill(values, BigDecimal.ZERO); return values; }
    private static LocalDate date(Object value) {
        if (value == null) return null;
        if (value instanceof Timestamp timestamp) return timestamp.toLocalDateTime().toLocalDate();
        if (value instanceof java.sql.Date sqlDate) return sqlDate.toLocalDate();
        if (value instanceof LocalDateTime time) return time.toLocalDate();
        return LocalDate.parse(value.toString().substring(0, 10));
    }
}
