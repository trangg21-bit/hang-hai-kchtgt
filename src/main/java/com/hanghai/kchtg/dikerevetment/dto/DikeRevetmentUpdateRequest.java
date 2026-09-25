package com.hanghai.kchtg.dikerevetment.dto;

import com.hanghai.kchtg.common.dto.FieldPresenceTrackedRequest;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.validator.Decimal20_4;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Update request for DikeRevetment (F-044).
 */
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DikeRevetmentUpdateRequest extends FieldPresenceTrackedRequest {

    private DikeRevetmentType dikeRevetmentType;
    private String location;
    private String locationDetail;
    private String dikeRevetmentName;
    @Decimal20_4(message = "Chiều dài không quá 20 chữ số (tối đa 4 số lẻ)")
    private BigDecimal length;
    @Decimal20_4(message = "Cao trình đỉnh không quá 20 chữ số (tối đa 4 số lẻ)")
    private BigDecimal crestElevation;
    private LocalDate commissioningDate;
    private LocalDate constructionDate;
    private Integer lastMaintenanceYear;
    @Decimal20_4(message = "Chiều cao không quá 20 chữ số (tối đa 4 số lẻ)")
    private BigDecimal height;
    private String surfaceMaterial;
    private String status;
    private String note;
    private UUID orgUnitId;
    private UUID seaportId;
    private UUID operatingUnitId;
    private GisGeometryType geometryType;
    private String coordinates;
    private UUID symbolId;
    private ApprovalStatus approvalStatus;

    public void setApprovalStatus(ApprovalStatus approvalStatus) {
        markFieldPresent("approvalStatus");
        this.approvalStatus = approvalStatus;
    }

    public void setDikeRevetmentType(DikeRevetmentType dikeRevetmentType) {
        markFieldPresent("dikeRevetmentType");
        this.dikeRevetmentType = dikeRevetmentType;
    }

    public void setLocation(String location) {
        markFieldPresent("location");
        this.location = location != null && !location.trim().isEmpty() ? location.trim() : null;
    }

    public void setLocationDetail(String locationDetail) {
        markFieldPresent("locationDetail");
        this.locationDetail = locationDetail != null && !locationDetail.trim().isEmpty() ? locationDetail.trim() : null;
    }

    public void setDikeRevetmentName(String dikeRevetmentName) {
        markFieldPresent("dikeRevetmentName");
        this.dikeRevetmentName = dikeRevetmentName != null && !dikeRevetmentName.trim().isEmpty() ? dikeRevetmentName.trim() : null;
    }

    public void setLength(BigDecimal length) {
        markFieldPresent("length");
        this.length = length;
    }

    public void setCrestElevation(BigDecimal crestElevation) {
        markFieldPresent("crestElevation");
        this.crestElevation = crestElevation;
    }

    public void setCommissioningDate(LocalDate commissioningDate) {
        markFieldPresent("commissioningDate");
        this.commissioningDate = commissioningDate;
    }

    public void setConstructionDate(LocalDate constructionDate) {
        markFieldPresent("constructionDate");
        this.constructionDate = constructionDate;
    }

    public void setLastMaintenanceYear(Integer lastMaintenanceYear) {
        markFieldPresent("lastMaintenanceYear");
        this.lastMaintenanceYear = lastMaintenanceYear;
    }

    public void setHeight(BigDecimal height) {
        markFieldPresent("height");
        this.height = height;
    }

    public void setSurfaceMaterial(String surfaceMaterial) {
        markFieldPresent("surfaceMaterial");
        this.surfaceMaterial = surfaceMaterial != null && !surfaceMaterial.trim().isEmpty() ? surfaceMaterial.trim() : null;
    }

    public void setStatus(String status) {
        markFieldPresent("status");
        this.status = status != null && !status.trim().isEmpty() ? status.trim() : null;
    }

    public void setNote(String note) {
        markFieldPresent("note");
        this.note = note != null && !note.trim().isEmpty() ? note.trim() : null;
    }

    public void setOrgUnitId(UUID orgUnitId) {
        markFieldPresent("orgUnitId");
        this.orgUnitId = orgUnitId;
    }

    public void setSeaportId(UUID seaportId) {
        markFieldPresent("seaportId");
        this.seaportId = seaportId;
    }

    public void setOperatingUnitId(UUID operatingUnitId) {
        markFieldPresent("operatingUnitId");
        this.operatingUnitId = operatingUnitId;
    }

    public void setGeometryType(GisGeometryType geometryType) {
        markFieldPresent("geometryType");
        this.geometryType = geometryType;
    }

    public void setCoordinates(String coordinates) {
        markFieldPresent("coordinates");
        this.coordinates = coordinates != null && !coordinates.trim().isEmpty() ? coordinates.trim() : null;
    }

    public void setSymbolId(UUID symbolId) {
        markFieldPresent("symbolId");
        this.symbolId = symbolId;
    }

    public static class DikeRevetmentUpdateRequestBuilder {
        private final Set<String> presentFields = new HashSet<>();

        public DikeRevetmentUpdateRequestBuilder dikeRevetmentType(DikeRevetmentType dikeRevetmentType) {
            this.dikeRevetmentType = dikeRevetmentType;
            this.presentFields.add("dikeRevetmentType");
            return this;
        }

        public DikeRevetmentUpdateRequestBuilder location(String location) {
            this.location = location;
            this.presentFields.add("location");
            return this;
        }

        public DikeRevetmentUpdateRequestBuilder locationDetail(String locationDetail) {
            this.locationDetail = locationDetail;
            this.presentFields.add("locationDetail");
            return this;
        }

        public DikeRevetmentUpdateRequestBuilder dikeRevetmentName(String dikeRevetmentName) {
            this.dikeRevetmentName = dikeRevetmentName;
            this.presentFields.add("dikeRevetmentName");
            return this;
        }

        public DikeRevetmentUpdateRequestBuilder length(BigDecimal length) {
            this.length = length;
            this.presentFields.add("length");
            return this;
        }

        public DikeRevetmentUpdateRequestBuilder crestElevation(BigDecimal crestElevation) {
            this.crestElevation = crestElevation;
            this.presentFields.add("crestElevation");
            return this;
        }

        public DikeRevetmentUpdateRequestBuilder commissioningDate(LocalDate commissioningDate) {
            this.commissioningDate = commissioningDate;
            this.presentFields.add("commissioningDate");
            return this;
        }

        public DikeRevetmentUpdateRequestBuilder constructionDate(LocalDate constructionDate) {
            this.constructionDate = constructionDate;
            this.presentFields.add("constructionDate");
            return this;
        }

        public DikeRevetmentUpdateRequestBuilder lastMaintenanceYear(Integer lastMaintenanceYear) {
            this.lastMaintenanceYear = lastMaintenanceYear;
            this.presentFields.add("lastMaintenanceYear");
            return this;
        }

        public DikeRevetmentUpdateRequestBuilder height(BigDecimal height) {
            this.height = height;
            this.presentFields.add("height");
            return this;
        }

        public DikeRevetmentUpdateRequestBuilder surfaceMaterial(String surfaceMaterial) {
            this.surfaceMaterial = surfaceMaterial;
            this.presentFields.add("surfaceMaterial");
            return this;
        }

        public DikeRevetmentUpdateRequestBuilder status(String status) {
            this.status = status;
            this.presentFields.add("status");
            return this;
        }

        public DikeRevetmentUpdateRequestBuilder note(String note) {
            this.note = note;
            this.presentFields.add("note");
            return this;
        }

        public DikeRevetmentUpdateRequestBuilder orgUnitId(UUID orgUnitId) {
            this.orgUnitId = orgUnitId;
            this.presentFields.add("orgUnitId");
            return this;
        }

        public DikeRevetmentUpdateRequestBuilder seaportId(UUID seaportId) {
            this.seaportId = seaportId;
            this.presentFields.add("seaportId");
            return this;
        }

        public DikeRevetmentUpdateRequestBuilder operatingUnitId(UUID operatingUnitId) {
            this.operatingUnitId = operatingUnitId;
            this.presentFields.add("operatingUnitId");
            return this;
        }

        public DikeRevetmentUpdateRequestBuilder geometryType(GisGeometryType geometryType) {
            this.geometryType = geometryType;
            this.presentFields.add("geometryType");
            return this;
        }

        public DikeRevetmentUpdateRequestBuilder coordinates(String coordinates) {
            this.coordinates = coordinates;
            this.presentFields.add("coordinates");
            return this;
        }

        public DikeRevetmentUpdateRequestBuilder symbolId(UUID symbolId) {
            this.symbolId = symbolId;
            this.presentFields.add("symbolId");
            return this;
        }

        public DikeRevetmentUpdateRequest build() {
            DikeRevetmentUpdateRequest req = new DikeRevetmentUpdateRequest();
            if (presentFields.contains("dikeRevetmentType")) req.setDikeRevetmentType(this.dikeRevetmentType);
            if (presentFields.contains("location")) req.setLocation(this.location);
            if (presentFields.contains("locationDetail")) req.setLocationDetail(this.locationDetail);
            if (presentFields.contains("dikeRevetmentName")) req.setDikeRevetmentName(this.dikeRevetmentName);
            if (presentFields.contains("length")) req.setLength(this.length);
            if (presentFields.contains("crestElevation")) req.setCrestElevation(this.crestElevation);
            if (presentFields.contains("commissioningDate")) req.setCommissioningDate(this.commissioningDate);
            if (presentFields.contains("constructionDate")) req.setConstructionDate(this.constructionDate);
            if (presentFields.contains("lastMaintenanceYear")) req.setLastMaintenanceYear(this.lastMaintenanceYear);
            if (presentFields.contains("height")) req.setHeight(this.height);
            if (presentFields.contains("surfaceMaterial")) req.setSurfaceMaterial(this.surfaceMaterial);
            if (presentFields.contains("status")) req.setStatus(this.status);
            if (presentFields.contains("note")) req.setNote(this.note);
            if (presentFields.contains("orgUnitId")) req.setOrgUnitId(this.orgUnitId);
            if (presentFields.contains("seaportId")) req.setSeaportId(this.seaportId);
            if (presentFields.contains("operatingUnitId")) req.setOperatingUnitId(this.operatingUnitId);
            if (presentFields.contains("geometryType")) req.setGeometryType(this.geometryType);
            if (presentFields.contains("coordinates")) req.setCoordinates(this.coordinates);
            if (presentFields.contains("symbolId")) req.setSymbolId(this.symbolId);
            return req;
        }
    }
}
