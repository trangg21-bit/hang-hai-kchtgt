package com.hanghai.kchtg.gis.spatial.service;

import java.util.UUID;

import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialStatus;
import com.hanghai.kchtg.gis.spatial.repository.GisSpatialObjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;

@Service
@RequiredArgsConstructor
@Transactional
public class GisSpatialObjectService {

    private final GisSpatialObjectRepository repository;

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
        entity.setGeometryType(geometryType);
        entity.setObjectType(objectType);
        entity.setCoordinates(coordinates);
        entity.setRefId(refId);
        entity.setRefType(refType);
        entity.setStatus(GisSpatialStatus.PUBLISHED); // Default to PUBLISHED for direct KCHT integration

        return repository.save(entity);
    }

    public void delete(UUID id) {
        if (id == null) return;
        repository.findById(id).ifPresent(entity -> {
            entity.softDelete(com.hanghai.kchtg.security.SecurityUtils.getCurrentUserId());
            repository.save(entity);
        });
    }

    @Transactional(readOnly = true)
    public Optional<GisSpatialObject> findById(UUID id) {
        if (id == null) return Optional.empty();
        return repository.findById(id);
    }
}
