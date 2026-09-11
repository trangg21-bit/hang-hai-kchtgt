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
 * Handler cho báo cáo F-175 (BCTT48_190) — Biểu số 06-N: Năng lực thông qua bến cảng, cầu cảng theo TT48.
 */
@Component
public class F175ReportHandler extends BaseReportHandler {

    @Autowired
    private ReportRecordService reportRecordService;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public boolean supports(String reportCode) {
        return "F-175".equalsIgnoreCase(reportCode) || "BCTT48_190".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        int reportYear = getReportYear(request);
        String period = request.getReportPeriod() != null ? request.getReportPeriod() : "ANNUAL";

        List<String> headers = List.of(
                "STT", "Tên bến cảng / Cầu cảng", "Đơn vị quản lý / Khai thác", "Chiều dài cầu bến (m)",
                "Độ sâu trước bến (m)", "Cỡ tàu lớn nhất (DWT)", "Công suất thiết kế (Triệu tấn/năm)",
                "Sản lượng thông qua thực tế (Triệu tấn)"
        );
        List<Map<String, Object>> rows = loadRows(targetUnitId, reportYear, period);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số bến/cầu cảng", rows.size());

        return buildPreviewResponse("F-175", headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        String period = request.getReportPeriod() != null ? request.getReportPeriod() : "ANNUAL";
        return loadRows(targetUnitId, reportYear, period);
    }

    private List<Map<String, Object>> loadRows(UUID orgUnitId, int reportYear, String period) {
        Optional<ReportRecord> recordOpt = reportRecordService.findSnapshot(orgUnitId, "F-175", reportYear, period);
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
        r.put("Tên bến cảng / Cầu cảng", "Bến cảng Tân Vũ - Cầu cảng số 1");
        r.put("Đơn vị quản lý / Khai thác", "Công ty CP Cảng Hải Phòng");
        r.put("Chiều dài cầu bến (m)", 250);
        r.put("Độ sâu trước bến (m)", -10.5);
        r.put("Cỡ tàu lớn nhất (DWT)", 20000);
        r.put("Công suất thiết kế (Triệu tấn/năm)", 3.5);
        r.put("Sản lượng thông qua thực tế (Triệu tấn)", 3.2);
        rows.add(r);
        return rows;
    }
}
