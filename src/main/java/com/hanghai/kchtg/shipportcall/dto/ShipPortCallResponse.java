package com.hanghai.kchtg.shipportcall.dto;

import com.hanghai.kchtg.shipportcall.entity.ShipPortCall;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response projection for one ship port call register row (F-300).
 * Mirrors every business column of entity {@link ShipPortCall} plus {@code orgUnitName}
 * (resolved via OrgUnitCacheService) and audit {@code createdBy}/{@code createdAt}
 * (Admin Cục visibility). JSON field names = camelCase English.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class ShipPortCallResponse {

    private UUID id;
    private UUID orgUnitId;
    private String orgUnitName;
    private LocalDate reportDate;
    private String reportCode;
    private String reportName;
    private String reportPeriod;
    private String shipName;
    private String callSign;
    private String imoNumber;
    private String nationality;
    private String shipType;
    private BigDecimal length;
    private BigDecimal draftArrivalDeparture;
    private BigDecimal dwt;
    private BigDecimal gt;
    private BigDecimal airDraftActual;
    private BigDecimal exportTons;
    private BigDecimal exportTeus;
    private BigDecimal exportEmptyTeus;
    private BigDecimal importTons;
    private BigDecimal importTeus;
    private BigDecimal importEmptyTeus;
    private BigDecimal domesticInTons;
    private BigDecimal domesticInTeus;
    private BigDecimal domesticInEmptyTeus;
    private BigDecimal domesticOutTons;
    private BigDecimal domesticOutTeus;
    private BigDecimal domesticOutEmptyTeus;
    private BigDecimal transshipmentTons;
    private BigDecimal transshipmentTeus;
    private BigDecimal transitHandlingTons;
    private BigDecimal transitHandlingTeus;
    private BigDecimal transitNoHandlingTons;
    private BigDecimal transitNoHandlingTeus;
    private Integer passengersArrival;
    private Integer passengersDeparture;
    private String cargoGroup;
    private String cargoType;
    private String cargoName;
    private String lastPortOfCall;
    private String arrivalPortName;
    private String arrivalPortCode;
    private String departurePortName;
    private String departurePortCode;
    private String destinationPort;
    private LocalDate arrivalDate;
    private LocalDate departureDate;
    private ShipPortCall.IslandRoute islandRoute;
    private ShipPortCall.DangerousGoods dangerousGoods;
    private String shipAgent;
    private String enterpriseCode;
    private LocalDateTime createdAt;
    private UUID createdBy;
}
