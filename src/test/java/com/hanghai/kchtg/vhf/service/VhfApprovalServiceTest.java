package com.hanghai.kchtg.vhf.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.radarstation.entity.RadarStation;
import com.hanghai.kchtg.radarstation.repository.RadarStationRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.vhf.dto.ApprovalRequest;
import com.hanghai.kchtg.vhf.dto.VhfResponse;
import com.hanghai.kchtg.vhf.entity.Vhf;
import com.hanghai.kchtg.vhf.repository.VhfRepository;
import com.hanghai.kchtg.vtsoperationcenter.entity.VtsOperationCenter;
import com.hanghai.kchtg.vtsoperationcenter.repository.VtsOperationCenterRepository;
import com.hanghai.kchtg.vtssystem.dto.HistoryEntry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests the 2-level approval flow and 6 criteria of Audit Trail on VHF.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class VhfApprovalServiceTest {

    private static final UUID ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID CREATOR = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID APPROVER_A = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private static final UUID APPROVER_B = UUID.fromString("44444444-4444-4444-4444-444444444444");
    private static final UUID ORG_UNIT_ID = UUID.fromString("55555555-5555-5555-5555-555555555555");

    @Mock
    private VhfRepository vhfRepository;
    @Mock
    private VhfService vhfService;
    @Mock
    private InfrastructureHistoryRepository historyRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private OrgUnitCacheService orgUnitCacheService;
    @Mock
    private OrgUnitScopeService orgUnitScopeService;
    @Mock
    private JdbcTemplate jdbcTemplate;
    @Mock
    private VtsOperationCenterRepository vtsOperationCenterRepository;
    @Mock
    private RadarStationRepository radarStationRepository;
    @Mock
    private PortRepository portRepository;

    private VhfApprovalService service;

    private Vhf entity;

    @BeforeEach
    void setUp() {
        InfrastructureApprovalService approvalService =
                new InfrastructureApprovalService(historyRepository, userRepository);
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.all());
        service = new VhfApprovalService(vhfRepository, vhfService, approvalService,
                historyRepository, userRepository,
                orgUnitCacheService, orgUnitScopeService, jdbcTemplate,
                vtsOperationCenterRepository, radarStationRepository, portRepository);

        when(userRepository.findById(any())).thenReturn(Optional.empty());
        when(vhfRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(vhfService.mapToResponse(any())).thenAnswer(inv -> VhfResponse.builder()
                .id(ID)
                .approvalStatus(((Vhf) inv.getArgument(0)).getApprovalStatus())
                .build());
        when(vhfService.toResponse(any())).thenAnswer(inv -> VhfResponse.builder()
                .id(ID)
                .approvalStatus(((Vhf) inv.getArgument(0)).getApprovalStatus())
                .build());

        entity = Vhf.builder()
                .id(ID)
                .deviceCode("VHF-000001")
                .deviceName("Hệ thống VHF Hòn Dấu")
                .quantity(1)
                .orgUnitId(ORG_UNIT_ID)
                .approvalStatus(ApprovalStatus.DRAFT)
                .createdBy(CREATOR)
                .build();
    }

    private void givenStatus(ApprovalStatus status) {
        entity.setApprovalStatus(status);
        when(vhfRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(vhfRepository.findByIdAndDeletedAtIsNull(ID)).thenReturn(Optional.of(entity));
        when(vhfRepository.existsById(ID)).thenReturn(true);
    }

    private ApprovalRequest request(String decision, String reason) {
        return ApprovalRequest.builder().decision(decision).reason(reason).build();
    }

    @Test
    void submitFromDraftGoesToPendingApproval() {
        givenStatus(ApprovalStatus.DRAFT);

        VhfResponse result = service.submit(ID, APPROVER_A);

        assertEquals(ApprovalStatus.PENDING_APPROVAL, result.getApprovalStatus());
        assertEquals(ApprovalStatus.PENDING_APPROVAL, entity.getApprovalStatus());
        assertEquals(APPROVER_A, entity.getSubmittedBy());
        assertNotNull(entity.getSubmittedDate());
    }

    @Test
    void submitFromApprovedIsRejected() {
        givenStatus(ApprovalStatus.APPROVED);

        assertThrows(IllegalStateException.class, () -> service.submit(ID, APPROVER_A));
    }

    @Test
    void approveC1MovesToApprovedLevel1() {
        givenStatus(ApprovalStatus.PENDING_APPROVAL);

        VhfResponse result = service.approveC1(ID, request("APPROVED", "Đồng ý"), APPROVER_A);

        assertEquals(ApprovalStatus.APPROVED_LEVEL1, result.getApprovalStatus());
        assertEquals(APPROVER_A, entity.getApproverLevel1());
        assertNotNull(entity.getApprovedDateLevel1());
        assertEquals("Đồng ý", entity.getApprovalContentLevel1());
    }

    @Test
    void approveC1ByCreatorIsBlocked() {
        givenStatus(ApprovalStatus.PENDING_APPROVAL);

        assertThrows(IllegalStateException.class,
                () -> service.approveC1(ID, request("APPROVED", "ok"), CREATOR));
    }

    @Test
    void rejectC1RequiresReason() {
        givenStatus(ApprovalStatus.PENDING_APPROVAL);

        assertThrows(IllegalArgumentException.class,
                () -> service.approveC1(ID, request("REJECTED", "  "), APPROVER_A));
    }

    @Test
    void rejectC1MovesToRejectedLevel1() {
        givenStatus(ApprovalStatus.PENDING_APPROVAL);

        VhfResponse result = service.approveC1(ID, request("REJECTED", "Lý do hợp lệ"), APPROVER_A);

        assertEquals(ApprovalStatus.REJECTED_LEVEL1, result.getApprovalStatus());
        assertEquals("Lý do hợp lệ", entity.getApprovalContentLevel1());
    }

    @Test
    void approveC2MovesToApproved() {
        givenStatus(ApprovalStatus.APPROVED_LEVEL1);

        VhfResponse result = service.approveC2(ID, request("APPROVED", "Cục đồng ý"), APPROVER_B);

        assertEquals(ApprovalStatus.APPROVED, result.getApprovalStatus());
        assertEquals(APPROVER_B, entity.getApproverLevel2());
        assertNotNull(entity.getApprovedDateLevel2());
        assertEquals("Cục đồng ý", entity.getApprovalContentLevel2());
    }

    @Test
    void approveC2BySamePersonAsC1IsBlocked() {
        givenStatus(ApprovalStatus.APPROVED_LEVEL1);
        entity.setApproverLevel1(APPROVER_A);

        assertThrows(IllegalStateException.class,
                () -> service.approveC2(ID, request("APPROVED", "ok"), APPROVER_A));
    }

    @Test
    void rejectC2MovesToRejectedLevel2() {
        givenStatus(ApprovalStatus.APPROVED_LEVEL1);

        VhfResponse result = service.approveC2(ID, request("REJECTED", "Cục từ chối"), APPROVER_B);

        assertEquals(ApprovalStatus.REJECTED_LEVEL2, result.getApprovalStatus());
        assertEquals("Cục từ chối", entity.getApprovalContentLevel2());
    }

    @Nested
    @DisplayName("Audit Trail / History Tests according to 6 Criteria")
    class HistoryTests {

        private final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000005");

        @Test
        @DisplayName("Criterion 1 & 2: Resolve actor name and unit name from user's orgUnit")
        void getHistory_shouldResolveActorNameAndOrgUnit() {
            givenStatus(ApprovalStatus.APPROVED);

            InfrastructureHistory history = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(ID)
                    .refType(InfrastructureType.VHF)
                    .approvalLevel(ApprovalLevel.LEVEL_1)
                    .status(InfrastructureHistoryStatus.APPROVED)
                    .approvedBy(USER_ID)
                    .approvedDate(LocalDateTime.of(2026, 6, 15, 14, 30))
                    .changedField("Tên thiết bị")
                    .previousValue("VHF cũ")
                    .newValue("VHF mới")
                    .reason("Cập nhật thông tin Tên thiết bị")
                    .build();

            when(historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.VHF, ID))
                    .thenReturn(List.of(history));

            OrgUnit userOrgUnit = new OrgUnit();
            userOrgUnit.setName("Cảng vụ Hàng hải Hải Phòng");

            User actor = new User();
            actor.setId(USER_ID);
            actor.setFullName("Nguyễn Văn A");
            actor.setUsername("nguyenvana");
            actor.setOrgUnit(userOrgUnit);

            when(userRepository.findAllByIdInWithOrgUnit(Set.of(USER_ID))).thenReturn(List.of(actor));

            List<HistoryEntry> result = service.getHistory(ID);

            assertThat(result).hasSize(1);
            HistoryEntry entry = result.get(0);
            assertThat(entry.getApprovedBy()).isEqualTo("Nguyễn Văn A");
            assertThat(entry.getOrgUnitName()).isEqualTo("Cảng vụ Hàng hải Hải Phòng");
            assertThat(entry.getPreviousValue()).isEqualTo("VHF cũ");
            assertThat(entry.getNewValue()).isEqualTo("VHF mới");
        }

        @Test
        @DisplayName("Criterion 2: Unit name falls back to department or default agency")
        void getHistory_unitNameFallback() {
            givenStatus(ApprovalStatus.APPROVED);

            InfrastructureHistory history = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(ID)
                    .refType(InfrastructureType.VHF)
                    .approvedBy(USER_ID)
                    .build();

            when(historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.VHF, ID))
                    .thenReturn(List.of(history));

            User actorWithDept = new User();
            actorWithDept.setId(USER_ID);
            actorWithDept.setUsername("canbo");
            actorWithDept.setDepartment("Phòng Kỹ thuật");
            when(userRepository.findAllByIdInWithOrgUnit(Set.of(USER_ID))).thenReturn(List.of(actorWithDept));

            List<HistoryEntry> result = service.getHistory(ID);
            assertThat(result.get(0).getOrgUnitName()).isEqualTo("Phòng Kỹ thuật");
            assertThat(result.get(0).getApprovedBy()).isEqualTo("canbo");

            // User without orgUnit and without department
            actorWithDept.setDepartment(null);
            result = service.getHistory(ID);
            assertThat(result.get(0).getOrgUnitName()).isEqualTo("Cục Hàng hải Việt Nam");
        }

        @Test
        @DisplayName("Criterion 3: Search history with normalized keyword unaccented")
        void getHistory_withKeyword_shouldNormalize() {
            givenStatus(ApprovalStatus.APPROVED);

            when(historyRepository.searchHistory(eq(InfrastructureType.VHF), eq(ID), eq("thiet bi vhf"), any(), any(), any()))
                    .thenReturn(List.of());

            service.getHistory(ID, 0, 10, "Thiết bị VHF", null, (String) null);

            verify(historyRepository).searchHistory(
                    eq(InfrastructureType.VHF), eq(ID), eq("thiet bi vhf"), isNull(), isNull(), any());
        }

        @Test
        @DisplayName("Criterion 4: Date range filter parsed to start and end of day")
        void getHistory_withDateRange_shouldParseStartAndEndOfDay() {
            givenStatus(ApprovalStatus.APPROVED);

            when(historyRepository.searchHistory(eq(InfrastructureType.VHF), eq(ID), any(), any(), any(), any()))
                    .thenReturn(List.of());

            service.getHistory(ID, null, null, null, "2026-06-01", "2026-06-30");

            ArgumentCaptor<LocalDateTime> fromCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
            ArgumentCaptor<LocalDateTime> toCaptor = ArgumentCaptor.forClass(LocalDateTime.class);

            verify(historyRepository).searchHistory(
                    eq(InfrastructureType.VHF), eq(ID), isNull(),
                    fromCaptor.capture(), toCaptor.capture(), any());

            assertThat(fromCaptor.getValue()).isEqualTo(LocalDateTime.of(2026, 6, 1, 0, 0, 0));
            assertThat(toCaptor.getValue().toLocalDate()).isEqualTo(LocalDate.of(2026, 6, 30));
            assertThat(toCaptor.getValue().getHour()).isEqualTo(23);
            assertThat(toCaptor.getValue().getMinute()).isEqualTo(59);
        }

        @Test
        @DisplayName("Criterion 6: formatDisplayValue correctly maps IDs and codes to human-readable names")
        void formatDisplayValue_mapping() {
            UUID mockSymbolId = UUID.randomUUID();
            when(jdbcTemplate.queryForList("SELECT name FROM map_symbols WHERE id = ?", String.class, mockSymbolId))
                    .thenReturn(List.of("Biểu tượng VHF"));
            assertThat(service.formatDisplayValue("mapSymbolId", mockSymbolId.toString())).isEqualTo("Biểu tượng VHF");

            UUID mockOrgUnitId = UUID.randomUUID();
            when(orgUnitCacheService.getName(mockOrgUnitId)).thenReturn("Đơn vị Quản lý A");
            assertThat(service.formatDisplayValue("orgUnitId", mockOrgUnitId.toString())).isEqualTo("Đơn vị Quản lý A");

            UUID mockOpId = UUID.randomUUID();
            when(jdbcTemplate.queryForList("SELECT name FROM operating_organizations WHERE id = ?", String.class, mockOpId))
                    .thenReturn(List.of("Xí nghiệp Vận hành VHF"));
            assertThat(service.formatDisplayValue("operatingUnitId", mockOpId.toString())).isEqualTo("Xí nghiệp Vận hành VHF");

            UUID mockPortId = UUID.randomUUID();
            Port port = new Port();
            port.setId(mockPortId);
            port.setPortName("Cảng Hải Phòng");
            port.setPortCode("VNHPH");
            when(portRepository.findById(mockPortId)).thenReturn(Optional.of(port));
            assertThat(service.formatDisplayValue("seaportId", mockPortId.toString())).isEqualTo("Cảng Hải Phòng");

            assertThat(service.formatDisplayValue("attachedInfrastructureType", "1")).isEqualTo("TTDH VTS");
            assertThat(service.formatDisplayValue("attachedInfrastructureType", "2")).isEqualTo("Trạm Radar");

            UUID mockVtsCenterId = UUID.randomUUID();
            VtsOperationCenter oc = new VtsOperationCenter();
            oc.setId(mockVtsCenterId);
            oc.setName("Trung tâm VTS Hải Phòng");
            when(vtsOperationCenterRepository.findByIdAndDeletedAtIsNull(mockVtsCenterId)).thenReturn(Optional.of(oc));
            assertThat(service.formatDisplayValue("attachedInfrastructureId", mockVtsCenterId.toString())).isEqualTo("Trung tâm VTS Hải Phòng");

            UUID mockRadarId = UUID.randomUUID();
            RadarStation rs = new RadarStation();
            rs.setId(mockRadarId);
            rs.setStationName("Trạm Radar Hòn Dấu");
            when(radarStationRepository.findById(mockRadarId)).thenReturn(Optional.of(rs));
            assertThat(service.formatDisplayValue("attachedInfrastructureId", mockRadarId.toString())).isEqualTo("Trạm Radar Hòn Dấu");

            when(jdbcTemplate.queryForList("SELECT name FROM provinces WHERE id = ?", String.class, 31))
                    .thenReturn(List.of("Hải Phòng"));
            assertThat(service.formatDisplayValue("provinceId", "31")).isEqualTo("Hải Phòng");

            assertThat(service.formatDisplayValue("operationalStatus", "0")).isEqualTo("Chưa khai thác/vận hành");
            assertThat(service.formatDisplayValue("operationalStatus", "1")).isEqualTo("Đang khai thác/vận hành");
            assertThat(service.formatDisplayValue("operationalStatus", "2")).isEqualTo("Dừng khai thác/vận hành");

            assertThat(service.formatDisplayValue("unitOfMeasure", "1")).isEqualTo("Bộ");
            assertThat(service.formatDisplayValue("unitOfMeasure", "4")).isEqualTo("Chiếc");
            assertThat(service.formatDisplayValue("unitOfMeasure", "6")).isEqualTo("Cái");

            assertThat(service.formatDisplayValue("geometryType", "POINT")).isEqualTo("Đối tượng điểm");
            assertThat(service.formatDisplayValue("approvalStatus", "APPROVED")).isEqualTo("Đã duyệt");
            assertThat(service.formatDisplayValue("coordinateSystem", "1")).isEqualTo("WGS 84");
            assertThat(service.formatDisplayValue("coordinateSystem", "2")).isEqualTo("VN-2000");
        }
    }
}
