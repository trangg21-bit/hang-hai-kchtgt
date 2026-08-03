package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.assetmovement.dto.YeuCauGiamTaiSanRequest;
import com.hanghai.kchtg.assetmovement.dto.YeuCauGiamTaiSanResponse;
import com.hanghai.kchtg.assetmovement.entity.LoaiTaiSanKCHT;
import com.hanghai.kchtg.assetmovement.entity.NguyenNhanGiam;
import com.hanghai.kchtg.assetmovement.entity.TaiSanKCHT;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiTaiSan;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiYeuCau;
import com.hanghai.kchtg.assetmovement.entity.YeuCauGiamTaiSan;
import com.hanghai.kchtg.assetmovement.repository.TaiSanKCHTRepository;
import com.hanghai.kchtg.assetmovement.repository.YeuCauGiamTaiSanRepository;
import com.hanghai.kchtg.assetmovement.service.YeuCauGiamTaiSanService;
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
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("YeuCauGiamTaiSanService Unit Tests")
public class YeuCauGiamTaiSanServiceTest {

    @InjectMocks
    private YeuCauGiamTaiSanService service;

    @Mock
    private YeuCauGiamTaiSanRepository repository;

    @Mock
    private TaiSanKCHTRepository taiSanRepository;

    @Mock
    private UserRepository userRepository;

    private UUID testId;
    private UUID taiSanId;
    private YeuCauGiamTaiSan testEntity;
    private YeuCauGiamTaiSanRequest testRequest;
    private TaiSanKCHT mockTaiSan;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        taiSanId = UUID.randomUUID();

        testEntity = YeuCauGiamTaiSan.builder()
                .id(testId)
                .taiSanId(taiSanId)
                .nguyenNhanGiam(NguyenNhanGiam.HU_HONG)
                .ngayGiam(Instant.now())
                .moTa("Hỏng máy móc do bão số 5")
                .trangThai(TrangThaiYeuCau.CHO_PHE_DUYET)
                .createdBy(taiSanId)
                .deleted(false)
                .build();
        testEntity.setCreatedAt(Instant.now());
        testEntity.setUpdatedAt(Instant.now());

        testRequest = new YeuCauGiamTaiSanRequest();
        testRequest.setTaiSanId(taiSanId);
        testRequest.setTenTaiSan("Máy bơm nước");
        testRequest.setLyDo("Hỏng máy móc do bão số 5");
        testRequest.setSoLuong(1);
        testRequest.setDonViTinh("Cái");
        testRequest.setNguyenNhanGiam("HU_HONG");

        mockTaiSan = TaiSanKCHT.builder()
                .id(taiSanId)
                .maTaiSan("TS-002")
                .tenTaiSan("Máy bơm nước")
                .loaiTaiSan(LoaiTaiSanKCHT.LOAI_PHAO_TIEU)
                .trangThai(TrangThaiTaiSan.DANG_QUAN_LY)
                .build();
    }

    @Test
    @DisplayName("create should save and return response successfully")
    void create_ShouldSaveAndReturnResponse() {
        when(repository.save(any(YeuCauGiamTaiSan.class))).thenReturn(testEntity);

        YeuCauGiamTaiSanResponse response = service.create(testRequest);

        assertNotNull(response);
        assertEquals(testId, response.getId());
        assertEquals(taiSanId, response.getTaiSanId());
        assertEquals("Hỏng máy móc do bão số 5", response.getLyDo());
        assertEquals("CHO_PHE_DUYET", response.getTrangThai());
        verify(repository, times(1)).save(any(YeuCauGiamTaiSan.class));
    }

    @Test
    @DisplayName("getById should return response when id exists")
    void getById_ShouldReturnResponse_WhenIdExists() {
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));

        YeuCauGiamTaiSanResponse response = service.getById(testId);

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
        Page<YeuCauGiamTaiSan> page = new PageImpl<>(List.of(testEntity));
        when(repository.findAll(pageable)).thenReturn(page);
        when(taiSanRepository.findAllById(anyList())).thenReturn(List.of(mockTaiSan));
        when(userRepository.findAllById(anyList())).thenReturn(List.of());

        Page<YeuCauGiamTaiSanResponse> result = service.findAll(pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(testId, result.getContent().get(0).getId());
        verify(repository, times(1)).findAll(pageable);
    }

    @Test
    @DisplayName("update should modify and save entity when id exists")
    void update_ShouldModifyAndSave_WhenIdExists() {
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(repository.save(any(YeuCauGiamTaiSan.class))).thenReturn(testEntity);

        testRequest.setLyDo("Lý do thay đổi");
        YeuCauGiamTaiSanResponse response = service.update(testId, testRequest);

        assertNotNull(response);
        verify(repository, times(1)).findById(testId);
        verify(repository, times(1)).save(any(YeuCauGiamTaiSan.class));
    }

    @Test
    @DisplayName("update should throw EntityNotFoundException when id does not exist")
    void update_ShouldThrowException_WhenIdDoesNotExist() {
        when(repository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.update(testId, testRequest));
        verify(repository, times(1)).findById(testId);
        verify(repository, never()).save(any(YeuCauGiamTaiSan.class));
    }

    @Test
    @DisplayName("delete should soft-delete entity when id exists")
    void delete_ShouldSoftDelete_WhenIdExists() {
        when(repository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(repository.save(any(YeuCauGiamTaiSan.class))).thenReturn(testEntity);

        assertDoesNotThrow(() -> service.delete(testId));

        verify(repository, times(1)).findById(testId);
        verify(repository, times(1)).save(any(YeuCauGiamTaiSan.class));
        assertTrue(testEntity.getDeleted());
    }

    @Test
    @DisplayName("delete should throw EntityNotFoundException when id does not exist")
    void delete_ShouldThrowException_WhenIdDoesNotExist() {
        when(repository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.delete(testId));

        verify(repository, times(1)).findById(testId);
        verify(repository, never()).save(any(YeuCauGiamTaiSan.class));
    }
}
