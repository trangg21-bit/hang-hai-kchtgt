package com.hanghai.kchtg.beacon;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hanghai.kchtg.beacon.dto.beacon_station.BeaconStationResponse;
import com.hanghai.kchtg.beacon.dto.beacon_station.CreateBeaconStationRequest;
import com.hanghai.kchtg.beacon.dto.beacon_station.UpdateBeaconStationRequest;
import com.hanghai.kchtg.beacon.entity.BeaconStation;
import com.hanghai.kchtg.beacon.repository.BeaconHistoryRepository;
import com.hanghai.kchtg.beacon.repository.BeaconStationRepository;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
import com.hanghai.kchtg.beacon.service.BeaconStationService;
import com.hanghai.kchtg.beacon.service.NotificationService;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.beacon.dto.BeaconHistoryEntry;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import org.springframework.data.domain.Pageable;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BeaconStationServiceTest {

    @Mock
    private BeaconStationRepository beaconStationRepo;

    @Mock
    private BuoyRepository buoyRepo;

    @Mock
    private BeaconHistoryRepository historyRepo;

    @Mock
    private com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository infraHistoryRepo;

    @Mock
    private NotificationService notificationService;

    @Mock
    private GisSpatialObjectService gisSpatialObjectService;

    @Mock
    private OrgUnitRepository orgUnitRepo;

    @Mock
    private com.hanghai.kchtg.orgunit.service.OrgUnitScopeService orgUnitScopeService;

    @Mock
    private com.hanghai.kchtg.orgunit.service.OrgUnitCacheService orgUnitCacheService;

    @Mock
    private com.hanghai.kchtg.port.service.shared.UserResolverService userResolverService;

    @Mock
    private com.hanghai.kchtg.port.repository.AttachmentRepository attachmentRepository;

    @Mock
    private com.hanghai.kchtg.user.repository.UserRepository userRepository;

    @Mock
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Mock
    private com.hanghai.kchtg.port.service.PortCacheService portCacheService;

    @InjectMocks
    private BeaconStationService service;

    private ObjectMapper objectMapper;

    @Captor
    private ArgumentCaptor<BeaconStation> beaconStationCaptor;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        // Inject a real ObjectMapper via reflection since the field is final
        try {
            java.lang.reflect.Field field = BeaconStationService.class.getDeclaredField("objectMapper");
            field.setAccessible(true);
            field.set(service, objectMapper);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        GisSpatialObject dummySpatial = new GisSpatialObject();
        dummySpatial.setId(UUID.randomUUID());
        lenient().when(gisSpatialObjectService.createOrUpdate(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(dummySpatial);
        lenient().when(orgUnitScopeService.currentUserScope())
                .thenReturn(com.hanghai.kchtg.orgunit.service.OrgUnitScopeService.Scope.allScope());
        lenient().when(orgUnitCacheService.getName(any())).thenReturn("Đơn vị Test");
        lenient().when(userResolverService.resolveName(any())).thenReturn("Admin Test");
    }

    private BeaconStation makeEntity(UUID id, String status) {
        BeaconStation entity = BeaconStation.builder()
                .code("DEN-001")
                .name("Đèn biển test")
                .type("LIGHTHOUSE")
                .unitId(UUID.randomUUID())
                .lightRange(15.0)
                .towerColor("Trắng")
                .area(BigDecimal.valueOf(12.0))
                .isActive(true)
                .status(status)
                .approvalStatus(ApprovalStatus.PENDING_APPROVAL)
                .build();
        setId(entity, id);
        entity.setCreatedAt(LocalDateTime.now().minusDays(1));
        entity.setUpdatedAt(LocalDateTime.now());
        return entity;
    }

    private static void setId(Object entity, UUID id) {
        if (entity instanceof BeaconStation bs) {
            bs.setId(id);
            return;
        }
        try {
            java.lang.reflect.Field idField = entity.getClass().getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(entity, id);
        } catch (Exception e) {
            try {
                java.lang.reflect.Field idField = BaseEntity.class.getDeclaredField("id");
                idField.setAccessible(true);
                idField.set(entity, id);
            } catch (Exception ex) {
                throw new RuntimeException(ex);
            }
        }
    }

    private CreateBeaconStationRequest makeCreateRequest() {
        return CreateBeaconStationRequest.builder()
                .code("DEN-002")
                .name("Đèn biển mới")
                .unitId(UUID.randomUUID())
                .type("BEACON_LIGHT")
                .lightRange(15.0)
                .towerColor("Đỏ")
                .primaryLightModel("Chớp 5 giây")
                .area(BigDecimal.valueOf(12.0))
                .location("Mô tả")
                .isActive(true)
                .action("draft")
                .build();
    }

    // ─────── READ TESTS ────────────────────────────────────────────

    @Nested
    @DisplayName("READ operations")
    class ReadTests {

        @Test
        @DisplayName("findAll returns list of responses")
        void findAll() {
            BeaconStation entity = makeEntity(UUID.randomUUID(), "DRAFT");
            when(beaconStationRepo.findAll()).thenReturn(List.of(entity));

            List<BeaconStationResponse> result = service.findAll();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getCode()).isEqualTo("DEN-001");
            assertThat(result.get(0).getName()).isEqualTo("Đèn biển test");
            verify(beaconStationRepo).findAll();
        }

        @Test
        @DisplayName("findById returns response when found")
        void findById() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "DRAFT");
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));

            BeaconStationResponse result = service.findById(id);

            assertThat(result.getId()).isEqualTo(id);
            assertThat(result.getCode()).isEqualTo("DEN-001");
            verify(beaconStationRepo).findById(id);
        }

        @Test
        @DisplayName("findById throws EntityNotFoundException when not found")
        void findByIdNotFound() {
            UUID id = UUID.randomUUID();
            when(beaconStationRepo.findById(id)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.findById(id))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Đèn biển không tìm thấy");

            verify(beaconStationRepo).findById(id);
        }

        @Test
        @DisplayName("search returns filtered results")
        void search() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "DRAFT");
            when(beaconStationRepo.searchFiltered(any(), any(), any(), any(), any(), anyBoolean(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(List.of(entity));

            List<BeaconStationResponse> result = service.search(
                    "Đèn", "DEN", "LIGHTHOUSE", null, "DRAFT", null, null, null, null, null, null, null, null, null, null, null, null);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Đèn biển test");
            verify(beaconStationRepo).searchFiltered("Đèn", "DEN",
                    "LIGHTHOUSE", null, "DRAFT", true, List.of(), null, null, null, null, null, null, null, null, null, null, null);
        }

        @Test
        @DisplayName("search with formatted date ranges correctly parses commissioned and updated dates")
        void search_withFormattedDateRanges() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "DRAFT");
            when(beaconStationRepo.searchFiltered(any(), any(), any(), any(), any(), anyBoolean(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(List.of(entity));

            List<BeaconStationResponse> result = service.search(
                    null, null, null, null, null, null, null, null, null, null, null, null, null,
                    "2026-09-22 00:00:00.000", "2026-09-22 23:59:59.999",
                    "2026-09-22 00:00:00.000", "2026-09-22 23:59:59.999");

            assertThat(result).hasSize(1);
            verify(beaconStationRepo).searchFiltered(
                    isNull(), isNull(), isNull(), isNull(), isNull(), eq(true), eq(List.of()),
                    isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(),
                    eq(LocalDate.of(2026, 9, 22)), eq(LocalDate.of(2026, 9, 22)),
                    argThat(from -> from != null && from.getYear() == 2026 && from.getMonthValue() == 9 && from.getDayOfMonth() == 22 && from.getHour() == 0 && from.getMinute() == 0 && from.getSecond() == 0),
                    argThat(to -> to != null && to.getYear() == 2026 && to.getMonthValue() == 9 && to.getDayOfMonth() == 22 && to.getHour() == 23 && to.getMinute() == 59 && to.getSecond() == 59 && to.getNano() == 999_999_999)
            );
        }

        @Test
        @DisplayName("searchPaged with formatted date ranges correctly parses commissioned and updated dates")
        void searchPaged_withFormattedDateRanges() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "DRAFT");
            org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 20);
            when(beaconStationRepo.searchFilteredPaged(any(), any(), any(), any(), any(), anyBoolean(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(entity)));

            var result = service.searchPaged(
                    null, null, null, null, null, null, null, null, null, null, null, null, null,
                    "2026-09-22 00:00:00.000", "2026-09-22 23:59:59.999",
                    "2026-09-22 00:00:00.000", "2026-09-22 23:59:59.999",
                    pageable);

            assertThat(result.getContent()).hasSize(1);
            verify(beaconStationRepo).searchFilteredPaged(
                    isNull(), isNull(), isNull(), isNull(), isNull(), eq(true), eq(List.of()),
                    isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(),
                    eq(LocalDate.of(2026, 9, 22)), eq(LocalDate.of(2026, 9, 22)),
                    argThat(from -> from != null && from.getYear() == 2026 && from.getMonthValue() == 9 && from.getDayOfMonth() == 22 && from.getHour() == 0 && from.getMinute() == 0 && from.getSecond() == 0),
                    argThat(to -> to != null && to.getYear() == 2026 && to.getMonthValue() == 9 && to.getDayOfMonth() == 22 && to.getHour() == 23 && to.getMinute() == 59 && to.getSecond() == 59 && to.getNano() == 999_999_999),
                    eq(pageable)
            );
        }

        @Test
        @DisplayName("findById deleted entity returns status DELETED and deleted audit fields")
        void findByIdDeletedEntity() {
            UUID id = UUID.randomUUID();
            UUID userId = UUID.randomUUID();
            LocalDateTime now = LocalDateTime.now();
            BeaconStation entity = makeEntity(id, "DRAFT");
            entity.setDeletedAt(now);
            entity.setDeletedBy(userId);
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));

            BeaconStationResponse res = service.findById(id);

            assertThat(res.getStatus()).isEqualTo("DELETED");
            assertThat(res.getApprovalStatus()).isEqualTo("ARCHIVED");
            assertThat(res.getDeletedAt()).isEqualTo(now);
            assertThat(res.getDeletedBy()).isEqualTo(userId);
        }
    }

    // ─────── CREATE TESTS ──────────────────────────────────────────

    @Nested
    @DisplayName("CREATE operation")
    class CreateTests {

        @Test
        @DisplayName("create with valid data — saves and returns response")
        void createSuccess() {
            UUID savedId = UUID.randomUUID();
            CreateBeaconStationRequest request = makeCreateRequest();

            when(beaconStationRepo.existsByCode("DEN-002")).thenReturn(false);
            when(buoyRepo.existsByCode("DEN-002")).thenReturn(false);
            when(beaconStationRepo.save(any())).thenAnswer(invocation -> {
                BeaconStation entity = invocation.getArgument(0);
                setId(entity, savedId);
                return entity;
            });

            BeaconStationResponse result = service.create(request);

            assertThat(result.getId()).isEqualTo(savedId);
            assertThat(result.getCode()).isEqualTo("DEN-002");
            assertThat(result.getName()).isEqualTo("Đèn biển mới");
            assertThat(result.getType()).isEqualTo("BEACON_LIGHT");
            assertThat(result.getStatus()).isEqualTo("DRAFT");
            assertThat(result.getApprovalStatus()).isEqualTo("PROPOSED");

            verify(beaconStationRepo, atLeastOnce()).save(any());
            verify(infraHistoryRepo, never()).save(any());
            verify(notificationService).sendApprovalNotification(any());
        }

        @Test
        @DisplayName("create with duplicate code — throws IllegalArgumentException")
        void createDuplicateCode() {
            CreateBeaconStationRequest request = makeCreateRequest();
            when(beaconStationRepo.existsByCode("DEN-002")).thenReturn(true);

            assertThatThrownBy(() -> service.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Mã đã tồn tại");

            verify(beaconStationRepo, never()).save(any());
        }

        @Test
        @DisplayName("create with action=submit — sets PENDING_APPROVAL status")
        void createWithSubmitAction() {
            UUID savedId = UUID.randomUUID();
            CreateBeaconStationRequest request = makeCreateRequest();
            request.setAction("submit");

            when(beaconStationRepo.existsByCode("DEN-002")).thenReturn(false);
            when(buoyRepo.existsByCode("DEN-002")).thenReturn(false);
            when(beaconStationRepo.save(any())).thenAnswer(invocation -> {
                BeaconStation entity = invocation.getArgument(0);
                setId(entity, savedId);
                return entity;
            });

            BeaconStationResponse result = service.create(request);

            assertThat(result.getStatus()).isEqualTo("PENDING_APPROVAL");
            assertThat(result.getApprovalLevel()).isEqualTo(ApprovalLevel.LEVEL_1);
            verify(infraHistoryRepo).save(any());
        }

        @Test
        @DisplayName("create with action=approved — sets APPROVED status and does NOT create history")
        void createWithApprovedAction_doesNotCreateHistory() {
            org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                    new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                            "admin", "pass", java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_SUPER_ADMIN"))));
            try {
                UUID savedId = UUID.randomUUID();
                CreateBeaconStationRequest request = makeCreateRequest();
                request.setAction("approved");

                when(beaconStationRepo.existsByCode("DEN-002")).thenReturn(false);
                when(buoyRepo.existsByCode("DEN-002")).thenReturn(false);
                when(beaconStationRepo.save(any())).thenAnswer(invocation -> {
                    BeaconStation entity = invocation.getArgument(0);
                    setId(entity, savedId);
                    return entity;
                });

                BeaconStationResponse result = service.create(request);

                assertThat(result.getStatus()).isEqualTo("APPROVED");
                assertThat(result.getApprovalLevel()).isEqualTo(ApprovalLevel.LEVEL_2);
                verify(infraHistoryRepo, never()).save(any());
            } finally {
                org.springframework.security.core.context.SecurityContextHolder.clearContext();
            }
        }

        @Test
        @DisplayName("create with future lastMaintenanceDate — throws IllegalArgumentException")
        void createFutureMaintenanceDate() {
            CreateBeaconStationRequest request = makeCreateRequest();
            request.setLastRepairDate(LocalDate.now().plusDays(30));

            when(beaconStationRepo.existsByCode("DEN-002")).thenReturn(false);
            when(buoyRepo.existsByCode("DEN-002")).thenReturn(false);

            assertThatThrownBy(() -> service.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Ngày bảo trì gần nhất");

            verify(beaconStationRepo, never()).save(any());
        }

        @Test
        @DisplayName("create with lightRange > 60.0 succeeds without DecimalMax restriction")
        void create_withLightRangeGreaterThan60_shouldSucceed() {
            UUID savedId = UUID.randomUUID();
            CreateBeaconStationRequest request = makeCreateRequest();
            request.setLightRange(85.5);

            when(beaconStationRepo.existsByCode("DEN-002")).thenReturn(false);
            when(buoyRepo.existsByCode("DEN-002")).thenReturn(false);
            when(beaconStationRepo.save(any())).thenAnswer(invocation -> {
                BeaconStation entity = invocation.getArgument(0);
                setId(entity, savedId);
                return entity;
            });

            BeaconStationResponse result = service.create(request);

            assertThat(result).isNotNull();
            verify(beaconStationRepo, atLeastOnce()).save(beaconStationCaptor.capture());
            assertThat(beaconStationCaptor.getValue().getLightRange()).isEqualTo(85.5);
        }

        @Test
        @DisplayName("generateBeaconStationCode when no existing records returns DBNT-000001")
        void generateBeaconStationCode_whenNoRecords_returnsFirstSequence() {
            when(beaconStationRepo.findMaxBeaconStationCodeSequence()).thenReturn(Optional.empty());
            when(beaconStationRepo.existsCodeAnyState("DBNT-000001")).thenReturn(false);

            String code = service.generateBeaconStationCode();
            assertThat(code).isEqualTo("DBNT-000001");
        }

        @Test
        @DisplayName("generateBeaconStationCode when DBNT-000001 exists returns DBNT-000002")
        void generateBeaconStationCode_whenDBNT000001Exists_returnsDBNT000002() {
            when(beaconStationRepo.findMaxBeaconStationCodeSequence()).thenReturn(Optional.of(1));
            when(beaconStationRepo.existsCodeAnyState("DBNT-000002")).thenReturn(false);

            String code = service.generateBeaconStationCode();
            assertThat(code).isEqualTo("DBNT-000002");
        }

        @Test
        @DisplayName("generateBeaconStationCode when collision occurs loops to next available")
        void generateBeaconStationCode_whenCollision_loopsToNextAvailable() {
            when(beaconStationRepo.findMaxBeaconStationCodeSequence()).thenReturn(Optional.of(1));
            when(beaconStationRepo.existsCodeAnyState("DBNT-000002")).thenReturn(true);
            when(beaconStationRepo.existsCodeAnyState("DBNT-000003")).thenReturn(false);

            String code = service.generateBeaconStationCode();
            assertThat(code).isEqualTo("DBNT-000003");
        }

        @Test
        @DisplayName("generateBeaconStationCode when native query fails uses fallback list")
        void generateBeaconStationCode_whenNativeQueryFails_usesFallbackList() {
            when(beaconStationRepo.findMaxBeaconStationCodeSequence()).thenThrow(new RuntimeException("Native query error"));
            when(beaconStationRepo.findAllCodesWithBeaconPrefix()).thenReturn(List.of("DBNT-000001", "DBNT-000005"));
            when(beaconStationRepo.existsCodeAnyState("DBNT-000006")).thenReturn(false);

            String code = service.generateBeaconStationCode();
            assertThat(code).isEqualTo("DBNT-000006");
        }
    }

    // ─────── UPDATE TESTS ──────────────────────────────────────────

    @Nested
    @DisplayName("UPDATE operation")
    class UpdateTests {

        @Test
        @DisplayName("update mutable fields — saves and returns updated response")
        void updateSuccess() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "DRAFT");
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconStationRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            UpdateBeaconStationRequest request = UpdateBeaconStationRequest.builder()
                    .name("Tên mới")
                    .towerColor("Xanh")
                    .area(BigDecimal.valueOf(18.0))
                    .build();

            BeaconStationResponse result = service.update(id, request);

            assertThat(result.getName()).isEqualTo("Tên mới");
            assertThat(result.getTowerColor()).isEqualTo("Xanh");
            assertThat(result.getArea()).isEqualByComparingTo(BigDecimal.valueOf(18.0));
            // Code should remain immutable
            assertThat(result.getCode()).isEqualTo("DEN-001");

            verify(beaconStationRepo, atLeastOnce()).save(any());
            verify(historyRepo, never()).save(any());
        }

        @Test
        @DisplayName("update clear field — sets field to null and persists empty value")
        void updateClearField_persistsNullValue() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "DRAFT");
            entity.setDetailedLocation("Vị trí chi tiết ban đầu");
            entity.setOperator("Đơn vị vận hành ban đầu");
            entity.setStaffCount(10);
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconStationRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            UpdateBeaconStationRequest request = new UpdateBeaconStationRequest();
            request.setName("Tên giữ nguyên");
            request.setDetailedLocation(null);
            request.setOperator("");
            request.setStaffCount(null);

            BeaconStationResponse result = service.update(id, request);

            assertThat(result.getDetailedLocation()).isNull();
            assertThat(result.getOperator()).isNull();
            assertThat(result.getStaffCount()).isNull();
            assertThat(entity.getDetailedLocation()).isNull();
            assertThat(entity.getOperator()).isNull();
            assertThat(entity.getStaffCount()).isNull();
        }

        @Test
        @DisplayName("update deleted entity — throws EntityNotFoundException")
        void updateDeletedEntity() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "DELETED");
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));

            UpdateBeaconStationRequest request = UpdateBeaconStationRequest.builder()
                    .name("Tên mới")
                    .build();

            assertThatThrownBy(() -> service.update(id, request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("đã bị xóa");

            verify(beaconStationRepo, never()).save(any());
        }

        @Test
        @DisplayName("update with approved type change — throws IllegalArgumentException")
        void updateApprovedTypeChange() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "PUBLISHED");
            entity.setType("LIGHTHOUSE");
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));

            UpdateBeaconStationRequest request = UpdateBeaconStationRequest.builder()
                    .type("BEACON_MARK")
                    .build();

            assertThatThrownBy(() -> service.update(id, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Loại đèn biển không thể thay đổi");
        }

        @Test
        @DisplayName("update on approved entity — keeps APPROVED status and records history")
        void updateApprovedEntityRevertsStatus() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "APPROVED_L2");
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
            entity.setApprovalLevel(2);
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconStationRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            UpdateBeaconStationRequest request = UpdateBeaconStationRequest.builder()
                    .name("Tên sửa đổi")
                    .build();

            BeaconStationResponse result = service.update(id, request);

            // Sửa bản Đã phê duyệt (action mặc định draft) → giữ trạng thái chuẩn APPROVED
            assertThat(result.getStatus()).isEqualTo("APPROVED");
            assertThat(result.getApprovalStatus()).isEqualTo("APPROVED");
            verify(infraHistoryRepo, atLeastOnce()).save(any());
        }

        @Test
        @DisplayName("update approved entity with identical BigDecimal values (different scale) — does not create history")
        void updateApprovedEntity_withSameBigDecimalScaleDifference_doesNotCreateHistory() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "APPROVED_L2");
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
            entity.setApprovalLevel(2);
            entity.setArea(new BigDecimal("100.0000"));
            entity.setTowerHeight(new BigDecimal("25.0000"));
            entity.setLightHeight(new BigDecimal("30.0000"));
            entity.setStationArea(new BigDecimal("500.0000"));
            entity.setLightRange(15.0);
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconStationRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            UpdateBeaconStationRequest request = UpdateBeaconStationRequest.builder()
                    .name(entity.getName())
                    .area(new BigDecimal("100"))
                    .towerHeight(new BigDecimal("25.0"))
                    .lightHeight(new BigDecimal("30"))
                    .stationArea(new BigDecimal("500.00"))
                    .lightRange(15.0)
                    .build();

            BeaconStationResponse result = service.update(id, request);

            assertThat(result.getStatus()).isEqualTo("APPROVED");
            verify(infraHistoryRepo, never()).save(any());
        }

        @Test
        @DisplayName("update keeps code immutable")
        void updateCannotChangeCode() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "DRAFT");
            // The UpdateBeaconStationRequest has no code field — it's not mutable
            // Verify that the entity's code stays unchanged after any update
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconStationRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            UpdateBeaconStationRequest request = UpdateBeaconStationRequest.builder()
                    .name("Tên mới")
                    .build();

            BeaconStationResponse result = service.update(id, request);

            assertThat(result.getCode()).isEqualTo("DEN-001");
        }

        @Test
        @DisplayName("update with geometryType cleared — clears all location fields and deletes spatial object")
        void update_whenGeometryTypeCleared_shouldClearAllLocationFieldsAndSpatialObject() {
            UUID id = UUID.randomUUID();
            UUID spatialId = UUID.randomUUID();
            UUID symbolId = UUID.randomUUID();

            BeaconStation entity = makeEntity(id, "APPROVED_L2");
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
            entity.setApprovalLevel(2);
            entity.setGeometryType("POINT");
            entity.setSpatialId(spatialId);
            entity.setMapSymbolId(symbolId);
            entity.setCoordinateSystem(1);
            entity.setDisplayRule("Độ, phút, giây (DMS)");

            GisSpatialObject spatial = new GisSpatialObject();
            spatial.setId(spatialId);
            spatial.setCoordinates("POINT (106.7 20.8)");
            when(gisSpatialObjectService.findById(spatialId)).thenReturn(Optional.of(spatial));

            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconStationRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            UpdateBeaconStationRequest request = UpdateBeaconStationRequest.builder()
                    .name(entity.getName())
                    .geometryType(null)
                    .coordinates(null)
                    .mapSymbolId(null)
                    .coordinateSystem(null)
                    .displayRule(null)
                    .build();

            BeaconStationResponse result = service.update(id, request);

            assertThat(result.getGeometryType()).isNull();
            assertThat(result.getMapSymbolId()).isNull();
            assertThat(result.getCoordinateSystem()).isNull();
            assertThat(result.getDisplayRule()).isNull();
            assertThat(result.getCoordinates()).isNull();

            verify(gisSpatialObjectService).delete(spatialId);
            verify(beaconStationRepo, atLeastOnce()).save(beaconStationCaptor.capture());
            BeaconStation saved = beaconStationCaptor.getValue();
            assertThat(saved.getSpatialId()).isNull();
            assertThat(saved.getGeometryType()).isNull();
            assertThat(saved.getMapSymbolId()).isNull();
            assertThat(saved.getCoordinateSystem()).isNull();
            assertThat(saved.getDisplayRule()).isNull();
        }
    }

    // ─────── DELETE TESTS ──────────────────────────────────────────

    @Nested
    @DisplayName("DELETE (soft) operation")
    class DeleteTests {

        @Test
        @DisplayName("delete active entity — sets DELETED status")
        void deleteSuccess() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "DRAFT");
            entity.setSpatialId(UUID.randomUUID());
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconStationRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            service.delete(id);

            verify(beaconStationRepo).save(beaconStationCaptor.capture());
            BeaconStation saved = beaconStationCaptor.getValue();
            assertThat(saved.getStatus()).isEqualTo("DELETED");
            assertThat(saved.getApprovalStatus()).isEqualTo(ApprovalStatus.ARCHIVED);
            assertThat(saved.getDeletedAt()).isNotNull();
            verify(infraHistoryRepo).save(any());
            verify(gisSpatialObjectService).delete(entity.getSpatialId());
        }

        @Test
        @DisplayName("delete already deleted entity — throws IllegalArgumentException")
        void deleteAlreadyDeleted() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "DELETED");
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(() -> service.delete(id))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("đã bị xóa trước đó");

            verify(beaconStationRepo, never()).save(any());
        }

        @Test
        @DisplayName("delete entity in approval process — throws IllegalStateException")
        void deleteInApprovalProcess() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "PENDING_APPROVAL");
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(() -> service.delete(id))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Không thể xóa")
                    .hasMessageContaining("chờ phê duyệt");
        }

        @Test
        @DisplayName("delete not found — throws EntityNotFoundException")
        void deleteNotFound() {
            UUID id = UUID.randomUUID();
            when(beaconStationRepo.findById(id)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.delete(id))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    // ─────── APPROVAL TESTS ────────────────────────────────────────

    @Nested
    @DisplayName("Approval workflow")
    class ApprovalTests {

        @Test
        @DisplayName("submitForApproval — transitions from DRAFT to PENDING_APPROVAL")
        void submitForApproval() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "DRAFT");
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconStationRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            service.submitForApproval(id);

            verify(beaconStationRepo).save(beaconStationCaptor.capture());
            BeaconStation saved = beaconStationCaptor.getValue();
            assertThat(saved.getStatus()).isEqualTo("PENDING_APPROVAL");
            assertThat(saved.getApprovalStatus()).isEqualTo(ApprovalStatus.PROPOSED);
            assertThat(saved.getApprovalLevel()).isEqualTo(1);
            verify(notificationService).sendApprovalNotification(entity);
        }

        @Test
        @DisplayName("submitForApproval — resubmit từ REJECTED_LEVEL1/REJECTED_LEVEL2 (gửi lại sau khi bị trả về)")
        void submitForApprovalFromRejected() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "REJECTED_LEVEL1");
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconStationRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            service.submitForApproval(id);

            verify(beaconStationRepo).save(beaconStationCaptor.capture());
            BeaconStation saved = beaconStationCaptor.getValue();
            assertThat(saved.getStatus()).isEqualTo("PENDING_APPROVAL");
            assertThat(saved.getApprovalStatus()).isEqualTo(ApprovalStatus.PROPOSED);
            assertThat(saved.getApprovalLevel()).isEqualTo(1);
        }

        @Test
        @DisplayName("submitForApproval — throws when not DRAFT")
        void submitForApprovalNotDraft() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "PENDING_APPROVAL");
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(() -> service.submitForApproval(id))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Lưu tạm hoặc bị trả về");

            verify(beaconStationRepo, never()).save(any());
        }

        @Test
        @DisplayName("approveL1 — transitions from PENDING_APPROVAL to APPROVED")
        void approveL1() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "PENDING_APPROVAL");
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconStationRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            BeaconStationResponse result = service.approveL1(id,
                    java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"), null);

            verify(beaconStationRepo).save(beaconStationCaptor.capture());
            BeaconStation saved = beaconStationCaptor.getValue();
            assertThat(saved.getStatus()).isEqualTo(ApprovalStatus.APPROVED_LEVEL1.name());
            assertThat(saved.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED_LEVEL1);
            assertThat(saved.getApproverLevel1())
                    .isEqualTo(java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"));
            assertThat(saved.getApprovedDateLevel1()).isNotNull();
            assertThat(result.getStatus()).isEqualTo(ApprovalStatus.APPROVED_LEVEL1.name());
            verify(infraHistoryRepo).save(any());
        }

        @Test
        @DisplayName("approveL1 — throws when not PENDING_APPROVAL")
        void approveL1WrongStatus() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "DRAFT");
            entity.setApprovedBy(null);
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(() -> service.approveL1(id,
                    java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"), null))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Không ở trạng thái chờ phê duyệt L1");
        }

        @Test
        @DisplayName("reject with valid reason — transitions to REJECTED_LEVEL1 (theo cấp đang chờ)")
        void rejectValid() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "PENDING_APPROVAL");
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconStationRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            BeaconStationResponse result = service.reject(id,
                    "Lý do từ chối hợp lệ (đủ 10 ký tự)",
                    java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"));

            verify(beaconStationRepo).save(beaconStationCaptor.capture());
            BeaconStation saved = beaconStationCaptor.getValue();
            assertThat(saved.getStatus()).isEqualTo("REJECTED_LEVEL1");
            assertThat(saved.getApprovalStatus()).isEqualTo(ApprovalStatus.REJECTED_LEVEL1);
            assertThat(saved.getRejectionReason()).isEqualTo("Lý do từ chối hợp lệ (đủ 10 ký tự)");
            assertThat(result.getStatus()).isEqualTo("REJECTED_LEVEL1");
            assertThat(result.getApprovalStatus()).isEqualTo("REJECTED_LEVEL1");
            verify(notificationService).sendRejectionNotification(entity,
                    "Lý do từ chối hợp lệ (đủ 10 ký tự)");
        }

        @Test
        @DisplayName("reject with short reason — throws IllegalArgumentException")
        void rejectShortReason() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "PENDING_APPROVAL");
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(
                    () -> service.reject(id, "Ngắn", java.util.UUID.fromString("00000000-0000-0000-0000-000000000002")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("ít nhất 10 ký tự");
        }

        @Test
        @DisplayName("reject with null reason — throws IllegalArgumentException")
        void rejectNullReason() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "PENDING_APPROVAL");
            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));

            assertThatThrownBy(
                    () -> service.reject(id, null, java.util.UUID.fromString("00000000-0000-0000-0000-000000000002")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("ít nhất 10 ký tự");
        }
    }

    @Nested
    @DisplayName("Lịch sử thay đổi (Audit trail) — chuẩn /vts-operation-center")
    class HistoryTests {

        @Test
        @DisplayName("getHistory — lấy đúng tên user thực hiện và đơn vị của user đó")
        void getHistoryResolvesActorAndUserUnit() {
            UUID stationId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();

            when(beaconStationRepo.findById(stationId)).thenReturn(Optional.of(makeEntity(stationId, "APPROVED")));

            OrgUnit orgUnit = new OrgUnit();
            orgUnit.setName("Cảng vụ Hàng hải Hải Phòng");

            User user = new User();
            user.setFullName("Trần Văn B");
            user.setOrgUnit(orgUnit);
            setId(user, userId);

            InfrastructureHistory historyRecord = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(stationId)
                    .refType(InfrastructureType.LIGHTHOUSE)
                    .approvalLevel(ApprovalLevel.LEVEL_2)
                    .status(InfrastructureHistoryStatus.UPDATED)
                    .approvedBy(userId)
                    .approvedDate(LocalDateTime.now())
                    .changedField("Chiều cao tháp đèn (m)")
                    .previousValue("12")
                    .newValue("15")
                    .build();

            when(infraHistoryRepo.findByRefTypeAndRefIdOrderByApprovedDateDesc(eq(InfrastructureType.LIGHTHOUSE), eq(stationId), any(Pageable.class)))
                    .thenReturn(List.of(historyRecord));
            when(userRepository.findAllByIdInWithOrgUnit(any()))
                    .thenReturn(List.of(user));

            List<BeaconHistoryEntry> entries = service.getHistory(stationId, 0, 20, null, null, null);

            assertThat(entries).hasSize(1);
            BeaconHistoryEntry entry = entries.get(0);
            assertThat(entry.getApprovedBy()).isEqualTo("Trần Văn B");
            assertThat(entry.getOrgUnitName()).isEqualTo("Cảng vụ Hàng hải Hải Phòng");
            assertThat(entry.getChangedField()).isEqualTo("Chiều cao tháp đèn (m)");
            assertThat(entry.getPreviousValue()).isEqualTo("12");
            assertThat(entry.getNewValue()).isEqualTo("15");
        }

        @Test
        @DisplayName("getHistory — lọc theo từ khóa và khoảng ngày gọi searchHistory")
        void getHistoryWithKeywordAndDateRange() {
            UUID stationId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();

            when(beaconStationRepo.findById(stationId)).thenReturn(Optional.of(makeEntity(stationId, "APPROVED")));

            InfrastructureHistory historyRecord = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(stationId)
                    .refType(InfrastructureType.LIGHTHOUSE)
                    .approvalLevel(ApprovalLevel.LEVEL_2)
                    .status(InfrastructureHistoryStatus.UPDATED)
                    .approvedBy(userId)
                    .approvedDate(LocalDateTime.of(2026, 3, 10, 10, 0))
                    .changedField("Tên đèn biển")
                    .previousValue("Đèn biển cũ")
                    .newValue("Đèn biển mới")
                    .build();

            when(infraHistoryRepo.searchHistory(eq(InfrastructureType.LIGHTHOUSE), eq(stationId), eq("den bien"), any(), any(), any(Pageable.class)))
                    .thenReturn(List.of(historyRecord));
            when(userRepository.findAllByIdInWithOrgUnit(any()))
                    .thenReturn(List.of());

            List<BeaconHistoryEntry> entries = service.getHistory(stationId, 0, 10, "đèn biển", "2026-03-01", "2026-03-31");

            assertThat(entries).hasSize(1);
            assertThat(entries.get(0).getChangedField()).isEqualTo("Tên đèn biển");
            verify(infraHistoryRepo).searchHistory(eq(InfrastructureType.LIGHTHOUSE), eq(stationId), eq("den bien"), any(), any(), any(Pageable.class));
        }

        @Test
        @DisplayName("update — ghi nhận đầy đủ từng trường thay đổi vào infrastructure_history với tên hiển thị chuẩn")
        void updateRecordsDetailedChanges() {
            UUID id = UUID.randomUUID();
            BeaconStation entity = makeEntity(id, "APPROVED");
            entity.setTowerHeight(BigDecimal.valueOf(10.0));
            entity.setLightHeight(BigDecimal.valueOf(15.0));
            entity.setTowerColor("Trắng");

            when(beaconStationRepo.findById(id)).thenReturn(Optional.of(entity));
            when(beaconStationRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            UpdateBeaconStationRequest request = UpdateBeaconStationRequest.builder()
                    .name(entity.getName())
                    .type(entity.getType())
                    .unitId(entity.getUnitId())
                    .towerHeight(BigDecimal.valueOf(12.0))
                    .lightHeight(BigDecimal.valueOf(18.0))
                    .towerColor("Đỏ - Trắng")
                    .build();

            service.update(id, request);

            ArgumentCaptor<InfrastructureHistory> historyCaptor = ArgumentCaptor.forClass(InfrastructureHistory.class);
            verify(infraHistoryRepo, atLeast(3)).save(historyCaptor.capture());

            List<InfrastructureHistory> savedEntries = historyCaptor.getAllValues();
            List<String> changedFields = savedEntries.stream().map(InfrastructureHistory::getChangedField).toList();

            assertThat(changedFields).contains("Chiều cao tháp đèn (m)", "Chiều cao tâm sáng (m)", "Màu sắc tháp đèn");
        }

        @Test
        @DisplayName("getHistory — lọc bỏ các bản ghi CREATED, approvalStatus và các bản ghi không thay đổi giá trị")
        void getHistoryFiltersOutCreatedAndApprovalStatusAndEqualValues() {
            UUID stationId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();

            when(beaconStationRepo.findById(stationId)).thenReturn(Optional.of(makeEntity(stationId, "APPROVED")));

            InfrastructureHistory createdRecord = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(stationId)
                    .refType(InfrastructureType.LIGHTHOUSE)
                    .status(InfrastructureHistoryStatus.CREATED)
                    .approvedBy(userId)
                    .approvedDate(LocalDateTime.now())
                    .newValue("{\"name\":\"Đèn biển\"}")
                    .build();

            InfrastructureHistory approvalStatusRecord = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(stationId)
                    .refType(InfrastructureType.LIGHTHOUSE)
                    .status(InfrastructureHistoryStatus.UPDATED)
                    .approvedBy(userId)
                    .approvedDate(LocalDateTime.now())
                    .changedField("Trạng thái phê duyệt")
                    .previousValue("Đã duyệt")
                    .newValue("Đã duyệt")
                    .build();

            InfrastructureHistory equalValueRecord = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(stationId)
                    .refType(InfrastructureType.LIGHTHOUSE)
                    .status(InfrastructureHistoryStatus.UPDATED)
                    .approvedBy(userId)
                    .approvedDate(LocalDateTime.now())
                    .changedField("Ghi chú")
                    .previousValue("Không có")
                    .newValue("Không có")
                    .build();

            InfrastructureHistory genuineRecord = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(stationId)
                    .refType(InfrastructureType.LIGHTHOUSE)
                    .status(InfrastructureHistoryStatus.UPDATED)
                    .approvedBy(userId)
                    .approvedDate(LocalDateTime.now())
                    .changedField("Tên đèn biển")
                    .previousValue("Đèn biển cũ")
                    .newValue("Đèn biển mới")
                    .build();

            when(infraHistoryRepo.findByRefTypeAndRefIdOrderByApprovedDateDesc(eq(InfrastructureType.LIGHTHOUSE), eq(stationId), any(Pageable.class)))
                    .thenReturn(List.of(createdRecord, approvalStatusRecord, equalValueRecord, genuineRecord));
            when(userRepository.findAllByIdInWithOrgUnit(any()))
                    .thenReturn(List.of());

            List<BeaconHistoryEntry> entries = service.getHistory(stationId, 0, 20, null, null, null);

            assertThat(entries).hasSize(1);
            assertThat(entries.get(0).getChangedField()).isEqualTo("Tên đèn biển");
        }

        @Test
        @DisplayName("getHistory — lọc sạch các trường metadata phê duyệt và ngày gửi duyệt")
        void getHistoryFiltersApprovalMetadataFields() {
            UUID stationId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();
            LocalDateTime now = LocalDateTime.now();

            when(beaconStationRepo.findById(stationId)).thenReturn(Optional.of(makeEntity(stationId, "APPROVED")));

            InfrastructureHistory approvalContent1 = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(stationId)
                    .refType(InfrastructureType.LIGHTHOUSE)
                    .status(InfrastructureHistoryStatus.UPDATED)
                    .approvedBy(userId)
                    .approvedDate(now)
                    .changedField("approvalContentLevel1")
                    .previousValue(null)
                    .newValue("Cấp Cục phê duyệt trực tiếp")
                    .build();

            InfrastructureHistory submittedDateRecord = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(stationId)
                    .refType(InfrastructureType.LIGHTHOUSE)
                    .status(InfrastructureHistoryStatus.UPDATED)
                    .approvedBy(userId)
                    .approvedDate(now)
                    .changedField("submittedDate")
                    .previousValue(null)
                    .newValue(now.toString())
                    .build();

            InfrastructureHistory rejectionRecord = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(stationId)
                    .refType(InfrastructureType.LIGHTHOUSE)
                    .status(InfrastructureHistoryStatus.UPDATED)
                    .approvedBy(userId)
                    .approvedDate(now)
                    .changedField("rejectionReason")
                    .previousValue(null)
                    .newValue("Hồ sơ chưa đủ điều kiện")
                    .build();

            InfrastructureHistory genuineRecord = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(stationId)
                    .refType(InfrastructureType.LIGHTHOUSE)
                    .status(InfrastructureHistoryStatus.UPDATED)
                    .approvedBy(userId)
                    .approvedDate(now)
                    .changedField("towerHeight")
                    .previousValue("25.0")
                    .newValue("28.0")
                    .build();

            when(infraHistoryRepo.findByRefTypeAndRefIdOrderByApprovedDateDesc(eq(InfrastructureType.LIGHTHOUSE), eq(stationId), any(Pageable.class)))
                    .thenReturn(List.of(approvalContent1, submittedDateRecord, rejectionRecord, genuineRecord));
            when(userRepository.findAllByIdInWithOrgUnit(any()))
                    .thenReturn(List.of());

            List<BeaconHistoryEntry> entries = service.getHistory(stationId, 0, 20, null, null, null);

            assertThat(entries).hasSize(1);
            assertThat(entries.get(0).getChangedField()).isEqualTo("towerHeight");
            assertThat(entries.get(0).getNewValue()).isEqualTo("28.0");
        }

        @Test
        @DisplayName("getHistory — khử trùng lặp bản ghi tiếng Anh và tiếng Việt trong cùng phiên cập nhật")
        void getHistoryDeduplicatesCanonicalFieldsInSameSession() {
            UUID stationId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();
            LocalDateTime now = LocalDateTime.now();

            when(beaconStationRepo.findById(stationId)).thenReturn(Optional.of(makeEntity(stationId, "APPROVED")));

            InfrastructureHistory engRecord = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(stationId)
                    .refType(InfrastructureType.LIGHTHOUSE)
                    .status(InfrastructureHistoryStatus.UPDATED)
                    .approvedBy(userId)
                    .approvedDate(now)
                    .changedField("unitId")
                    .previousValue("Đơn vị 1")
                    .newValue("Đơn vị 2")
                    .build();

            InfrastructureHistory viRecord = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(stationId)
                    .refType(InfrastructureType.LIGHTHOUSE)
                    .status(InfrastructureHistoryStatus.UPDATED)
                    .approvedBy(userId)
                    .approvedDate(now)
                    .changedField("Đơn vị quản lý")
                    .previousValue("Đơn vị 1")
                    .newValue("Đơn vị 2")
                    .build();

            when(infraHistoryRepo.findByRefTypeAndRefIdOrderByApprovedDateDesc(eq(InfrastructureType.LIGHTHOUSE), eq(stationId), any(Pageable.class)))
                    .thenReturn(List.of(engRecord, viRecord));
            when(userRepository.findAllByIdInWithOrgUnit(any()))
                    .thenReturn(List.of());

            List<BeaconHistoryEntry> entries = service.getHistory(stationId, 0, 20, null, null, null);

            assertThat(entries).hasSize(1);
            assertThat(entries.get(0).getChangedField()).isEqualTo("unitId");
        }

        @Test
        @DisplayName("getHistory — fallback người thực hiện sang 'Hệ thống' khi không xác định được danh tính")
        void getHistoryFallbackUserNameToSystemWhenNull() {
            UUID stationId = UUID.randomUUID();
            LocalDateTime now = LocalDateTime.now();

            when(beaconStationRepo.findById(stationId)).thenReturn(Optional.of(makeEntity(stationId, "APPROVED")));

            InfrastructureHistory genuineRecord = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(stationId)
                    .refType(InfrastructureType.LIGHTHOUSE)
                    .status(InfrastructureHistoryStatus.UPDATED)
                    .approvedBy(null)
                    .approvedDate(now)
                    .changedField("Tên đèn biển")
                    .previousValue("Cũ")
                    .newValue("Mới")
                    .build();

            when(infraHistoryRepo.findByRefTypeAndRefIdOrderByApprovedDateDesc(eq(InfrastructureType.LIGHTHOUSE), eq(stationId), any(Pageable.class)))
                    .thenReturn(List.of(genuineRecord));

            List<BeaconHistoryEntry> entries = service.getHistory(stationId, 0, 20, null, null, null);

            assertThat(entries).hasSize(1);
            assertThat(entries.get(0).getApprovedBy()).isEqualTo("Hệ thống");
        }

        @Test
        @DisplayName("uploadAttachments — hồ sơ vừa tạo mới không ghi nhận lịch sử đính kèm")
        void uploadAttachmentsForNewlyCreatedRecordDoesNotLogHistory() {
            UUID stationId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();
            BeaconStation newlyCreatedStation = makeEntity(stationId, "APPROVED");
            newlyCreatedStation.setCreatedAt(LocalDateTime.now().minusSeconds(5));

            org.springframework.test.util.ReflectionTestUtils.setField(service, "attachmentPath", "target/test-uploads");

            when(beaconStationRepo.findById(stationId)).thenReturn(Optional.of(newlyCreatedStation));

            org.springframework.mock.web.MockMultipartFile file = new org.springframework.mock.web.MockMultipartFile(
                    "files", "test.pdf", "application/pdf", "test content".getBytes());

            when(attachmentRepository.countByEntityTypeAndEntityId(any(), any())).thenReturn(0L);
            when(attachmentRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            service.uploadAttachments(stationId, List.of(file), userId);

            verify(infraHistoryRepo, never()).save(any());
        }

        @Test
        @DisplayName("getHistory — khi hồ sơ ở trạng thái Lưu tạm (DRAFT) thì trả về danh sách rỗng")
        void getHistory_whenDraft_returnsEmptyList() {
            UUID stationId = UUID.randomUUID();
            BeaconStation draftStation = makeEntity(stationId, "DRAFT");
            draftStation.setApprovalStatus(ApprovalStatus.DRAFT);

            when(beaconStationRepo.findById(stationId)).thenReturn(Optional.of(draftStation));

            List<BeaconHistoryEntry> entries = service.getHistory(stationId, 0, 20, null, null, null);

            assertThat(entries).isEmpty();
            verify(infraHistoryRepo, never()).findByRefTypeAndRefIdOrderByApprovedDateDesc(any(), any(), any());
            verify(infraHistoryRepo, never()).searchHistory(any(), any(), any(), any(), any(), any());
        }

        @Test
        @DisplayName("deleteAttachment — khi hồ sơ ở trạng thái DRAFT thì không ghi nhật ký lịch sử")
        void deleteAttachment_whenDraft_doesNotRecordHistory() {
            UUID stationId = UUID.randomUUID();
            UUID attachmentId = UUID.randomUUID();
            BeaconStation draftStation = makeEntity(stationId, "DRAFT");
            draftStation.setApprovalStatus(ApprovalStatus.DRAFT);

            com.hanghai.kchtg.port.entity.Attachment attachment = new com.hanghai.kchtg.port.entity.Attachment();
            attachment.setId(attachmentId);
            attachment.setEntityType("BEACON_LIGHT");
            attachment.setEntityId(stationId);
            attachment.setFileName("test.pdf");
            attachment.setFilePath("target/test-uploads/test.pdf");

            when(attachmentRepository.findById(attachmentId)).thenReturn(Optional.of(attachment));
            when(beaconStationRepo.findById(stationId)).thenReturn(Optional.of(draftStation));

            service.deleteAttachment(stationId, attachmentId);

            verify(attachmentRepository).delete(attachment);
            verify(infraHistoryRepo, never()).save(any());
        }

        @Test
        @DisplayName("deleteAttachment — khi hồ sơ ĐÃ DUYỆT thì ghi nhật ký xóa tệp đính kèm")
        void deleteAttachment_whenApproved_recordsHistory() {
            UUID stationId = UUID.randomUUID();
            UUID attachmentId = UUID.randomUUID();
            BeaconStation approvedStation = makeEntity(stationId, "APPROVED");
            approvedStation.setApprovalStatus(ApprovalStatus.APPROVED);

            com.hanghai.kchtg.port.entity.Attachment attachment = new com.hanghai.kchtg.port.entity.Attachment();
            attachment.setId(attachmentId);
            attachment.setEntityType("BEACON_LIGHT");
            attachment.setEntityId(stationId);
            attachment.setFileName("test.pdf");
            attachment.setFilePath("target/test-uploads/test.pdf");

            when(attachmentRepository.findById(attachmentId)).thenReturn(Optional.of(attachment));
            when(attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc("BEACON_LIGHT", stationId))
                    .thenReturn(List.of(attachment));
            when(beaconStationRepo.findById(stationId)).thenReturn(Optional.of(approvedStation));

            service.deleteAttachment(stationId, attachmentId);

            verify(attachmentRepository).delete(attachment);
            verify(infraHistoryRepo).save(argThat(h ->
                    h.getRefId().equals(stationId)
                            && h.getStatus() == InfrastructureHistoryStatus.ATTACHMENT_DELETED
                            && "Tài liệu đính kèm".equals(h.getChangedField())
                            && "test.pdf".equals(h.getPreviousValue())
            ));
        }
    }
}



