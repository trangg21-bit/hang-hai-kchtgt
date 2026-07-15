package com.hanghai.kchtg.cangben.service;

import com.hanghai.kchtg.cangben.dto.cangbien.CangBienResponse;
import com.hanghai.kchtg.cangben.dto.cangbien.CreateCangBienRequest;
import com.hanghai.kchtg.cangben.dto.cangbien.UpdateCangBienRequest;
import com.hanghai.kchtg.cangben.entity.CangBien;
import com.hanghai.kchtg.cangben.repository.BenCangRepository;
import com.hanghai.kchtg.cangben.repository.CangBienRepository;
import com.hanghai.kchtg.cangben.repository.CauCangRepository;
import com.hanghai.kchtg.cangben.repository.VungNuocRepository;
import com.hanghai.kchtg.cangben.service.shared.LichSuThayDoiService;
import com.hanghai.kchtg.cangben.service.shared.UserResolverService;
import com.hanghai.kchtg.common.entity.TrangThaiHoatDong;
import com.hanghai.kchtg.common.entity.TrangThaiPheDuyet;
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
 * Service core for CangBien CRUD operations.
 * Covers F-008 (create), F-009 (update), F-010 (soft-delete).
 * <p>
 * Business rules:
 * - Code (maCang) is immutable after creation — duplicate detection on create
 * - Approval status always set to CHO_PHE_DUYET on create/update
 * - Cannot soft-delete if active children (BenCang, VungNuoc) exist
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CangBienService {

    private final CangBienRepository cangBienRepository;
    private final BenCangRepository benCangRepository;
    private final VungNuocRepository vungNuocRepository;
    private final CauCangRepository cauCangRepository;
    private final LichSuThayDoiService lichSuThayDoiService;
    private final UserResolverService userResolverService;
    private final com.hanghai.kchtg.user.repository.UserRepository userRepository;
    private final com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;

    // ── CREATE (F-008) ──────────────────────────────────────────────────

    /**
     * Create a new CangBien. Returns 409 if code already exists.
     */
    @Transactional
    public CangBienResponse create(CreateCangBienRequest request) {
        if (cangBienRepository.existsByMaCang(request.getMaCang())) {
            throw new IllegalArgumentException("Mã " + request.getMaCang() + " đã tồn tại");
        }

        CangBien entity = CangBien.builder()
                .maCang(request.getMaCang())
                .tenCang(request.getTenCang())
                .tinhThanhPho(request.getTinhThanhPho())
                .viDo(request.getViDo())
                .kinhDo(request.getKinhDo())
                .dienTich(request.getDienTich())
                .khaNangTiepNhan(request.getKhaNangTiepNhan())
                .trangThaiHoatDong(request.getTrangThaiHoatDong())
                .trangThaiPheDuyet(TrangThaiPheDuyet.CHO_PHE_DUYET)
                .orgUnitId(request.getOrgUnitId())
                .nhomCangBien(request.getNhomCangBien())
                .bieuTuongId(request.getBieuTuongId())
                .build();

        CangBien saved = cangBienRepository.save(entity);

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
                    saved.getTenCang(),
                    "CANGBIEN_" + saved.getMaCang(),
                    geomType,
                    objType,
                    toaDo,
                    request.getBieuTuongId(),
                    refId,
                    com.hanghai.kchtg.gis.search.dto.KchtType.CANGBIEN
            );
            saved.setKhongGianId(spatialObj.getId());
            if (geomType == com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT) {
                try {
                    String clean = toaDo.replace("POINT", "").replace("(", "").replace(")", "").trim();
                    String[] parts = clean.split("\\s+");
                    if (parts.length == 2) {
                        saved.setKinhDo(new java.math.BigDecimal(parts[0]));
                        saved.setViDo(new java.math.BigDecimal(parts[1]));
                    }
                } catch (Exception e) {
                    log.error("Failed to parse POINT coordinates", e);
                }
            }
            saved = cangBienRepository.save(saved);
        }

        log.info("Created CangBien [{}] code={}", saved.getId(), saved.getMaCang());
        return toResponse(saved);
    }

    // ── READ ─────────────────────────────────────────────────────────────

    /**
     * Find a CangBien by ID.
     */
    @Transactional(readOnly = true)
    public CangBienResponse getById(UUID id) {
        CangBien entity = cangBienRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển với id: " + id));
        return toResponse(entity);
    }

    /**
     * Paginated list with optional org-unit filter.
     * Default page size 20, max 100.
     */
    @Transactional(readOnly = true)
    public Page<CangBienResponse> findAll(int page, int size, UUID orgUnitId) {
        return findAll(page, size, orgUnitId, null, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public Page<CangBienResponse> findAll(int page, int size, UUID orgUnitId,
                                          String maCang, String tenCang, String tinhThanhPho,
                                          String trangThaiHoatDong, String trangThaiPheDuyet,
                                          String search) {
        int pageSize = Math.min(Math.max(size, 1), 5000);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by("createdAt").descending());

        TrangThaiHoatDong statusEnum = trangThaiHoatDong != null ? TrangThaiHoatDong.fromString(trangThaiHoatDong) : null;
        TrangThaiPheDuyet approvalEnum = trangThaiPheDuyet != null ? TrangThaiPheDuyet.fromString(trangThaiPheDuyet) : null;
        Page<CangBien> results = cangBienRepository.searchCangBien(
                orgUnitId, maCang, tenCang, tinhThanhPho, statusEnum, approvalEnum, search, pageable);

        java.util.Set<UUID> userUuids = new java.util.HashSet<>();
        results.getContent().forEach(e -> {
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

        return results.map(e -> toResponse(e, userNamesMap.get(e.getCreatedBy()), userNamesMap.get(e.getUpdatedBy())));
    }

    // ── UPDATE (F-009) ──────────────────────────────────────────────────

    /**
     * Update a CangBien. Code is immutable. Resets approval to CHO_PHE_DUYET.
     * Captures a pre-mutation snapshot for change history (INT-003c).
     */
    @Transactional
    public CangBienResponse update(UpdateCangBienRequest request) {
        CangBien entity = cangBienRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển với id: " + request.getId()));

        // Capture pre-mutation snapshot before applying changes (INT-003c)
        CangBien preImage = CangBien.builder()
                .id(entity.getId())
                .maCang(entity.getMaCang())
                .tenCang(entity.getTenCang())
                .tinhThanhPho(entity.getTinhThanhPho())
                .viDo(entity.getViDo())
                .kinhDo(entity.getKinhDo())
                .dienTich(entity.getDienTich())
                .khaNangTiepNhan(entity.getKhaNangTiepNhan())
                .orgUnitId(entity.getOrgUnitId())
                .nhomCangBien(entity.getNhomCangBien())
                .trangThaiHoatDong(entity.getTrangThaiHoatDong())
                .trangThaiPheDuyet(entity.getTrangThaiPheDuyet())
                .bieuTuongId(entity.getBieuTuongId())
                .build();

        // Update mutable fields — code (maCang) is immutable
        if (request.getTenCang() != null) entity.setTenCang(request.getTenCang());
        if (request.getTinhThanhPho() != null) entity.setTinhThanhPho(request.getTinhThanhPho());
        if (request.getViDo() != null) entity.setViDo(request.getViDo());
        if (request.getKinhDo() != null) entity.setKinhDo(request.getKinhDo());
        if (request.getDienTich() != null) entity.setDienTich(request.getDienTich());
        if (request.getKhaNangTiepNhan() != null) entity.setKhaNangTiepNhan(request.getKhaNangTiepNhan());
        if (request.getOrgUnitId() != null) {
            UUID oldOrgUnitId = entity.getOrgUnitId();
            entity.setOrgUnitId(request.getOrgUnitId());
            if (!request.getOrgUnitId().equals(oldOrgUnitId)) {
                benCangRepository.findByCangBienIdAndDeletedAtIsNull(entity.getId()).forEach(bc -> {
                    bc.setOrgUnitId(request.getOrgUnitId());
                    benCangRepository.save(bc);
                    cauCangRepository.findByBenCangIdAndDeletedAtIsNull(bc.getId()).forEach(cc -> {
                        cc.setDonViId(request.getOrgUnitId());
                        cauCangRepository.save(cc);
                    });
                });
                vungNuocRepository.findByCangBienIdAndDeletedAtIsNull(entity.getId()).forEach(vn -> {
                    vn.setDonViId(request.getOrgUnitId());
                    vungNuocRepository.save(vn);
                });
            }
        }
        if (request.getNhomCangBien() != null) entity.setNhomCangBien(request.getNhomCangBien());
        entity.setBieuTuongId(request.getBieuTuongId());
        entity.setTrangThaiHoatDong(request.getTrangThaiHoatDong() != null ? request.getTrangThaiHoatDong() : entity.getTrangThaiHoatDong());
        entity.setTrangThaiPheDuyet(TrangThaiPheDuyet.CHO_PHE_DUYET);

        CangBien saved = cangBienRepository.save(entity);

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
                    saved.getTenCang(),
                    "CANGBIEN_" + saved.getMaCang(),
                    geomType,
                    objType,
                    toaDo,
                    request.getBieuTuongId(),
                    refId,
                    com.hanghai.kchtg.gis.search.dto.KchtType.CANGBIEN
            );
            saved.setKhongGianId(spatialObj.getId());
            if (geomType == com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT) {
                try {
                    String clean = toaDo.replace("POINT", "").replace("(", "").replace(")", "").trim();
                    String[] parts = clean.split("\\s+");
                    if (parts.length == 2) {
                        saved.setKinhDo(new java.math.BigDecimal(parts[0]));
                        saved.setViDo(new java.math.BigDecimal(parts[1]));
                    }
                } catch (Exception e) {
                    log.error("Failed to parse POINT coordinates", e);
                }
            }
            saved = cangBienRepository.save(saved);
        } else if (saved.getKhongGianId() != null) {
            com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geomType = request.getLoaiHinhHoc() != null ? request.getLoaiHinhHoc() : com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT;
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType objType = com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType.POINT_PORT;
            gisSpatialObjectService.createOrUpdate(
                    saved.getKhongGianId(),
                    saved.getTenCang(),
                    "CANGBIEN_" + saved.getMaCang(),
                    geomType,
                    objType,
                    "POINT(" + saved.getKinhDo() + " " + saved.getViDo() + ")",
                    saved.getBieuTuongId(),
                    saved.getId(),
                    com.hanghai.kchtg.gis.search.dto.KchtType.CANGBIEN
            );
        }

        // Record field-level change history (INT-003b)
        lichSuThayDoiService.recordChanges("CangBien", saved.getId().toString(), "system", preImage, saved);

        log.info("Updated CangBien [{}] code={}", saved.getId(), saved.getMaCang());
        return toResponse(saved);
    }

    // ── DELETE (F-010) ──────────────────────────────────────────────────

    /**
     * Soft-delete a CangBien. Returns 409 if active children exist.
     */
    @Transactional
    public void softDelete(UUID id) {
        CangBien entity = cangBienRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển với id: " + id));

        // Guard: cannot soft-delete if children exist
        long benCangCount = countBenCangByCangBienId(id);
        long vungNuocCount = countVungNuocByCangBienId(id);

        if (benCangCount > 0 || vungNuocCount > 0) {
            StringBuilder msg = new StringBuilder("Không thể xóa: còn ");
            if (benCangCount > 0) msg.append(benCangCount).append(" bến cảng đang hoạt động");
            if (benCangCount > 0 && vungNuocCount > 0) msg.append(", ");
            if (vungNuocCount > 0) msg.append(vungNuocCount).append(" vùng nước đang hoạt động");
            throw new IllegalArgumentException(msg.toString());
        }

        entity.softDelete();
        cangBienRepository.save(entity);
        if (entity.getKhongGianId() != null) {
            gisSpatialObjectService.delete(entity.getKhongGianId());
        }
        log.info("Soft-deleted CangBien [{}] code={}", entity.getId(), entity.getMaCang());
    }

    // ── Count helpers (would need their own repos — stubs for now) ──────

    private long countBenCangByCangBienId(UUID cangBienId) {
        return benCangRepository.countByCangBienIdAndDeletedAtIsNull(cangBienId);
    }

    private long countVungNuocByCangBienId(UUID cangBienId) {
        return vungNuocRepository.countByCangBienIdAndDeletedAtIsNull(cangBienId);
    }

    // ── Internal helpers ─────────────────────────────────────────────────

    private CangBienResponse toResponse(CangBien entity) {
        return toResponse(entity, null, null);
    }

    private CangBienResponse toResponse(CangBien entity, String preResolvedCreatorName, String preResolvedUpdaterName) {
        String createdBy = preResolvedCreatorName != null ? preResolvedCreatorName : userResolverService.resolveName(entity.getCreatedBy());
        String updatedBy = preResolvedUpdaterName != null ? preResolvedUpdaterName : userResolverService.resolveName(entity.getUpdatedBy());

        CangBienResponse.CangBienResponseBuilder builder = CangBienResponse.builder()
                .id(entity.getId())
                .maCang(entity.getMaCang())
                .tenCang(entity.getTenCang())
                .tinhThanhPho(entity.getTinhThanhPho())
                .viDo(entity.getViDo())
                .kinhDo(entity.getKinhDo())
                .dienTich(entity.getDienTich())
                .khaNangTiepNhan(entity.getKhaNangTiepNhan())
                .trangThaiHoatDong(entity.getTrangThaiHoatDong())
                .trangThaiPheDuyet(entity.getTrangThaiPheDuyet())
                .orgUnitId(entity.getOrgUnitId())
                .nhomCangBien(entity.getNhomCangBien())
                .bieuTuongId(entity.getBieuTuongId())
                .createdBy(createdBy)
                .updatedBy(updatedBy)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt());

        if (entity.getKhongGianId() != null) {
            builder.khongGianId(entity.getKhongGianId());
            gisSpatialObjectService.findById(entity.getKhongGianId()).ifPresent(spatialObj -> {
                builder.loaiHinhHoc(spatialObj.getGeometryType());
                builder.toaDo(spatialObj.getCoordinates());
            });
        }
        return builder.build();
    }
}
