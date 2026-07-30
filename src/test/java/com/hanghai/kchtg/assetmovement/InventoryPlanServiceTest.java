package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.assetmovement.dto.InventoryPlanRequest;
import com.hanghai.kchtg.assetmovement.dto.InventoryPlanResponse;
import com.hanghai.kchtg.assetmovement.entity.InventoryPlan;
import com.hanghai.kchtg.assetmovement.entity.InventoryType;
import com.hanghai.kchtg.assetmovement.entity.PlanStatus;
import com.hanghai.kchtg.assetmovement.repository.InventoryPlanRepository;
import com.hanghai.kchtg.assetmovement.service.InventoryPlanService;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("InventoryPlanService Unit Tests")
public class InventoryPlanServiceTest {

    @InjectMocks
    private InventoryPlanService service;

    @Mock
    private InventoryPlanRepository repository;

    @Mock
    private UserRepository userRepository;

    private UUID testId;
    private InventoryPlan testEntity;
    private InventoryPlanRequest testRequest;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        testEntity = InventoryPlan.builder()
                .id(testId)
                .planName("Kiểm kê Q3/2026")
                .description("Kiểm kê định kỳ")
                .inventoryType(InventoryType.PERIODIC)
                .status(PlanStatus.PENDING)

                .build();
        testEntity.setCreatedAt(java.time.LocalDateTime.now());
        testEntity.setUpdatedAt(java.time.LocalDateTime.now());

        testRequest = new InventoryPlanRequest();
        testRequest.setPlanName("Kiểm kê Q3/2026");
        testRequest.setDescription("Kiểm kê định kỳ");
        testRequest.setInventoryType(InventoryType.PERIODIC);
    }

    @Test
    @DisplayName("create should save plan and return response successfully")
    void create_ShouldSavePlanAndReturnResponse() {
        when(repository.save(any(InventoryPlan.class))).thenReturn(testEntity);

        InventoryPlanResponse response = service.create(testRequest);

        assertNotNull(response);
        assertEquals(testId, response.getId());
        assertEquals("Kiểm kê Q3/2026", response.getPlanName());
        assertEquals("PENDING", response.getStatus());
        verify(repository, times(1)).save(any(InventoryPlan.class));
    }

    @Test
    @DisplayName("getById should return plan when ID exists")
    void getById_ShouldReturnPlan_WhenIdExists() {
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));

        InventoryPlanResponse response = service.getById(testId);

        assertNotNull(response);
        assertEquals(testId, response.getId());
        assertEquals("Kiểm kê Q3/2026", response.getPlanName());
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
        when(repository.save(any(InventoryPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InventoryPlanResponse response = service.approve(testId, "Duyệt kế hoạch");

        assertNotNull(response);
        assertEquals("APPROVED", response.getStatus());
        verify(repository, times(1)).save(any(InventoryPlan.class));
    }

    @Test
    @DisplayName("reject should return status to PENDING and save")
    void reject_ShouldReturnStatusToChoPheDuyet() {
        testEntity.setStatus(PlanStatus.APPROVED);
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(repository.save(any(InventoryPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InventoryPlanResponse response = service.reject(testId, "Từ chối do thiếu thông tin");

        assertNotNull(response);
        assertEquals("REJECTED", response.getStatus());
        verify(repository, times(1)).save(any(InventoryPlan.class));
    }

    @Test
    @DisplayName("startExecution should update status to IN_PROGRESS")
    void startExecution_ShouldUpdateStatusToDangThucHien() {
        testEntity.setStatus(PlanStatus.APPROVED);
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(repository.save(any(InventoryPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InventoryPlanResponse response = service.startExecution(testId);

        assertNotNull(response);
        assertEquals("IN_PROGRESS", response.getStatus());
    }

    @Test
    @DisplayName("completeExecution should update status to COMPLETED")
    void completeExecution_ShouldUpdateStatusToHoanThanh() {
        testEntity.setStatus(PlanStatus.IN_PROGRESS);
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(repository.save(any(InventoryPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InventoryPlanResponse response = service.completeExecution(testId);

        assertNotNull(response);
        assertEquals("COMPLETED", response.getStatus());
    }
}
