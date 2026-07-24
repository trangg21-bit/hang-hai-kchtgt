package com.hanghai.kchtg.cangben.service;

import com.hanghai.kchtg.cangben.dto.caucang.*;
import com.hanghai.kchtg.cangben.entity.Berth;
import com.hanghai.kchtg.cangben.entity.Pier;
import com.hanghai.kchtg.cangben.entity.LoaiCau;
import com.hanghai.kchtg.common.entity.TrangThaiHoatDong;
import com.hanghai.kchtg.common.entity.TrangThaiPheDuyet;
import com.hanghai.kchtg.cangben.repository.BerthRepository;
import com.hanghai.kchtg.cangben.repository.PierRepository;
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
public class PierService {

    private final PierRepository pierRepository;
    private final BerthRepository berthRepository;
    private final LichSuThayDoiService lichSuThayDoiService;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final UserResolverService userResolverService;
    private final com.hanghai.kchtg.user.repository.UserRepository userRepository;
    private final com.hanghai.kchtg.gis.spatial.repository.GisSpatialObjectRepository gisSpatialObjectRepository;

    @Transactional
    public PierResponse create(CreatePierRequest request) {
        if (pierRepository.existsByPierCode(request.getPierCode())) {
            throw new IllegalArgumentException("Mã " + request.getPierCode() + " đã tồn tại");
        }

        Berth parent = berthRepository.findById(request.getBerthId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Bến cảng không tồn tại: " + request.getBerthId()));
        if (parent.getOperationalStatus() != TrangThaiHoatDong.HIEN_HANH) {
            throw new IllegalArgumentException(
                    "Không thể tạo cầu cảng: bến cảng cha phải ở trạng thái hoạt động (HIEN_HANH)");
        }

        UUID pierId = UUID.randomUUID();
        UUID spatialId = null;

        if (request.getCoordinates() != null && !request.getCoordinates().trim().isEmpty()) {
            GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : GisGeometryType.LINE;
            GisSpatialObjectType objType = getSpatialObjectType(geomType);
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    request.getPierName(),
                    request.getPierCode(),
                    geomType,
                    objType,
                    request.getCoordinates(),
                    pierId,
                    com.hanghai.kchtg.gis.search.dto.KchtType.CAUCANG
            );
            spatialId = spatialObj.getId();
        }

        Pier entity = Pier.builder()
                .id(pierId)
                .pierCode(request.getPierCode()).pierName(request.getPierName())
                .berthId(request.getBerthId()).length(request.getLength())
                .designLoad(request.getDesignLoad()).pierType(request.getPierType())
                .operationalFunction(request.getOperationalFunction())
                .operationalStatus(request.getOperationalStatus())
                .orgUnitId(parent.getOrgUnitId())
                .approvalStatus(TrangThaiPheDuyet.CHO_PHE_DUYET)
                .mapSymbolId(request.getMapSymbolId())
                .spatialId(spatialId)
                .build();
        Pier saved = pierRepository.save(entity);
        log.info("Created Pier [{}] code={}", saved.getId(), saved.getPierCode());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PierResponse getById(UUID id) {
        return toResponse(pierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cầu cảng với id: " + id)));
    }

    @Transactional(readOnly = true)
    public Page<PierResponse> findAll(int page, int size, UUID orgUnitId) {
        return findAll(page, size, orgUnitId, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public Page<PierResponse> findAll(int page, int size, UUID orgUnitId,
            String search, UUID berthId,
            String status, String approvalStatus) {
        return findAll(page, size, orgUnitId, search, berthId, (LoaiCau) null, status, approvalStatus);
    }

    @Transactional(readOnly = true)
    public Page<PierResponse> findAll(int page, int size, UUID orgUnitId,
            String search, UUID berthId, LoaiCau pierType,
            String status, String approvalStatus) {
        int pageSize = Math.min(Math.max(size, 1), 5000);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("id")));
        TrangThaiHoatDong statusEnum = status != null ? TrangThaiHoatDong.fromString(status) : null;
        TrangThaiPheDuyet approvalEnum = approvalStatus != null ? TrangThaiPheDuyet.fromString(approvalStatus) : null;
        Page<Pier> pageResult = pierRepository.searchPiers(orgUnitId, search, berthId, pierType, statusEnum, approvalEnum, pageable);
        
        java.util.List<UUID> parentIds = pageResult.getContent().stream()
                .map(Pier::getBerthId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(java.util.stream.Collectors.toList());

        java.util.Map<UUID, String> parentNameMap = new java.util.HashMap<>();
        if (!parentIds.isEmpty()) {
            berthRepository.findAllById(parentIds).forEach(bc -> {
                parentNameMap.put(bc.getId(), bc.getBerthName());
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
                .map(Pier::getSpatialId)
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
                parentNameMap.get(e.getBerthId()),
                userNamesMap.get(e.getCreatedBy()),
                userNamesMap.get(e.getUpdatedBy()),
                spatialMap.get(e.getSpatialId())
        ));
    }

    @Transactional(readOnly = true)
    public PierResponse findByCode(String pierCode) {
        return toResponse(pierRepository.findByPierCode(pierCode)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cầu cảng với mã: " + pierCode)));
    }

    @Transactional
    public PierResponse update(UpdatePierRequest request) {
        Pier entity = pierRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cầu cảng với id: " + request.getId()));

        Pier snapshot = Pier.builder()
                .pierCode(entity.getPierCode())
                .pierName(entity.getPierName()).berthId(entity.getBerthId())
                .length(entity.getLength()).designLoad(entity.getDesignLoad())
                .pierType(entity.getPierType()).operationalFunction(entity.getOperationalFunction())
                .operationalStatus(entity.getOperationalStatus())
                .approvalStatus(entity.getApprovalStatus())
                .orgUnitId(entity.getOrgUnitId())
                .mapSymbolId(entity.getMapSymbolId())
                .build();

        if (request.getPierName() != null)
            entity.setPierName(request.getPierName());
        if (request.getBerthId() != null) {
            entity.setBerthId(request.getBerthId());
            Berth parent = berthRepository.findById(request.getBerthId())
                    .orElseThrow(
                            () -> new EntityNotFoundException("Bến cảng không tồn tại: " + request.getBerthId()));
            entity.setOrgUnitId(parent.getOrgUnitId());
        } else if (entity.getOrgUnitId() == null && entity.getBerthId() != null) {
            berthRepository.findById(entity.getBerthId()).ifPresent(p -> {
                entity.setOrgUnitId(p.getOrgUnitId());
            });
        }
        if (request.getLength() != null)
            entity.setLength(request.getLength());
        if (request.getDesignLoad() != null)
            entity.setDesignLoad(request.getDesignLoad());
        if (request.getPierType() != null)
            entity.setPierType(request.getPierType());
        if (request.getOperationalFunction() != null)
            entity.setOperationalFunction(request.getOperationalFunction());
        if (request.getOperationalStatus() != null)
            entity.setOperationalStatus(request.getOperationalStatus());
        entity.setMapSymbolId(request.getMapSymbolId());

        if (request.getCoordinates() != null) {
            if (request.getCoordinates().trim().isEmpty()) {
                if (entity.getSpatialId() != null) {
                    gisSpatialObjectService.delete(entity.getSpatialId());
                    entity.setSpatialId(null);
                }
            } else {
                GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : GisGeometryType.LINE;
                GisSpatialObjectType objType = getSpatialObjectType(geomType);
                GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                        entity.getSpatialId(),
                        entity.getPierName(),
                        entity.getPierCode(),
                        geomType,
                        objType,
                        request.getCoordinates(),
                        entity.getId(),
                        com.hanghai.kchtg.gis.search.dto.KchtType.CAUCANG
                );
                entity.setSpatialId(spatialObj.getId());
            }
        } else if (entity.getSpatialId() != null && request.getPierName() != null) {
            gisSpatialObjectService.findById(entity.getSpatialId()).ifPresent(spatialObj -> {
                gisSpatialObjectService.createOrUpdate(
                        spatialObj.getId(),
                        request.getPierName(),
                        spatialObj.getCode(),
                        spatialObj.getGeometryType(),
                        spatialObj.getObjectType(),
                        spatialObj.getCoordinates(),
                        entity.getId(),
                        com.hanghai.kchtg.gis.search.dto.KchtType.CAUCANG
                );
            });
        }

        entity.setApprovalStatus(TrangThaiPheDuyet.CHO_PHE_DUYET);

        Pier saved = pierRepository.save(entity);

        lichSuThayDoiService.recordChanges("Pier", saved.getId().toString(), "system", snapshot, saved);

        log.info("Updated Pier [{}] code={}", saved.getId(), saved.getPierCode());
        return toResponse(saved);
    }

    @Transactional
    public void softDelete(UUID id) {
        Pier entity = pierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cầu cảng với id: " + id));
        entity.softDelete();
        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }
        pierRepository.save(entity);
        log.info("Soft-deleted Pier [{}] code={}", entity.getId(), entity.getPierCode());
    }


    private PierResponse toResponse(Pier e) {
        return toResponse(e, null, null, null, null);
    }

    private PierResponse toResponse(Pier e, String preResolvedBerthName) {
        return toResponse(e, preResolvedBerthName, null, null, null);
    }

    private PierResponse toResponse(Pier e, String preResolvedBerthName, String preResolvedCreatorName, String preResolvedUpdaterName) {
        return toResponse(e, preResolvedBerthName, preResolvedCreatorName, preResolvedUpdaterName, null);
    }

    private PierResponse toResponse(Pier e, String preResolvedBerthName, String preResolvedCreatorName, String preResolvedUpdaterName, com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject preResolvedSpatial) {
        GisGeometryType geomType = null;
        String coords = null;
        
        com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatial = preResolvedSpatial;
        if (spatial == null && e.getSpatialId() != null) {
            spatial = gisSpatialObjectRepository.findById(e.getSpatialId()).orElse(null);
        }
        
        if (spatial != null) {
            geomType = spatial.getGeometryType();
            coords = spatial.getCoordinates();
        }

        String berthName = preResolvedBerthName;
        if (berthName == null && e.getBerthId() != null) {
            berthName = berthRepository.findById(e.getBerthId()).map(Berth::getBerthName).orElse(null);
        }

        String createdBy = preResolvedCreatorName != null ? preResolvedCreatorName : userResolverService.resolveName(e.getCreatedBy());
        String updatedBy = preResolvedUpdaterName != null ? preResolvedUpdaterName : userResolverService.resolveName(e.getUpdatedBy());

        return PierResponse.builder()
                .id(e.getId()).pierCode(e.getPierCode()).pierName(e.getPierName())
                .berthId(e.getBerthId())
                .berthName(berthName)
                .length(e.getLength())
                .designLoad(e.getDesignLoad()).pierType(e.getPierType())
                .operationalFunction(e.getOperationalFunction())
                .operationalStatus(e.getOperationalStatus()).approvalStatus(e.getApprovalStatus())
                .orgUnitId(e.getOrgUnitId())
                .mapSymbolId(e.getMapSymbolId())
                .spatialId(e.getSpatialId())
                .geometryType(geomType)
                .coordinates(coords)
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
