package com.hanghai.kchtg.cangben.service;

import com.hanghai.kchtg.cangben.dto.vungnuoc.*;
import com.hanghai.kchtg.cangben.entity.VungNuoc;
import com.hanghai.kchtg.cangben.entity.LoaiVungNuoc;
import com.hanghai.kchtg.common.entity.TrangThaiHoatDong;
import com.hanghai.kchtg.common.entity.TrangThaiPheDuyet;
import com.hanghai.kchtg.cangben.repository.VungNuocRepository;
import com.hanghai.kchtg.cangben.service.shared.LichSuThayDoiService;
import com.hanghai.kchtg.cangben.service.shared.UserResolverService;
import com.hanghai.kchtg.cangben.entity.CangBien;
import com.hanghai.kchtg.cangben.repository.CangBienRepository;
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
public class VungNuocService {

    private final VungNuocRepository vungNuocRepository;
    private final CangBienRepository cangBienRepository;
    private final LichSuThayDoiService lichSuThayDoiService;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final UserResolverService userResolverService;
    private final com.hanghai.kchtg.user.repository.UserRepository userRepository;
    private final com.hanghai.kchtg.gis.spatial.repository.GisSpatialObjectRepository gisSpatialObjectRepository;

    @Transactional
    public VungNuocResponse create(CreateVungNuocRequest request) {
        if (vungNuocRepository.existsByMaVungNuoc(request.getMaVungNuoc())) {
            throw new IllegalArgumentException("Mã " + request.getMaVungNuoc() + " đã tồn tại");
        }
        CangBien parent = cangBienRepository.findById(request.getCangBienId())
                .orElseThrow(() -> new EntityNotFoundException("Cảng biển không tồn tại: " + request.getCangBienId()));

        UUID vungNuocId = UUID.randomUUID();
        UUID spatialId = null;

        if (request.getToaDo() != null && !request.getToaDo().trim().isEmpty()) {
            GisGeometryType geomType = request.getLoaiHinhHoc() != null ? request.getLoaiHinhHoc() : GisGeometryType.POLYGON;
            GisSpatialObjectType objType = getSpatialObjectType(geomType);
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    request.getTenVungNuoc(),
                    request.getMaVungNuoc(),
                    geomType,
                    objType,
                    request.getToaDo(),
                    request.getBieuTuongId(),
                    vungNuocId,
                    com.hanghai.kchtg.gis.search.dto.KchtType.VUNGNUOC
            );
            spatialId = spatialObj.getId();
        }

        VungNuoc entity = VungNuoc.builder()
                .id(vungNuocId)
                .maVungNuoc(request.getMaVungNuoc()).tenVungNuoc(request.getTenVungNuoc())
                .cangBienId(request.getCangBienId()).dienTich(request.getDienTich())
                .doSauMax(request.getDoSauMax()).doSauTrungBinh(request.getDoSauTrungBinh())
                .loaiVungNuoc(request.getLoaiVungNuoc()).trangThaiHoatDong(request.getTrangThaiHoatDong())
                .donViId(parent.getOrgUnitId())
                .trangThaiPheDuyet(TrangThaiPheDuyet.CHO_PHE_DUYET)
                .bieuTuongId(request.getBieuTuongId())
                .khongGianId(spatialId)
                .build();
        VungNuoc saved = vungNuocRepository.save(entity);
        log.info("Created VungNuoc [{}] code={}", saved.getId(), saved.getMaVungNuoc());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public VungNuocResponse getById(UUID id) {
        return toResponse(vungNuocRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vùng nước với id: " + id)));
    }

    @Transactional(readOnly = true)
    public Page<VungNuocResponse> findAll(int page, int size, UUID orgUnitId) {
        return findAll(page, size, orgUnitId, null);
    }

    @Transactional(readOnly = true)
    public Page<VungNuocResponse> findAll(int page, int size, UUID orgUnitId, UUID cangBienId) {
        return findAll(page, size, orgUnitId, cangBienId, null, (LoaiVungNuoc) null, null, null);
    }

    @Transactional(readOnly = true)
    public Page<VungNuocResponse> findAll(int page, int size, UUID orgUnitId, UUID cangBienId,
                                         String search, String status, String approvalStatus) {
        return findAll(page, size, orgUnitId, cangBienId, search, (LoaiVungNuoc) null, status, approvalStatus);
    }

    @Transactional(readOnly = true)
    public Page<VungNuocResponse> findAll(int page, int size, UUID orgUnitId, UUID cangBienId,
                                         String search, LoaiVungNuoc loaiVungNuoc, String status, String approvalStatus) {
        int pageSize = Math.min(Math.max(size, 1), 5000);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("id")));
        TrangThaiHoatDong statusEnum = status != null ? TrangThaiHoatDong.fromString(status) : null;
        TrangThaiPheDuyet approvalEnum = approvalStatus != null ? TrangThaiPheDuyet.fromString(approvalStatus) : null;
        Page<VungNuoc> pageResult = vungNuocRepository.searchVungNuoc(orgUnitId, cangBienId, search, loaiVungNuoc, statusEnum, approvalEnum, pageable);

