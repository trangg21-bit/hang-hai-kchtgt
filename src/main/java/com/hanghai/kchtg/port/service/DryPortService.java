package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.port.dto.dryport.*;
import com.hanghai.kchtg.port.entity.DryPort;
import java.math.BigDecimal;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.port.repository.DryPortRepository;
import com.hanghai.kchtg.port.service.shared.AuditLogService;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
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
 * Service core for DryPort (inland port) CRUD operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DryPortService {

    private final DryPortRepository dryPortRepository;
    private final ChangeHistoryService changeHistoryService;
    private final AuditLogService auditLogService;
    private final UserResolverService userResolverService;
    private final com.hanghai.kchtg.user.repository.UserRepository userRepository;
    private final com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;

    @Transactional
    public DryPortResponse create(CreateDryPortRequest request) {
        if (dryPortRepository.existsByDryPortCode(request.getDryPortCode())) {
            throw new IllegalArgumentException("Mã " + request.getDryPortCode() + " đã tồn tại");
        }
        DryPort entity = DryPort.builder()
                .dryPortCode(request.getDryPortCode()).dryPortName(request.getDryPortName())
                .province(request.getProvince()).area(request.getArea())
                .teuCapacity(request.getTeuCapacity()).operationalStatus(request.getOperationalStatus())
                .approvalStatus(ApprovalStatus.PENDING)
                .mapSymbolId(request.getMapSymbolId()).build();
        DryPort saved = dryPortRepository.save(entity);

        String coordinates = request.getCoordinates();
        if ((coordinates == null || coordinates.trim().isEmpty()) && request.getLongitude() != null && request.getLatitude() != null) {
            coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        if (coordinates != null && !coordinates.trim().isEmpty()) {
            com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT;
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType objType = com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType.POINT_PORT;
            UUID refId = saved.getId();
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    saved.getDryPortName(),
                    "DRYPORT_" + saved.getDryPortCode(),
                    geomType,
                    objType,
                    coordinates,
                    refId,
                    com.hanghai.kchtg.gis.search.dto.InfrastructureType.DRY_PORT
            );
            saved.setSpatialId(spatialObj.getId());
            saved = dryPortRepository.save(saved);
        }

        log.info("Created DryPort [{}] code={}", saved.getId(), saved.getDryPortCode());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public DryPortResponse getById(UUID id) {
        return toResponse(dryPortRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng cạn với id: " + id)));
    }

    @Transactional(readOnly = true)
    public Page<DryPortResponse> findAll(int page, int size, UUID orgUnitId) {
        return findAll(page, size, orgUnitId, null, null, null);
    }

    @Transactional(readOnly = true)
    public Page<DryPortResponse> findAll(int page, int size, UUID orgUnitId,
                                             String search, String status, String approvalStatus) {
        int pageSize = Math.min(Math.max(size, 1), 5000);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("id")));
        OperationalStatus statusEnum = status != null ? OperationalStatus.fromString(status) : null;
        ApprovalStatus approvalEnum = approvalStatus != null ? ApprovalStatus.fromString(approvalStatus) : null;
        Page<DryPort> pageResult = dryPortRepository.searchDryPorts(orgUnitId, search, statusEnum, approvalEnum, pageable);

        java.util.Set<UUID> userUuids = new java.util.HashSet<>();
        pageResult.getContent().forEach(e -> {
            try {
                if (e.getCreatedBy() != null) userUuids.add(e.getCreatedBy());
                if (e.getUpdatedBy() != null) userUuids.add(e.getUpdatedBy());
            } catch (Exception ex) {
                // ignore
            }
        });

        java.util.Map<java.util.UUID, String> userNamesMap = new java.util.HashMap<>();
        if (!userUuids.isEmpty()) {
            userRepository.findAllById(userUuids).forEach(usr -> {
                String displayName = usr.getFullName() != null && !usr.getFullName().trim().isEmpty()
                        ? usr.getFullName()
                        : usr.getUsername();
                userNamesMap.put(usr.getId(), displayName);
            });
        }

        return pageResult.map(e -> toResponse(e, userNamesMap.get(e.getCreatedBy()), userNamesMap.get(e.getUpdatedBy())));
    }

    @Transactional(readOnly = true)
    public DryPortResponse findByCode(String dryPortCode) {
        return toResponse(dryPortRepository.findByDryPortCode(dryPortCode)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng cạn với mã: " + dryPortCode)));
    }

    @Transactional
    public DryPortResponse update(UpdateDryPortRequest request) {
        DryPort entity = dryPortRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng cạn với id: " + request.getId()));

        DryPort snapshot = DryPort.builder()
                .dryPortCode(entity.getDryPortCode())
                .dryPortName(entity.getDryPortName()).province(entity.getProvince())
                .area(entity.getArea())
                .teuCapacity(entity.getTeuCapacity()).operationalStatus(entity.getOperationalStatus())
                .approvalStatus(entity.getApprovalStatus())
                .orgUnitId(entity.getOrgUnitId())
                .mapSymbolId(entity.getMapSymbolId())
                .build();

        if (request.getDryPortName() != null) entity.setDryPortName(request.getDryPortName());
        if (request.getProvince() != null) entity.setProvince(request.getProvince());

        if (request.getArea() != null) entity.setArea(request.getArea());
        if (request.getTeuCapacity() != null) entity.setTeuCapacity(request.getTeuCapacity());
        if (request.getOperationalStatus() != null) entity.setOperationalStatus(request.getOperationalStatus());
        entity.setMapSymbolId(request.getMapSymbolId());
        entity.setApprovalStatus(ApprovalStatus.PENDING);

        DryPort saved = dryPortRepository.save(entity);

        String coordinates = request.getCoordinates();
        if ((coordinates == null || coordinates.trim().isEmpty()) && request.getLongitude() != null && request.getLatitude() != null) {
            coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        if (coordinates != null && !coordinates.trim().isEmpty()) {
            com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT;
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType objType = com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType.POINT_PORT;
            UUID refId = saved.getId();
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    saved.getSpatialId(),
                    saved.getDryPortName(),
                    "DRYPORT_" + saved.getDryPortCode(),
                    geomType,
                    objType,
                    coordinates,
                    refId,
                    com.hanghai.kchtg.gis.search.dto.InfrastructureType.DRY_PORT
            );
            saved.setSpatialId(spatialObj.getId());
            saved = dryPortRepository.save(saved);
        }

        changeHistoryService.recordChanges("DryPort", saved.getId().toString(),
                "system", snapshot, saved);

        log.info("Updated DryPort [{}] code={}", saved.getId(), saved.getDryPortCode());
        return toResponse(saved);
    }

    @Transactional
    public void softDelete(UUID id) {
        DryPort entity = dryPortRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng cạn với id: " + id));
        entity.softDelete();
        dryPortRepository.save(entity);
        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }
        log.info("Soft-deleted DryPort [{}] code={}", entity.getId(), entity.getDryPortCode());
    }

    private DryPortResponse toResponse(DryPort e) {
        return toResponse(e, null, null);
    }

    private DryPortResponse toResponse(DryPort e, String preResolvedCreatorName, String preResolvedUpdaterName) {
        String createdBy = preResolvedCreatorName != null ? preResolvedCreatorName : userResolverService.resolveName(e.getCreatedBy());
        String updatedBy = preResolvedUpdaterName != null ? preResolvedUpdaterName : userResolverService.resolveName(e.getUpdatedBy());

        DryPortResponse.DryPortResponseBuilder builder = DryPortResponse.builder()
                .id(e.getId()).dryPortCode(e.getDryPortCode()).dryPortName(e.getDryPortName())
                .province(e.getProvince())
                .area(e.getArea()).teuCapacity(e.getTeuCapacity())
                .operationalStatus(e.getOperationalStatus()).approvalStatus(e.getApprovalStatus())
                .orgUnitId(e.getOrgUnitId())
                .mapSymbolId(e.getMapSymbolId())
                .createdBy(e.getCreatedBy())
                .updatedBy(e.getUpdatedBy())
                .createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt());

        if (e.getSpatialId() != null) {
            builder.spatialId(e.getSpatialId());
            gisSpatialObjectService.findById(e.getSpatialId()).ifPresent(spatialObj -> {
                builder.geometryType(spatialObj.getGeometryType());
                builder.coordinates(spatialObj.getCoordinates());
                try {
                    String clean = spatialObj.getCoordinates().replace("POINT", "").replace("(", "").replace(")", "").trim();
                    String[] parts = clean.split("\\s+");
                    if (parts.length == 2) {
                    }
                } catch (Exception ex) {
                    // ignore
                }
            });
        }
        return builder.build();
    }
}
