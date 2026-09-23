package com.hanghai.kchtg.dikerevetment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

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

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.dikerevetment.dto.DikeRevetmentCreateRequest;
import com.hanghai.kchtg.dikerevetment.dto.DikeRevetmentResponse;
import com.hanghai.kchtg.dikerevetment.dto.DikeRevetmentUpdateRequest;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetment;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentType;
import com.hanghai.kchtg.dikerevetment.repository.DikeRevetmentRepository;
import com.hanghai.kchtg.dikerevetment.service.DikeRevetmentService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.port.service.PortCacheService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.vtssystem.dto.HistoryEntry;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DikeRevetmentServiceTest {

    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID TEST_ID_2 = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock private DikeRevetmentRepository repo;
    @Mock private InfrastructureHistoryRepository approvalHistoryRepo;
    @Mock private InfrastructureApprovalService approvalService;
    @Mock private GisSpatialObjectService gisSpatialObjectService;
    @Mock private OrgUnitCacheService orgUnitCacheService;
    @Mock private OrgUnitScopeService orgUnitScopeService;
    @Mock private PortCacheService portCacheService;
    @Mock private UserResolverService userResolverService;
    @Mock private InfrastructureAttachmentRepository infrastructureAttachmentRepository;
    @Mock private UserRepository userRepository;
    @Mock private JdbcTemplate jdbcTemplate;

    private DikeRevetmentService service;
    private DikeRevetment testEntity;
    private DikeRevetmentCreateRequest createReq;

    @BeforeEach
    void setUp() {
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.all());
        service = new DikeRevetmentService(
                repo, approvalHistoryRepo, approvalService, gisSpatialObjectService,
                orgUnitCacheService, orgUnitScopeService, portCacheService, userResolverService,
                infrastructureAttachmentRepository, userRepository, jdbcTemplate);
        org.springframework.test.util.ReflectionTestUtils.setField(service, "uploadDir", "target/test-uploads");

        testEntity = DikeRevetment.builder()
                .id(TEST_ID)
                .dikeRevetmentType(DikeRevetmentType.RIVER_DIKE)
                .location("Bac Giang")
                .length(new BigDecimal("150.5"))
                .crestElevation(new BigDecimal("10.0"))
                .height(new BigDecimal("5.0"))
                .surfaceMaterial("Betong")
                .status("1")
                .approvalStatus(ApprovalStatus.DRAFT)
                .createdBy(UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .createdAt(LocalDateTime.of(2026, 6, 1, 10, 0))
                .build();

        createReq = DikeRevetmentCreateRequest.builder()
                .dikeRevetmentType(DikeRevetmentType.SAND_DIKE)
                .location("Ha Noi")
                .length(new BigDecimal("200.0"))
                .crestElevation(new BigDecimal("20.0"))
                .height(new BigDecimal("8.0"))
                .surfaceMaterial("Thep")
                .status("1")
                .constructionDate(LocalDate.of(2018, 1, 15))
                .lastMaintenanceYear(2022)
                .build();
    }

    @Test
    void create_shouldSaveEntity() {
        ArgumentCaptor<DikeRevetment> captor = ArgumentCaptor.forClass(DikeRevetment.class);
        when(repo.save(any())).thenReturn(testEntity);
        DikeRevetmentResponse r = service.create(createReq, UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertThat(r).isNotNull();
        assertThat(r.getDikeRevetmentType()).isEqualTo(DikeRevetmentType.RIVER_DIKE);
        assertThat(r.getApprovalStatus()).isEqualTo(ApprovalStatus.DRAFT);
        verify(repo, times(1)).save(captor.capture());
        assertThat(captor.getValue().getConstructionDate()).isEqualTo(LocalDate.of(2018, 1, 15));
        assertThat(captor.getValue().getLastMaintenanceYear()).isEqualTo(2022);
    }

    @Test
    void getById_shouldReturnResponse() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        DikeRevetmentResponse r = service.getById(TEST_ID);
        assertThat(r).isNotNull();
        assertThat(r.getId()).isEqualTo(TEST_ID);
    }

    @Test
    void getById_notFound_shouldThrowException() {
        when(repo.findById(TEST_ID_2)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getById(TEST_ID_2))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void update_shouldUpdateFields() {
        DikeRevetmentUpdateRequest updateReq = DikeRevetmentUpdateRequest.builder()
                .dikeRevetmentType(DikeRevetmentType.BANK_PROTECTION_REVETMENT)
                .location("Hai Phong")
                .length(new BigDecimal("300.0"))
                .constructionDate(LocalDate.of(2020, 5, 10))
                .lastMaintenanceYear(2023)
                .build();

        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);

        DikeRevetmentResponse r = service.update(TEST_ID, updateReq, UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertThat(r).isNotNull();
        assertThat(testEntity.getConstructionDate()).isEqualTo(LocalDate.of(2020, 5, 10));
        assertThat(testEntity.getLastMaintenanceYear()).isEqualTo(2023);
        verify(repo, times(1)).save(any());
    }

    @Test
    @DisplayName("update when geometryType is cleared - should clear all location fields and delete spatial object")
    void update_whenGeometryTypeCleared_shouldClearAllLocationFieldsAndSpatialObject() {
        UUID spatialId = UUID.randomUUID();
        UUID symbolId = UUID.randomUUID();

        testEntity.setSpatialId(spatialId);
        testEntity.setSymbolId(symbolId);

        GisSpatialObject spatial = new GisSpatialObject();
        spatial.setId(spatialId);
        spatial.setGeometryType(GisGeometryType.LINE);
        spatial.setCoordinates("LINESTRING (106.7 20.8, 106.8 20.9)");

        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(gisSpatialObjectService.findById(spatialId)).thenReturn(Optional.of(spatial));

        DikeRevetmentUpdateRequest updateReq = DikeRevetmentUpdateRequest.builder()
                .dikeRevetmentType(DikeRevetmentType.RIVER_DIKE)
                .location("Bac Giang")
                .geometryType(null)
                .coordinates(null)
                .symbolId(null)
                .build();

        DikeRevetmentResponse response = service.update(TEST_ID, updateReq, UUID.fromString("00000000-0000-0000-0000-000000000001"));

        assertThat(response.getGeometryType()).isNull();
        assertThat(response.getCoordinates()).isNull();
        assertThat(response.getSymbolId()).isNull();
        assertThat(response.getSpatialId()).isNull();

        assertThat(testEntity.getSpatialId()).isNull();
        assertThat(testEntity.getSymbolId()).isNull();

        verify(gisSpatialObjectService).delete(spatialId);
        verify(repo, atLeastOnce()).save(testEntity);
    }

    @Test
    void delete_shouldArchiveEntity() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);

        service.delete(TEST_ID, UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertThat(testEntity.getDeletedAt()).isNotNull();
        assertThat(testEntity.getApprovalStatus()).isEqualTo(ApprovalStatus.ARCHIVED);
    }

    @Test
    void submitForApproval_shouldCallApprovalService() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);

        service.submitForApproval(TEST_ID, UUID.fromString("00000000-0000-0000-0000-000000000001"));
        verify(approvalService, times(1)).submit(eq(testEntity), eq(InfrastructureType.DIKE_REVETMENT), any());
    }

    @Test
    void approveLevel1_shouldCallApprovalService() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);

        service.approveLevel1(TEST_ID, UUID.fromString("00000000-0000-0000-0000-000000000002"), "OK");
        verify(approvalService, times(1)).approveC1(eq(testEntity), eq(InfrastructureType.DIKE_REVETMENT), eq("APPROVED"), eq("OK"), any());
    }

    @Test
    void approveLevel2_shouldCallApprovalService() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);

        service.approveLevel2(TEST_ID, UUID.fromString("00000000-0000-0000-0000-000000000003"), "OK C2");
        verify(approvalService, times(1)).approveC2(eq(testEntity), eq(InfrastructureType.DIKE_REVETMENT), eq("APPROVED"), eq("OK C2"), any());
    }

    @Test
    void rejectLevel1_shouldCallApprovalService() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);

        service.rejectLevel1(TEST_ID, UUID.fromString("00000000-0000-0000-0000-000000000002"), "Lý do từ chối 1");
        verify(approvalService, times(1)).approveC1(eq(testEntity), eq(InfrastructureType.DIKE_REVETMENT), eq("REJECTED"), eq("Lý do từ chối 1"), any());
    }

    @Test
    void rejectLevel2_shouldCallApprovalService() {
        when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
        when(repo.save(any())).thenReturn(testEntity);

        service.rejectLevel2(TEST_ID, UUID.fromString("00000000-0000-0000-0000-000000000003"), "Lý do từ chối 2");
        verify(approvalService, times(1)).approveC2(eq(testEntity), eq(InfrastructureType.DIKE_REVETMENT), eq("REJECTED"), eq("Lý do từ chối 2"), any());
    }

    @Nested
    @DisplayName("History operations - 6 Criteria verification")
    class HistoryTests {

        private final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000005");

        @BeforeEach
        void setUpHistory() {
            testEntity.setApprovalStatus(ApprovalStatus.APPROVED);
        }

        @Test
        @DisplayName("getHistory: Trả về danh sách rỗng khi bản ghi ở trạng thái Lưu tạm (DRAFT)")
        void getHistory_whenDraft_returnsEmptyList() {
            testEntity.setApprovalStatus(ApprovalStatus.DRAFT);
            when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));

            List<HistoryEntry> result = service.getHistory(TEST_ID);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Criterion 1 & 2: Resolve actor name and unit name from user's orgUnit")
        void getHistory_shouldResolveActorNameAndOrgUnit() {
            when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));

            InfrastructureHistory history = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(TEST_ID)
                    .refType(InfrastructureType.DIKE_REVETMENT)
                    .approvalLevel(ApprovalLevel.LEVEL_1)
                    .status(InfrastructureHistoryStatus.APPROVED)
                    .approvedBy(USER_ID)
                    .approvedDate(LocalDateTime.of(2026, 6, 15, 14, 30))
                    .changedField("Loại kết cấu công trình")
                    .previousValue("RIVER_DIKE")
                    .newValue("SAND_DIKE")
                    .build();

            when(approvalHistoryRepo.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.DIKE_REVETMENT, TEST_ID))
                    .thenReturn(List.of(history));

            OrgUnit userOrgUnit = new OrgUnit();
            userOrgUnit.setId(UUID.randomUUID());
            userOrgUnit.setName("Cảng vụ Hàng hải Hải Phòng");

            User actor = new User();
            actor.setId(USER_ID);
            actor.setFullName("Nguyễn Văn A");
            actor.setUsername("nguyenvana");
            actor.setOrgUnit(userOrgUnit);

            when(userRepository.findAllByIdInWithOrgUnit(Set.of(USER_ID))).thenReturn(List.of(actor));

            List<HistoryEntry> result = service.getHistory(TEST_ID);

            assertThat(result).hasSize(1);
            HistoryEntry entry = result.get(0);
            assertThat(entry.getApprovedBy()).isEqualTo("Nguyễn Văn A");
            assertThat(entry.getOrgUnitName()).isEqualTo("Cảng vụ Hàng hải Hải Phòng");
            assertThat(entry.getPreviousValue()).isEqualTo("Đê chắn sóng");
            assertThat(entry.getNewValue()).isEqualTo("Đê chắn cát");
        }

        @Test
        @DisplayName("Criterion 2: Unit name falls back to department or default agency")
        void getHistory_unitNameFallback() {
            when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));

            InfrastructureHistory history = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(TEST_ID)
                    .refType(InfrastructureType.DIKE_REVETMENT)
                    .approvedBy(USER_ID)
                    .build();

            when(approvalHistoryRepo.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.DIKE_REVETMENT, TEST_ID))
                    .thenReturn(List.of(history));

            User actorWithDept = new User();
            actorWithDept.setId(USER_ID);
            actorWithDept.setUsername("canbo");
            actorWithDept.setDepartment("Phòng Kỹ thuật");
            when(userRepository.findAllByIdInWithOrgUnit(Set.of(USER_ID))).thenReturn(List.of(actorWithDept));

            List<HistoryEntry> result = service.getHistory(TEST_ID);
            assertThat(result.get(0).getOrgUnitName()).isEqualTo("Phòng Kỹ thuật");
            assertThat(result.get(0).getApprovedBy()).isEqualTo("canbo");

            // User without orgUnit and without department
            actorWithDept.setDepartment(null);
            result = service.getHistory(TEST_ID);
            assertThat(result.get(0).getOrgUnitName()).isEqualTo("Cục Hàng hải Việt Nam");
        }

        @Test
        @DisplayName("Criterion 3: Search history with normalized keyword unaccented")
        void getHistory_withKeyword_shouldNormalize() {
            when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
            when(approvalHistoryRepo.searchHistory(eq(InfrastructureType.DIKE_REVETMENT), eq(TEST_ID), eq("de chan song"), any(), any(), any()))
                    .thenReturn(List.of());

            service.getHistory(TEST_ID, 0, 10, "Đê Chắn Sóng", null, (String) null);

            verify(approvalHistoryRepo).searchHistory(
                    eq(InfrastructureType.DIKE_REVETMENT), eq(TEST_ID), eq("de chan song"), isNull(), isNull(), any());
        }

        @Test
        @DisplayName("Criterion 4: Date range filter parsed to start and end of day")
        void getHistory_withDateRange_shouldParseStartAndEndOfDay() {
            when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
            when(approvalHistoryRepo.searchHistory(eq(InfrastructureType.DIKE_REVETMENT), eq(TEST_ID), any(), any(), any(), any()))
                    .thenReturn(List.of());

            service.getHistory(TEST_ID, null, null, null, "2026-06-01", "2026-06-30");

            ArgumentCaptor<LocalDateTime> fromCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
            ArgumentCaptor<LocalDateTime> toCaptor = ArgumentCaptor.forClass(LocalDateTime.class);

            verify(approvalHistoryRepo).searchHistory(
                    eq(InfrastructureType.DIKE_REVETMENT), eq(TEST_ID), isNull(),
                    fromCaptor.capture(), toCaptor.capture(), any());

            assertThat(fromCaptor.getValue()).isEqualTo(LocalDateTime.of(2026, 6, 1, 0, 0, 0));
            assertThat(toCaptor.getValue().toLocalDate()).isEqualTo(LocalDate.of(2026, 6, 30));
            assertThat(toCaptor.getValue().getHour()).isEqualTo(23);
            assertThat(toCaptor.getValue().getMinute()).isEqualTo(59);
        }

        @Test
        @DisplayName("Criterion 5: Update captures modified fields and formats history")
        void update_onApprovedEntity_shouldRecordChangedFields() {
            testEntity.setApprovalStatus(ApprovalStatus.APPROVED);
            when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
            when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            DikeRevetmentUpdateRequest updateReq = DikeRevetmentUpdateRequest.builder()
                    .dikeRevetmentName("Đê chắn sóng mới")
                    .length(new BigDecimal("350.0"))
                    .status("2")
                    .build();

            service.update(TEST_ID, updateReq, USER_ID);

            ArgumentCaptor<InfrastructureHistory> histCaptor = ArgumentCaptor.forClass(InfrastructureHistory.class);
            verify(approvalHistoryRepo, atLeastOnce()).save(histCaptor.capture());

            List<InfrastructureHistory> savedEntries = histCaptor.getAllValues();
            assertThat(savedEntries).anyMatch(h -> "Tên đê kè".equals(h.getChangedField()) && "Đê chắn sóng mới".equals(h.getNewValue()));
            assertThat(savedEntries).anyMatch(h -> "Chiều dài (m)".equals(h.getChangedField()) && "350.0".equals(h.getNewValue()));
            assertThat(savedEntries).anyMatch(h -> "Tình trạng".equals(h.getChangedField()) && "Đang khai thác/vận hành".equals(h.getNewValue()));
        }

        @Test
        @DisplayName("Criterion 6: formatDisplayValue correctly maps IDs to human-readable names")
        void formatDisplayValue_mapping() {
            UUID mockSymbolId = UUID.randomUUID();
            when(jdbcTemplate.queryForList("SELECT name FROM map_symbols WHERE id = ?", String.class, mockSymbolId))
                    .thenReturn(List.of("Biểu tượng đê"));
            assertThat(service.formatDisplayValue("symbolId", mockSymbolId.toString())).isEqualTo("Biểu tượng đê");

            UUID mockOrgUnitId = UUID.randomUUID();
            when(orgUnitCacheService.getName(mockOrgUnitId)).thenReturn("Đơn vị Quản lý A");
            assertThat(service.formatDisplayValue("orgUnitId", mockOrgUnitId.toString())).isEqualTo("Đơn vị Quản lý A");

            UUID mockPortId = UUID.randomUUID();
            when(portCacheService.getName(mockPortId)).thenReturn("Cảng Hải Phòng");
            assertThat(service.formatDisplayValue("seaportId", mockPortId.toString())).isEqualTo("Cảng Hải Phòng");

            UUID mockOpId = UUID.randomUUID();
            when(jdbcTemplate.queryForList("SELECT name FROM operating_units WHERE id = ?", String.class, mockOpId))
                    .thenReturn(List.of("Xí nghiệp B"));
            assertThat(service.formatDisplayValue("operatingUnitId", mockOpId.toString())).isEqualTo("Xí nghiệp B");

            when(jdbcTemplate.queryForList("SELECT name FROM provinces WHERE id = ?", String.class, 31))
                    .thenReturn(List.of("Hải Phòng"));
            assertThat(service.formatDisplayValue("location", "31")).isEqualTo("Hải Phòng");

            assertThat(service.formatDisplayValue("dikeRevetmentType", "FLOW_GUIDE_REVETMENT")).isEqualTo("Kè hướng dòng");
            assertThat(service.formatDisplayValue("status", "1")).isEqualTo("Chưa khai thác/vận hành");
            assertThat(service.formatDisplayValue("geometryType", "LINE")).isEqualTo("Đối tượng đường");
            assertThat(service.formatDisplayValue("approvalStatus", "APPROVED")).isEqualTo("Đã duyệt");
            assertThat(service.formatDisplayValue("coordinateSystem", "1")).isEqualTo("WGS 84");
            assertThat(service.formatDisplayValue("coordinateSystem", "2")).isEqualTo("VN-2000");
            assertThat(service.formatDisplayValue("commissioningDate", "2026-06-15")).isEqualTo("15/06/2026");
        }

        @Test
        @DisplayName("Update on approved entity with equivalent BigDecimal scales (5555.0000 vs 5555) should NOT record history")
        void update_onApprovedEntity_whenBigDecimalScaleDiffers_shouldNotRecordHistory() {
            DikeRevetment approvedEntity = DikeRevetment.builder()
                    .id(TEST_ID)
                    .dikeRevetmentType(DikeRevetmentType.RIVER_DIKE)
                    .location("Bac Giang")
                    .length(new BigDecimal("5555.0000"))
                    .crestElevation(new BigDecimal("10.0000"))
                    .height(new BigDecimal("5.0000"))
                    .surfaceMaterial("Betong")
                    .status("1")
                    .approvalStatus(ApprovalStatus.APPROVED)
                    .build();

            when(repo.findById(TEST_ID)).thenReturn(Optional.of(approvedEntity));
            when(repo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            DikeRevetmentUpdateRequest req = DikeRevetmentUpdateRequest.builder()
                    .dikeRevetmentType(DikeRevetmentType.RIVER_DIKE)
                    .location("Bac Giang")
                    .length(new BigDecimal("5555")) // Scale 0 vs Scale 4
                    .crestElevation(new BigDecimal("10.0")) // Scale 1 vs Scale 4
                    .height(new BigDecimal("5")) // Scale 0 vs Scale 4
                    .surfaceMaterial("Betong")
                    .status("1")
                    .build();

            service.update(TEST_ID, req, USER_ID);

            verify(approvalHistoryRepo, never()).save(any());
        }

        @Test
        @DisplayName("Update on approved entity with actual changes should record history only for changed fields")
        void update_onApprovedEntity_whenFieldsActuallyChanged_shouldRecordHistoryForChangedFieldsOnly() {
            DikeRevetment approvedEntity = DikeRevetment.builder()
                    .id(TEST_ID)
                    .dikeRevetmentType(DikeRevetmentType.RIVER_DIKE)
                    .location("Bac Giang")
                    .length(new BigDecimal("5555.0000"))
                    .crestElevation(new BigDecimal("10.0000"))
                    .height(new BigDecimal("5.0000"))
                    .surfaceMaterial("Betong")
                    .status("1")
                    .approvalStatus(ApprovalStatus.APPROVED)
                    .build();

            when(repo.findById(TEST_ID)).thenReturn(Optional.of(approvedEntity));
            when(repo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            DikeRevetmentUpdateRequest req = DikeRevetmentUpdateRequest.builder()
                    .dikeRevetmentType(DikeRevetmentType.RIVER_DIKE)
                    .location("Bac Giang")
                    .length(new BigDecimal("6000.0000")) // Actually changed
                    .crestElevation(new BigDecimal("10.0")) // Scale differs, value identical
                    .height(new BigDecimal("5.0000")) // Identical
                    .surfaceMaterial("Betong")
                    .status("1")
                    .build();

            service.update(TEST_ID, req, USER_ID);

            ArgumentCaptor<InfrastructureHistory> historyCaptor = ArgumentCaptor.forClass(InfrastructureHistory.class);
            verify(approvalHistoryRepo, times(1)).save(historyCaptor.capture());

            InfrastructureHistory recorded = historyCaptor.getValue();
            assertThat(recorded.getChangedField()).isEqualTo("Chiều dài (m)");
            assertThat(recorded.getPreviousValue()).isEqualTo("5555.0000");
            assertThat(recorded.getNewValue()).isEqualTo("6000.0000");
            assertThat(recorded.getStatus()).isEqualTo(InfrastructureHistoryStatus.UPDATED);
        }

        @Test
        @DisplayName("searchPaged passes correct date range when commissioningYear is provided")
        void searchPaged_withCommissioningYear_shouldPassDateRangeToRepository() {
            org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 20);
            when(repo.searchPaged(any(), anyBoolean(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(testEntity)));

            service.searchPaged(null, null, null, null, null, null, null, null, null, null, null, null, 2024, pageable);

            ArgumentCaptor<LocalDate> fromCaptor = ArgumentCaptor.forClass(LocalDate.class);
            ArgumentCaptor<LocalDate> toCaptor = ArgumentCaptor.forClass(LocalDate.class);
            verify(repo).searchPaged(
                    any(), anyBoolean(), any(), any(), any(),
                    any(), any(), any(), any(), any(), any(), any(),
                    any(), any(),
                    fromCaptor.capture(), toCaptor.capture(),
                    eq(pageable));

            assertThat(fromCaptor.getValue()).isEqualTo(LocalDate.of(2024, 1, 1));
            assertThat(toCaptor.getValue()).isEqualTo(LocalDate.of(2024, 12, 31));
        }

        @Test
        @DisplayName("searchPaged without approvalStatus should pass isDeleted=false to repository to exclude deleted records in All tab")
        void searchPaged_withoutApprovalStatus_shouldPassIsDeletedFalseToRepository() {
            org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 20);
            when(repo.searchPaged(any(), anyBoolean(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(testEntity)));

            service.searchPaged(null, null, null, null, null, null, null, null, null, null, null, null, null, pageable);

            ArgumentCaptor<Boolean> isDeletedCaptor = ArgumentCaptor.forClass(Boolean.class);
            verify(repo).searchPaged(
                    isDeletedCaptor.capture(), anyBoolean(), any(), any(), any(),
                    any(), any(), any(), any(), any(), any(), any(),
                    any(), any(), any(), any(),
                    eq(pageable));

            assertThat(isDeletedCaptor.getValue()).isFalse();
        }

        @Test
        @DisplayName("searchPaged with ARCHIVED approvalStatus should pass isDeleted=true to repository")
        void searchPaged_withArchivedApprovalStatus_shouldPassIsDeletedTrueToRepository() {
            org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 20);
            when(repo.searchPaged(any(), anyBoolean(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(testEntity)));

            service.searchPaged(null, null, null, null, null, null, "ARCHIVED", null, null, null, null, null, null, pageable);

            ArgumentCaptor<Boolean> isDeletedCaptor = ArgumentCaptor.forClass(Boolean.class);
            verify(repo).searchPaged(
                    isDeletedCaptor.capture(), anyBoolean(), any(), any(), any(),
                    any(), any(), any(), any(), any(), any(), any(),
                    any(), any(), any(), any(),
                    eq(pageable));

            assertThat(isDeletedCaptor.getValue()).isTrue();
        }

        @Test
        @DisplayName("getTabCounts should exclude ARCHIVED from total count")
        void getTabCounts_shouldExcludeArchivedFromTotal() {
            when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.all());
            List<Object[]> mockCounts = List.of(
                    new Object[]{ApprovalStatus.DRAFT, 5L},
                    new Object[]{ApprovalStatus.PENDING_APPROVAL, 3L},
                    new Object[]{ApprovalStatus.APPROVED, 10L},
                    new Object[]{ApprovalStatus.ARCHIVED, 2L}
            );
            when(repo.countByApprovalStatus(anyBoolean(), any(), any(), any(), any())).thenReturn(mockCounts);

            java.util.Map<String, Long> counts = service.getTabCounts(null, null, null, null);

            assertThat(counts.get("DRAFT")).isEqualTo(5L);
            assertThat(counts.get("PENDING_APPROVAL")).isEqualTo(3L);
            assertThat(counts.get("APPROVED")).isEqualTo(10L);
            assertThat(counts.get("ARCHIVED")).isEqualTo(2L);
            // Total should be 5 + 3 + 10 = 18, NOT 20 (excluding ARCHIVED)
            assertThat(counts.get("")).isEqualTo(18L);
        }

        @Test
        @DisplayName("getHistory filters out approvalStatus, Trạng thái phê duyệt, and identical values")
        void getHistory_shouldFilterOutApprovalStatusAndIdenticalValues() {
            when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));

            InfrastructureHistory approvalStatusHist = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(TEST_ID)
                    .refType(InfrastructureType.DIKE_REVETMENT)
                    .changedField("approvalStatus")
                    .previousValue("Đã duyệt")
                    .newValue("Đã duyệt")
                    .approvedBy(USER_ID)
                    .build();

            InfrastructureHistory trangThaiHist = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(TEST_ID)
                    .refType(InfrastructureType.DIKE_REVETMENT)
                    .changedField("Trạng thái phê duyệt")
                    .previousValue("Lưu tạm")
                    .newValue("Đã duyệt")
                    .approvedBy(USER_ID)
                    .build();

            InfrastructureHistory identicalHist = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(TEST_ID)
                    .refType(InfrastructureType.DIKE_REVETMENT)
                    .changedField("Ghi chú")
                    .previousValue("Đê biển")
                    .newValue("Đê biển")
                    .approvedBy(USER_ID)
                    .build();

            InfrastructureHistory genuineHist = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(TEST_ID)
                    .refType(InfrastructureType.DIKE_REVETMENT)
                    .changedField("Chiều dài (m)")
                    .previousValue("100")
                    .newValue("200")
                    .approvedBy(USER_ID)
                    .build();

            when(approvalHistoryRepo.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.DIKE_REVETMENT, TEST_ID))
                    .thenReturn(List.of(approvalStatusHist, trangThaiHist, identicalHist, genuineHist));

            List<HistoryEntry> result = service.getHistory(TEST_ID);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getChangedField()).isEqualTo("Chiều dài (m)");
            assertThat(result.get(0).getPreviousValue()).isEqualTo("100");
            assertThat(result.get(0).getNewValue()).isEqualTo("200");
        }

        @Test
        @DisplayName("getHistory filters out approval workflow metadata fields")
        void getHistory_shouldFilterOutApprovalWorkflowMetadata() {
            when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
            LocalDateTime now = LocalDateTime.now();

            InfrastructureHistory meta1 = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(TEST_ID)
                    .refType(InfrastructureType.DIKE_REVETMENT)
                    .changedField("approvalContentLevel1")
                    .previousValue(null)
                    .newValue("Đồng ý phê duyệt")
                    .approvedDate(now)
                    .approvedBy(USER_ID)
                    .build();

            InfrastructureHistory meta2 = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(TEST_ID)
                    .refType(InfrastructureType.DIKE_REVETMENT)
                    .changedField("submittedDate")
                    .previousValue(null)
                    .newValue("2026-03-01T10:00:00")
                    .approvedDate(now)
                    .approvedBy(USER_ID)
                    .build();

            InfrastructureHistory meta3 = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(TEST_ID)
                    .refType(InfrastructureType.DIKE_REVETMENT)
                    .changedField("rejectionReason")
                    .previousValue(null)
                    .newValue("Hồ sơ chưa đủ")
                    .approvedDate(now)
                    .approvedBy(USER_ID)
                    .build();

            InfrastructureHistory realField = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(TEST_ID)
                    .refType(InfrastructureType.DIKE_REVETMENT)
                    .changedField("surfaceMaterial")
                    .previousValue("Bê tông")
                    .newValue("Đá hộc")
                    .approvedDate(now)
                    .approvedBy(USER_ID)
                    .build();

            when(approvalHistoryRepo.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.DIKE_REVETMENT, TEST_ID))
                    .thenReturn(List.of(meta1, meta2, meta3, realField));

            List<HistoryEntry> result = service.getHistory(TEST_ID);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getChangedField()).isEqualTo("surfaceMaterial");
            assertThat(result.get(0).getPreviousValue()).isEqualTo("Bê tông");
            assertThat(result.get(0).getNewValue()).isEqualTo("Đá hộc");
        }

        @Test
        @DisplayName("getHistory deduplicates canonical fields in the same session")
        void getHistory_shouldDeduplicateCanonicalFieldsInSameSession() {
            when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
            LocalDateTime timestamp = LocalDateTime.of(2026, 3, 1, 10, 30, 0);

            InfrastructureHistory englishField = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(TEST_ID)
                    .refType(InfrastructureType.DIKE_REVETMENT)
                    .changedField("dikeRevetmentName")
                    .previousValue("Đê cũ")
                    .newValue("Đê mới")
                    .approvedDate(timestamp)
                    .approvedBy(USER_ID)
                    .build();

            InfrastructureHistory vietnameseField = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(TEST_ID)
                    .refType(InfrastructureType.DIKE_REVETMENT)
                    .changedField("Tên đê kè")
                    .previousValue("Đê cũ")
                    .newValue("Đê mới")
                    .approvedDate(timestamp)
                    .approvedBy(USER_ID)
                    .build();

            when(approvalHistoryRepo.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.DIKE_REVETMENT, TEST_ID))
                    .thenReturn(List.of(englishField, vietnameseField));

            List<HistoryEntry> result = service.getHistory(TEST_ID);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getChangedField()).isEqualTo("dikeRevetmentName");
        }

        @Test
        @DisplayName("getHistory falls back approvedBy to Hệ thống when user cannot be resolved")
        void getHistory_shouldFallbackApprovedByToSystemWhenUserNotFound() {
            when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
            UUID unknownUserId = UUID.randomUUID();

            InfrastructureHistory hist = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(TEST_ID)
                    .refType(InfrastructureType.DIKE_REVETMENT)
                    .changedField("note")
                    .previousValue("Ghi chú 1")
                    .newValue("Ghi chú 2")
                    .approvedDate(LocalDateTime.now())
                    .approvedBy(unknownUserId)
                    .build();

            when(approvalHistoryRepo.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.DIKE_REVETMENT, TEST_ID))
                    .thenReturn(List.of(hist));
            when(userRepository.findAllById(any())).thenReturn(List.of());

            List<HistoryEntry> result = service.getHistory(TEST_ID);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getApprovedBy()).isEqualTo("Hệ thống");
        }

        @Test
        @DisplayName("Uploading attachments on newly created entity (<=30s) even if approved should NOT record history")
        void uploadAttachments_whenNewlyCreatedAndApproved_shouldNotRecordHistory() {
            testEntity.setApprovalStatus(ApprovalStatus.APPROVED);
            testEntity.setCreatedAt(LocalDateTime.now().minusSeconds(5));
            when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
            org.springframework.mock.web.MockMultipartFile file =
                    new org.springframework.mock.web.MockMultipartFile("file", "test.pdf", "application/pdf", "content".getBytes());

            when(infrastructureAttachmentRepository.save(any())).thenAnswer(inv -> {
                com.hanghai.kchtg.common.entity.InfrastructureAttachment att = inv.getArgument(0);
                att.setId(UUID.randomUUID());
                return att;
            });

            service.uploadAttachments(TEST_ID, List.of(file), USER_ID);

            verify(approvalHistoryRepo, never()).save(any());
        }

        @Test
        @DisplayName("Uploading attachments on existing approved entity (>30s) should record history")
        void uploadAttachments_whenExistingApproved_shouldRecordHistory() {
            testEntity.setApprovalStatus(ApprovalStatus.APPROVED);
            testEntity.setCreatedAt(LocalDateTime.now().minusDays(2));
            when(repo.findById(TEST_ID)).thenReturn(Optional.of(testEntity));
            org.springframework.mock.web.MockMultipartFile file =
                    new org.springframework.mock.web.MockMultipartFile("file", "test.pdf", "application/pdf", "content".getBytes());

            when(infrastructureAttachmentRepository.save(any())).thenAnswer(inv -> {
                com.hanghai.kchtg.common.entity.InfrastructureAttachment att = inv.getArgument(0);
                att.setId(UUID.randomUUID());
                return att;
            });

            service.uploadAttachments(TEST_ID, List.of(file), USER_ID);

            verify(approvalHistoryRepo, times(1)).save(any());
        }
    }
}
