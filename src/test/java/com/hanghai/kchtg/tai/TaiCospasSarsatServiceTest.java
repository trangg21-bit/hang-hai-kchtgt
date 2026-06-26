package com.hanghai.kchtg.tai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.tai.dto.cospassarsat.CreateTaiCospasSarsatRequest;
import com.hanghai.kchtg.tai.dto.cospassarsat.TaiCospasSarsatResponse;
import com.hanghai.kchtg.tai.dto.cospassarsat.UpdateTaiCospasSarsatRequest;
import com.hanghai.kchtg.tai.entity.*;
import com.hanghai.kchtg.tai.repository.TaiCospasSarsatRepository;
import com.hanghai.kchtg.tai.repository.TaiHistoryRepository;
import com.hanghai.kchtg.tai.repository.TaiRepository;
import com.hanghai.kchtg.tai.service.PointObjectSyncService;
import com.hanghai.kchtg.tai.service.TaiCospasSarsatService;
import com.hanghai.kchtg.tai.service.TaiHistoryService;
import com.hanghai.kchtg.tai.service.TaiNotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaiCospasSarsatServiceTest {

    @InjectMocks
    private TaiCospasSarsatService service;

    @Mock
    private TaiCospasSarsatRepository taiRepo;

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
    private TaiCospasSarsat testEntity;

    @BeforeEach
    void setUp() {
        org.springframework.test.util.ReflectionTestUtils.setField(service, "objectMapper", objectMapper);
        testId = UUID.randomUUID();
        testEntity = TaiCospasSarsat.builder()
                .id(testId)
                .code("CPS-001")
                .name("Cospas Demo")
                .taiType(TaiType.COSPAS_SARSAT)
                .frequency(new BigDecimal("406.000"))
                .protocol("COSPAS-SARSAT")
                .country("Vietnam")
                .status(TaiStatus.ACTIVE)
                .approvalStatus(TaiApprovalStatus.PENDING)
                .deleted(false)
                .createdAt(Instant.now())
                .createdBy(UUID.randomUUID())
                .build();
    }

    @Test
    @DisplayName("F-015-020: findById — returns response when entity exists")
    void testFindByIdExists() {
        when(taiRepo.findById(testId)).thenReturn(Optional.of(testEntity));

        TaiCospasSarsatResponse response = service.findById(testId);

        assertNotNull(response);
        assertEquals("Cospas Demo", response.getName());
        assertEquals("CPS-001", response.getCode());
    }

    @Test
    @DisplayName("F-015-020: findById — throws when not found")
    void testFindByIdNotFound() {
        when(taiRepo.findById(testId)).thenReturn(Optional.empty());

        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.findById(testId));
    }

    @Test
    @DisplayName("F-015-020: findByCode — returns response when exists")
    void testFindByCodeExists() {
        when(taiRepo.findByCodeAndDeletedFalse("CPS-001")).thenReturn(Optional.of(testEntity));

        TaiCospasSarsatResponse response = service.findByCode("CPS-001");

        assertNotNull(response);
        assertEquals("Cospas Demo", response.getName());
    }

    @Test
    @DisplayName("F-015-020: findByCode — throws when not found")
    void testFindByCodeNotFound() {
        when(taiRepo.findByCodeAndDeletedFalse("CPS-001")).thenReturn(Optional.empty());

        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.findByCode("CPS-001"));
    }

    @Test
    @DisplayName("F-015-021: findAll — returns all entities")
    void testFindAll() {
        when(taiRepo.findAll()).thenReturn(List.of(testEntity));

        List<TaiCospasSarsatResponse> result = service.findAll();

        assertEquals(1, result.size());
        assertEquals("Cospas Demo", result.get(0).getName());
    }

    @Test
    @DisplayName("F-015-021: findAll — returns empty")
    void testFindAllEmpty() {
        when(taiRepo.findAll()).thenReturn(List.of());
        assertTrue(service.findAll().isEmpty());
    }

    @Test
    @DisplayName("F-015-022: create — creates with ACTIVE and PENDING")
    void testCreateSuccess() {
        CreateTaiCospasSarsatRequest request = new CreateTaiCospasSarsatRequest(
                "CPS-002", "Cospas moi", TaiType.COSPAS_SARSAT,
                new BigDecimal("406.000"), "COSPAS-SARSAT", "Vietnam");

        when(taiRepo.existsByCode("CPS-002")).thenReturn(false);
        when(taiRepo.save(any(TaiCospasSarsat.class))).thenAnswer(inv -> {
            TaiCospasSarsat saved = inv.getArgument(0);
            saved.setId(UUID.randomUUID());
            saved.setCreatedBy(UUID.randomUUID());
            return saved;
        });

        TaiCospasSarsatResponse result = service.create(request);

        assertNotNull(result);
        assertEquals("Cospas moi", result.getName());
        assertEquals(TaiStatus.ACTIVE, result.getStatus());
        assertEquals(TaiApprovalStatus.PENDING, result.getApprovalStatus());
        verify(taiRepo).save(any(TaiCospasSarsat.class));
        verify(historyRepo).save(any());
        verify(notificationService).sendApproveNotification(eq("Tai Cospas-Sarsat: Cospas moi"), any());
    }

    @Test
    @DisplayName("F-015-022: create — throws when code already exists")
    void testCreateDuplicateCode() {
        CreateTaiCospasSarsatRequest request = new CreateTaiCospasSarsatRequest(
                "CPS-001", "Cospas moi", TaiType.COSPAS_SARSAT,
                new BigDecimal("406.000"), null, null);
        when(taiRepo.existsByCode("CPS-001")).thenReturn(true);
        assertThrows(IllegalArgumentException.class, () -> service.create(request));
    }

    @Test
    @DisplayName("F-015-023: update — updates fields and saves history")
    void testUpdateSuccess() {
        when(taiRepo.findById(testId)).thenReturn(Optional.of(testEntity));
        when(taiRepo.save(any(TaiCospasSarsat.class))).thenReturn(testEntity);

        UpdateTaiCospasSarsatRequest request = UpdateTaiCospasSarsatRequest.builder()
                .name("Cospas cap nhat")
                .frequency(new BigDecimal("406.500"))
                .protocol("NEW-PROTOCOL")
                .country("Cambodia")
                .build();

        TaiCospasSarsatResponse result = service.update(testId, request);

        assertNotNull(result);
        verify(taiRepo).save(any(TaiCospasSarsat.class));
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-015-023: update — throws when not found")
    void testUpdateNotFound() {
        when(taiRepo.findById(testId)).thenReturn(Optional.empty());
        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.update(testId, UpdateTaiCospasSarsatRequest.builder().build()));
    }

    @Test
    @DisplayName("F-015-023: update — throws when entity deleted")
    void testUpdateDeleted() {
        testEntity.setDeleted(true);
        when(taiRepo.findById(testId)).thenReturn(Optional.of(testEntity));
        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.update(testId, UpdateTaiCospasSarsatRequest.builder().build()));
    }

    @Test
    @DisplayName("F-015-024: delete — soft deletes with history")
    void testDeleteSoftDelete() {
        when(taiRepo.findByCodeAndDeletedFalse("CPS-001")).thenReturn(Optional.of(testEntity));
        when(taiRepo.save(any(TaiCospasSarsat.class))).thenReturn(testEntity);

        service.delete("CPS-001");

        assertTrue(testEntity.getDeleted());
        assertNotNull(testEntity.getDeletedAt());
        verify(taiRepo).save(any(TaiCospasSarsat.class));
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-015-024: delete — throws when not found")
    void testDeleteNotFound() {
        when(taiRepo.findByCodeAndDeletedFalse("CPS-001")).thenReturn(Optional.empty());
        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.delete("CPS-001"));
    }

    @Test
    @DisplayName("F-015-024: delete — throws if already deleted")
    void testDeleteAlreadyDeleted() {
        testEntity.setDeleted(true);
        when(taiRepo.findByCodeAndDeletedFalse("CPS-001")).thenReturn(Optional.of(testEntity));
        assertThrows(IllegalArgumentException.class, () -> service.delete("CPS-001"));
    }

    @Test
    @DisplayName("F-015-025: approve — sets APPROVED, saves history")
    void testApproveSuccess() {
        when(taiRepo.findByCodeAndDeletedFalse("CPS-001")).thenReturn(Optional.of(testEntity));
        when(taiRepo.save(any(TaiCospasSarsat.class))).thenReturn(testEntity);

        TaiCospasSarsatResponse result = service.approve("CPS-001", "OK", testId);

        assertEquals(TaiApprovalStatus.APPROVED, result.getApprovalStatus());
        assertEquals(testId, result.getApprovedBy());
        assertNotNull(result.getApprovedAt());
        verify(taiRepo).save(any(TaiCospasSarsat.class));
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-015-025: approve — throws when not found")
    void testApproveNotFound() {
        when(taiRepo.findByCodeAndDeletedFalse("CPS-001")).thenReturn(Optional.empty());
        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.approve("CPS-001", "OK", testId));
    }

    @Test
    @DisplayName("F-015-025: reject — sets REJECTED status")
    void testRejectSuccess() {
        when(taiRepo.findByCodeAndDeletedFalse("CPS-001")).thenReturn(Optional.of(testEntity));
        when(taiRepo.save(any(TaiCospasSarsat.class))).thenReturn(testEntity);

        TaiCospasSarsatResponse result = service.reject("CPS-001", "Ly do", testId);

        assertEquals(TaiApprovalStatus.REJECTED, result.getApprovalStatus());
        assertEquals(testId, result.getUnapprovedBy());
        verify(taiRepo).save(any(TaiCospasSarsat.class));
        verify(historyRepo).save(any());
    }

    @Test
    @DisplayName("F-015-025: reject — throws when not found")
    void testRejectNotFound() {
        when(taiRepo.findByCodeAndDeletedFalse("CPS-001")).thenReturn(Optional.empty());
        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> service.reject("CPS-001", "Ly do", testId));
    }

    @Test
    @DisplayName("F-015-026: countByStatus — returns count")
    void testCountByStatus() {
        when(taiRepo.countByStatus(TaiStatus.ACTIVE)).thenReturn(2L);
        assertEquals(2, service.countByStatus(TaiStatus.ACTIVE));
    }

    @Test
    @DisplayName("F-015-026: deleteByCode — delegates to repo")
    void testDeleteByCode() {
        service.deleteByCode("CPS-001");
        verify(taiRepo).deleteByCode("CPS-001");
    }

    @Test
    @DisplayName("F-015-027: syncToMapPhao — logs message")
    void testSyncToMapPhao() {
        UUID id = UUID.randomUUID();
        service.syncToMapPhao(id);
        verifyNoMoreInteractions(taiRepo);
    }

    @Test
    @DisplayName("F-015-027: hideFromMapPhao — logs message")
    void testHideFromMapPhao() {
        UUID id = UUID.randomUUID();
        service.hideFromMapPhao(id);
        verifyNoMoreInteractions(taiRepo);
    }
}
