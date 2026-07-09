package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import java.util.List;
import java.util.Map;

public interface ReportHandler {
    boolean supports(String reportCode);
    ReportResponse getPreview(ReportPreviewRequest request);
    List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear);
}
