package com.hanghai.kchtg.report.handler;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.report.entity.ReportRecord;
import com.hanghai.kchtg.report.service.ReportRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Handler cho báo cáo F-173 (BCDN_188) — Biểu 36–N: Thống kê cơ sở đóng mới, sửa chữa, phá dỡ tàu biển.
 */
@Component
public class F173ReportHandler extends BaseReportHandler {

    @Autowired
    private ReportRecordService reportRecordService;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public boolean supports(String reportCode) {
        return "F-173".equalsIgnoreCase(reportCode) || "BCDN_188".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        int reportYear = getReportYear(request);
        String period = request.getReportPeriod() != null ? request.getReportPeriod() : "ANNUAL";

        List<String> headers = List.of(
                "STT", "Tên cơ sở", "Địa chỉ / Tỉnh thành", "Loại hình hoạt động",
                "Năng lực đóng mới lớn nhất (DWT)", "Năng lực sửa chữa lớn nhất (DWT)",
                "Số lượng ụ khô / Triền đà", "Tình trạng hoạt động"
        );
        List<Map<String, Object>> rows = loadRows(targetUnitId, reportYear, period);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số cơ sở", rows.size());

        return buildPreviewResponse("F-173", headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        String period = request.getReportPeriod() != null ? request.getReportPeriod() : "ANNUAL";
        return loadRows(targetUnitId, reportYear, period);
    }

    private List<Map<String, Object>> loadRows(UUID orgUnitId, int reportYear, String period) {
        Optional<ReportRecord> recordOpt = reportRecordService.findSnapshot(orgUnitId, "F-173", reportYear, period);
        if (recordOpt.isPresent() && recordOpt.get().getReportData() != null) {
            try {
                return objectMapper.readValue(recordOpt.get().getReportData(), new TypeReference<List<Map<String, Object>>>() {});
            } catch (Exception ignored) {
            }
        }
        return getDefaultRows();
    }

    private List<Map<String, Object>> getDefaultRows() {
        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("STT", "1");
        r.put("Tên cơ sở", "Nhà máy đóng tàu Bạch Đằng");
        r.put("Địa chỉ / Tỉnh thành", "Hải Phòng");
        r.put("Loại hình hoạt động", "Đóng mới và sửa chữa");
        r.put("Năng lực đóng mới lớn nhất (DWT)", 50000);
        r.put("Năng lực sửa chữa lớn nhất (DWT)", 70000);
        r.put("Số lượng ụ khô / Triền đà", 3);
        r.put("Tình trạng hoạt động", "Hoạt động bình thường");
        rows.add(r);
        return rows;
    }
}
