package com.hanghai.kchtg.orgunit.service;

import com.hanghai.kchtg.orgunit.dto.CreateOrgUnitRequest;
import com.hanghai.kchtg.orgunit.dto.OrgUnitResponse;
import com.hanghai.kchtg.orgunit.dto.UpdateOrgUnitRequest;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.entity.OrgUnitStatus;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service layer for {@link OrgUnit} CRUD plus tree/list-by-parent operations.
 * <p>
 * All mutating methods run within a read-write transaction;
 * read-only methods use {@code @Transactional(readOnly = true)} for
 * Hibernate performance optimisation.
 * </p>
 */
@Service
@RequiredArgsConstructor
@Transactional
public class OrgUnitService {

    private final OrgUnitRepository repo;

    // â”€â”€ Queries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /**
     * Flat list of all units (no tree nesting).
     */
    @Transactional(readOnly = true)
    public List<OrgUnitResponse> findAll() {
        return repo.findAll().stream()
                .map(OrgUnitResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Full hierarchical tree starting from root nodes (parentId is null).
     */
    @Transactional(readOnly = true)
    public List<OrgUnitResponse> findTree() {
        List<OrgUnit> all = repo.findAll();

        // Build a lookup: parentId â†’ list of children
        Map<UUID, List<OrgUnit>> childrenMap = all.stream()
                .filter(u -> u.getParentId() != null)
                .collect(Collectors.groupingBy(OrgUnit::getParentId));

        // Start from roots and recursively assemble the tree
        return all.stream()
                .filter(u -> u.getParentId() == null)
                .map(root -> buildTree(root, childrenMap))
                .collect(Collectors.toList());
    }

    private OrgUnitResponse buildTree(OrgUnit unit, Map<UUID, List<OrgUnit>> childrenMap) {
        OrgUnitResponse response = OrgUnitResponse.from(unit);
        List<OrgUnit> children = childrenMap.getOrDefault(unit.getId(), Collections.emptyList());
        if (!children.isEmpty()) {
            response.setChildren(
                    children.stream()
                            .map(child -> buildTree(child, childrenMap))
                            .collect(Collectors.toList())
            );
        }
        return response;
    }

    /**
     * Direct children of a specific parent (flat list).
     */
    @Transactional(readOnly = true)
    public List<OrgUnitResponse> findByParentId(UUID parentId) {
        return repo.findByParentId(parentId).stream()
                .map(OrgUnitResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Single unit by ID.
     *
     * @throws EntityNotFoundException if not found
     */
    @Transactional(readOnly = true)
    public OrgUnitResponse findById(UUID id) {
        OrgUnit unit = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "ÄÆ¡n vá»‹ khĂ´ng tá»“n táº¡i: " + id));
        return OrgUnitResponse.from(unit);
    }

    // â”€â”€ Mutations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /**
     * Create a new unit. Defaults status to {@code ACTIVE} if not provided.
     *
     * @throws IllegalArgumentException if the code already exists
     * @throws EntityNotFoundException  if the specified parent does not exist
     */
    public OrgUnitResponse create(CreateOrgUnitRequest request) {
        if (repo.existsByCode(request.getCode())) {
            throw new IllegalArgumentException(
                    "MĂ£ Ä‘Æ¡n vá»‹ Ä‘Ă£ tá»“n táº¡i: " + request.getCode());
        }
        if (request.getParentId() != null && !repo.existsById(request.getParentId())) {
            throw new EntityNotFoundException(
                    "ÄÆ¡n vá»‹ cha khĂ´ng tá»“n táº¡i: " + request.getParentId());
        }

        OrgUnit unit = OrgUnit.builder()
                .name(request.getName())
                .code(request.getCode())
                .parentId(request.getParentId())
                .type(request.getType())
                .address(request.getAddress())
                .phone(request.getPhone())
                .status(request.getStatus() != null
                        ? request.getStatus()
                        : OrgUnitStatus.ACTIVE)
                .build();

        return OrgUnitResponse.from(repo.save(unit));
    }

    /**
     * Partial update. Only non-null fields in the request are applied.
     *
     * @throws EntityNotFoundException  if the unit or parent does not exist
     * @throws IllegalArgumentException if the new code collides with another unit
     */
    public OrgUnitResponse update(UUID id, UpdateOrgUnitRequest request) {
        OrgUnit unit = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "ÄÆ¡n vá»‹ khĂ´ng tá»“n táº¡i: " + id));

        if (request.getCode() != null
                && !request.getCode().equals(unit.getCode())) {
            if (repo.existsByCodeAndIdNot(request.getCode(), id)) {
                throw new IllegalArgumentException(
                        "MĂ£ Ä‘Æ¡n vá»‹ Ä‘Ă£ tá»“n táº¡i: " + request.getCode());
            }
            unit.setCode(request.getCode());
        }

        if (request.getParentId() != null) {
            if (request.getParentId().equals(id)) {
                throw new IllegalArgumentException(
                        "ÄÆ¡n vá»‹ khĂ´ng thá»ƒ lĂ  cha cá»§a chĂ­nh nĂ³");
            }
            if (!repo.existsById(request.getParentId())) {
                throw new EntityNotFoundException(
                        "ÄÆ¡n vá»‹ cha khĂ´ng tá»“n táº¡i: " + request.getParentId());
            }
            unit.setParentId(request.getParentId());
        }

        if (request.getName() != null) {
            unit.setName(request.getName());
        }
        if (request.getType() != null) {
            unit.setType(request.getType());
        }
        if (request.getAddress() != null) {
            unit.setAddress(request.getAddress());
        }
        if (request.getPhone() != null) {
            unit.setPhone(request.getPhone());
        }
        if (request.getStatus() != null) {
            unit.setStatus(request.getStatus());
        }

        return OrgUnitResponse.from(repo.save(unit));
    }

    /**
     * Delete a unit. Fails if the unit still has child units.
     *
     * @throws EntityNotFoundException  if the unit does not exist
     * @throws IllegalArgumentException if the unit has children
     */
    public void delete(UUID id) {
        if (!repo.existsById(id)) {
            throw new EntityNotFoundException(
                    "ÄÆ¡n vá»‹ khĂ´ng tá»“n táº¡i: " + id);
        }
        if (!repo.findByParentId(id).isEmpty()) {
            throw new IllegalArgumentException(
                    "KhĂ´ng thá»ƒ xĂ³a Ä‘Æ¡n vá»‹ cĂ³ Ä‘Æ¡n vá»‹ con. "
                            + "Vui lĂ²ng xĂ³a hoáº·c di chuyá»ƒn cĂ¡c Ä‘Æ¡n vá»‹ con trÆ°á»›c.");
        }
        OrgUnit unit = repo.findById(id).orElseThrow();
        unit.softDelete();
        repo.save(unit);
    }
}
