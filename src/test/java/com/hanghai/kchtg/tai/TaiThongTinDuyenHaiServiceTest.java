package com.hanghai.kchtg.tai;

import com.hanghai.kchtg.tai.dto.thongtinduyenhai.CreateTaiThongTinDuyenHaiRequest;
import com.hanghai.kchtg.tai.dto.thongtinduyenhai.TaiThongTinDuyenHaiResponse;
import com.hanghai.kchtg.tai.dto.thongtinduyenhai.UpdateTaiThongTinDuyenHaiRequest;
import com.hanghai.kchtg.tai.entity.*;
import com.hanghai.kchtg.tai.repository.TaiRepository;
import com.hanghai.kchtg.tai.repository.TaiThongTinDuyenHaiRepository;
import com.hanghai.kchtg.tai.repository.TaiHistoryRepository;
import com.hanghai.kchtg.tai.service.TaiHistoryService;
import com.hanghai.kchtg.tai.service.TaiNotificationService;
import com.hanghai.kchtg.tai.service.TaiThongTinDuyenHaiService;
import com.hanghai.kchtg.tai.service.PointObjectSyncService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaiThongTinDuyenHaiServiceTest {

    @InjectMocks
    private TaiThongTinDuyenHaiService service;

    @Mock
    private TaiThongTinDuyenHaiRepository taiRepo;

    @Mock
    private TaiRepository baseTaiRepo;

    @Mock
    private TaiHistoryRepository historyRepo;

    @Mock
    private TaiHistoryService historyService;

    @Mock
    private TaiNotificationService notificationService;

    @Mock
    private PointObjectSyncService pointObjectSyncService;

    @Spy
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    private UUID testId;
    private TaiThongTinDuyenHai testEntity;

    @BeforeEach
    void setUp() {
        org.springframework.test.util.ReflectionTestUtils.setField(service, "objectMapper", objectMapper);
        testId = UUID.randomUUID();
        testEntity = TaiThongTinDuyenHai.builder()
                .id(testId)
                .code("TDH-001")
                .name("Dai Demo")
                .taiType(TaiType.COASTAL)
                .frequency(new BigDecimal("156.800"))
                .range(10)
                .country("Vietnam")
                .contactInfo("contact@test.com")
                .status(TaiStatus.ACTIVE)
                .approvalStatus(TaiApprovalStatus.PENDING)
                .deleted(false)
                .createdAt(Instant.now())
                .createdBy(UUID.randomUUID())
                .build();
    }

    // -- READ TESTS --

    @Test
    @DisplayName("F-015-001: findById — returns response when entity exists")
    void testFindByIdExists() {
        when(taiRepo.findById(testId)).thenReturn(Optional.of(testEntity));

        TaiThongTinDuyenHaiResponse response = service.findById(testId);

        assertNotNull(response);
        assertEquals("Dai Demo", response.getName());
        assertEquals("TDH-001", response.getCode());
        assertEquals(TaiType.COASTAL, response.getType());
    }

    @Test
    @DisplayName("F-015-001: findById — throws EntityNotFoundException when not found")
    void testFindByIdNotFound() {
        when(taiRepo.findById(testId)).thenReturn(Optional.empty());

        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.findById(testId));
    }

    @Test
    @DisplayName("F-015-001: findByCode — returns response when entity exists")
    void testFindByCodeExists() {
        when(taiRepo.findByCodeAndDeletedFalse("TDH-001")).thenReturn(Optional.of(testEntity));

        TaiThongTinDuyenHaiResponse response = service.findByCode("TDH-001");

        assertNotNull(response);
        assertEquals("Dai Demo", response.getName());
    }

    @Test
    @DisplayName("F-015-001: findByCode — throws when not found")
    void testFindByCodeNotFound() {
        when(taiRepo.findByCodeAndDeletedFalse("TDH-001")).thenReturn(Optional.empty());

        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.findByCode("TDH-001"));
    }

    @Test
    @DisplayName("F-015-002: findAll — returns all entities")
    void testFindAll() {
        when(taiRepo.findAll()).thenReturn(List.of(testEntity));

        List<TaiThongTinDuyenHaiResponse> result = service.findAll();

        assertEquals(1, result.size());
        assertEquals("Dai Demo", result.get(0).getName());
    }

    @Test
    @DisplayName("F-015-002: findAll — returns empty list")
    void testFindAllEmpty() {
        when(taiRepo.findAll()).thenReturn(List.of());

        List<TaiThongTinDuyenHaiResponse> result = service.findAll();

        assertTrue(result.isEmpty());
    }

    // -- CREATE TESTS --

    @Test
    @DisplayName("F-015-003: create — creates entity with ACTIVE status and PENDING approval")
    void testCreateSuccess() {
        CreateTaiThongTinDuyenHaiRequest request = new CreateTaiThongTinDuyenHaiRequest(
                "TDH-002", "Dai moi", TaiType.COASTAL,
                new BigDecimal("157.000"), 15, "Vietnam", "new@test.com");

        when(taiRepo.existsByCode("TDH-002")).thenReturn(false);
        when(baseTaiRepo.findByCodeAndDeletedFalse("TDH-002")).thenReturn(Optional.empty());
        when(taiRepo.save(any(TaiThongTinDuyenHai.class))).thenAnswer(inv -> {
            TaiThongTinDuyenHai saved = inv.getArgument(0);
            saved.setId(UUID.randomUUID());
            saved.setCreatedBy(UUID.randomUUID());
            return saved;
        });

        TaiThongTinDuyenHaiResponse result = service.create(request);

        assertNotNull(result);
        assertEquals("Dai moi", result.getName());
        assertEquals(TaiStatus.ACTIVE, result.getStatus());
        assertEquals(TaiApprovalStatus.PENDING, result.getApprovalStatus());
        verify(taiRepo).save(any(TaiThongTinDuyenHai.class));
        verify(historyRepo).save(any());
        verify(notificationService).sendApproveNotification(eq("Tai Thong Tin Duyen Hai: Dai moi"), any());
    }

    @Test
    @DisplayName("F-015-003: create — throws when code already exists in tai_thong_tin_duyen_hai")
    void testCreateDuplicateCode() {
        CreateTaiThongTinDuyenHaiRequest request = new CreateTaiThongTinDuyenHaiRequest(
                "TDH-001", "Dai moi", TaiType.COASTAL,
                new BigDecimal("157.000"), 15, "Vietnam", "new@test.com");

        when(taiRepo.existsByCode("TDH-001")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> service.create(request));
    }

    @Test
    @DisplayName("F-015-003: create — throws when code exists in base tai table")
    void testCreateCodeInBaseTai() {
        CreateTaiThongTinDuyenHaiRequest request = new CreateTaiThongTinDuyenHaiRequest(
                "TDH-001", "Dai moi", TaiType.COASTAL,
                new BigDecimal("157.000"), 15, "Vietnam", "new@test.com");

        when(taiRepo.existsByCode("TDH-001")).thenReturn(false);
        when(baseTaiRepo.findByCodeAndDeletedFalse("TDH-001")).thenReturn(
                Optional.of(mock(BaseTai.class)));

        assertThrows(IllegalArgumentException.class, () -> service.create(request));
    }

    // -- UPDATE TESTS --

    @Test
    @DisplayName("F-015-004: update — updates mutable fields and saves history")
    void testUpdateSuccess() {
        when(taiRepo.findById(testId)).thenReturn(Optional.of(testEntity));
        when(taiRepo.save(any(TaiThongTinDuyenHai.class))).thenReturn(testEntity);

        UpdateTaiThongTinDuyenHaiRequest request = UpdateTaiThongTinDuyenHaiRequest.builder()
                .name("Dai cap nhat")
                .frequency(new BigDecimal("157.500"))
                .range(20)
                .country("Trung Quoc")
                .contactInfo("updated@test.com")
                .build();

        TaiThongTinDuyenHaiResponse result = service.update(testId, request);

        assertNotNull(result);
        assertEquals("Dai cap nhat", result.getName());
        assertEquals(new BigDecimal("157.500"), result.getFrequency());
        assertEquals(20, result.getRange());
        verify(taiRepo).save(any(TaiThongTinDuyenHai.class));
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-015-004: update — throws EntityNotFoundException when not found")
    void testUpdateNotFound() {
        when(taiRepo.findById(testId)).thenReturn(Optional.empty());

        UpdateTaiThongTinDuyenHaiRequest request = UpdateTaiThongTinDuyenHaiRequest.builder()
                .name("Dai cap nhat")
                .build();

        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.update(testId, request));
    }

    @Test
    @DisplayName("F-015-004: update — throws when entity is deleted")
    void testUpdateDeletedEntity() {
        testEntity.setDeleted(true);
        when(taiRepo.findById(testId)).thenReturn(Optional.of(testEntity));

        UpdateTaiThongTinDuyenHaiRequest request = UpdateTaiThongTinDuyenHaiRequest.builder()
                .name("Dai cap nhat")
                .build();

        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.update(testId, request));
    }

    // -- DELETE TESTS --

    @Test
    @DisplayName("F-015-005: delete — soft deletes entity with history")
    void testDeleteSoftDelete() {
        when(taiRepo.findByCodeAndDeletedFalse("TDH-001")).thenReturn(Optional.of(testEntity));
        when(taiRepo.save(any(TaiThongTinDuyenHai.class))).thenReturn(testEntity);

        service.delete("TDH-001");

        assertTrue(testEntity.getDeleted());
        assertNotNull(testEntity.getDeletedAt());
        assertNotNull(testEntity.getDeletedBy());
        verify(taiRepo).save(any(TaiThongTinDuyenHai.class));
        verify(historyRepo).save(any());
        verify(pointObjectSyncService).hideFromMapPhao(testId);
    }

    @Test
    @DisplayName("F-015-005: delete — throws when entity not found")
    void testDeleteNotFound() {
        when(taiRepo.findByCodeAndDeletedFalse("TDH-001")).thenReturn(Optional.empty());

        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.delete("TDH-001"));
    }

    @Test
    @DisplayName("F-015-005: delete — throws if already deleted")
    void testDeleteAlreadyDeleted() {
        testEntity.setDeleted(true);
        when(taiRepo.findByCodeAndDeletedFalse("TDH-001")).thenReturn(Optional.of(testEntity));

        assertThrows(IllegalArgumentException.class, () -> service.delete("TDH-001"));
    }

    // -- APPROVAL TESTS --

    @Test
    @DisplayName("F-015-006: approve — sets APPROVED status, saves history, calls sync")
    void testApproveSuccess() {
        when(taiRepo.findByCodeAndDeletedFalse("TDH-001")).thenReturn(Optional.of(testEntity));
        when(taiRepo.save(any(TaiThongTinDuyenHai.class))).thenReturn(testEntity);

        TaiThongTinDuyenHaiResponse result = service.approve("TDH-001", "Phe duyet OK", testId);

        assertEquals(TaiStatus.ACTIVE, result.getStatus());
        assertEquals(TaiApprovalStatus.APPROVED, result.getApprovalStatus());
        assertEquals(testId, result.getApprovedBy());
        assertNotNull(result.getApprovedAt());
        verify(taiRepo).save(any(TaiThongTinDuyenHai.class));
        verify(historyRepo).save(any());
        verify(pointObjectSyncService).syncToMapPhao(testId);
    }

    @Test
    @DisplayName("F-015-006: approve — throws when not found")
    void testApproveNotFound() {
        when(taiRepo.findByCodeAndDeletedFalse("TDH-001")).thenReturn(Optional.empty());

        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.approve("TDH-001", "Remarks", testId));
    }

    @Test
    @DisplayName("F-015-006: reject — sets REJECTED status with unapproved fields")
    void testRejectSuccess() {
        when(taiRepo.findByCodeAndDeletedFalse("TDH-001")).thenReturn(Optional.of(testEntity));
        when(taiRepo.save(any(TaiThongTinDuyenHai.class))).thenReturn(testEntity);

        TaiThongTinDuyenHaiResponse result = service.reject("TDH-001", "Ly do tu choi", testId);

        assertEquals(TaiApprovalStatus.REJECTED, result.getApprovalStatus());
        assertEquals(testId, result.getUnapprovedBy());
        assertNotNull(result.getUnapprovedAt());
        verify(taiRepo).save(any(TaiThongTinDuyenHai.class));
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-015-006: reject — throws when not found")
    void testRejectNotFound() {
        when(taiRepo.findByCodeAndDeletedFalse("TDH-001")).thenReturn(Optional.empty());

        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.reject("TDH-001", "Ly do", testId));
    }

    // -- COUNTS TESTS --

    @Test
    @DisplayName("F-015-007: countByStatus — returns count for given status")
    void testCountByStatus() {
        when(taiRepo.countByStatus(TaiStatus.ACTIVE)).thenReturn(5L);

        long count = service.countByStatus(TaiStatus.ACTIVE);

        assertEquals(5, count);
    }

    @Test
    @DisplayName("F-015-007: deleteByCode — delegates to repository")
    void testDeleteByCode() {
        service.deleteByCode("TDH-001");

        verify(taiRepo).deleteByCode("TDH-001");
    }

    // -- MAP SYNC STUB TESTS --

    @Test
    @DisplayName("F-015-008: syncToMapPhao — logs message")
    void testSyncToMapPhao() {
        UUID id = UUID.randomUUID();
        service.syncToMapPhao(id);

        // Should not throw — just logs
        verifyNoMoreInteractions(taiRepo);
    }

    @Test
    @DisplayName("F-015-008: hideFromMapPhao — logs message")
    void testHideFromMapPhao() {
        UUID id = UUID.randomUUID();
        service.hideFromMapPhao(id);

        // Should not throw — just logs
        verifyNoMoreInteractions(taiRepo);
    }
}
