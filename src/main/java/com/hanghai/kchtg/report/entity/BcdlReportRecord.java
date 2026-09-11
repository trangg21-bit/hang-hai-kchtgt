package com.hanghai.kchtg.report.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Filter;

import java.util.UUID;

/**
 * Snapshot dữ liệu báo cáo nhóm BCDL (F-163 đến F-169).
 */
@Entity
@Table(name = "bcdl_report_record")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@FieldNameConstants
@Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
public class BcdlReportRecord extends BaseEntity {

    @Column(name = "org_unit_id", nullable = false)
    private UUID orgUnitId;

    @Column(name = "report_code", nullable = false, length = 50)
    private String reportCode;

    @Column(name = "report_period", nullable = false, length = 50)
    private String reportPeriod;

    @Column(name = "report_year", nullable = false)
    private Integer reportYear;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "report_data", columnDefinition = "TEXT")
    private String reportData;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;
}
