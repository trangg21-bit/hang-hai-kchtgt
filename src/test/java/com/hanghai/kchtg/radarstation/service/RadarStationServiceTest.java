package com.hanghai.kchtg.radarstation.service;

import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.radarstation.dto.RadarStationCreateRequest;
import com.hanghai.kchtg.radarstation.dto.RadarStationResponse;
import com.hanghai.kchtg.radarstation.dto.RadarStationUpdateRequest;
import com.hanghai.kchtg.radarstation.entity.RadarStation;
import com.hanghai.kchtg.radarstation.repository.RadarStationRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.vtssystem.dto.HistoryEntry;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RadarStationServiceTest {

    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID TEST_ID_2 = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock
    private RadarStationRepository repository;

    @Mock
    private InfrastructureHistoryRepository historyRepository;

    @Mock
    private InfrastructureAttachmentRepository attachmentRepository;

    @Mock
    private GisSpatialObjectService gisSpatialObjectService;

    @Mock
    private OrgUnitCacheService orgUnitCacheService;

    @Mock
    private OrgUnitScopeService orgUnitScopeService;

    @Mock
    private InfrastructureApprovalService approvalService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private VtsSystemRepository vtsSystemRepository;

    @Mock
    private PortRepository portRepository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private RadarStationService service;

    private RadarStation entity;
    private RadarStationCreateRequest createRequest;

    @BeforeEach
    void setUp() {
        lenient().when(attachmentRepository.findByRefIdAndRefTypeOrderByUploadedDateDesc(any(), any()))
                .thenReturn(Collections.emptyList());
        lenient().when(gisSpatialObjectService.createOrUpdate(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenAnswer(inv -> {
                    GisSpatialObject spatial = new GisSpatialObject();
                    spatial.setId(UUID.randomUUID());
                    return spatial;
                });
        lenient().when(orgUnitScopeService.currentUserScope())
                .thenReturn(OrgUnitScopeService.Scope.all());

        entity = RadarStation.builder()
                .id(TEST_ID)
                .stationName("Tram ABC")
                .location("Hà Nội")
                .approvalStatus(ApprovalStatus.DRAFT)
                .createdBy(UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .build();

        createRequest = RadarStationCreateRequest.builder()
                .stationName("Tram ABC")
                .location("Hà Nội")
                .build();
    }

    @Test
    void testCreate() {
        RadarStation saved = RadarStation.builder()
                .id(TEST_ID).stationName("Tram ABC").location("Hà Nội")
                .approvalStatus(ApprovalStatus.DRAFT)
                .createdBy(UUID.fromString("00000000-0000-0000-0000-000000000001")).build();

        when(repository.save(any())).thenReturn(saved);
        when(historyRepository.save(any())).thenReturn(mock(InfrastructureHistory.class));

        RadarStationResponse response = service.create(createRequest,
                UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertNotNull(response);
        assertEquals(ApprovalStatus.DRAFT, response.getApprovalStatus());
        verify(repository, times(1)).save(any());
    }

    @Test
    void testGetById() {
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        RadarStationResponse response = service.getById(TEST_ID);
        assertNotNull(response);
        assertEquals(TEST_ID, response.getId());
    }

    @Test
    void testGetById_NotFound() {
        when(repository.findById(TEST_ID_2)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.getById(TEST_ID_2));
    }

    @Test
    void testGetById_DeletedRecord() {
        UUID deleterId = UUID.fromString("00000000-0000-0000-0000-000000000099");
        LocalDateTime deletedTime = LocalDateTime.now();
        RadarStation deletedEntity = RadarStation.builder()
                .id(TEST_ID)
                .stationName("Tram Deleted")
                .location("Hà Nội")
                .approvalStatus(ApprovalStatus.ARCHIVED)
                .deletedAt(deletedTime)
                .deletedBy(deleterId)
                .createdBy(UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .build();

        User deleter = new User();
        deleter.setId(deleterId);
        deleter.setFullName("Cán bộ xóa");
        when(userRepository.findAllById(any())).thenReturn(List.of(deleter));
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(deletedEntity));

        RadarStationResponse response = service.getById(TEST_ID);
        assertNotNull(response);
        assertEquals(TEST_ID, response.getId());
        assertEquals(deleterId, response.getDeletedBy());
        assertEquals("Cán bộ xóa", response.getDeletedByName());
        assertEquals(deletedTime, response.getDeletedAt());
    }

    @Test
    void testUpdate() {
        RadarStationUpdateRequest updateReq = RadarStationUpdateRequest.builder()
                .stationName("Tram moi").build();
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);

        RadarStationResponse response = service.update(TEST_ID, updateReq,
                UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertNotNull(response);
        verify(repository, times(1)).save(any());
    }

    @Test
    void testDelete() {
        RadarStation draftEntity = RadarStation.builder()
                .id(TEST_ID).stationName("ABC").location("Hà Nội")
                .approvalStatus(ApprovalStatus.DRAFT)
                .createdBy(UUID.fromString("00000000-0000-0000-0000-000000000001")).build();

        when(repository.findById(TEST_ID)).thenReturn(Optional.of(draftEntity));
        when(repository.save(any())).thenReturn(draftEntity);
        when(historyRepository.save(any())).thenReturn(mock(InfrastructureHistory.class));

        service.delete(TEST_ID, UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertNotNull(draftEntity.getDeletedAt());
        assertEquals(ApprovalStatus.ARCHIVED, draftEntity.getApprovalStatus());
    }

    @Test
    void testSubmitForApproval() {
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);

        service.submitForApproval(TEST_ID,
                UUID.fromString("00000000-0000-0000-0000-000000000001"));
        verify(approvalService, times(1)).submit(eq(entity), eq(InfrastructureType.RADAR_STATION), any());
    }

    @Test
    void testApproveLevel1() {
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);

        service.approveLevel1(TEST_ID,
                UUID.fromString("00000000-0000-0000-0000-000000000002"), "OK");
        verify(approvalService, times(1)).approveC1(eq(entity), eq(InfrastructureType.RADAR_STATION), eq("APPROVED"), eq("OK"), any());
    }

    @Test
    void testApproveLevel2() {
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);

        service.approveLevel2(TEST_ID,
                UUID.fromString("00000000-0000-0000-0000-000000000003"), "OK C2");
        verify(approvalService, times(1)).approveC2(eq(entity), eq(InfrastructureType.RADAR_STATION), eq("APPROVED"), eq("OK C2"), any());
    }

    @Test
    void testRejectLevel1() {
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);

        service.rejectLevel1(TEST_ID,
                UUID.fromString("00000000-0000-0000-0000-000000000002"), "Không đủ điều kiện");
        verify(approvalService, times(1)).approveC1(eq(entity), eq(InfrastructureType.RADAR_STATION), eq("REJECTED"), eq("Không đủ điều kiện"), any());
    }

    @Test
    void testRejectLevel2() {
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);

        service.rejectLevel2(TEST_ID,
                UUID.fromString("00000000-0000-0000-0000-000000000003"), "Lý do cấp 2");
        verify(approvalService, times(1)).approveC2(eq(entity), eq(InfrastructureType.RADAR_STATION), eq("REJECTED"), eq("Lý do cấp 2"), any());
    }

    @Test
    void testGetHistory() {
        when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
        InfrastructureHistory history = InfrastructureHistory.builder()
                .id(UUID.fromString("00000000-0000-0000-0000-000000000001")).refId(TEST_ID)
                .refType(InfrastructureType.RADAR_STATION)
                .approvalLevel(ApprovalLevel.LEVEL_1)
                .status(InfrastructureHistoryStatus.APPROVED)
                .approvedBy(UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .approvedDate(LocalDateTime.now()).reason("Duyệt").build();
        when(historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.RADAR_STATION, TEST_ID))
                .thenReturn(List.of(history));

        List<HistoryEntry> entries = service.getHistory(TEST_ID);
        assertNotNull(entries);
        assertEquals(1, entries.size());
    }

    @Test
    void testSearch() {
        when(repository.searchPaged(anyBoolean(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), anyBoolean(), any(), any(), any(), any()))
                .thenReturn(Page.empty());
        List<RadarStationResponse> responses = service.search(null, null, null, null);
        assertNotNull(responses);
        assertTrue(responses.isEmpty());
    }

    @Test
    void testSearch_Deleted() {
        when(repository.searchPaged(anyBoolean(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), eq(true), any(), any(), any(), any()))
                .thenReturn(Page.empty());
        Page<RadarStationResponse> responses = service.searchPaged(null, null, null, null, null, null, null, null, null, "DELETED", null, null, null, null, Pageable.unpaged());
        assertNotNull(responses);
        assertTrue(responses.isEmpty());
    }

    @Nested
    @DisplayName("History operations - 6 Criteria verification")
    class HistoryTests {

        private final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000005");

        @Test
        @DisplayName("Criterion 1 & 2: Resolve actor name and unit name from user's orgUnit")
        void getHistory_shouldResolveActorNameAndOrgUnit() {
            when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

            InfrastructureHistory history = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(TEST_ID)
                    .refType(InfrastructureType.RADAR_STATION)
                    .approvalLevel(ApprovalLevel.LEVEL_1)
                    .status(InfrastructureHistoryStatus.APPROVED)
                    .approvedBy(USER_ID)
                    .approvedDate(LocalDateTime.of(2026, 6, 15, 14, 30))
                    .changedField("Tên trạm radar")
                    .previousValue("Trạm cũ")
                    .newValue("Trạm mới")
                    .reason("Cập nhật thông tin Tên trạm radar")
                    .build();

            when(historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.RADAR_STATION, TEST_ID))
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
            assertThat(entry.getPreviousValue()).isEqualTo("Trạm cũ");
            assertThat(entry.getNewValue()).isEqualTo("Trạm mới");
        }

        @Test
        @DisplayName("Criterion 2: Unit name falls back to department or default agency")
        void getHistory_unitNameFallback() {
            when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));

            InfrastructureHistory history = InfrastructureHistory.builder()
                    .id(UUID.randomUUID())
                    .refId(TEST_ID)
                    .refType(InfrastructureType.RADAR_STATION)
                    .approvedBy(USER_ID)
                    .build();

            when(historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.RADAR_STATION, TEST_ID))
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
            when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
            when(historyRepository.searchHistory(eq(InfrastructureType.RADAR_STATION), eq(TEST_ID), eq("tram radar moi"), any(), any(), any()))
                    .thenReturn(List.of());

            service.getHistory(TEST_ID, 0, 10, "Trạm Radar Mới", null, (String) null);

            verify(historyRepository).searchHistory(
                    eq(InfrastructureType.RADAR_STATION), eq(TEST_ID), eq("tram radar moi"), isNull(), isNull(), any());
        }

        @Test
        @DisplayName("Criterion 4: Date range filter parsed to start and end of day")
        void getHistory_withDateRange_shouldParseStartAndEndOfDay() {
            when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
            when(historyRepository.searchHistory(eq(InfrastructureType.RADAR_STATION), eq(TEST_ID), any(), any(), any(), any()))
                    .thenReturn(List.of());

            service.getHistory(TEST_ID, null, null, null, "2026-06-01", "2026-06-30");

            ArgumentCaptor<LocalDateTime> fromCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
            ArgumentCaptor<LocalDateTime> toCaptor = ArgumentCaptor.forClass(LocalDateTime.class);

            verify(historyRepository).searchHistory(
                    eq(InfrastructureType.RADAR_STATION), eq(TEST_ID), isNull(),
                    fromCaptor.capture(), toCaptor.capture(), any());

            assertThat(fromCaptor.getValue()).isEqualTo(LocalDateTime.of(2026, 6, 1, 0, 0, 0));
            assertThat(toCaptor.getValue().toLocalDate()).isEqualTo(LocalDate.of(2026, 6, 30));
            assertThat(toCaptor.getValue().getHour()).isEqualTo(23);
            assertThat(toCaptor.getValue().getMinute()).isEqualTo(59);
        }

        @Test
        @DisplayName("Criterion 5: Update captures modified fields and formats history")
        void update_onApprovedEntity_shouldRecordChangedFields() {
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
            when(repository.findById(TEST_ID)).thenReturn(Optional.of(entity));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            RadarStationUpdateRequest updateReq = RadarStationUpdateRequest.builder()
                    .stationName("Trạm Radar Hải Phòng")
                    .stationType("INDEPENDENT")
                    .conditionStatus("1")
                    .build();

            service.update(TEST_ID, updateReq, USER_ID);

            ArgumentCaptor<InfrastructureHistory> histCaptor = ArgumentCaptor.forClass(InfrastructureHistory.class);
            verify(historyRepository, atLeastOnce()).save(histCaptor.capture());

            List<InfrastructureHistory> savedEntries = histCaptor.getAllValues();
            assertThat(savedEntries).anyMatch(h -> "Tên trạm radar".equals(h.getChangedField()) && "Trạm Radar Hải Phòng".equals(h.getNewValue()));
            assertThat(savedEntries).anyMatch(h -> "Loại trạm".equals(h.getChangedField()) && "Trạm độc lập".equals(h.getNewValue()));
            assertThat(savedEntries).anyMatch(h -> "Tình trạng hoạt động".equals(h.getChangedField()) && "Đang khai thác/vận hành".equals(h.getNewValue()));
        }

        @Test
        @DisplayName("Criterion 6: formatDisplayValue correctly maps IDs to human-readable names")
        void formatDisplayValue_mapping() {
            UUID mockSymbolId = UUID.randomUUID();
            when(jdbcTemplate.queryForList("SELECT name FROM map_symbols WHERE id = ?", String.class, mockSymbolId))
                    .thenReturn(List.of("Biểu tượng Radar"));
            assertThat(service.formatDisplayValue("mapIcon", mockSymbolId.toString())).isEqualTo("Biểu tượng Radar");

            UUID mockOrgUnitId = UUID.randomUUID();
            when(orgUnitCacheService.getName(mockOrgUnitId)).thenReturn("Đơn vị Quản lý A");
            assertThat(service.formatDisplayValue("orgUnitId", mockOrgUnitId.toString())).isEqualTo("Đơn vị Quản lý A");

            UUID mockPortId = UUID.randomUUID();
            Port mockPort = new Port();
            mockPort.setId(mockPortId);
            mockPort.setPortName("Cảng Hải Phòng");
            when(portRepository.findById(mockPortId)).thenReturn(Optional.of(mockPort));
            assertThat(service.formatDisplayValue("seaportId", mockPortId.toString())).isEqualTo("Cảng Hải Phòng");

            UUID mockVtsSysId = UUID.randomUUID();
            VtsSystem mockVts = new VtsSystem();
            mockVts.setId(mockVtsSysId);
            mockVts.setSystemName("Hệ thống VTS Hải Phòng");
            when(vtsSystemRepository.findById(mockVtsSysId)).thenReturn(Optional.of(mockVts));
            assertThat(service.formatDisplayValue("vtsSystemId", mockVtsSysId.toString())).isEqualTo("Hệ thống VTS Hải Phòng");

            UUID mockVtsCenterId = UUID.randomUUID();
            when(jdbcTemplate.queryForList("SELECT name FROM vts_operation_centers WHERE id = ? AND deleted_at IS NULL", String.class, mockVtsCenterId))
                    .thenReturn(List.of("Trung tâm điều hành VTS Đồ Sơn"));
            assertThat(service.formatDisplayValue("vtsOperationCenterId", mockVtsCenterId.toString())).isEqualTo("Trung tâm điều hành VTS Đồ Sơn");

            UUID mockOpId = UUID.randomUUID();
            when(jdbcTemplate.queryForList("SELECT name FROM operating_units WHERE id = ?", String.class, mockOpId))
                    .thenReturn(List.of("Xí nghiệp B"));
            assertThat(service.formatDisplayValue("operatingUnitId", mockOpId.toString())).isEqualTo("Xí nghiệp B");

            when(jdbcTemplate.queryForList("SELECT name FROM provinces WHERE id = ?", String.class, 31))
                    .thenReturn(List.of("Hải Phòng"));
            assertThat(service.formatDisplayValue("provinceId", "31")).isEqualTo("Hải Phòng");

            assertThat(service.formatDisplayValue("stationType", "INDEPENDENT")).isEqualTo("Trạm độc lập");
            assertThat(service.formatDisplayValue("stationType", "DEPENDENT")).isEqualTo("Trạm phụ thuộc");
            assertThat(service.formatDisplayValue("conditionStatus", "1")).isEqualTo("Đang khai thác/vận hành");
            assertThat(service.formatDisplayValue("geometryType", "POINT")).isEqualTo("Đối tượng điểm");
            assertThat(service.formatDisplayValue("approvalStatus", "APPROVED")).isEqualTo("Đã duyệt");
            assertThat(service.formatDisplayValue("coordinateSystem", "1")).isEqualTo("WGS 84");
            assertThat(service.formatDisplayValue("coordinateSystem", "2")).isEqualTo("VN-2000");
        }
    }
}
