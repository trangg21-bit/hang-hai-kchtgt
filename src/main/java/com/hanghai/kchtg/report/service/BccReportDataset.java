package com.hanghai.kchtg.report.service;

import com.hanghai.kchtg.report.dto.ReportResponse;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** One dataset shared by preview and template rendering. */
public record BccReportDataset(String code, List<String> headers, List<Line> lines,
        Map<String, Object> metadata) {
    public record Line(String group, String block, List<Object> values) {}

    public ReportResponse preview() {
        List<Map<String, Object>> rows = new ArrayList<>();
        String previous = null;
        for (Line line : lines) {
            String group = line.block() + " / " + line.group();
            if (!group.equals(previous) && !line.group().isEmpty()) {
                Map<String, Object> section = new LinkedHashMap<>();
                section.put("_rowType", "section");
                section.put(headers.get(1), line.block().isEmpty() ? line.group() : group);
                rows.add(section);
            }
            Map<String, Object> row = new LinkedHashMap<>();
            for (int i = 0; i < headers.size(); i++) row.put(headers.get(i), line.values().get(i));
            rows.add(row);
            previous = group;
        }
        return ReportResponse.builder().code(code).headers(headers).rows(rows)
                .summary(Map.of("Số dòng dữ liệu", lines.size())).build();
    }
}
