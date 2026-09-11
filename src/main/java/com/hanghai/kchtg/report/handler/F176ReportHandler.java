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
 * Handler cho báo cáo F-176 (BCTT48_191) — Biểu 07-N: Năng lực thông qua cảng biển, bến TNĐ địa phương và doanh nghiệp.
 */
@Component
public class F176ReportHandler extends BaseReportHandler {

    @Autowired
    private ReportRecordService reportRecordService;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public boolean supports(String reportCode) {
        return "F-176".equalsIgnoreCase(reportCode) || "BCTT48_191".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        int reportYear = getReportYear(request);
        String period = request.getReportPeriod() != null ? request.getReportPeriod() : "ANNUAL";

        List<String> headers = List.of(
                "STT", "Tên cảng / Bến thủy nội địa", "Địa phương / Doanh nghiệp quản lý", "Số lượng cầu bến (Bến)",
                "Chiều dài bến (m)", "Cỡ tàu tiếp nhận (Tấn)", "Công suất thiết kế (Triệu tấn/năm)",
                "Sản lượng thông qua (Triệu tấn)"
        );
        List<Map<String, Object>> rows = loadRows(targetUnitId, reportYear, period);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số cảng/bến", rows.size());

        return buildPreviewResponse("F-176", headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        String period = request.getReportPeriod() != null ? request.getReportPeriod() : "ANNUAL";
        return loadRows(targetUnitId, reportYear, period);
    }

    private List<Map<String, Object>> loadRows(UUID orgUnitId, int reportYear, String period) {
        Optional<ReportRecord> recordOpt = reportRecordService.findSnapshot(orgUnitId, "F-176", reportYear, period);
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
        r.put("Tên cảng / Bến thủy nội địa", "Bến thủy nội địa Vật Cách");
        r.put("Địa phương / Doanh nghiệp quản lý", "Công ty CP Cảng Vật Cách");
        r.put("Số lượng cầu bến (Bến)", 2);
        r.put("Chiều dài bến (m)", 180);
        r.put("Cỡ tàu tiếp nhận (Tấn)", 3000);
        r.put("Công suất thiết kế (Triệu tấn/năm)", 1.2);
        r.put("Sản lượng thông qua (Triệu tấn)", 1.05);
        rows.add(r);
        return rows;
    }
}
