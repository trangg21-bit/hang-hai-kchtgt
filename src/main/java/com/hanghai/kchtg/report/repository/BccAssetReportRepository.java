package com.hanghai.kchtg.report.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.assetmovement.entity.ProcessingRecordStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** SQL is explicitly scoped: Hibernate filters do not apply to JDBC. */
@Repository
@RequiredArgsConstructor
public class BccAssetReportRepository {
    private final NamedParameterJdbcTemplate jdbc;

    public List<Map<String, Object>> assets(List<UUID> units, LocalDate start, LocalDate end,
            String content, boolean opening) {
        if (units != null && units.isEmpty()) return List.of();
        var params = parameters(units, start, end);
        String filter = scope(units);
        if (!opening && start != null) filter += " AND a.created_at >= :startDate";
        if (end != null) filter += " AND a.created_at < :endDate";
        if ("1".equals(content)) filter += " AND a.declaration_date <= DATE '2025-04-04'";
        if ("2".equals(content)) filter += " AND a.declaration_date > DATE '2025-04-04'";
        return jdbc.queryForList("SELECT a.* FROM infra_assets a WHERE a.deleted_at IS NULL"
                + " AND a.approval_status = :approved" + filter
                + " ORDER BY a.asset_group, a.asset_type, a.asset_code, a.id", params);
    }

    public List<Map<String, Object>> exploitations(List<UUID> units, LocalDate start, LocalDate end) {
        if (units != null && units.isEmpty()) return List.of();
        var params = parameters(units, start, end);
        String dates = "";
        if (start != null) dates += " AND e.created_at >= :startDate";
        if (end != null) dates += " AND e.created_at < :endDate";
        return jdbc.queryForList("""
                SELECT a.*, e.exploitation_deadline, e.operator_org_unit_id,
                       e.total_revenue, e.related_costs, e.state_budget_payment, e.project_amount
                FROM infra_assets a JOIN asset_exploitations e ON e.asset_id = a.id
                WHERE a.deleted_at IS NULL AND e.deleted_at IS NULL
                  AND a.approval_status = :approved
                """ + scope(units) + dates + " ORDER BY a.id, e.id", params);
    }

    public List<Map<String, Object>> proposals(List<UUID> units, List<String> methods) {
        if (units != null && units.isEmpty()) return List.of();
        var params = parameters(units, null, null)
                .addValue("recordApproved", ProcessingRecordStatus.APPROVED.getValue());
        String methodFilter = "";
        if (methods != null && !methods.isEmpty()) {
            params.addValue("methods", methods.stream().map(Integer::valueOf).toList());
            methodFilter = " AND p.processing_type IN (:methods)";
        }
        return jdbc.queryForList("""
                SELECT a.*, p.processing_reason, p.processing_type
                FROM asset_processing_records p JOIN infra_assets a ON a.id = p.asset_id
                WHERE p.deleted_at IS NULL AND a.deleted_at IS NULL
                  AND a.approval_status = :approved AND p.status = :recordApproved
                """ + scope(units) + methodFilter + " ORDER BY a.asset_group, a.asset_code, p.id", params);
    }

    public List<Map<String, Object>> revenues(List<UUID> units) {
        if (units != null && units.isEmpty()) return List.of();
        return jdbc.queryForList("""
                SELECT e.asset_id, SUM(e.total_revenue) AS total_revenue,
                       SUM(e.related_costs) AS related_costs, SUM(e.state_budget_payment) AS state_budget_payment
                FROM asset_exploitations e JOIN infra_assets a ON a.id = e.asset_id
                WHERE e.deleted_at IS NULL AND a.deleted_at IS NULL AND a.approval_status = :approved
                """ + scope(units) + " GROUP BY e.asset_id", parameters(units, null, null));
    }

    private String scope(List<UUID> units) {
        return units == null ? "" : " AND a.org_unit_id IN (:units)";
    }

    private MapSqlParameterSource parameters(List<UUID> units, LocalDate start, LocalDate end) {
        return new MapSqlParameterSource().addValue("units", units)
                .addValue("approved", ApprovalStatus.APPROVED.getValue())
                .addValue("startDate", start == null ? null : start.atStartOfDay())
                .addValue("endDate", end == null ? null : end.plusDays(1).atStartOfDay());
    }
}
