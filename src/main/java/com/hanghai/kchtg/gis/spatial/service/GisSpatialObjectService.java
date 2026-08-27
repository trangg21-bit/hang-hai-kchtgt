package com.hanghai.kchtg.gis.spatial.service;

import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialStatus;
import com.hanghai.kchtg.gis.spatial.repository.GisSpatialObjectRepository;
import com.hanghai.kchtg.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class GisSpatialObjectService {

    private final GisSpatialObjectRepository repository;

    /**
     * Tự động ánh xạ loại hình học và loại hạ tầng KCHT sang GisSpatialObjectType chuẩn
     */
    public GisSpatialObjectType resolveSpatialObjectType(GisGeometryType geomType, InfrastructureType refType) {
        if (geomType == null || geomType == GisGeometryType.POINT) {
            if (refType == null) return GisSpatialObjectType.POINT_OTHER;
            return switch (refType) {
                case SEAPORT, PORT_TERMINAL, DRY_PORT -> GisSpatialObjectType.POINT_PORT;
                case LIGHTHOUSE -> GisSpatialObjectType.POINT_LIGHTHOUSE;
                case BUOY -> GisSpatialObjectType.POINT_BUOY;
                default -> GisSpatialObjectType.POINT_OTHER;
            };
        } else if (geomType == GisGeometryType.POLYGON) {
            if (refType == null) return GisSpatialObjectType.POLYGON_OTHER;
            return switch (refType) {
                case WATER_AREA -> GisSpatialObjectType.POLYGON_WATER_ZONE;
                case ANCHORAGE_AREA -> GisSpatialObjectType.POLYGON_ANCHORAGE;
                case TRANSSHIPMENT_AREA -> GisSpatialObjectType.POLYGON_TRANSSHIPMENT;
                case STORM_SHELTER_AREA -> GisSpatialObjectType.POLYGON_STORM_SHELTER;
                case BUOY_BERTH -> GisSpatialObjectType.POLYGON_BUOY_BERTH;
                default -> GisSpatialObjectType.POLYGON_OTHER;
            };
        } else {
            if (refType == null) return GisSpatialObjectType.LINE_OTHER;
            return switch (refType) {
                case NAVIGATION_CHANNEL -> GisSpatialObjectType.LINE_SHIPPING_ROUTE;
                default -> GisSpatialObjectType.LINE_OTHER;
            };
        }
    }

    /**
     * Dịch vụ chung đồng bộ tọa độ mọi loại KCHT vào bảng tập trung gis_spatial_objects:
     * - Nếu coordinates rỗng/null: Tự động xóa đối tượng spatial cũ (nếu có) và trả về null.
     * - Nếu coordinates có dữ liệu: Tự động tạo mới hoặc cập nhật bản ghi trong gis_spatial_objects và trả về UUID spatialId.
     */
    public UUID syncSpatialObject(
            UUID currentSpatialId,
            String name,
            String code,
            GisGeometryType geometryType,
            String coordinates,
            UUID refId,
            InfrastructureType refType) {

        if (coordinates == null || coordinates.trim().isEmpty()) {
            if (currentSpatialId != null) {
                delete(currentSpatialId);
            }
            return null;
        }

        GisGeometryType geomType = geometryType != null ? geometryType : GisGeometryType.POINT;
        GisSpatialObjectType objType = resolveSpatialObjectType(geomType, refType);
        String objName = name != null ? name : (refType != null ? refType.name() : "KCHT");
        String objCode = code != null && !code.isBlank() ? code : "SPATIAL_" + (refId != null ? refId.toString().substring(0, 8) : UUID.randomUUID().toString().substring(0, 8));

        GisSpatialObject spatialObj = createOrUpdate(
                currentSpatialId,
                objName,
                objCode,
                geomType,
                objType,
                coordinates.trim(),
                refId,
                refType);

        return spatialObj != null ? spatialObj.getId() : null;
    }

    public GisSpatialObject createOrUpdate(
            UUID id,
            String name,
            String code,
            GisGeometryType geometryType,
            GisSpatialObjectType objectType,
            String coordinates,
            UUID refId,
            InfrastructureType refType) {

        GisSpatialObject entity;
        if (id != null) {
            entity = repository.findById(id).orElse(new GisSpatialObject());
        } else {
            entity = new GisSpatialObject();
            entity.setId(UUID.randomUUID());
        }

        entity.setName(name);
        entity.setCode(code != null && !code.trim().isEmpty() ? code : "SPATIAL_" + entity.getId().toString().substring(0, 8));
        entity.setGeometryType(geometryType != null ? geometryType : GisGeometryType.POINT);
        entity.setObjectType(objectType != null ? objectType : GisSpatialObjectType.POINT_OTHER);
        entity.setCoordinates(coordinates);
        entity.setRefId(refId);
        entity.setRefType(refType);
        entity.setStatus(GisSpatialStatus.PUBLISHED); // Mặc định PUBLISHED cho tích hợp trực tiếp KCHT

        return repository.save(entity);
    }

    public void delete(UUID id) {
        if (id == null) return;
        repository.findById(id).ifPresent(entity -> {
            entity.softDelete(SecurityUtils.getCurrentUserId());
            repository.save(entity);
        });
    }

    @Transactional(readOnly = true)
    public Optional<GisSpatialObject> findById(UUID id) {
        if (id == null) return Optional.empty();
        return repository.findById(id);
    }
}
