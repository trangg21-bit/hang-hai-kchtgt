package com.hanghai.kchtg.tai;

import com.hanghai.kchtg.tai.dto.inmarsat.CreateTaiInmarsatRequest;
import com.hanghai.kchtg.tai.dto.inmarsat.TaiInmarsatResponse;
import com.hanghai.kchtg.tai.dto.inmarsat.UpdateTaiInmarsatRequest;
import com.hanghai.kchtg.tai.entity.*;
import com.hanghai.kchtg.tai.repository.TaiRepository;
import com.hanghai.kchtg.tai.repository.TaiHistoryRepository;
import com.hanghai.kchtg.tai.repository.TaiInmarsatRepository;
import com.hanghai.kchtg.tai.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaiInmarsatServiceTest {

    @InjectMocks
    private TaiInmarsatService service;

    @Mock
    private TaiInmarsatRepository taiRepo;

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
    private ObjectMapper objectMapper = new ObjectMapper().registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    private UUID testId;
    private TaiInmarsat testEntity;

    @BeforeEach
    void setUp() {
        org.springframework.test.util.ReflectionTestUtils.setField(service, "objectMapper", objectMapper);
        testId = UUID.randomUUID();
        testEntity = TaiInmarsat.builder()
                .id(testId)
                .code("IM-001")
                .name("Inmarsat Demo")
                .taiType(TaiType.INMARSAT)
                .satelliteId("SAT-001")
                .signalStrength(new java.math.BigDecimal("95.5"))
                .serviceType("BGAN")
                .status(TaiStatus.ACTIVE)
                .approvalStatus(TaiApprovalStatus.PENDING)
                .deleted(false)
                .createdAt(Instant.now())
                .createdBy(UUID.randomUUID())
                .build();
    }

    @Test
    @DisplayName("F-015-010: findById — returns response when entity exists")
    void testFindByIdExists() {
        when(taiRepo.findById(testId)).thenReturn(Optional.of(testEntity));

        TaiInmarsatResponse response = service.findById(testId);

        assertNotNull(response);
        assertEquals("Inmarsat Demo", response.getName());
        assertEquals("IM-001", response.getCode());
    }

    @Test
    @DisplayName("F-015-010: findById — throws when not found")
    void testFindByIdNotFound() {
        when(taiRepo.findById(testId)).thenReturn(Optional.empty());

        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.findById(testId));
    }

    @Test
    @DisplayName("F-015-010: findByCode — returns response when exists")
    void testFindByCodeExists() {
        when(taiRepo.findByCodeAndDeletedFalse("IM-001")).thenReturn(Optional.of(testEntity));

        TaiInmarsatResponse response = service.findByCode("IM-001");

        assertNotNull(response);
        assertEquals("Inmarsat Demo", response.getName());
    }

    @Test
    @DisplayName("F-015-010: findByCode — throws when not found")
    void testFindByCodeNotFound() {
        when(taiRepo.findByCodeAndDeletedFalse("IM-001")).thenReturn(Optional.empty());

        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.findByCode("IM-001"));
    }

    @Test
    @DisplayName("F-015-011: findAll — returns all entities")
    void testFindAll() {
        when(taiRepo.findAll()).thenReturn(List.of(testEntity));

        List<TaiInmarsatResponse> result = service.findAll();

        assertEquals(1, result.size());
        assertEquals("Inmarsat Demo", result.get(0).getName());
    }

    @Test
    @DisplayName("F-015-011: findAll — returns empty list")
    void testFindAllEmpty() {
        when(taiRepo.findAll()).thenReturn(List.of());

        assertTrue(service.findAll().isEmpty());
    }

    @Test
    @DisplayName("F-015-012: create — creates entity with ACTIVE and PENDING")
    void testCreateSuccess() {
        CreateTaiInmarsatRequest request = new CreateTaiInmarsatRequest(
                "IM-002", "Inmarsat moi", TaiType.INMARSAT,
                "SAT-002", new java.math.BigDecimal("90.0"), "BGAN");

        when(taiRepo.existsByCode("IM-002")).thenReturn(false);
        when(baseTaiRepo.findByCodeAndDeletedFalse("IM-002")).thenReturn(Optional.empty());
        when(taiRepo.save(any(TaiInmarsat.class))).thenAnswer(inv -> {
            TaiInmarsat saved = inv.getArgument(0);
            saved.setId(UUID.randomUUID());
            saved.setCreatedBy(UUID.randomUUID());
            return saved;
        });

        TaiInmarsatResponse result = service.create(request);

        assertNotNull(result);
        assertEquals("Inmarsat moi", result.getName());
        assertEquals(TaiStatus.ACTIVE, result.getStatus());
        assertEquals(TaiApprovalStatus.PENDING, result.getApprovalStatus());
        verify(taiRepo).save(any(TaiInmarsat.class));
        verify(historyRepo).save(any());
        verify(notificationService).sendApproveNotification(eq("Tai Inmarsat: Inmarsat moi"), any());
    }

    @Test
    @DisplayName("F-015-012: create — throws when code already exists")
    void testCreateDuplicateCode() {
        CreateTaiInmarsatRequest request = new CreateTaiInmarsatRequest(
                "IM-001", "Inmarsat moi", TaiType.INMARSAT,
                "SAT-002", null, null);

        when(taiRepo.existsByCode("IM-001")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> service.create(request));
    }

    @Test
    @DisplayName("F-015-012: create — throws when code exists in baseTai")
    void testCreateCodeInBaseTai() {
        CreateTaiInmarsatRequest request = new CreateTaiInmarsatRequest(
                "IM-001", "Inmarsat moi", TaiType.INMARSAT,
                "SAT-002", null, null);

        when(taiRepo.existsByCode("IM-001")).thenReturn(false);
        when(baseTaiRepo.findByCodeAndDeletedFalse("IM-001")).thenReturn(Optional.of(mock(BaseTai.class)));

        assertThrows(IllegalArgumentException.class, () -> service.create(request));
    }

    @Test
    @DisplayName("F-015-013: update — updates fields and saves history")
    void testUpdateSuccess() {
        when(taiRepo.findById(testId)).thenReturn(Optional.of(testEntity));
        when(taiRepo.save(any(TaiInmarsat.class))).thenReturn(testEntity);

        UpdateTaiInmarsatRequest request = UpdateTaiInmarsatRequest.builder()
                .name("Inmarsat cap nhat")
                .satelliteId("SAT-NEW")
                .signalStrength(new java.math.BigDecimal("88.0"))
                .serviceType("BGAN-NEW")
                .build();

        TaiInmarsatResponse result = service.update(testId, request);

        assertNotNull(result);
        assertEquals("Inmarsat cap nhat", result.getName());
        verify(taiRepo).save(any(TaiInmarsat.class));
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-015-013: update — throws when not found")
    void testUpdateNotFound() {
        when(taiRepo.findById(testId)).thenReturn(Optional.empty());

        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.update(testId, UpdateTaiInmarsatRequest.builder().build()));
    }

    @Test
    @DisplayName("F-015-013: update — throws when entity deleted")
    void testUpdateDeleted() {
        testEntity.setDeleted(true);
        when(taiRepo.findById(testId)).thenReturn(Optional.of(testEntity));

        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.update(testId, UpdateTaiInmarsatRequest.builder().build()));
    }

    @Test
    @DisplayName("F-015-014: delete — soft deletes with history")
    void testDeleteSoftDelete() {
        when(taiRepo.findByCodeAndDeletedFalse("IM-001")).thenReturn(Optional.of(testEntity));
        when(taiRepo.save(any(TaiInmarsat.class))).thenReturn(testEntity);

        service.delete("IM-001");

        assertTrue(testEntity.getDeleted());
        assertNotNull(testEntity.getDeletedAt());
        verify(taiRepo).save(any(TaiInmarsat.class));
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-015-014: delete — throws when not found")
    void testDeleteNotFound() {
        when(taiRepo.findByCodeAndDeletedFalse("IM-001")).thenReturn(Optional.empty());

        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.delete("IM-001"));
    }

    @Test
    @DisplayName("F-015-014: delete — throws if already deleted")
    void testDeleteAlreadyDeleted() {
        testEntity.setDeleted(true);
        when(taiRepo.findByCodeAndDeletedFalse("IM-001")).thenReturn(Optional.of(testEntity));

        assertThrows(IllegalArgumentException.class, () -> service.delete("IM-001"));
    }

    @Test
    @DisplayName("F-015-015: approve — sets APPROVED status, sync + history")
    void testApproveSuccess() {
        when(taiRepo.findByCodeAndDeletedFalse("IM-001")).thenReturn(Optional.of(testEntity));
        when(taiRepo.save(any(TaiInmarsat.class))).thenReturn(testEntity);

        TaiInmarsatResponse result = service.approve("IM-001", "OK", testId);

        assertEquals(TaiApprovalStatus.APPROVED, result.getApprovalStatus());
        assertEquals(testId, result.getApprovedBy());
        assertNotNull(result.getApprovedAt());
        verify(taiRepo).save(any(TaiInmarsat.class));
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-015-015: approve — throws when not found")
    void testApproveNotFound() {
        when(taiRepo.findByCodeAndDeletedFalse("IM-001")).thenReturn(Optional.empty());

        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.approve("IM-001", "OK", testId));
    }

    @Test
    @DisplayName("F-015-015: reject — sets REJECTED status with unapproved fields")
    void testRejectSuccess() {
        when(taiRepo.findByCodeAndDeletedFalse("IM-001")).thenReturn(Optional.of(testEntity));
        when(taiRepo.save(any(TaiInmarsat.class))).thenReturn(testEntity);

        TaiInmarsatResponse result = service.reject("IM-001", "Ly do tu choi", testId);

        assertEquals(TaiApprovalStatus.REJECTED, result.getApprovalStatus());
        assertEquals(testId, result.getUnapprovedBy());
        verify(taiRepo).save(any(TaiInmarsat.class));
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-015-015: reject — throws when not found")
    void testRejectNotFound() {
        when(taiRepo.findByCodeAndDeletedFalse("IM-001")).thenReturn(Optional.empty());

        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.reject("IM-001", "Ly do", testId));
    }

    @Test
    @DisplayName("F-015-016: countByStatus — returns count")
    void testCountByStatus() {
        when(taiRepo.countByStatus(TaiStatus.ACTIVE)).thenReturn(3L);

        assertEquals(3, service.countByStatus(TaiStatus.ACTIVE));
    }

    @Test
    @DisplayName("F-015-016: deleteByCode — delegates to repo")
    void testDeleteByCode() {
        service.deleteByCode("IM-001");
        verify(taiRepo).deleteByCode("IM-001");
    }

    @Test
    @DisplayName("F-015-017: syncToMapPhao — logs message")
    void testSyncToMapPhao() {
        UUID id = UUID.randomUUID();
        service.syncToMapPhao(id);
        verifyNoMoreInteractions(taiRepo);
    }

    @Test
    @DisplayName("F-015-017: hideFromMapPhao — logs message")
    void testHideFromMapPhao() {
        UUID id = UUID.randomUUID();
        service.hideFromMapPhao(id);
        verifyNoMoreInteractions(taiRepo);
    }
}
