package com.hanghai.kchtg.report.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Chi tiết phương tiện thủy nội địa ra, vào cảng biển (F-162 / BCDL_177).
 */
@Entity
@Table(name = "inland_waterway_port_call")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@FieldNameConstants
@Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
public class InlandWaterwayPortCall extends BaseEntity {

    @Column(name = "org_unit_id", nullable = false)
    private UUID orgUnitId;

    @Column(name = "report_date")
    private LocalDate reportDate;

    @Column(name = "report_code", length = 100)
    private String reportCode;

    @Column(name = "report_name", length = 500)
    private String reportName;

    @Column(name = "report_period", length = 50)
    private String reportPeriod;

    @Column(name = "boat_name", length = 255)
    private String boatName;

    @Column(name = "registration_number", length = 50)
    private String registrationNumber;

    @Column(name = "boat_type")
    private Integer boatType;

    @Column(name = "boat_grade", length = 20)
    private String boatGrade;

    @Column(name = "length", precision = 19, scale = 4)
    private BigDecimal length;

    @Column(name = "dwt", precision = 19, scale = 4)
    private BigDecimal dwt;

    @Column(name = "gross_tonnage", precision = 19, scale = 4)
    private BigDecimal grossTonnage;

    @Column(name = "export_tons", precision = 19, scale = 4)
    private BigDecimal exportTons;

    @Column(name = "export_teus", precision = 19, scale = 4)
    private BigDecimal exportTeus;

    @Column(name = "export_empty_teus", precision = 19, scale = 4)
    private BigDecimal exportEmptyTeus;

    @Column(name = "import_tons", precision = 19, scale = 4)
    private BigDecimal importTons;

    @Column(name = "import_teus", precision = 19, scale = 4)
    private BigDecimal importTeus;

    @Column(name = "import_empty_teus", precision = 19, scale = 4)
    private BigDecimal importEmptyTeus;

    @Column(name = "domestic_in_tons", precision = 19, scale = 4)
    private BigDecimal domesticInTons;

    @Column(name = "domestic_in_teus", precision = 19, scale = 4)
    private BigDecimal domesticInTeus;

    @Column(name = "domestic_in_empty_teus", precision = 19, scale = 4)
    private BigDecimal domesticInEmptyTeus;

    @Column(name = "domestic_out_tons", precision = 19, scale = 4)
    private BigDecimal domesticOutTons;

    @Column(name = "domestic_out_teus", precision = 19, scale = 4)
    private BigDecimal domesticOutTeus;

    @Column(name = "domestic_out_empty_teus", precision = 19, scale = 4)
    private BigDecimal domesticOutEmptyTeus;

    @Column(name = "transshipment_tons", precision = 19, scale = 4)
    private BigDecimal transshipmentTons;

    @Column(name = "transshipment_teus", precision = 19, scale = 4)
    private BigDecimal transshipmentTeus;

    @Column(name = "transit_handling_tons", precision = 19, scale = 4)
    private BigDecimal transitHandlingTons;

    @Column(name = "transit_handling_teus", precision = 19, scale = 4)
    private BigDecimal transitHandlingTeus;

    @Column(name = "transit_no_handling_tons", precision = 19, scale = 4)
    private BigDecimal transitNoHandlingTons;

    @Column(name = "transit_no_handling_teus", precision = 19, scale = 4)
    private BigDecimal transitNoHandlingTeus;

    @Column(name = "passengers_arrival")
    private Integer passengersArrival;

    @Column(name = "passengers_departure")
    private Integer passengersDeparture;

    @Column(name = "cargo_group", length = 255)
    private String cargoGroup;

    @Column(name = "cargo_type", length = 255)
    private String cargoType;

    @Column(name = "cargo_name", length = 500)
    private String cargoName;

    @Column(name = "last_port_of_call", length = 255)
    private String lastPortOfCall;

    @Column(name = "arrival_port_name", length = 255)
    private String arrivalPortName;

    @Column(name = "arrival_port_code", length = 50)
    private String arrivalPortCode;

    @Column(name = "departure_port_name", length = 255)
    private String departurePortName;

    @Column(name = "departure_port_code", length = 50)
    private String departurePortCode;

    @Column(name = "destination_port", length = 255)
    private String destinationPort;

    @Column(name = "arrival_date")
    private LocalDate arrivalDate;

    @Column(name = "departure_date")
    private LocalDate departureDate;

    @Column(name = "island_route")
    private Integer islandRoute;

    @Column(name = "dangerous_goods")
    private Integer dangerousGoods;

    @Column(name = "enterprise_code", length = 100)
    private String enterpriseCode;
}
