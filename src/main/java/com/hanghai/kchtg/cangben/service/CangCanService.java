package com.hanghai.kchtg.cangben.service;

import com.hanghai.kchtg.cangben.dto.cangcan.*;
import com.hanghai.kchtg.cangben.entity.CangCan;
import java.math.BigDecimal;
import com.hanghai.kchtg.common.entity.TrangThaiHoatDong;
import com.hanghai.kchtg.common.entity.TrangThaiPheDuyet;
import com.hanghai.kchtg.cangben.repository.CangCanRepository;
import com.hanghai.kchtg.cangben.service.shared.AuditLogService;
import com.hanghai.kchtg.cangben.service.shared.LichSuThayDoiService;
import com.hanghai.kchtg.cangben.service.shared.UserResolverService;
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

/**
 * Service core for CangCan (inland port) CRUD operations.
 * Covers F-026 (create), F-027 (update), F-028 (soft-delete), F-029 (list).
 * <p>
 * Business rules:
 * - Code (maCangCan) is immutable after creation — duplicate detection on create
 * - Approval status always set to CHO_PHE_DUYET on create/update
 * - No parent FK guard (CangCan is independent)
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CangCanService {

    private final CangCanRepository cangCanRepository;
    private final LichSuThayDoiService lichSuThayDoiService;
    private final AuditLogService auditLogService;
    private final UserResolverService userResolverService;
    private final com.hanghai.kchtg.user.repository.UserRepository userRepository;
    private final com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;

    @Transactional
    public CangCanResponse create(CreateCangCanRequest request) {
        if (cangCanRepository.existsByMaCangCan(request.getMaCangCan())) {
            throw new IllegalArgumentException("Mã " + request.getMaCangCan() + " đã tồn tại");
        }
        CangCan entity = CangCan.builder()
                .maCangCan(request.getMaCangCan()).tenCangCan(request.getTenCangCan())
                .tinhThanhPho(request.getTinhThanhPho()).dienTich(request.getDienTich())
                .congSuatTEU(request.getCongSuatTEU()).trangThaiHoatDong(request.getTrangThaiHoatDong())
                .trangThaiPheDuyet(TrangThaiPheDuyet.CHO_PHE_DUYET)
                .bieuTuongId(request.getBieuTuongId()).build();
        CangCan saved = cangCanRepository.save(entity);

        String toaDo = request.getToaDo();
        if ((toaDo == null || toaDo.trim().isEmpty()) && request.getKinhDo() != null && request.getViDo() != null) {
            toaDo = "POINT(" + request.getKinhDo() + " " + request.getViDo() + ")";
        }

        if (toaDo != null && !toaDo.trim().isEmpty()) {
            com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geomType = request.getLoaiHinhHoc() != null ? request.getLoaiHinhHoc() : com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT;
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType objType = com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType.POINT_PORT;
            UUID refId = saved.getId();
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    saved.getTenCangCan(),
                    "CANGCAN_" + saved.getMaCangCan(),
                    geomType,
                    objType,
                    toaDo,
                    request.getBieuTuongId(),
                    refId,
                    com.hanghai.kchtg.gis.search.dto.KchtType.CANGCAN
            );
            saved.setKhongGianId(spatialObj.getId());
            saved = cangCanRepository.save(saved);
        }

        log.info("Created CangCan [{}] code={}", saved.getId(), saved.getMaCangCan());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public CangCanResponse getById(UUID id) {
        return toResponse(cangCanRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng cạn với id: " + id)));
    }

    @Transactional(readOnly = true)
    public Page<CangCanResponse> findAll(int page, int size, UUID orgUnitId) {
        return findAll(page, size, orgUnitId, null, null, null);
    }

    @Transactional(readOnly = true)
    public Page<CangCanResponse> findAll(int page, int size, UUID orgUnitId,
                                         String search, String status, String approvalStatus) {
        int pageSize = Math.min(Math.max(size, 1), 5000);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("id")));
        TrangThaiHoatDong statusEnum = status != null ? TrangThaiHoatDong.fromString(status) : null;
        TrangThaiPheDuyet approvalEnum = approvalStatus != null ? TrangThaiPheDuyet.fromString(approvalStatus) : null;
        Page<CangCan> pageResult = cangCanRepository.searchCangCan(orgUnitId, search, statusEnum, approvalEnum, pageable);

        java.util.Set<UUID> userUuids = new java.util.HashSet<>();
        pageResult.getContent().forEach(e -> {
            try {
                if (e.getCreatedBy() != null) userUuids.add(UUID.fromString(e.getCreatedBy()));
                if (e.getUpdatedBy() != null) userUuids.add(UUID.fromString(e.getUpdatedBy()));
            } catch (Exception ex) {
                // ignore
            }
        });

        java.util.Map<String, String> userNamesMap = new java.util.HashMap<>();
        if (!userUuids.isEmpty()) {
            userRepository.findAllById(userUuids).forEach(usr -> {
                String displayName = usr.getFullName() != null && !usr.getFullName().trim().isEmpty()
                        ? usr.getFullName()
                        : usr.getUsername();
                userNamesMap.put(usr.getId().toString(), displayName);
            });
        }

        return pageResult.map(e -> toResponse(e, userNamesMap.get(e.getCreatedBy()), userNamesMap.get(e.getUpdatedBy())));
    }

    @Transactional(readOnly = true)
    public CangCanResponse findByCode(String maCangCan) {
        return toResponse(cangCanRepository.findByMaCangCan(maCangCan)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng cạn với mã: " + maCangCan)));
    }

    @Transactional
    public CangCanResponse update(UpdateCangCanRequest request) {
        CangCan entity = cangCanRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng cạn với id: " + request.getId()));

        // Capture pre-mutation snapshot BEFORE applying changes (INT-003c fix)
        CangCan snapshot = CangCan.builder()
                .maCangCan(entity.getMaCangCan())
                .tenCangCan(entity.getTenCangCan()).tinhThanhPho(entity.getTinhThanhPho())
                .dienTich(entity.getDienTich())
                .congSuatTEU(entity.getCongSuatTEU()).trangThaiHoatDong(entity.getTrangThaiHoatDong())
                .trangThaiPheDuyet(entity.getTrangThaiPheDuyet())
                .orgUnitId(entity.getOrgUnitId())
                .bieuTuongId(entity.getBieuTuongId())
                .build();

        if (request.getTenCangCan() != null) entity.setTenCangCan(request.getTenCangCan());
        if (request.getTinhThanhPho() != null) entity.setTinhThanhPho(request.getTinhThanhPho());

        if (request.getDienTich() != null) entity.setDienTich(request.getDienTich());
        if (request.getCongSuatTEU() != null) entity.setCongSuatTEU(request.getCongSuatTEU());
        if (request.getTrangThaiHoatDong() != null) entity.setTrangThaiHoatDong(request.getTrangThaiHoatDong());
        entity.setBieuTuongId(request.getBieuTuongId());
        // Reset approval status — changes require re-approval
        entity.setTrangThaiPheDuyet(TrangThaiPheDuyet.CHO_PHE_DUYET);

        CangCan saved = cangCanRepository.save(entity);

        // Sync to GisSpatialObject
        String toaDo = request.getToaDo();
        if ((toaDo == null || toaDo.trim().isEmpty()) && request.getKinhDo() != null && request.getViDo() != null) {
            toaDo = "POINT(" + request.getKinhDo() + " " + request.getViDo() + ")";
        }

        if (toaDo != null && !toaDo.trim().isEmpty()) {
            com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geomType = request.getLoaiHinhHoc() != null ? request.getLoaiHinhHoc() : com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT;
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType objType = com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType.POINT_PORT;
            UUID refId = saved.getId();
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    saved.getKhongGianId(),
                    saved.getTenCangCan(),
                    "CANGCAN_" + saved.getMaCangCan(),
                    geomType,
                    objType,
                    toaDo,
                    request.getBieuTuongId(),
                    refId,
                    com.hanghai.kchtg.gis.search.dto.KchtType.CANGCAN
            );
            saved.setKhongGianId(spatialObj.getId());
            saved = cangCanRepository.save(saved);
        }

        // Record change history using pre-mutation snapshot (INT-003b/c)
        lichSuThayDoiService.recordChanges("CangCan", saved.getId().toString(),
                "system", snapshot, saved);

        log.info("Updated CangCan [{}] code={}", saved.getId(), saved.getMaCangCan());
        return toResponse(saved);
    }

    @Transactional
    public void softDelete(UUID id) {
        CangCan entity = cangCanRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng cạn với id: " + id));
        entity.softDelete();
        cangCanRepository.save(entity);
        if (entity.getKhongGianId() != null) {
            gisSpatialObjectService.delete(entity.getKhongGianId());
        }
        log.info("Soft-deleted CangCan [{}] code={}", entity.getId(), entity.getMaCangCan());
    }

    private CangCanResponse toResponse(CangCan e) {
        return toResponse(e, null, null);
    }

    private CangCanResponse toResponse(CangCan e, String preResolvedCreatorName, String preResolvedUpdaterName) {
        String createdBy = preResolvedCreatorName != null ? preResolvedCreatorName : userResolverService.resolveName(e.getCreatedBy());
        String updatedBy = preResolvedUpdaterName != null ? preResolvedUpdaterName : userResolverService.resolveName(e.getUpdatedBy());

        CangCanResponse.CangCanResponseBuilder builder = CangCanResponse.builder()
                .id(e.getId()).maCangCan(e.getMaCangCan()).tenCangCan(e.getTenCangCan())
                .tinhThanhPho(e.getTinhThanhPho())
                .dienTich(e.getDienTich()).congSuatTEU(e.getCongSuatTEU())
                .trangThaiHoatDong(e.getTrangThaiHoatDong()).trangThaiPheDuyet(e.getTrangThaiPheDuyet())
                .orgUnitId(e.getOrgUnitId())
                .bieuTuongId(e.getBieuTuongId())
                .createdBy(createdBy)
                .updatedBy(updatedBy)
                .createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt());

        if (e.getKhongGianId() != null) {
            builder.khongGianId(e.getKhongGianId());
            gisSpatialObjectService.findById(e.getKhongGianId()).ifPresent(spatialObj -> {
                builder.loaiHinhHoc(spatialObj.getGeometryType());
                builder.toaDo(spatialObj.getCoordinates());
                try {
                    String clean = spatialObj.getCoordinates().replace("POINT", "").replace("(", "").replace(")", "").trim();
                    String[] parts = clean.split("\\s+");
                    if (parts.length == 2) {
                        builder.kinhDo(new BigDecimal(parts[0]));
                        builder.viDo(new BigDecimal(parts[1]));
                    }
                } catch (Exception ex) {
                    // ignore
                }
            });
        }
        return builder.build();
    }
}
