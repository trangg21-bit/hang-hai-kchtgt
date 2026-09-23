package com.hanghai.kchtg.port.dto.dryport;

import com.hanghai.kchtg.common.dto.FieldPresenceTrackedRequest;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.validator.Decimal20_4;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDryPortRequest extends FieldPresenceTrackedRequest {

    @NotNull(message = "ID cảng cạn không được để trống")
    private UUID id;

    @Size(max = 50, message = "Mã cảng cạn tối đa 50 ký tự")
    private String dryPortCode;

    @Size(max = 255, message = "Tên cảng cạn tối đa 255 ký tự")
    private String dryPortName;

    private UUID orgUnitId;
    private UUID operatingOrgId;

    @Size(max = 255, message = "Đơn vị vận hành tối đa 255 ký tự")
    private String operatingUnit;

    @Size(max = 255, message = "Vùng tối đa 255 ký tự")
    private String region;

    private Integer provinceId;

    @Size(max = 500, message = "Địa điểm chi tiết tối đa 500 ký tự")
    private String detailedLocation;

    @Size(max = 255, message = "Hành lang vận tải tối đa 255 ký tự")
    private String transportCorridor;

    @DecimalMin(value = "0.0", message = "Diện tích phải >= 0")
    @Decimal20_4(message = "Diện tích không quá 20 chữ số (tối đa 4 số lẻ)")
    private BigDecimal area;

    @DecimalMin(value = "0.0", message = "Năng lực thông qua phải >= 0")
    @Decimal20_4(message = "Năng lực thông qua không quá 20 chữ số (tối đa 4 số lẻ)")
    private BigDecimal teuCapacity;

    @DecimalMin(value = "0.0", message = "Diện tích kho phải >= 0")
    @Decimal20_4(message = "Diện tích kho không quá 20 chữ số (tối đa 4 số lẻ)")
    private BigDecimal warehouseArea;

    @DecimalMin(value = "0.0", message = "Diện tích bãi phải >= 0")
    @Decimal20_4(message = "Diện tích bãi không quá 20 chữ số (tối đa 4 số lẻ)")
    private BigDecimal yardArea;

    @Size(max = 255, message = "Phương thức kết nối tối đa 255 ký tự")
    private String connectionMode;

    private Integer portStatus;
    private OperationalStatus operationalStatus;

    @Size(max = 1000, message = "Ghi chú tối đa 1000 ký tự")
    private String remarks;

    private UUID mapSymbolId;
    private GisGeometryType geometryType;
    private String coordinates;
    private BigDecimal latitude;
    private BigDecimal longitude;

    private String saveAction;

    private LocalDateTime announcementTime;
    private String announcementDecisionNumber;
    private LocalDate announcementDecisionDate;
    private String announcementOrg;

    private LocalDate openingAnnouncementDate;
    private String openingDecision;
    private String investmentAgreementDoc;
    private Integer coordinateSystem;
    private Integer displayRule;

    private static String normalize(String s) {
        if (s == null) return null;
        String trimmed = s.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public void setId(UUID id) {
        markFieldPresent("id");
        this.id = id;
    }

    public void setDryPortCode(String dryPortCode) {
        markFieldPresent("dryPortCode");
        this.dryPortCode = normalize(dryPortCode);
    }

    public void setDryPortName(String dryPortName) {
        markFieldPresent("dryPortName");
        this.dryPortName = normalize(dryPortName);
    }

    public void setOrgUnitId(UUID orgUnitId) {
        markFieldPresent("orgUnitId");
        this.orgUnitId = orgUnitId;
    }

    public void setOperatingOrgId(UUID operatingOrgId) {
        markFieldPresent("operatingOrgId");
        this.operatingOrgId = operatingOrgId;
    }

    public void setOperatingUnit(String operatingUnit) {
        markFieldPresent("operatingUnit");
        this.operatingUnit = normalize(operatingUnit);
    }

    public void setRegion(String region) {
        markFieldPresent("region");
        this.region = normalize(region);
    }

    public void setProvinceId(Integer provinceId) {
        markFieldPresent("provinceId");
        this.provinceId = provinceId;
    }

    public void setDetailedLocation(String detailedLocation) {
        markFieldPresent("detailedLocation");
        this.detailedLocation = normalize(detailedLocation);
    }

    public void setTransportCorridor(String transportCorridor) {
        markFieldPresent("transportCorridor");
        this.transportCorridor = normalize(transportCorridor);
    }

    public void setArea(BigDecimal area) {
        markFieldPresent("area");
        this.area = area;
    }

    public void setTeuCapacity(BigDecimal teuCapacity) {
        markFieldPresent("teuCapacity");
        this.teuCapacity = teuCapacity;
    }

    public void setWarehouseArea(BigDecimal warehouseArea) {
        markFieldPresent("warehouseArea");
        this.warehouseArea = warehouseArea;
    }

    public void setYardArea(BigDecimal yardArea) {
        markFieldPresent("yardArea");
        this.yardArea = yardArea;
    }

    public void setConnectionMode(String connectionMode) {
        markFieldPresent("connectionMode");
        this.connectionMode = normalize(connectionMode);
    }

    public void setPortStatus(Integer portStatus) {
        markFieldPresent("portStatus");
        this.portStatus = portStatus;
    }

    public void setOperationalStatus(OperationalStatus operationalStatus) {
        markFieldPresent("operationalStatus");
        this.operationalStatus = operationalStatus;
    }

    public void setRemarks(String remarks) {
        markFieldPresent("remarks");
        this.remarks = normalize(remarks);
    }

    public void setMapSymbolId(UUID mapSymbolId) {
        markFieldPresent("mapSymbolId");
        this.mapSymbolId = mapSymbolId;
    }

    public void setGeometryType(GisGeometryType geometryType) {
        markFieldPresent("geometryType");
        this.geometryType = geometryType;
    }

    public void setCoordinates(String coordinates) {
        markFieldPresent("coordinates");
        this.coordinates = normalize(coordinates);
    }

    public void setLatitude(BigDecimal latitude) {
        markFieldPresent("latitude");
        this.latitude = latitude;
    }

    public void setLongitude(BigDecimal longitude) {
        markFieldPresent("longitude");
        this.longitude = longitude;
    }

    public void setSaveAction(String saveAction) {
        markFieldPresent("saveAction");
        this.saveAction = normalize(saveAction);
    }

    public void setAnnouncementTime(LocalDateTime announcementTime) {
        markFieldPresent("announcementTime");
        this.announcementTime = announcementTime;
    }

    public void setAnnouncementDecisionNumber(String announcementDecisionNumber) {
        markFieldPresent("announcementDecisionNumber");
        this.announcementDecisionNumber = normalize(announcementDecisionNumber);
    }

    public void setAnnouncementDecisionDate(LocalDate announcementDecisionDate) {
        markFieldPresent("announcementDecisionDate");
        this.announcementDecisionDate = announcementDecisionDate;
    }

    public void setAnnouncementOrg(String announcementOrg) {
        markFieldPresent("announcementOrg");
        this.announcementOrg = normalize(announcementOrg);
    }

    public void setOpeningAnnouncementDate(LocalDate openingAnnouncementDate) {
        markFieldPresent("openingAnnouncementDate");
        this.openingAnnouncementDate = openingAnnouncementDate;
    }

    public void setOpeningDecision(String openingDecision) {
        markFieldPresent("openingDecision");
        this.openingDecision = normalize(openingDecision);
    }

    public void setInvestmentAgreementDoc(String investmentAgreementDoc) {
        markFieldPresent("investmentAgreementDoc");
        this.investmentAgreementDoc = normalize(investmentAgreementDoc);
    }

    public void setCoordinateSystem(Integer coordinateSystem) {
        markFieldPresent("coordinateSystem");
        this.coordinateSystem = coordinateSystem;
    }

    public void setDisplayRule(Integer displayRule) {
        markFieldPresent("displayRule");
        this.displayRule = displayRule;
    }

    public static UpdateDryPortRequestBuilder builder() {
        return new UpdateDryPortRequestBuilder();
    }

    public static class UpdateDryPortRequestBuilder {
        private UUID id;
        private String dryPortCode;
        private String dryPortName;
        private UUID orgUnitId;
        private UUID operatingOrgId;
        private String operatingUnit;
        private String region;
        private Integer provinceId;
        private String detailedLocation;
        private String transportCorridor;
        private BigDecimal area;
        private BigDecimal teuCapacity;
        private BigDecimal warehouseArea;
        private BigDecimal yardArea;
        private String connectionMode;
        private Integer portStatus;
        private OperationalStatus operationalStatus;
        private String remarks;
        private UUID mapSymbolId;
        private GisGeometryType geometryType;
        private String coordinates;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private String saveAction;
        private LocalDateTime announcementTime;
        private String announcementDecisionNumber;
        private LocalDate announcementDecisionDate;
        private String announcementOrg;
        private LocalDate openingAnnouncementDate;
        private String openingDecision;
        private String investmentAgreementDoc;
        private Integer coordinateSystem;
        private Integer displayRule;
        private final Set<String> presentFields = new HashSet<>();

        public UpdateDryPortRequestBuilder id(UUID id) {
            this.id = id;
            this.presentFields.add("id");
            return this;
        }

        public UpdateDryPortRequestBuilder dryPortCode(String dryPortCode) {
            this.dryPortCode = dryPortCode;
            this.presentFields.add("dryPortCode");
            return this;
        }

        public UpdateDryPortRequestBuilder dryPortName(String dryPortName) {
            this.dryPortName = dryPortName;
            this.presentFields.add("dryPortName");
            return this;
        }

        public UpdateDryPortRequestBuilder orgUnitId(UUID orgUnitId) {
            this.orgUnitId = orgUnitId;
            this.presentFields.add("orgUnitId");
            return this;
        }

        public UpdateDryPortRequestBuilder operatingOrgId(UUID operatingOrgId) {
            this.operatingOrgId = operatingOrgId;
            this.presentFields.add("operatingOrgId");
            return this;
        }

        public UpdateDryPortRequestBuilder operatingUnit(String operatingUnit) {
            this.operatingUnit = operatingUnit;
            this.presentFields.add("operatingUnit");
            return this;
        }

        public UpdateDryPortRequestBuilder region(String region) {
            this.region = region;
            this.presentFields.add("region");
            return this;
        }

        public UpdateDryPortRequestBuilder provinceId(Integer provinceId) {
            this.provinceId = provinceId;
            this.presentFields.add("provinceId");
            return this;
        }

        public UpdateDryPortRequestBuilder detailedLocation(String detailedLocation) {
            this.detailedLocation = detailedLocation;
            this.presentFields.add("detailedLocation");
            return this;
        }

        public UpdateDryPortRequestBuilder transportCorridor(String transportCorridor) {
            this.transportCorridor = transportCorridor;
            this.presentFields.add("transportCorridor");
            return this;
        }

        public UpdateDryPortRequestBuilder area(BigDecimal area) {
            this.area = area;
            this.presentFields.add("area");
            return this;
        }

        public UpdateDryPortRequestBuilder teuCapacity(BigDecimal teuCapacity) {
            this.teuCapacity = teuCapacity;
            this.presentFields.add("teuCapacity");
            return this;
        }

        public UpdateDryPortRequestBuilder warehouseArea(BigDecimal warehouseArea) {
            this.warehouseArea = warehouseArea;
            this.presentFields.add("warehouseArea");
            return this;
        }

        public UpdateDryPortRequestBuilder yardArea(BigDecimal yardArea) {
            this.yardArea = yardArea;
            this.presentFields.add("yardArea");
            return this;
        }

        public UpdateDryPortRequestBuilder connectionMode(String connectionMode) {
            this.connectionMode = connectionMode;
            this.presentFields.add("connectionMode");
            return this;
        }

        public UpdateDryPortRequestBuilder portStatus(Integer portStatus) {
            this.portStatus = portStatus;
            this.presentFields.add("portStatus");
            return this;
        }

        public UpdateDryPortRequestBuilder operationalStatus(OperationalStatus operationalStatus) {
            this.operationalStatus = operationalStatus;
            this.presentFields.add("operationalStatus");
            return this;
        }

        public UpdateDryPortRequestBuilder remarks(String remarks) {
            this.remarks = remarks;
            this.presentFields.add("remarks");
            return this;
        }

        public UpdateDryPortRequestBuilder mapSymbolId(UUID mapSymbolId) {
            this.mapSymbolId = mapSymbolId;
            this.presentFields.add("mapSymbolId");
            return this;
        }

        public UpdateDryPortRequestBuilder geometryType(GisGeometryType geometryType) {
            this.geometryType = geometryType;
            this.presentFields.add("geometryType");
            return this;
        }

        public UpdateDryPortRequestBuilder coordinates(String coordinates) {
            this.coordinates = coordinates;
            this.presentFields.add("coordinates");
            return this;
        }

        public UpdateDryPortRequestBuilder latitude(BigDecimal latitude) {
            this.latitude = latitude;
            this.presentFields.add("latitude");
            return this;
        }

        public UpdateDryPortRequestBuilder longitude(BigDecimal longitude) {
            this.longitude = longitude;
            this.presentFields.add("longitude");
            return this;
        }

        public UpdateDryPortRequestBuilder saveAction(String saveAction) {
            this.saveAction = saveAction;
            this.presentFields.add("saveAction");
            return this;
        }

        public UpdateDryPortRequestBuilder announcementTime(LocalDateTime announcementTime) {
            this.announcementTime = announcementTime;
            this.presentFields.add("announcementTime");
            return this;
        }

        public UpdateDryPortRequestBuilder announcementDecisionNumber(String announcementDecisionNumber) {
            this.announcementDecisionNumber = announcementDecisionNumber;
            this.presentFields.add("announcementDecisionNumber");
            return this;
        }

        public UpdateDryPortRequestBuilder announcementDecisionDate(LocalDate announcementDecisionDate) {
            this.announcementDecisionDate = announcementDecisionDate;
            this.presentFields.add("announcementDecisionDate");
            return this;
        }

        public UpdateDryPortRequestBuilder announcementOrg(String announcementOrg) {
            this.announcementOrg = announcementOrg;
            this.presentFields.add("announcementOrg");
            return this;
        }

        public UpdateDryPortRequestBuilder openingAnnouncementDate(LocalDate openingAnnouncementDate) {
            this.openingAnnouncementDate = openingAnnouncementDate;
            this.presentFields.add("openingAnnouncementDate");
            return this;
        }

        public UpdateDryPortRequestBuilder openingDecision(String openingDecision) {
            this.openingDecision = openingDecision;
            this.presentFields.add("openingDecision");
            return this;
        }

        public UpdateDryPortRequestBuilder investmentAgreementDoc(String investmentAgreementDoc) {
            this.investmentAgreementDoc = investmentAgreementDoc;
            this.presentFields.add("investmentAgreementDoc");
            return this;
        }

        public UpdateDryPortRequestBuilder coordinateSystem(Integer coordinateSystem) {
            this.coordinateSystem = coordinateSystem;
            this.presentFields.add("coordinateSystem");
            return this;
        }

        public UpdateDryPortRequestBuilder displayRule(Integer displayRule) {
            this.displayRule = displayRule;
            this.presentFields.add("displayRule");
            return this;
        }

        public UpdateDryPortRequest build() {
            UpdateDryPortRequest req = new UpdateDryPortRequest();
            if (presentFields.contains("id")) req.setId(this.id);
            if (presentFields.contains("dryPortCode")) req.setDryPortCode(this.dryPortCode);
            if (presentFields.contains("dryPortName")) req.setDryPortName(this.dryPortName);
            if (presentFields.contains("orgUnitId")) req.setOrgUnitId(this.orgUnitId);
            if (presentFields.contains("operatingOrgId")) req.setOperatingOrgId(this.operatingOrgId);
            if (presentFields.contains("operatingUnit")) req.setOperatingUnit(this.operatingUnit);
            if (presentFields.contains("region")) req.setRegion(this.region);
            if (presentFields.contains("provinceId")) req.setProvinceId(this.provinceId);
            if (presentFields.contains("detailedLocation")) req.setDetailedLocation(this.detailedLocation);
            if (presentFields.contains("transportCorridor")) req.setTransportCorridor(this.transportCorridor);
            if (presentFields.contains("area")) req.setArea(this.area);
            if (presentFields.contains("teuCapacity")) req.setTeuCapacity(this.teuCapacity);
            if (presentFields.contains("warehouseArea")) req.setWarehouseArea(this.warehouseArea);
            if (presentFields.contains("yardArea")) req.setYardArea(this.yardArea);
            if (presentFields.contains("connectionMode")) req.setConnectionMode(this.connectionMode);
            if (presentFields.contains("portStatus")) req.setPortStatus(this.portStatus);
            if (presentFields.contains("operationalStatus")) req.setOperationalStatus(this.operationalStatus);
            if (presentFields.contains("remarks")) req.setRemarks(this.remarks);
            if (presentFields.contains("mapSymbolId")) req.setMapSymbolId(this.mapSymbolId);
            if (presentFields.contains("geometryType")) req.setGeometryType(this.geometryType);
            if (presentFields.contains("coordinates")) req.setCoordinates(this.coordinates);
            if (presentFields.contains("latitude")) req.setLatitude(this.latitude);
            if (presentFields.contains("longitude")) req.setLongitude(this.longitude);
            if (presentFields.contains("saveAction")) req.setSaveAction(this.saveAction);
            if (presentFields.contains("announcementTime")) req.setAnnouncementTime(this.announcementTime);
            if (presentFields.contains("announcementDecisionNumber")) req.setAnnouncementDecisionNumber(this.announcementDecisionNumber);
            if (presentFields.contains("announcementDecisionDate")) req.setAnnouncementDecisionDate(this.announcementDecisionDate);
            if (presentFields.contains("announcementOrg")) req.setAnnouncementOrg(this.announcementOrg);
            if (presentFields.contains("openingAnnouncementDate")) req.setOpeningAnnouncementDate(this.openingAnnouncementDate);
            if (presentFields.contains("openingDecision")) req.setOpeningDecision(this.openingDecision);
            if (presentFields.contains("investmentAgreementDoc")) req.setInvestmentAgreementDoc(this.investmentAgreementDoc);
            if (presentFields.contains("coordinateSystem")) req.setCoordinateSystem(this.coordinateSystem);
            if (presentFields.contains("displayRule")) req.setDisplayRule(this.displayRule);
            return req;
        }
    }
}
