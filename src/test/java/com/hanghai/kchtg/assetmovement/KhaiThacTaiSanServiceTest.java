package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.assetmovement.dto.KhaiThacTaiSanRequest;
import com.hanghai.kchtg.assetmovement.dto.KhaiThacTaiSanResponse;
import com.hanghai.kchtg.assetmovement.entity.KhaiThacTaiSan;
import com.hanghai.kchtg.assetmovement.entity.LoaiTaiSanKCHT;
import com.hanghai.kchtg.assetmovement.entity.TaiSanKCHT;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiTaiSan;
import com.hanghai.kchtg.assetmovement.repository.KhaiThacTaiSanRepository;
import com.hanghai.kchtg.assetmovement.repository.TaiSanKCHTRepository;
import com.hanghai.kchtg.assetmovement.service.KhaiThacTaiSanService;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("KhaiThacTaiSanService Unit Tests")
public class KhaiThacTaiSanServiceTest {

    @InjectMocks
    private KhaiThacTaiSanService service;

    @Mock
    private KhaiThacTaiSanRepository repository;

    @Mock
    private TaiSanKCHTRepository taiSanRepository;

    private UUID testId;
    private UUID taiSanId;
    private KhaiThacTaiSan testEntity;
    private KhaiThacTaiSanRequest testRequest;
    private TaiSanKCHT mockTaiSan;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        taiSanId = UUID.randomUUID();

        testEntity = KhaiThacTaiSan.builder()
                .id(testId)
                .taiSanId(taiSanId)
                .thoiGianHoatDong(24)
                .mucDoKhaiThac(BigDecimal.valueOf(100.0))
                .chiPhiVanHanh(BigDecimal.valueOf(50000000))
                .chiPhiBaoDuong(BigDecimal.valueOf(2000000))
                .tinhTrangKyThuat("Bình thường")
                .thangKhaiThac(7)
                .namKhaiThac(2026)
                .moTa("Khai thác phao tiêu tháng 7/2026")
                .deleted(false)
                .build();
        testEntity.setCreatedAt(Instant.now());
        testEntity.setUpdatedAt(Instant.now());

        testRequest = new KhaiThacTaiSanRequest();
        testRequest.setTaiSanId(taiSanId);
        testRequest.setTenTaiSan("Phao tiêu số 5");
        testRequest.setNamKhaiThac(2026);
        testRequest.setDoanhThu(BigDecimal.valueOf(50000000));
        testRequest.setHaoMon(BigDecimal.valueOf(2000000));
        testRequest.setMoTa("Khai thác phao tiêu tháng 7/2026");

        mockTaiSan = TaiSanKCHT.builder()
                .id(taiSanId)
                .maTaiSan("TS-005")
                .tenTaiSan("Phao tiêu số 5")
                .loaiTaiSan(LoaiTaiSanKCHT.LOAI_PHAO_TIEU)
                .trangThai(TrangThaiTaiSan.DANG_QUAN_LY)
                .build();
    }

    @Test
    @DisplayName("create should save and return response successfully")
    void create_ShouldSaveAndReturnResponse() {
        when(repository.save(any(KhaiThacTaiSan.class))).thenReturn(testEntity);

        KhaiThacTaiSanResponse response = service.create(testRequest);

        assertNotNull(response);
        assertEquals(testId, response.getId());
        assertEquals(taiSanId, response.getTaiSanId());
        assertEquals(2026, response.getNamKhaiThac());
        assertEquals(0, BigDecimal.valueOf(50000000).compareTo(response.getDoanhThu()));
        verify(repository, times(1)).save(any(KhaiThacTaiSan.class));
    }

    @Test
    @DisplayName("getById should return response when id exists")
    void getById_ShouldReturnResponse_WhenIdExists() {
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));

        KhaiThacTaiSanResponse response = service.getById(testId);

        assertNotNull(response);
        assertEquals(testId, response.getId());
        verify(repository, times(1)).findById(testId);
    }

    @Test
    @DisplayName("getById should throw EntityNotFoundException when id does not exist")
    void getById_ShouldThrowException_WhenIdDoesNotExist() {
        when(repository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.getById(testId));
        verify(repository, times(1)).findById(testId);
    }

    @Test
    @DisplayName("findAll should return page of responses")
    void findAll_ShouldReturnPageOfResponses() {
        Pageable pageable = mock(Pageable.class);
        Page<KhaiThacTaiSan> page = new PageImpl<>(List.of(testEntity));
        when(repository.findAll(pageable)).thenReturn(page);

        Page<KhaiThacTaiSanResponse> result = service.findAll(pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(testId, result.getContent().get(0).getId());
        verify(repository, times(1)).findAll(pageable);
    }

    @Test
    @DisplayName("update should modify and save entity when id exists")
    void update_ShouldModifyAndSave_WhenIdExists() {
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(repository.save(any(KhaiThacTaiSan.class))).thenReturn(testEntity);

        testRequest.setMoTa("Mô tả thay đổi");
        KhaiThacTaiSanResponse response = service.update(testId, testRequest);

        assertNotNull(response);
        verify(repository, times(1)).findById(testId);
        verify(repository, times(1)).save(any(KhaiThacTaiSan.class));
    }

    @Test
    @DisplayName("update should throw EntityNotFoundException when id does not exist")
    void update_ShouldThrowException_WhenIdDoesNotExist() {
        when(repository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.update(testId, testRequest));
        verify(repository, times(1)).findById(testId);
        verify(repository, never()).save(any(KhaiThacTaiSan.class));
    }

    @Test
    @DisplayName("delete should soft-delete entity when id exists")
    void delete_ShouldSoftDelete_WhenIdExists() {
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(repository.save(any(KhaiThacTaiSan.class))).thenReturn(testEntity);

        assertDoesNotThrow(() -> service.delete(testId));

        verify(repository, times(1)).findById(testId);
        verify(repository, times(1)).save(any(KhaiThacTaiSan.class));
        assertTrue(testEntity.getDeleted());
    }

    @Test
    @DisplayName("delete should throw EntityNotFoundException when id does not exist")
    void delete_ShouldThrowException_WhenIdDoesNotExist() {
        when(repository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.delete(testId));

        verify(repository, times(1)).findById(testId);
        verify(repository, never()).save(any(KhaiThacTaiSan.class));
    }
}
