package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.assetmovement.dto.KeHoachKiemKeRequest;
import com.hanghai.kchtg.assetmovement.dto.KeHoachKiemKeResponse;
import com.hanghai.kchtg.assetmovement.entity.KeHoachKiemKe;
import com.hanghai.kchtg.assetmovement.entity.LoaiKiemKe;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiKeHoach;
import com.hanghai.kchtg.assetmovement.repository.KeHoachKiemKeRepository;
import com.hanghai.kchtg.assetmovement.service.KeHoachKiemKeService;
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
@DisplayName("KeHoachKiemKeService Unit Tests")
public class KeHoachKiemKeServiceTest {

    @InjectMocks
    private KeHoachKiemKeService service;

    @Mock
    private KeHoachKiemKeRepository repository;

    @Mock
    private UserRepository userRepository;

    private UUID testId;
    private KeHoachKiemKe testEntity;
    private KeHoachKiemKeRequest testRequest;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        testEntity = KeHoachKiemKe.builder()
                .id(testId)
                .tenKeHoach("Kiểm kê Q3/2026")
                .moTa("Kiểm kê định kỳ")
                .loaiKiemKe(LoaiKiemKe.DINH_KY)
                .trangThai(TrangThaiKeHoach.CHO_PHE_DUYET)
                .deleted(false)
                .build();
        testEntity.setCreatedAt(Instant.now());
        testEntity.setUpdatedAt(Instant.now());

        testRequest = new KeHoachKiemKeRequest();
        testRequest.setTenKeHoach("Kiểm kê Q3/2026");
        testRequest.setMoTa("Kiểm kê định kỳ");
        testRequest.setLoaiKiemKe(LoaiKiemKe.DINH_KY);
    }

    @Test
    @DisplayName("create should save plan and return response successfully")
    void create_ShouldSavePlanAndReturnResponse() {
        when(repository.save(any(KeHoachKiemKe.class))).thenReturn(testEntity);

        KeHoachKiemKeResponse response = service.create(testRequest);

        assertNotNull(response);
        assertEquals(testId, response.getId());
        assertEquals("Kiểm kê Q3/2026", response.getTenKeHoach());
        assertEquals("CHO_PHE_DUYET", response.getTrangThai());
        verify(repository, times(1)).save(any(KeHoachKiemKe.class));
    }

    @Test
    @DisplayName("getById should return plan when ID exists")
    void getById_ShouldReturnPlan_WhenIdExists() {
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));

        KeHoachKiemKeResponse response = service.getById(testId);

        assertNotNull(response);
        assertEquals(testId, response.getId());
        assertEquals("Kiểm kê Q3/2026", response.getTenKeHoach());
    }

    @Test
    @DisplayName("getById should throw exception when ID does not exist")
    void getById_ShouldThrowException_WhenIdDoesNotExist() {
        when(repository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.getById(testId));
    }

    @Test
    @DisplayName("approve should update status to DA_PHE_DUYET and save")
    void approve_ShouldUpdateStatusToDaPheDuyet() {
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(repository.save(any(KeHoachKiemKe.class))).thenAnswer(invocation -> invocation.getArgument(0));

        KeHoachKiemKeResponse response = service.approve(testId, "Duyệt kế hoạch");

        assertNotNull(response);
        assertEquals("DA_PHE_DUYET", response.getTrangThai());
        verify(repository, times(1)).save(any(KeHoachKiemKe.class));
    }

    @Test
    @DisplayName("reject should return status to CHO_PHE_DUYET and save")
    void reject_ShouldReturnStatusToChoPheDuyet() {
        testEntity.setTrangThai(TrangThaiKeHoach.DA_PHE_DUYET);
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(repository.save(any(KeHoachKiemKe.class))).thenAnswer(invocation -> invocation.getArgument(0));

        KeHoachKiemKeResponse response = service.reject(testId, "Từ chối do thiếu thông tin");

        assertNotNull(response);
        assertEquals("CHO_PHE_DUYET", response.getTrangThai());
        verify(repository, times(1)).save(any(KeHoachKiemKe.class));
    }

    @Test
    @DisplayName("startExecution should update status to DANG_THUC_HIEN")
    void startExecution_ShouldUpdateStatusToDangThucHien() {
        testEntity.setTrangThai(TrangThaiKeHoach.DA_PHE_DUYET);
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(repository.save(any(KeHoachKiemKe.class))).thenAnswer(invocation -> invocation.getArgument(0));

        KeHoachKiemKeResponse response = service.startExecution(testId);

        assertNotNull(response);
        assertEquals("DANG_THUC_HIEN", response.getTrangThai());
    }

    @Test
    @DisplayName("completeExecution should update status to HOAN_THANH")
    void completeExecution_ShouldUpdateStatusToHoanThanh() {
        testEntity.setTrangThai(TrangThaiKeHoach.DANG_THUC_HIEN);
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(repository.save(any(KeHoachKiemKe.class))).thenAnswer(invocation -> invocation.getArgument(0));

        KeHoachKiemKeResponse response = service.completeExecution(testId);

        assertNotNull(response);
        assertEquals("HOAN_THANH", response.getTrangThai());
    }
}
