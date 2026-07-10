package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.assetmovement.dto.BaoCaoKiemKeRequest;
import com.hanghai.kchtg.assetmovement.dto.BaoCaoKiemKeResponse;
import com.hanghai.kchtg.assetmovement.entity.BaoCaoKiemKe;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiBaoCao;
import com.hanghai.kchtg.assetmovement.repository.BaoCaoKiemKeRepository;
import com.hanghai.kchtg.assetmovement.service.BaoCaoKiemKeService;
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
@DisplayName("BaoCaoKiemKeService Unit Tests")
public class BaoCaoKiemKeServiceTest {

    @InjectMocks
    private BaoCaoKiemKeService service;

    @Mock
    private BaoCaoKiemKeRepository repository;

    @Mock
    private UserRepository userRepository;

    private UUID testId;
    private UUID keHoachId;
    private BaoCaoKiemKe testEntity;
    private BaoCaoKiemKeRequest testRequest;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        keHoachId = UUID.randomUUID();

        testEntity = BaoCaoKiemKe.builder()
                .id(testId)
                .keHoachId(keHoachId)
                .tongSoTaiSan(50)
                .soThua(2)
                .soThieu(0)
                .moTa("Báo cáo kiểm kê khớp số liệu")
                .trangThai(TrangThaiBaoCao.CHO_PHE_DUYET)
                .deleted(false)
                .build();
        testEntity.setCreatedAt(Instant.now());
        testEntity.setUpdatedAt(Instant.now());

        testRequest = new BaoCaoKiemKeRequest();
        testRequest.setKeHoachId(keHoachId);
        testRequest.setTongSoLuong(50);
        testRequest.setSoLuongChenhLech(2);
        testRequest.setMoTa("Báo cáo kiểm kê khớp số liệu");
    }

    @Test
    @DisplayName("create should save report and return response with CHO_PHE_DUYET state")
    void create_ShouldSaveReportAndReturnResponse() {
        when(repository.save(any(BaoCaoKiemKe.class))).thenReturn(testEntity);

        BaoCaoKiemKeResponse response = service.create(testRequest);

        assertNotNull(response);
        assertEquals(testId, response.getId());
        assertEquals("CHO_PHE_DUYET", response.getKetQua());
        verify(repository, times(1)).save(any(BaoCaoKiemKe.class));
    }

    @Test
    @DisplayName("getById should return report when ID exists")
    void getById_ShouldReturnReport_WhenIdExists() {
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));

        BaoCaoKiemKeResponse response = service.getById(testId);

        assertNotNull(response);
        assertEquals(testId, response.getId());
        assertEquals(keHoachId, response.getKeHoachId());
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
        when(repository.save(any(BaoCaoKiemKe.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BaoCaoKiemKeResponse response = service.approve(testId, "Duyệt báo cáo kiểm kê");

        assertNotNull(response);
        assertEquals("DA_PHE_DUYET", response.getKetQua());
        verify(repository, times(1)).save(any(BaoCaoKiemKe.class));
    }

    @Test
    @DisplayName("reject should return status to CHO_PHE_DUYET and save")
    void reject_ShouldReturnStatusToChoPheDuyet() {
        testEntity.setTrangThai(TrangThaiBaoCao.DA_PHE_DUYET);
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(repository.save(any(BaoCaoKiemKe.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BaoCaoKiemKeResponse response = service.reject(testId, "Từ chối báo cáo do chênh lệch chưa làm rõ");

        assertNotNull(response);
        assertEquals("TU_CHOI", response.getKetQua());
        verify(repository, times(1)).save(any(BaoCaoKiemKe.class));
    }
}
