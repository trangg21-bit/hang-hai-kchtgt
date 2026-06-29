package com.hanghai.kchtg.assetmovement;

import com.hanghai.kchtg.assetmovement.dto.HoSoXuLyTaiSanRequest;
import com.hanghai.kchtg.assetmovement.dto.HoSoXuLyTaiSanResponse;
import com.hanghai.kchtg.assetmovement.entity.HoSoXuLyTaiSan;
import com.hanghai.kchtg.assetmovement.entity.LoaiXuLy;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiHoSoXuLy;
import com.hanghai.kchtg.assetmovement.repository.HoSoXuLyTaiSanRepository;
import com.hanghai.kchtg.assetmovement.service.HoSoXuLyTaiSanService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HoSoXuLyTaiSanServiceTest {

    @InjectMocks
    private HoSoXuLyTaiSanService service;

    @Mock
    private HoSoXuLyTaiSanRepository repo;

    private UUID entityId;

    @BeforeEach
    void setUp() {
        entityId = UUID.randomUUID();
    }

    @Test
    @DisplayName("F-124: create — returns created record")
    void testCreate() {
        HoSoXuLyTaiSanRequest request = new HoSoXuLyTaiSanRequest();
        request.setTaiSanId(UUID.randomUUID());
        request.setMoTa("Test ho so");

        HoSoXuLyTaiSan entity = HoSoXuLyTaiSan.builder()
                .id(entityId)
                .taiSanId(request.getTaiSanId())
                .moTa(request.getMoTa())
                .trangThai(TrangThaiHoSoXuLy.CHO_PHE_DUYET)
                .deleted(false)
                .build();

        when(repo.save(any(HoSoXuLyTaiSan.class))).thenReturn(entity);

        HoSoXuLyTaiSanResponse result = service.create(request);

        assertNotNull(result);
        assertEquals(entityId, result.getId());
    }

    @Test
    @DisplayName("F-124: getById — returns record by ID")
    void testGetById() {
        HoSoXuLyTaiSan entity = HoSoXuLyTaiSan.builder()
                .id(entityId)
                .loaiXuLy(LoaiXuLy.DIEU_CHUYEN)
                .trangThai(TrangThaiHoSoXuLy.CHO_PHE_DUYET)
                .build();
        when(repo.findById(entityId)).thenReturn(java.util.Optional.of(entity));

        HoSoXuLyTaiSanResponse result = service.getById(entityId);

        assertNotNull(result);
        assertEquals("DIEU_CHUYEN", result.getLoaiXuLy());
    }

    @Test
    @DisplayName("F-124: findAll — returns paginated records")
    void testGetAll() {
        Pageable pageable = PageRequest.of(0, 20);
        HoSoXuLyTaiSan entity = HoSoXuLyTaiSan.builder()
                .id(UUID.randomUUID())
                .loaiXuLy(LoaiXuLy.DIEU_CHUYEN)
                .build();
        when(repo.findAll(pageable)).thenReturn(new PageImpl<>(List.of(entity)));

        Page<HoSoXuLyTaiSanResponse> result = service.findAll(pageable);

        assertEquals(1, result.getTotalElements());
        verify(repo).findAll(pageable);
    }

    @Test
    @DisplayName("F-124: update — returns updated record")
    void testUpdate() {
        HoSoXuLyTaiSan existing = HoSoXuLyTaiSan.builder()
                .id(entityId)
                .loaiXuLy(LoaiXuLy.DIEU_CHUYEN)
                .trangThai(TrangThaiHoSoXuLy.CHO_PHE_DUYET)
                .build();
        when(repo.findById(entityId)).thenReturn(java.util.Optional.of(existing));

        HoSoXuLyTaiSan updated = HoSoXuLyTaiSan.builder()
                .id(entityId)
                .loaiXuLy(LoaiXuLy.DIEU_CHUYEN)
                .trangThai(TrangThaiHoSoXuLy.CHO_PHE_DUYET)
                .build();
        when(repo.save(any(HoSoXuLyTaiSan.class))).thenReturn(updated);

        HoSoXuLyTaiSanResponse result = service.update(entityId, new HoSoXuLyTaiSanRequest());

        assertNotNull(result);
        assertEquals(entityId, result.getId());
    }

    @Test
    @DisplayName("F-124: delete — calls repository deleteById")
    void testDelete() {
        when(repo.existsById(entityId)).thenReturn(true);
        service.delete(entityId);
        verify(repo).deleteById(entityId);
    }

    @Test
    @DisplayName("F-124: findByTaiSanId — returns records filtered by asset ID")
    void testFindByTaiSanId() {
        UUID taiSanId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(0, 20);
        HoSoXuLyTaiSan entity = HoSoXuLyTaiSan.builder()
                .id(UUID.randomUUID())
                .taiSanId(taiSanId)
                .loaiXuLy(LoaiXuLy.DIEU_CHUYEN)
                .build();
        when(repo.findByTaiSanId(taiSanId, pageable)).thenReturn(new PageImpl<>(List.of(entity)));

        Page<HoSoXuLyTaiSanResponse> result = service.findByTaiSanId(taiSanId, pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    @DisplayName("F-124: findByLoaiXuLy — returns records filtered by type")
    void testFindByLoaiXuLy() {
        Pageable pageable = PageRequest.of(0, 20);
        HoSoXuLyTaiSan entity = HoSoXuLyTaiSan.builder()
                .id(UUID.randomUUID())
                .loaiXuLy(LoaiXuLy.DIEU_CHUYEN)
                .build();
        when(repo.findByLoaiXuLy(LoaiXuLy.DIEU_CHUYEN, pageable)).thenReturn(new PageImpl<>(List.of(entity)));

        Page<HoSoXuLyTaiSanResponse> result = service.findByLoaiXuLy(LoaiXuLy.DIEU_CHUYEN, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("DIEU_CHUYEN", result.getContent().get(0).getLoaiXuLy());
    }
}
