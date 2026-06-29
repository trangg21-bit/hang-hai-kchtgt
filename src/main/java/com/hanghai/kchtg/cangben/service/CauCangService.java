package com.hanghai.kchtg.cangben.service;

import com.hanghai.kchtg.cangben.dto.caucang.*;
import com.hanghai.kchtg.cangben.entity.BenCang;
import com.hanghai.kchtg.cangben.entity.CauCang;
import com.hanghai.kchtg.cangben.repository.BenCangRepository;
import com.hanghai.kchtg.cangben.repository.CauCangRepository;
import com.hanghai.kchtg.cangben.service.shared.LichSuThayDoiService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CauCangService {

    private final CauCangRepository cauCangRepository;
    private final BenCangRepository benCangRepository;
    private final LichSuThayDoiService lichSuThayDoiService;

    @Transactional
    public CauCangResponse create(CreateCauCangRequest request) {
        if (cauCangRepository.existsByMaCau(request.getMaCau())) {
            throw new IllegalArgumentException("Mã " + request.getMaCau() + " đã tồn tại");
        }

        // INT-005: verify parent BenCang exists and is HIEN_HANH
        BenCang parent = benCangRepository.findById(request.getBenCangId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Bến cảng không tồn tại: " + request.getBenCangId()));
        if (!"HIEN_HANH".equals(parent.getTrangThaiHoatDong())) {
            throw new IllegalArgumentException(
                    "Không thể tạo cầu cảng: bến cảng cha phải ở trạng thái hoạt động (HIEN_HANH)");
        }

        CauCang entity = CauCang.builder()
                .maCau(request.getMaCau()).tenCau(request.getTenCau())
                .benCangId(request.getBenCangId()).chieuDai(request.getChieuDai())
                .taiTrong(request.getTaiTrong()).loaiCau(request.getLoaiCau())
                .trangThaiHoatDong(request.getTrangThaiHoatDong())
                .trangThaiPheDuyet("CHO_PHE_DUYET").build();
        CauCang saved = cauCangRepository.save(entity);
        log.info("Created CauCang [{}] code={}", saved.getId(), saved.getMaCau());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public CauCangResponse getById(UUID id) {
        return toResponse(cauCangRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cầu cảng với id: " + id)));
    }

    @Transactional(readOnly = true)
    public Page<CauCangResponse> findAll(int page, int size, UUID orgUnitId) {
        int pageSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by("createdAt").descending());
        return cauCangRepository.findAllActive(orgUnitId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public CauCangResponse findByCode(String maCau) {
        return toResponse(cauCangRepository.findByMaCau(maCau)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cầu cảng với mã: " + maCau)));
    }

    @Transactional
    public CauCangResponse update(UpdateCauCangRequest request) {
        CauCang entity = cauCangRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cầu cảng với id: " + request.getId()));

        // Capture pre-mutation snapshot (INT-003c)
        CauCang snapshot = CauCang.builder()
                .tenCau(entity.getTenCau()).benCangId(entity.getBenCangId())
                .chieuDai(entity.getChieuDai()).taiTrong(entity.getTaiTrong())
                .loaiCau(entity.getLoaiCau()).trangThaiHoatDong(entity.getTrangThaiHoatDong())
                .trangThaiPheDuyet(entity.getTrangThaiPheDuyet())
                .build();

        if (request.getTenCau() != null) entity.setTenCau(request.getTenCau());
        if (request.getBenCangId() != null) entity.setBenCangId(request.getBenCangId());
        if (request.getChieuDai() != null) entity.setChieuDai(request.getChieuDai());
        if (request.getTaiTrong() != null) entity.setTaiTrong(request.getTaiTrong());
        if (request.getLoaiCau() != null) entity.setLoaiCau(request.getLoaiCau());
        if (request.getTrangThaiHoatDong() != null) entity.setTrangThaiHoatDong(request.getTrangThaiHoatDong());
        entity.setTrangThaiPheDuyet("CHO_PHE_DUYET");

        CauCang saved = cauCangRepository.save(entity);

        // Record change history (INT-003b)
        lichSuThayDoiService.recordChanges("CauCang", saved.getId().toString(), "system", snapshot, saved);

        log.info("Updated CauCang [{}] code={}", saved.getId(), saved.getMaCau());
        return toResponse(saved);
    }

    @Transactional
    public void softDelete(UUID id) {
        CauCang entity = cauCangRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cầu cảng với id: " + id));
        entity.softDelete();
        cauCangRepository.save(entity);
        log.info("Soft-deleted CauCang [{}] code={}", entity.getId(), entity.getMaCau());
    }

    private CauCangResponse toResponse(CauCang e) {
        return CauCangResponse.builder()
                .id(e.getId()).maCau(e.getMaCau()).tenCau(e.getTenCau())
                .benCangId(e.getBenCangId()).chieuDai(e.getChieuDai())
                .taiTrong(e.getTaiTrong()).loaiCau(e.getLoaiCau())
                .trangThaiHoatDong(e.getTrangThaiHoatDong()).trangThaiPheDuyet(e.getTrangThaiPheDuyet())
                .orgUnitId(e.getOrgUnitId()).createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt()).build();
    }
}
