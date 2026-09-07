package com.hanghai.kchtg.shipportcall.dto;

import com.hanghai.kchtg.shipportcall.entity.ShipPortCall;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Tạo mới bản ghi tàu biển ra vào cảng biển (F-300).
 * Fields = rows marked "✓ Create" in design plan §4 (45 fields: orgUnitId … enterpriseCode,
 * minus hidden passengers and excluded status). All text inputs are trimmed on the server.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class ShipPortCallCreateRequest {

    /** Đơn vị báo cáo — bắt buộc, must be within the caller's data scope. */
    @NotNull(message = "Đơn vị báo cáo không được để trống")
    private UUID orgUnitId;

    /** Ngày báo cáo — bắt buộc (recommended required set, U-6). */
    @NotNull(message = "Ngày báo cáo không được để trống")
    private LocalDate reportDate;

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
}
