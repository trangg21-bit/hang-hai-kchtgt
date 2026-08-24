package com.hanghai.kchtg.fieldvisibility;

import com.hanghai.kchtg.beacon.dto.beacon_station.CreateBeaconStationRequest;
import com.hanghai.kchtg.beacon.dto.buoy.CreateBuoyRequest;
import com.hanghai.kchtg.dikerevetment.dto.DikeRevetmentCreateRequest;
import com.hanghai.kchtg.document.dto.LegalDocumentCreateRequest;
import com.hanghai.kchtg.fieldvisibility.entity.FieldEffect;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.navigationchannel.dto.NavigationChannelCreateRequest;
import com.hanghai.kchtg.port.dto.berth.CreateBerthRequest;
import com.hanghai.kchtg.port.dto.dryport.CreateDryPortRequest;
import com.hanghai.kchtg.port.dto.pier.CreatePierRequest;
import com.hanghai.kchtg.port.dto.port.CreatePortRequest;
import com.hanghai.kchtg.port.dto.waterzone.CreateWaterZoneRequest;
import com.hanghai.kchtg.radarstation.dto.RadarStationCreateRequest;
import com.hanghai.kchtg.shiprepairfacility.dto.ShipRepairFacilityCreateRequest;
import com.hanghai.kchtg.station.dto.buoy.CreateBuoyStationRequest;
import com.hanghai.kchtg.vtssystem.dto.VtsSystemCreateRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FieldWriteGuardAllServicesTest {

    @AfterEach
    void tearDown() {
        FieldVisibilityContext.clear();
    }

    @Test
    @DisplayName("Write guard allows DTO when no fields are restricted")
    void allowedDto_passes() {
        FieldVisibilityContext.set(Map.of());

        CreatePortRequest req = new CreatePortRequest();
        req.setPortName("Hai Phong Port");
        req.setPortCode("HP01");

        assertThatCode(() -> FieldWriteGuard.validateObject(req)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Write guard rejects CreatePortRequest when a READONLY field has a value")
    void createPortRequest_withReadOnlyField_throwsAccessDenied() {
        FieldVisibilityContext.set(Map.of("portName", FieldEffect.READONLY));

        CreatePortRequest req = new CreatePortRequest();
        req.setPortName("Hai Phong Port");

        assertThatThrownBy(() -> FieldWriteGuard.validateObject(req))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("portName");
    }

    @Test
    @DisplayName("Write guard rejects CreateBerthRequest when a HIDE field has a value")
    void createBerthRequest_withHiddenField_throwsAccessDenied() {
        FieldVisibilityContext.set(Map.of("berthName", FieldEffect.HIDE));

        CreateBerthRequest req = new CreateBerthRequest();
        req.setBerthName("Berth 01");

        assertThatThrownBy(() -> FieldWriteGuard.validateObject(req))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("berthName");
    }

    @Test
    @DisplayName("Write guard rejects NavigationChannelCreateRequest when restricted")
    void navigationChannelCreateRequest_restrictedField_throwsAccessDenied() {
        FieldVisibilityContext.set(Map.of("channelName", FieldEffect.READONLY));

        NavigationChannelCreateRequest req = new NavigationChannelCreateRequest();
        req.setChannelName("Luồng Hải Phòng");

        assertThatThrownBy(() -> FieldWriteGuard.validateObject(req))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("channelName");
    }

    @Test
    @DisplayName("Write guard rejects DikeRevetmentCreateRequest when restricted")
    void dikeRevetmentCreateRequest_restrictedField_throwsAccessDenied() {
        FieldVisibilityContext.set(Map.of("dikeRevetmentName", FieldEffect.READONLY));

        DikeRevetmentCreateRequest req = new DikeRevetmentCreateRequest();
        req.setDikeRevetmentName("Đê chắn sóng 1");

        assertThatThrownBy(() -> FieldWriteGuard.validateObject(req))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("dikeRevetmentName");
    }

    @Test
    @DisplayName("Write guard rejects RadarStationCreateRequest when restricted")
    void radarStationCreateRequest_restrictedField_throwsAccessDenied() {
        FieldVisibilityContext.set(Map.of("stationName", FieldEffect.READONLY));

        RadarStationCreateRequest req = new RadarStationCreateRequest();
        req.setStationName("Trạm Radar Hòn Dáu");

        assertThatThrownBy(() -> FieldWriteGuard.validateObject(req))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("stationName");
    }

    @Test
    @DisplayName("Write guard rejects ShipRepairFacilityCreateRequest when restricted")
    void shipRepairCreateRequest_restrictedField_throwsAccessDenied() {
        FieldVisibilityContext.set(Map.of("facilityName", FieldEffect.READONLY));

        ShipRepairFacilityCreateRequest req = new ShipRepairFacilityCreateRequest();
        req.setFacilityName("Nhà máy đóng tàu Bạch Đằng");

        assertThatThrownBy(() -> FieldWriteGuard.validateObject(req))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("facilityName");
    }

    @Test
    @DisplayName("Write guard rejects LegalDocumentCreateRequest when restricted")
    void legalDocumentCreateRequest_restrictedField_throwsAccessDenied() {
        FieldVisibilityContext.set(Map.of("documentName", FieldEffect.READONLY));

        LegalDocumentCreateRequest req = new LegalDocumentCreateRequest();
        req.setDocumentName("Quyết định 123");

        assertThatThrownBy(() -> FieldWriteGuard.validateObject(req))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("documentName");
    }

    @Test
    @DisplayName("Write guard rejects CreateUserRequest when email is restricted")
    void createUserRequest_restrictedEmail_throwsAccessDenied() {
        FieldVisibilityContext.set(Map.of("email", FieldEffect.READONLY));

        com.hanghai.kchtg.user.dto.CreateUserRequest req = new com.hanghai.kchtg.user.dto.CreateUserRequest();
        req.setEmail("user@example.com");

        assertThatThrownBy(() -> FieldWriteGuard.validateObject(req))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("email");
    }

    @Test
    @DisplayName("Write guard rejects CreateGroupRequest when description is restricted")
    void createGroupRequest_restrictedDescription_throwsAccessDenied() {
        FieldVisibilityContext.set(Map.of("description", FieldEffect.READONLY));

        com.hanghai.kchtg.group.dto.CreateGroupRequest req = new com.hanghai.kchtg.group.dto.CreateGroupRequest();
        req.setName("Admin Group");
        req.setDescription("Sensitive Description");

        assertThatThrownBy(() -> FieldWriteGuard.validateObject(req))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("description");
    }

    @Test
    @DisplayName("Write guard rejects CreateOrgUnitRequest when detailAddress is restricted")
    void createOrgUnitRequest_restrictedAddress_throwsAccessDenied() {
        FieldVisibilityContext.set(Map.of("detailAddress", FieldEffect.HIDE));

        com.hanghai.kchtg.orgunit.dto.CreateOrgUnitRequest req = new com.hanghai.kchtg.orgunit.dto.CreateOrgUnitRequest();
        req.setName("Cảng vụ Hàng hải");
        req.setDetailAddress("123 Lê Thánh Tông");

        assertThatThrownBy(() -> FieldWriteGuard.validateObject(req))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("detailAddress");
    }

    @Test
    @DisplayName("Write guard rejects Bcc157CreateRequest when financial fields are restricted")
    void bcc157CreateRequest_restrictedFinancialField_throwsAccessDenied() {
        FieldVisibilityContext.set(Map.of("assetOpeningOriginalCost", FieldEffect.READONLY));

        com.hanghai.kchtg.report.dto.Bcc157CreateRequest req = new com.hanghai.kchtg.report.dto.Bcc157CreateRequest();
        req.setReportYear(2026);
        req.setAssetOpeningOriginalCost(new java.math.BigDecimal("1000000000"));

        assertThatThrownBy(() -> FieldWriteGuard.validateObject(req))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("assetOpeningOriginalCost");
    }
}
