package com.hanghai.kchtg.shipportcall.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
 * Sổ tàu biển ra vào cảng biển (F-300) — one row = one port call.
 * Columns map 1:1 to design plan §4 (English names; binary enums stored ORDINAL SMALLINT;
 * open vocabularies stored VARCHAR — no invented Java enum for them, see U-3).
 * Data scope: {@code org_unit_id} NOT NULL + {@code orgUnitFilter} activated by {@code @DataScope}
 * on the controller (org unit only sees its own rows; parent unit sees its subtree; Cục sees full).
 */
@Entity
@Table(name = "ship_port_call")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@FieldNameConstants
@Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
public class ShipPortCall extends BaseEntity {

    /** Loại tuyến hải trình (tuyến đảo): NO / YES — closed binary enum, ORDINAL SMALLINT. */
    public enum IslandRoute { NO, YES }

    /** Hàng nguy hiểm: NO / YES — closed binary enum, ORDINAL SMALLINT. */
    public enum DangerousGoods { NO, YES }

    /** Đơn vị báo cáo — bắt buộc; row identity for data scope. */
    @Column(name = "org_unit_id", nullable = false)
    private UUID orgUnitId;

    /** Ngày báo cáo (register identity). */
    @Column(name = "report_date")
    private LocalDate reportDate;

    /** Số hiệu báo cáo — «tự sinh/đọc»; no generation rule exists → NULL until decided (U-4). */
    @Column(name = "report_code", length = 100)
    private String reportCode;

    /** Tên báo cáo (list-only). */
    @Column(name = "report_name", length = 500)
    private String reportName;

    /** Kỳ báo cáo (list-only). */
    @Column(name = "report_period", length = 50)
    private String reportPeriod;

    /** Tên tàu. */
    @Column(name = "ship_name", length = 255)
    private String shipName;

    /** Hô hiệu tàu (call sign). */
    @Column(name = "call_sign", length = 50)
    private String callSign;

    /** Số IMO — text (preserves leading zeros). */
    @Column(name = "imo_number", length = 50)
    private String imoNumber;

    /** Quốc tịch — open vocabulary stored VARCHAR (U-2). */
    @Column(name = "nationality", length = 100)
    private String nationality;

    /** Loại tàu — Excel control Input Text → VARCHAR (deviation note §10.2). */
    @Column(name = "ship_type", length = 255)
    private String shipType;

    /** Chiều dài tàu (m). */
    @Column(name = "length", precision = 19, scale = 4)
    private BigDecimal length;

    /** Mớn nước đến / đi (m). */
    @Column(name = "draft_arrival_departure", precision = 19, scale = 4)
    private BigDecimal draftArrivalDeparture;

    /** Trọng tải toàn phần DWT (tấn). */
    @Column(name = "dwt", precision = 19, scale = 4)
    private BigDecimal dwt;

    /** Dung tích toàn phần GT. */
    @Column(name = "gt", precision = 19, scale = 4)
    private BigDecimal gt;

    /** Chiều cao cột khói thực tế (m). */
    @Column(name = "air_draft_actual", precision = 19, scale = 4)
    private BigDecimal airDraftActual;

    /** Xuất khẩu — hàng hóa (tấn). */
    @Column(name = "export_tons", precision = 19, scale = 4)
    private BigDecimal exportTons;

    /** Xuất khẩu — container (TEU). */
    @Column(name = "export_teus", precision = 19, scale = 4)
    private BigDecimal exportTeus;

    /** Xuất khẩu — container rỗng (TEU). */
    @Column(name = "export_empty_teus", precision = 19, scale = 4)
    private BigDecimal exportEmptyTeus;

    /** Nhập khẩu — hàng hóa (tấn). */
    @Column(name = "import_tons", precision = 19, scale = 4)
    private BigDecimal importTons;

    /** Nhập khẩu — container (TEU). */
    @Column(name = "import_teus", precision = 19, scale = 4)
    private BigDecimal importTeus;

    /** Nhập khẩu — container rỗng (TEU). */
    @Column(name = "import_empty_teus", precision = 19, scale = 4)
    private BigDecimal importEmptyTeus;

    /** Vận chuyển nội địa đi — hàng hóa (tấn). */
    @Column(name = "domestic_in_tons", precision = 19, scale = 4)
    private BigDecimal domesticInTons;

    /** Vận chuyển nội địa đi — container (TEU). */
    @Column(name = "domestic_in_teus", precision = 19, scale = 4)
    private BigDecimal domesticInTeus;

