package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.assetmovement.dto.InventoryReportRequest;
import com.hanghai.kchtg.assetmovement.dto.InventoryReportResponse;
import com.hanghai.kchtg.assetmovement.entity.InventoryReport;
import com.hanghai.kchtg.assetmovement.entity.ReportStatus;
import com.hanghai.kchtg.assetmovement.repository.InventoryReportRepository;
import com.hanghai.kchtg.assetmovement.service.InventoryReportService;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("InventoryReportService Unit Tests")
public class InventoryReportServiceTest {

    @InjectMocks
    private InventoryReportService service;

    @Mock
    private InventoryReportRepository repository;

    @Mock
    private UserRepository userRepository;

    private UUID testId;
    private UUID planId;
    private InventoryReport testEntity;
    private InventoryReportRequest testRequest;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        planId = UUID.randomUUID();

        testEntity = InventoryReport.builder()
                .id(testId)
                .planId(planId)
                .totalAssets(50)
                .surplusCount(2)
                .missingCount(0)
                .description("Báo cáo kiểm kê khớp số liệu")
                .status(ReportStatus.PENDING)
                
                .build();
        testEntity.setCreatedAt(java.time.LocalDateTime.now());
        testEntity.setUpdatedAt(java.time.LocalDateTime.now());

        testRequest = new InventoryReportRequest();
        testRequest.setPlanId(planId);
        testRequest.setTongSoLuong(50);
        testRequest.setSoLuongChenhLech(2);
        testRequest.setDescription("Báo cáo kiểm kê khớp số liệu");
    }

    @Test
    @DisplayName("create should save report and return response with PENDING state")
    void create_ShouldSaveReportAndReturnResponse() {
        when(repository.save(any(InventoryReport.class))).thenReturn(testEntity);

        InventoryReportResponse response = service.create(testRequest);

        assertNotNull(response);
        assertEquals(testId, response.getId());
        assertEquals("PENDING", response.getResult());
        verify(repository, times(1)).save(any(InventoryReport.class));
    }

    @Test
    @DisplayName("getById should return report when ID exists")
    void getById_ShouldReturnReport_WhenIdExists() {
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));

        InventoryReportResponse response = service.getById(testId);

        assertNotNull(response);
        assertEquals(testId, response.getId());
        assertEquals(planId, response.getPlanId());
    }

    @Test
    @DisplayName("getById should throw exception when ID does not exist")
    void getById_ShouldThrowException_WhenIdDoesNotExist() {
        when(repository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.getById(testId));
    }

    @Test
    @DisplayName("approve should update status to APPROVED and save")
    void approve_ShouldUpdateStatusToDaPheDuyet() {
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(repository.save(any(InventoryReport.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InventoryReportResponse response = service.approve(testId, "Duyệt báo cáo kiểm kê");

        assertNotNull(response);
        assertEquals("APPROVED", response.getResult());
        verify(repository, times(1)).save(any(InventoryReport.class));
    }

    @Test
    @DisplayName("reject should return status to PENDING and save")
    void reject_ShouldReturnStatusToChoPheDuyet() {
        testEntity.setStatus(ReportStatus.APPROVED);
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(repository.save(any(InventoryReport.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InventoryReportResponse response = service.reject(testId, "Từ chối báo cáo do chênh lệch chưa làm rõ");

        assertNotNull(response);
        assertEquals("REJECTED", response.getResult());
        verify(repository, times(1)).save(any(InventoryReport.class));
    }
}