        java.util.List<UUID> parentIds = pageResult.getContent().stream()
                .map(VungNuoc::getCangBienId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(java.util.stream.Collectors.toList());

        java.util.Map<UUID, String> parentNameMap = new java.util.HashMap<>();
        if (!parentIds.isEmpty()) {
            cangBienRepository.findAllById(parentIds).forEach(cb -> {
                parentNameMap.put(cb.getId(), cb.getTenCang());
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
                .map(VungNuoc::getKhongGianId)
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
                parentNameMap.get(e.getCangBienId()),
                userNamesMap.get(e.getCreatedBy()),
                userNamesMap.get(e.getUpdatedBy()),
                spatialMap.get(e.getKhongGianId())
        ));
    }

    @Transactional(readOnly = true)
    public VungNuocResponse findByCode(String maVungNuoc) {
        return toResponse(vungNuocRepository.findByMaVungNuoc(maVungNuoc)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vùng nước với mã: " + maVungNuoc)));
    }

    @Transactional
    public VungNuocResponse update(UpdateVungNuocRequest request) {
        VungNuoc entity = vungNuocRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vùng nước với id: " + request.getId()));

        // Capture pre-mutation snapshot (INT-003c)
        VungNuoc snapshot = VungNuoc.builder()
                .maVungNuoc(entity.getMaVungNuoc())
                .tenVungNuoc(entity.getTenVungNuoc()).cangBienId(entity.getCangBienId())
                .dienTich(entity.getDienTich()).doSauMax(entity.getDoSauMax())
                .doSauTrungBinh(entity.getDoSauTrungBinh()).loaiVungNuoc(entity.getLoaiVungNuoc())
                .trangThaiHoatDong(entity.getTrangThaiHoatDong()).trangThaiPheDuyet(entity.getTrangThaiPheDuyet())
                .donViId(entity.getDonViId())
                .bieuTuongId(entity.getBieuTuongId())
                .build();

        if (request.getTenVungNuoc() != null) entity.setTenVungNuoc(request.getTenVungNuoc());
        if (request.getCangBienId() != null) {
            entity.setCangBienId(request.getCangBienId());
            CangBien parent = cangBienRepository.findById(request.getCangBienId())
                    .orElseThrow(() -> new EntityNotFoundException("Cảng biển không tồn tại: " + request.getCangBienId()));
            entity.setDonViId(parent.getOrgUnitId());
        } else if (entity.getDonViId() == null && entity.getCangBienId() != null) {
            cangBienRepository.findById(entity.getCangBienId()).ifPresent(p -> {
                entity.setDonViId(p.getOrgUnitId());
            });
        }
        if (request.getDienTich() != null) entity.setDienTich(request.getDienTich());
        if (request.getDoSauMax() != null) entity.setDoSauMax(request.getDoSauMax());
        if (request.getDoSauTrungBinh() != null) entity.setDoSauTrungBinh(request.getDoSauTrungBinh());
        if (request.getLoaiVungNuoc() != null) entity.setLoaiVungNuoc(request.getLoaiVungNuoc());
        if (request.getTrangThaiHoatDong() != null) entity.setTrangThaiHoatDong(request.getTrangThaiHoatDong());
        entity.setBieuTuongId(request.getBieuTuongId());

        if (request.getToaDo() != null) {
            if (request.getToaDo().trim().isEmpty()) {
                if (entity.getKhongGianId() != null) {
                    gisSpatialObjectService.delete(entity.getKhongGianId());
                    entity.setKhongGianId(null);
                }
            } else {
                GisGeometryType geomType = request.getLoaiHinhHoc() != null ? request.getLoaiHinhHoc() : GisGeometryType.POLYGON;
                GisSpatialObjectType objType = getSpatialObjectType(geomType);
                GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                        entity.getKhongGianId(),
                        entity.getTenVungNuoc(),
                        entity.getMaVungNuoc(),
                        geomType,
                        objType,
                        request.getToaDo(),
                        request.getBieuTuongId(),
                        entity.getId(),
                        com.hanghai.kchtg.gis.search.dto.KchtType.VUNGNUOC
                );
                entity.setKhongGianId(spatialObj.getId());
            }
        } else if (entity.getKhongGianId() != null && request.getTenVungNuoc() != null) {
            gisSpatialObjectService.findById(entity.getKhongGianId()).ifPresent(spatialObj -> {
                gisSpatialObjectService.createOrUpdate(
                        spatialObj.getId(),
                        request.getTenVungNuoc(),
                        spatialObj.getCode(),
                        spatialObj.getGeometryType(),
                        spatialObj.getObjectType(),
                        spatialObj.getCoordinates(),
                        spatialObj.getBieuTuongId(),
                        entity.getId(),
                        com.hanghai.kchtg.gis.search.dto.KchtType.VUNGNUOC
                );
            });
        }

        entity.setTrangThaiPheDuyet(TrangThaiPheDuyet.CHO_PHE_DUYET);

        VungNuoc saved = vungNuocRepository.save(entity);

        // Record change history (INT-003b)
        lichSuThayDoiService.recordChanges("VungNuoc", saved.getId().toString(), "system", snapshot, saved);

        log.info("Updated VungNuoc [{}] code={}", saved.getId(), saved.getMaVungNuoc());
        return toResponse(saved);
    }

    @Transactional
    public void softDelete(UUID id) {
        VungNuoc entity = vungNuocRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vùng nước với id: " + id));
        entity.softDelete();
        if (entity.getKhongGianId() != null) {
            gisSpatialObjectService.delete(entity.getKhongGianId());
        }
        vungNuocRepository.save(entity);
        log.info("Soft-deleted VungNuoc [{}] code={}", entity.getId(), entity.getMaVungNuoc());
    }


    private VungNuocResponse toResponse(VungNuoc e) {
        return toResponse(e, null, null, null, null);
    }

    private VungNuocResponse toResponse(VungNuoc e, String preResolvedTenCangBien) {
        return toResponse(e, preResolvedTenCangBien, null, null, null);
    }

    private VungNuocResponse toResponse(VungNuoc e, String preResolvedTenCangBien, String preResolvedCreatorName, String preResolvedUpdaterName) {
        return toResponse(e, preResolvedTenCangBien, preResolvedCreatorName, preResolvedUpdaterName, null);
    }

    private VungNuocResponse toResponse(VungNuoc e, String preResolvedTenCangBien, String preResolvedCreatorName, String preResolvedUpdaterName, com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject preResolvedSpatial) {
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

        String tenCangBien = preResolvedTenCangBien;
        if (tenCangBien == null && e.getCangBienId() != null) {
            tenCangBien = cangBienRepository.findById(e.getCangBienId()).map(CangBien::getTenCang).orElse(null);
        }

        String createdBy = preResolvedCreatorName != null ? preResolvedCreatorName : userResolverService.resolveName(e.getCreatedBy());
        String updatedBy = preResolvedUpdaterName != null ? preResolvedUpdaterName : userResolverService.resolveName(e.getUpdatedBy());

        return VungNuocResponse.builder()
                .id(e.getId()).maVungNuoc(e.getMaVungNuoc()).tenVungNuoc(e.getTenVungNuoc())
                .cangBienId(e.getCangBienId())
                .tenCangBien(tenCangBien)
                .dienTich(e.getDienTich())
                .doSauMax(e.getDoSauMax()).doSauTrungBinh(e.getDoSauTrungBinh())
                .loaiVungNuoc(e.getLoaiVungNuoc()).trangThaiHoatDong(e.getTrangThaiHoatDong())
                .trangThaiPheDuyet(e.getTrangThaiPheDuyet()).donViId(e.getDonViId())
                .bieuTuongId(e.getBieuTuongId())
                .khongGianId(e.getKhongGianId())
                .loaiHinhHoc(geomType)
                .toaDo(coords)
                .createdBy(createdBy)
                .updatedBy(updatedBy)
                .createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt()).build();
    }

    private GisGeometryType parseGeometryType(String typeStr) {
        if (typeStr == null) return GisGeometryType.POLYGON;
        try {
            return GisGeometryType.valueOf(typeStr.toUpperCase());
        } catch (IllegalArgumentException ex) {
            return GisGeometryType.POLYGON;
        }
    }

    private GisSpatialObjectType getSpatialObjectType(GisGeometryType geomType) {
        if (geomType == GisGeometryType.POINT) return GisSpatialObjectType.POINT_OTHER;
        if (geomType == GisGeometryType.LINE) return GisSpatialObjectType.LINE_OTHER;
        return GisSpatialObjectType.POLYGON_WATER_ZONE;
    }
}
