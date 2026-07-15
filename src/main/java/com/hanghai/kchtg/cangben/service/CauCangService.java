package com.hanghai.kchtg.cangben.service;

import com.hanghai.kchtg.cangben.dto.caucang.*;
import com.hanghai.kchtg.cangben.entity.BenCang;
import com.hanghai.kchtg.cangben.entity.CauCang;
import com.hanghai.kchtg.cangben.entity.LoaiCau;
import com.hanghai.kchtg.common.entity.TrangThaiHoatDong;
import com.hanghai.kchtg.common.entity.TrangThaiPheDuyet;
import com.hanghai.kchtg.cangben.repository.BenCangRepository;
import com.hanghai.kchtg.cangben.repository.CauCangRepository;
import com.hanghai.kchtg.cangben.service.shared.LichSuThayDoiService;
import com.hanghai.kchtg.cangben.service.shared.UserResolverService;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
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
    private final GisSpatialObjectService gisSpatialObjectService;
    private final UserResolverService userResolverService;
    private final com.hanghai.kchtg.user.repository.UserRepository userRepository;
    private final com.hanghai.kchtg.gis.spatial.repository.GisSpatialObjectRepository gisSpatialObjectRepository;

    @Transactional
    public CauCangResponse create(CreateCauCangRequest request) {
        if (cauCangRepository.existsByMaCau(request.getMaCau())) {
            throw new IllegalArgumentException("Mã " + request.getMaCau() + " đã tồn tại");
        }

        // INT-005: verify parent BenCang exists and is HIEN_HANH
        BenCang parent = benCangRepository.findById(request.getBenCangId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Bến cảng không tồn tại: " + request.getBenCangId()));
        if (parent.getTrangThaiHoatDong() != TrangThaiHoatDong.HIEN_HANH) {
            throw new IllegalArgumentException(
                    "Không thể tạo cầu cảng: bến cảng cha phải ở trạng thái hoạt động (HIEN_HANH)");
        }

        UUID cauCangId = UUID.randomUUID();
        UUID spatialId = null;

        if (request.getToaDo() != null && !request.getToaDo().trim().isEmpty()) {
            GisGeometryType geomType = request.getLoaiHinhHoc() != null ? request.getLoaiHinhHoc() : GisGeometryType.LINE;
            GisSpatialObjectType objType = getSpatialObjectType(geomType);
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    request.getTenCau(),
                    request.getMaCau(),
                    geomType,
                    objType,
                    request.getToaDo(),
                    request.getBieuTuongId(),
                    cauCangId,
                    com.hanghai.kchtg.gis.search.dto.KchtType.CAUCANG
            );
            spatialId = spatialObj.getId();
        }

        CauCang entity = CauCang.builder()
                .id(cauCangId)
                .maCau(request.getMaCau()).tenCau(request.getTenCau())
                .benCangId(request.getBenCangId()).chieuDai(request.getChieuDai())
                .taiTrong(request.getTaiTrong()).loaiCau(request.getLoaiCau())
                .congNangKhaiThac(request.getCongNangKhaiThac())
                .trangThaiHoatDong(request.getTrangThaiHoatDong())
                .donViId(parent.getOrgUnitId())
                .trangThaiPheDuyet(TrangThaiPheDuyet.CHO_PHE_DUYET)
                .bieuTuongId(request.getBieuTuongId())
                .khongGianId(spatialId)
                .build();
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
        return findAll(page, size, orgUnitId, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public Page<CauCangResponse> findAll(int page, int size, UUID orgUnitId,
            String search, UUID benCangId,
            String status, String approvalStatus) {
        return findAll(page, size, orgUnitId, search, benCangId, (LoaiCau) null, status, approvalStatus);
    }

    @Transactional(readOnly = true)
    public Page<CauCangResponse> findAll(int page, int size, UUID orgUnitId,
            String search, UUID benCangId, LoaiCau loaiCau,
            String status, String approvalStatus) {
        int pageSize = Math.min(Math.max(size, 1), 5000);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by("createdAt").descending());
        TrangThaiHoatDong statusEnum = status != null ? TrangThaiHoatDong.fromString(status) : null;
        TrangThaiPheDuyet approvalEnum = approvalStatus != null ? TrangThaiPheDuyet.fromString(approvalStatus) : null;
        Page<CauCang> pageResult = cauCangRepository.searchCauCang(orgUnitId, search, benCangId, loaiCau, statusEnum, approvalEnum, pageable);
        
        java.util.List<UUID> parentIds = pageResult.getContent().stream()
                .map(CauCang::getBenCangId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(java.util.stream.Collectors.toList());

        java.util.Map<UUID, String> parentNameMap = new java.util.HashMap<>();
        if (!parentIds.isEmpty()) {
            benCangRepository.findAllById(parentIds).forEach(bc -> {
                parentNameMap.put(bc.getId(), bc.getTenBen());
            });
        }

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

        java.util.List<UUID> spatialIds = pageResult.getContent().stream()
                .map(CauCang::getKhongGianId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(java.util.stream.Collectors.toList());

        java.util.Map<UUID, com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject> spatialMap = new java.util.HashMap<>();
        if (!spatialIds.isEmpty()) {
            gisSpatialObjectRepository.findAllById(spatialIds).forEach(so -> {
                spatialMap.put(so.getId(), so);
            });
        }

        return pageResult.map(e -> toResponse(e, 
                parentNameMap.get(e.getBenCangId()),
                userNamesMap.get(e.getCreatedBy()),
                userNamesMap.get(e.getUpdatedBy()),
                spatialMap.get(e.getKhongGianId())
        ));
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
                .maCau(entity.getMaCau())
                .tenCau(entity.getTenCau()).benCangId(entity.getBenCangId())
                .chieuDai(entity.getChieuDai()).taiTrong(entity.getTaiTrong())
                .loaiCau(entity.getLoaiCau()).congNangKhaiThac(entity.getCongNangKhaiThac())
                .trangThaiHoatDong(entity.getTrangThaiHoatDong())
                .trangThaiPheDuyet(entity.getTrangThaiPheDuyet())
                .donViId(entity.getDonViId())
                .bieuTuongId(entity.getBieuTuongId())
                .build();

        if (request.getTenCau() != null)
            entity.setTenCau(request.getTenCau());
        if (request.getBenCangId() != null) {
            entity.setBenCangId(request.getBenCangId());
            BenCang parent = benCangRepository.findById(request.getBenCangId())
                    .orElseThrow(
                            () -> new EntityNotFoundException("Bến cảng không tồn tại: " + request.getBenCangId()));
            entity.setDonViId(parent.getOrgUnitId());
        } else if (entity.getDonViId() == null && entity.getBenCangId() != null) {
            benCangRepository.findById(entity.getBenCangId()).ifPresent(p -> {
                entity.setDonViId(p.getOrgUnitId());
            });
        }
        if (request.getChieuDai() != null)
            entity.setChieuDai(request.getChieuDai());
        if (request.getTaiTrong() != null)
            entity.setTaiTrong(request.getTaiTrong());
        if (request.getLoaiCau() != null)
            entity.setLoaiCau(request.getLoaiCau());
        if (request.getCongNangKhaiThac() != null)
            entity.setCongNangKhaiThac(request.getCongNangKhaiThac());
        if (request.getTrangThaiHoatDong() != null)
            entity.setTrangThaiHoatDong(request.getTrangThaiHoatDong());
        entity.setBieuTuongId(request.getBieuTuongId());

        if (request.getToaDo() != null) {
            if (request.getToaDo().trim().isEmpty()) {
                if (entity.getKhongGianId() != null) {
                    gisSpatialObjectService.delete(entity.getKhongGianId());
                    entity.setKhongGianId(null);
                }
            } else {
                GisGeometryType geomType = request.getLoaiHinhHoc() != null ? request.getLoaiHinhHoc() : GisGeometryType.LINE;
                GisSpatialObjectType objType = getSpatialObjectType(geomType);
                GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                        entity.getKhongGianId(),
                        entity.getTenCau(),
                        entity.getMaCau(),
                        geomType,
                        objType,
                        request.getToaDo(),
                        request.getBieuTuongId(),
                        entity.getId(),
                        com.hanghai.kchtg.gis.search.dto.KchtType.CAUCANG
                );
                entity.setKhongGianId(spatialObj.getId());
            }
        } else if (entity.getKhongGianId() != null && request.getTenCau() != null) {
            gisSpatialObjectService.findById(entity.getKhongGianId()).ifPresent(spatialObj -> {
                gisSpatialObjectService.createOrUpdate(
                        spatialObj.getId(),
                        request.getTenCau(),
                        spatialObj.getCode(),
                        spatialObj.getGeometryType(),
                        spatialObj.getObjectType(),
                        spatialObj.getCoordinates(),
                        spatialObj.getBieuTuongId(),
                        entity.getId(),
                        com.hanghai.kchtg.gis.search.dto.KchtType.CAUCANG
                );
            });
        }

        entity.setTrangThaiPheDuyet(TrangThaiPheDuyet.CHO_PHE_DUYET);

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
        if (entity.getKhongGianId() != null) {
            gisSpatialObjectService.delete(entity.getKhongGianId());
        }
        cauCangRepository.save(entity);
        log.info("Soft-deleted CauCang [{}] code={}", entity.getId(), entity.getMaCau());
    }


    private CauCangResponse toResponse(CauCang e) {
        return toResponse(e, null, null, null, null);
    }

    private CauCangResponse toResponse(CauCang e, String preResolvedTenBenCang) {
        return toResponse(e, preResolvedTenBenCang, null, null, null);
    }

    private CauCangResponse toResponse(CauCang e, String preResolvedTenBenCang, String preResolvedCreatorName, String preResolvedUpdaterName) {
        return toResponse(e, preResolvedTenBenCang, preResolvedCreatorName, preResolvedUpdaterName, null);
    }

    private CauCangResponse toResponse(CauCang e, String preResolvedTenBenCang, String preResolvedCreatorName, String preResolvedUpdaterName, com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject preResolvedSpatial) {
        GisGeometryType geomType = null;
        String coords = null;
        
        com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatial = preResolvedSpatial;
        if (spatial == null && e.getKhongGianId() != null) {
            spatial = gisSpatialObjectRepository.findById(e.getKhongGianId()).orElse(null);
        }
        
        if (spatial != null) {
            geomType = spatial.getGeometryType();
            coords = spatial.getCoordinates();
        }

        String tenBenCang = preResolvedTenBenCang;
        if (tenBenCang == null && e.getBenCangId() != null) {
            tenBenCang = benCangRepository.findById(e.getBenCangId()).map(BenCang::getTenBen).orElse(null);
        }

        String createdBy = preResolvedCreatorName != null ? preResolvedCreatorName : userResolverService.resolveName(e.getCreatedBy());
        String updatedBy = preResolvedUpdaterName != null ? preResolvedUpdaterName : userResolverService.resolveName(e.getUpdatedBy());

        return CauCangResponse.builder()
                .id(e.getId()).maCau(e.getMaCau()).tenCau(e.getTenCau())
                .benCangId(e.getBenCangId())
                .tenBenCang(tenBenCang)
                .chieuDai(e.getChieuDai())
                .taiTrong(e.getTaiTrong()).loaiCau(e.getLoaiCau())
                .congNangKhaiThac(e.getCongNangKhaiThac())
                .trangThaiHoatDong(e.getTrangThaiHoatDong()).trangThaiPheDuyet(e.getTrangThaiPheDuyet())
                .donViId(e.getDonViId())
                .bieuTuongId(e.getBieuTuongId())
                .khongGianId(e.getKhongGianId())
                .loaiHinhHoc(geomType)
                .toaDo(coords)
                .createdBy(createdBy)
                .updatedBy(updatedBy)
                .createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt()).build();
    }

    private GisGeometryType parseGeometryType(String typeStr) {
        if (typeStr == null) return GisGeometryType.LINE;
        try {
            return GisGeometryType.valueOf(typeStr.toUpperCase());
        } catch (IllegalArgumentException ex) {
            return GisGeometryType.LINE;
        }
    }

    private GisSpatialObjectType getSpatialObjectType(GisGeometryType geomType) {
        if (geomType == GisGeometryType.POINT) return GisSpatialObjectType.POINT_OTHER;
        if (geomType == GisGeometryType.POLYGON) return GisSpatialObjectType.POLYGON_OTHER;
        return GisSpatialObjectType.LINE_OTHER;
    }
}