    /** Vận chuyển nội địa đi — container rỗng (TEU). */
    @Column(name = "domestic_in_empty_teus", precision = 19, scale = 4)
    private BigDecimal domesticInEmptyTeus;

    /** Vận chuyển nội địa đến — hàng hóa (tấn). */
    @Column(name = "domestic_out_tons", precision = 19, scale = 4)
    private BigDecimal domesticOutTons;

    /** Vận chuyển nội địa đến — container (TEU). */
    @Column(name = "domestic_out_teus", precision = 19, scale = 4)
    private BigDecimal domesticOutTeus;

    /** Vận chuyển nội địa đến — container rỗng (TEU). */
    @Column(name = "domestic_out_empty_teus", precision = 19, scale = 4)
    private BigDecimal domesticOutEmptyTeus;

    /** Chuyển tải — hàng hóa (tấn). */
    @Column(name = "transshipment_tons", precision = 19, scale = 4)
    private BigDecimal transshipmentTons;

    /** Chuyển tải — container (TEU) (no «Teus rỗng» per Excel). */
    @Column(name = "transshipment_teus", precision = 19, scale = 4)
    private BigDecimal transshipmentTeus;

    /** Quá cảnh có bốc xếp — hàng hóa (tấn). */
    @Column(name = "transit_handling_tons", precision = 19, scale = 4)
    private BigDecimal transitHandlingTons;

    /** Quá cảnh có bốc xếp — container (TEU). */
    @Column(name = "transit_handling_teus", precision = 19, scale = 4)
    private BigDecimal transitHandlingTeus;

    /** Quá cảnh không bốc xếp — hàng hóa (tấn). */
    @Column(name = "transit_no_handling_tons", precision = 19, scale = 4)
    private BigDecimal transitNoHandlingTons;

    /** Quá cảnh không bốc xếp — container (TEU). */
    @Column(name = "transit_no_handling_teus", precision = 19, scale = 4)
    private BigDecimal transitNoHandlingTeus;

    /** Hành khách đến — UNRESOLVED (§10.1): column kept, form/DTO excluded in v1. */
    @Column(name = "passengers_arrival")
    private Integer passengersArrival;

    /** Hành khách đi — UNRESOLVED (§10.1): column kept, form/DTO excluded in v1. */
    @Column(name = "passengers_departure")
    private Integer passengersDeparture;

    /** Nhóm hàng — open vocabulary stored VARCHAR (no dictionary → v1, U-2). */
    @Column(name = "cargo_group", length = 255)
    private String cargoGroup;

    /** Loại hàng — open vocabulary stored VARCHAR. */
    @Column(name = "cargo_type", length = 255)
    private String cargoType;

    /** Tên hàng hóa. */
    @Column(name = "cargo_name", length = 500)
    private String cargoName;

    /** Cảng rời cuối cùng. */
    @Column(name = "last_port_of_call", length = 255)
    private String lastPortOfCall;

    /** Cảng đến (Cảng dỡ hàng). */
    @Column(name = "arrival_port_name", length = 255)
    private String arrivalPortName;

    /** Mã cảng đến. */
    @Column(name = "arrival_port_code", length = 50)
    private String arrivalPortCode;

    /** Cảng đi (Cảng xếp hàng). */
    @Column(name = "departure_port_name", length = 255)
    private String departurePortName;

    /** Mã cảng đi. */
    @Column(name = "departure_port_code", length = 50)
    private String departurePortCode;

    /** Cảng đích. */
    @Column(name = "destination_port", length = 255)
    private String destinationPort;

    /** Ngày đến cảng (filter ✓). */
    @Column(name = "arrival_date")
    private LocalDate arrivalDate;

    /** Ngày rời cảng (filter ✓). */
    @Column(name = "departure_date")
    private LocalDate departureDate;

    /** Tuyến đảo (nếu có) — closed binary enum, ORDINAL SMALLINT. */
    @Enumerated(EnumType.ORDINAL)
    @Column(name = "island_route", columnDefinition = "SMALLINT")
    private IslandRoute islandRoute;

    /** Hàng nguy hiểm — closed binary enum, ORDINAL SMALLINT. */
    @Enumerated(EnumType.ORDINAL)
    @Column(name = "dangerous_goods", columnDefinition = "SMALLINT")
    private DangerousGoods dangerousGoods;

    /** Đại lý tàu biển. */
    @Column(name = "ship_agent", length = 255)
    private String shipAgent;

    /** Mã doanh nghiệp — Excel Select, no option source → text v1 (U-2). */
    @Column(name = "enterprise_code", length = 100)
    private String enterpriseCode;
}
