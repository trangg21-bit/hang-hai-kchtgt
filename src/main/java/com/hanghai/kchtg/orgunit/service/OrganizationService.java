package com.hanghai.kchtg.orgunit.service;

import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.orgunit.dto.CandidateParentResponse;
import com.hanghai.kchtg.orgunit.dto.CreateOrgUnitRequest;
import com.hanghai.kchtg.orgunit.dto.OrgUnitResponse;
import com.hanghai.kchtg.orgunit.dto.UpdateOrgUnitRequest;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.orgunit.entity.OrgUnitRank;
import com.hanghai.kchtg.orgunit.entity.UnitHistory;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.repository.UnitHistoryRepository;
import com.hanghai.kchtg.security.SecurityUtils;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Primary service for organisational unit management.
 * Integrates MaterializedPathService for tree operations
 * and audit trail via UnitHistory.
 *
 * <p>
 * Consolidates the old OrgUnitService and OrganizationService into a single
 * canonical implementation per the tech-lead plan.
 * </p>
 *
 * <p>
 * Business rules enforced:
 * <ul>
 * <li>BR-013: unique unit code</li>
 * <li>BR-014: delete guard (no children, no related personnel)</li>
 * <li>BR-016: parent-child hierarchy with circular ref detection</li>
 * </ul>
 * </p>
 */
@Service
@RequiredArgsConstructor
@Transactional
public class OrganizationService {

    private static final Logger log = LoggerFactory.getLogger(OrganizationService.class);

    private final OrgUnitRepository orgUnitRepo;
    private final UnitHistoryRepository unitHistoryRepo;
    private final MaterializedPathService materializedPathService;
    private final TransactionTemplate transactionTemplate;
    private final OrgUnitCacheService orgUnitCacheService;

    // ═══════════════════════════════════════════════════════════════════
    // ── Queries ──────────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Flat list of all active units with pagination.
     */
    @Transactional(readOnly = true)
    public Page<OrgUnitResponse> findAll(Pageable pageable) {
        return orgUnitRepo.findAllActiveOrderByPath(pageable)
                .map(OrgUnitResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<OrgUnitResponse> findAll(Pageable pageable, OrgUnitScopeService.Scope scope) {
        if (scope.unrestricted()) {
            return findAll(pageable);
        }
        if (scope.orgUnitIds().isEmpty()) {
            return Page.empty(pageable);
        }
        return orgUnitRepo.findAllActiveByIds(scope.orgUnitIds(), pageable)
                .map(OrgUnitResponse::from);
    }

    /**
     * Flat list of all active units (no pagination).
     */
    @Transactional(readOnly = true)
    public List<OrgUnitResponse> findAll() {
        return orgUnitCacheService.getList();
    }

    @Transactional(readOnly = true)
    public List<OrgUnitResponse> findAll(OrgUnitScopeService.Scope scope) {
        if (scope.unrestricted()) {
            return findAll();
        }
        return orgUnitCacheService.getList().stream()
                .filter(unit -> scope.allows(unit.getId()))
                .toList();
    }

    /**
     * Full hierarchical tree starting from root nodes, built using path-based
     * ordering.
     */
    @Transactional(readOnly = true)
    public List<OrgUnitResponse> buildTree() {
        return buildTree(OrgUnitScopeService.Scope.allScope());
    }

    @Transactional(readOnly = true)
    public List<OrgUnitResponse> buildTree(OrgUnitScopeService.Scope scope) {
        List<OrgUnit> all = scope.unrestricted()
                ? orgUnitRepo.findAllActiveOrderByPath()
                : scope.orgUnitIds().isEmpty()
                        ? List.of()
                        : orgUnitRepo.findAllActiveByIds(scope.orgUnitIds());
        java.util.Set<UUID> visibleIds = all.stream()
                .map(OrgUnit::getId)
                .collect(Collectors.toSet());
        Map<UUID, List<OrgUnit>> childrenMap = all.stream()
                .filter(u -> u.getParentId() != null && visibleIds.contains(u.getParentId()))
                .collect(Collectors.groupingBy(OrgUnit::getParentId));

        return all.stream()
                .filter(u -> u.getParentId() == null || !visibleIds.contains(u.getParentId()))
                .map(root -> buildTree(root, childrenMap))
                .collect(Collectors.toList());
    }

    private OrgUnitResponse buildTree(OrgUnit unit, Map<UUID, List<OrgUnit>> childrenMap) {
        OrgUnitResponse response = OrgUnitResponse.from(unit);
        List<OrgUnit> children = childrenMap.getOrDefault(unit.getId(), Collections.emptyList());
        if (!children.isEmpty()) {
            response.setChildren(children.stream()
                    .map(child -> buildTree(child, childrenMap))
                    .collect(Collectors.toList()));
        }
        return response;
    }

    /**
     * Get sub-tree under a specific unit.
     */
    @Transactional(readOnly = true)
    public List<OrgUnitResponse> findSubTree(UUID unitId) {
        return findSubTree(unitId, OrgUnitScopeService.Scope.allScope());
    }

    @Transactional(readOnly = true)
    public List<OrgUnitResponse> findSubTree(UUID unitId, OrgUnitScopeService.Scope scope) {
        requireAllowed(scope, unitId);
        if (!orgUnitRepo.existsById(unitId)) {
            throw new EntityNotFoundException("Đơn vị không tồn tại: " + unitId);
        }
        List<OrgUnit> subtree = materializedPathService.getSubtree(unitId);
        return subtree.stream()
                .filter(unit -> scope.allows(unit.getId()))
                .map(OrgUnitResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Retrieve eligible parent units for creating or editing an organizational unit.
     */
    @Transactional(readOnly = true)
    public List<CandidateParentResponse> findCandidateParents(UUID unitId) {
        return findCandidateParents(unitId, OrgUnitScopeService.Scope.allScope());
    }

    @Transactional(readOnly = true)
    public List<CandidateParentResponse> findCandidateParents(UUID unitId, OrgUnitScopeService.Scope scope) {
        List<OrgUnit> allUnits = scope.unrestricted()
                ? orgUnitRepo.findAllActiveOrderByPath()
                : scope.orgUnitIds().isEmpty()
                        ? List.of()
                        : orgUnitRepo.findAllActiveByIds(scope.orgUnitIds());

        UUID currentParentId = null;
        java.util.Set<UUID> forbiddenIds = new java.util.HashSet<>();
        int maxSubtreeDepth = 0;

        if (unitId != null) {
            OrgUnit targetUnit = orgUnitRepo.findById(unitId).orElse(null);
            if (targetUnit != null) {
                currentParentId = targetUnit.getParentId();
                forbiddenIds.add(unitId);
                int targetLevel = resolveLevel(targetUnit);

                List<OrgUnit> subtree = materializedPathService.getSubtree(unitId);
                for (OrgUnit desc : subtree) {
                    forbiddenIds.add(desc.getId());
                    int descLevel = resolveLevel(desc);
                    maxSubtreeDepth = Math.max(maxSubtreeDepth, Math.max(0, descLevel - targetLevel));
                }
            }
        }

        List<CandidateParentResponse> result = new java.util.ArrayList<>();
        final UUID finalCurrentParentId = currentParentId;
        final int finalMaxSubtreeDepth = maxSubtreeDepth;

        for (OrgUnit u : allUnits) {
            // Exclude self and any descendants (prevent circular hierarchy)
            if (forbiddenIds.contains(u.getId())) {
                continue;
            }

            boolean isCurrentParent = finalCurrentParentId != null && u.getId().equals(finalCurrentParentId);

            // Skip suspended units unless it's the current parent
            if (!isCurrentParent && u.getOperationalStatus() == OperationalStatus.SUSPENDED) {
                continue;
            }

            int candLevel = resolveLevel(u);
            boolean exceedsDepth = candLevel >= 3 || (candLevel + 1 + finalMaxSubtreeDepth > 3);
            if (!isCurrentParent && exceedsDepth) {
                continue;
            }

            result.add(CandidateParentResponse.builder()
                    .id(u.getId())
                    .name(u.getName())
                    .level(candLevel)
                    .rank(u.getRank())
                    .currentParent(isCurrentParent)
                    .disabled(false)
                    .disabledReason(null)
                    .build());
        }

        // Ensure current parent is included at the top if missing from scope/list
        if (currentParentId != null) {
            boolean hasCurrentParent = result.stream().anyMatch(r -> r.getId().equals(finalCurrentParentId));
            if (!hasCurrentParent) {
                orgUnitRepo.findById(currentParentId).ifPresent(p -> {
                    result.add(0, CandidateParentResponse.builder()
                            .id(p.getId())
                            .name(p.getName())
                            .level(resolveLevel(p))
                            .rank(p.getRank())
                            .currentParent(true)
                            .disabled(false)
                            .build());
                });
            }
        }

        return result;
    }

    /**
     * Direct children of a specific parent (flat list).
     */
    @Transactional(readOnly = true)
    public List<OrgUnitResponse> findByParentId(UUID parentId) {
        return findByParentId(parentId, OrgUnitScopeService.Scope.allScope());
    }

    @Transactional(readOnly = true)
    public List<OrgUnitResponse> findByParentId(UUID parentId, OrgUnitScopeService.Scope scope) {
        requireAllowed(scope, parentId);
        return orgUnitRepo.findByParentId(parentId).stream()
                .filter(unit -> scope.allows(unit.getId()))
                .map(OrgUnitResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Single unit by ID.
     */
    @Transactional(readOnly = true)
    public OrgUnitResponse findById(UUID id) {
        return findById(id, OrgUnitScopeService.Scope.allScope());
    }

    @Transactional(readOnly = true)
    public OrgUnitResponse findById(UUID id, OrgUnitScopeService.Scope scope) {
        requireAllowed(scope, id);
        OrgUnit unit = orgUnitRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Đơn vị không tồn tại: " + id));
        return OrgUnitResponse.from(unit);
    }

    // ── Search / filter ──────────────────────────────────────────────

    /**
     * Search units by name (case-insensitive).
     */
    @Transactional(readOnly = true)
    public Page<OrgUnitResponse> searchUnits(String query, Pageable pageable) {
        return orgUnitRepo.findByNameLike(query, pageable)
                .map(OrgUnitResponse::from);
    }

    @Transactional(readOnly = true)
    public List<OrgUnitResponse> searchUnits(String query) {
        return orgUnitRepo.findByNameLike(query).stream()
                .map(OrgUnitResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrgUnitResponse> searchUnits(String query, OrgUnitScopeService.Scope scope) {
        if (scope.unrestricted()) {
            return searchUnits(query);
        }
        if (scope.orgUnitIds().isEmpty()) {
            return List.of();
        }
        return orgUnitRepo.findByNameLikeAndIds(query, scope.orgUnitIds()).stream()
                .map(OrgUnitResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Filter units by level.
     */
    @Transactional(readOnly = true)
    public Page<OrgUnitResponse> filterUnits(Integer level, Pageable pageable) {
        return orgUnitRepo.findByFilters(level, pageable)
                .map(OrgUnitResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<OrgUnitResponse> filterUnits(Integer level,
            Pageable pageable, OrgUnitScopeService.Scope scope) {
        if (scope.unrestricted()) {
            return filterUnits(level, pageable);
        }
        if (scope.orgUnitIds().isEmpty()) {
            return Page.empty(pageable);
        }
        return orgUnitRepo.findByFiltersAndIds(level, scope.orgUnitIds(), pageable)
                .map(OrgUnitResponse::from);
    }

    // ═══════════════════════════════════════════════════════════════════
    // ── Mutations ────────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Create a new unit with full materialized path computation,
     * circular reference detection, and audit trail.
     *
     * @throws IllegalArgumentException if code already exists or circular ref
     *                                  detected
     * @throws EntityNotFoundException  if parent does not exist
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public OrgUnitResponse create(CreateOrgUnitRequest request, UUID operatorId, String operatorName) {
        return create(request, operatorId, operatorName, OrgUnitScopeService.Scope.allScope());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public OrgUnitResponse create(CreateOrgUnitRequest request, UUID operatorId, String operatorName,
            OrgUnitScopeService.Scope scope) {
        FieldWriteGuard.validateObject(request);
        // Validate parent exists if specified
        OrgUnit parent = null;
        if (request.getParentId() != null) {
            requireAllowed(scope, request.getParentId());
            parent = orgUnitRepo.findById(request.getParentId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Đơn vị cha không tồn tại: " + request.getParentId()));
        } else if (!scope.unrestricted()) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Bạn chỉ được tạo đơn vị bên trong phạm vi đơn vị của tài khoản");
        }
        validateParentEligibility(parent);

        OrgUnit unit = OrgUnit.builder()
                .name(request.getName())
                .parentId(request.getParentId())
                .description(request.getDescription())
                .provinceId(request.getProvinceId())
                .detailAddress(request.getDetailAddress())
                .phone(request.getPhone())
                .operationalStatus(request.getOperationalStatus() != null
                        ? request.getOperationalStatus()
                        : OperationalStatus.OPERATIONAL)
                .rank(resolveRank(request.getRank(), parent))
                .sortOrder(0)
                .build();

        // Pre-assign UUID so path can be computed before persist
        unit.setId(UUID.randomUUID());
        String computedPath = materializedPathService.computePath(request.getParentId(), unit.getId());
        unit.setPath(computedPath);
        int computedLevel = materializedPathService.calculateLevel(computedPath);
        if (computedLevel > 3) {
            throw new IllegalArgumentException("Cây đơn vị chỉ được phép tối đa 3 cấp");
        }
        unit.setLevel(computedLevel);

        // Compute sortOrder: max existing children + 1
        if (parent != null) {
            long childCount = orgUnitRepo.countByParentIdAndDeletedAtIsNull(parent.getId());
            unit.setSortOrder(Math.toIntExact(childCount));
        }

        OrgUnit saved = orgUnitRepo.save(unit);

        saveHistory(saved, "CREATED", "Tạo mới đơn vị", operatorId, operatorName);
        orgUnitCacheService.evictAfterCommit();

        log.info("Created org unit: {} ({}, path: {}, level: {})", saved.getName(), saved.getId(),
                saved.getPath(), saved.getLevel());
        return OrgUnitResponse.from(saved);
    }

    /**
     * Partial update of an existing unit. Only non-null fields are applied.
     * Includes code uniqueness, circular reference detection, and path rebuild.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public OrgUnitResponse update(UUID id, UpdateOrgUnitRequest request, UUID operatorId, String operatorName) {
        return update(id, request, operatorId, operatorName, OrgUnitScopeService.Scope.allScope());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public OrgUnitResponse update(UUID id, UpdateOrgUnitRequest request, UUID operatorId, String operatorName,
            OrgUnitScopeService.Scope scope) {
        requireAllowed(scope, id);
        OrgUnit unit = orgUnitRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Đơn vị không tồn tại: " + id));
        FieldWriteGuard.validateUpdate(request, unit);

        // Handle parent change
        if (request.getParentId() != null) {
            UUID newParentId = request.getParentId();

            if (newParentId.equals(new UUID(0L, 0L))) {
                if (!scope.unrestricted()) {
                    throw new org.springframework.security.access.AccessDeniedException(
                            "Bạn không thể chuyển đơn vị ra ngoài phạm vi được phân quyền");
                }
                // Nil UUID: clear parent (move to root)
                if (unit.getParentId() != null) {
                    validateSubtreeDepth(unit, null);
                    materializedPathService.cascadePathRebuild(id, null);
                    unit.setParentId(null);
                    unit.setPath(materializedPathService.computePath(null, unit.getId()));
                    unit.setLevel(materializedPathService.calculateLevel(unit.getPath()));
                }
            } else {
                requireAllowed(scope, newParentId);
                // Self-parent check
                if (newParentId.equals(id)) {
                    throw new IllegalArgumentException("Đơn vị không thể là cha của chính nó");
                }

                // Parent must exist
                OrgUnit newParent = orgUnitRepo.findById(newParentId)
                        .orElseThrow(() -> new EntityNotFoundException(
                                "Đơn vị cha không tồn tại: " + newParentId));

                validateParentEligibility(newParent);

                // BR-016: circular reference detection
                validateSubtreeDepth(unit, newParent);
                if (materializedPathService.isAncestor(id, newParentId)) {
                    throw new IllegalArgumentException(
                            "Không thể chuyển đơn vị vào cây con của chính nó (tham chiếu vòng)");
                }

                unit.setParentId(newParentId);
                materializedPathService.cascadePathRebuild(unit.getId(), newParentId);
                unit.setPath(materializedPathService.computePath(newParentId, unit.getId()));
                unit.setLevel(materializedPathService.calculateLevel(unit.getPath()));
            }
        }

        // Apply remaining scalar fields
        if (request.getName() != null)
            unit.setName(request.getName());
        if (request.getDescription() != null)
            unit.setDescription(request.getDescription());
        if (request.getProvinceId() != null)
            unit.setProvinceId(request.getProvinceId());
        if (request.getDetailAddress() != null)
            unit.setDetailAddress(request.getDetailAddress());
        if (request.getPhone() != null)
            unit.setPhone(request.getPhone());
        if (request.getOperationalStatus() != null) {
            unit.setOperationalStatus(request.getOperationalStatus());
        }
        if (request.getRank() != null) {
            unit.setRank(request.getRank());
        }

        // Re-validate parent eligibility
        if (unit.getParentId() != null) {
            OrgUnit currentParent = orgUnitRepo.findById(unit.getParentId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Đơn vị cha không tồn tại: " + unit.getParentId()));
            validateParentEligibility(currentParent);
        }

        OrgUnit saved = orgUnitRepo.save(unit);
        orgUnitCacheService.evictAfterCommit();

        log.info("Updated org unit: {} ({})", saved.getName(), saved.getId());
        return OrgUnitResponse.from(saved);
    }

    /**
     * Resolve the effective rank ("Cấp đơn vị") for a new unit. An explicit request
     * wins;
     * otherwise infer from the parent: root → DEPARTMENT, parent at level 1 →
     * BRANCH, deeper parent → REPRESENTATIVE. BR-003-12.
     */
    private OrgUnitRank resolveRank(OrgUnitRank requested, OrgUnit parent) {
        if (requested != null)
            return requested;
        if (parent == null)
            return OrgUnitRank.DEPARTMENT;
        int pLevel = resolveLevel(parent);
        return pLevel <= 1
                ? OrgUnitRank.BRANCH
                : OrgUnitRank.REPRESENTATIVE;
    }

    private int resolveLevel(OrgUnit unit) {
        if (unit == null) {
            return 0;
        }
        if (unit.getLevel() != null && unit.getLevel() > 0) {
            return unit.getLevel();
        }
        if (unit.getPath() != null && !unit.getPath().isBlank()) {
            int calculated = materializedPathService.calculateLevel(unit.getPath());
            if (calculated > 0) {
                return calculated;
            }
        }
        return unit.getParentId() == null ? 1 : 2;
    }

    /**
     * Enforce the hierarchy rules at the API boundary as well as in the UI.
     * A parent must be an active node below the maximum depth (three levels).
     */
    private void validateParentEligibility(OrgUnit parent) {
        if (parent == null) {
            return;
        }
        if (parent.getOperationalStatus() == OperationalStatus.SUSPENDED) {
            throw new IllegalArgumentException("Không thể chọn đơn vị không sử dụng làm đơn vị cha");
        }
        if (resolveLevel(parent) >= 3) {
            throw new IllegalArgumentException("Cây đơn vị chỉ được phép tối đa 3 cấp");
        }
    }

    private void validateSubtreeDepth(OrgUnit unit, OrgUnit newParent) {
        int parentLevel = newParent != null ? resolveLevel(newParent) : 0;
        int unitCurrentLevel = resolveLevel(unit);

        List<OrgUnit> subtree = materializedPathService.getSubtree(unit.getId());
        int deepestRelativeLevel = subtree.stream()
                .mapToInt(descendant -> {
                    int descLevel = resolveLevel(descendant);
                    return Math.max(0, descLevel - unitCurrentLevel);
                })
                .max()
                .orElse(0);

        int newUnitLevel = parentLevel + 1;
        if (newUnitLevel + deepestRelativeLevel > 3) {
            throw new IllegalArgumentException("Cây đơn vị chỉ được phép tối đa 3 cấp");
        }
    }

    /**
     * Soft-delete a unit. Fails if the unit has children or related personnel.
     * BR-014: delete guard.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void delete(UUID id, UUID operatorId, String operatorName) {
        delete(id, operatorId, operatorName, OrgUnitScopeService.Scope.allScope());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void delete(UUID id, UUID operatorId, String operatorName,
            OrgUnitScopeService.Scope scope) {
        requireAllowed(scope, id);
        OrgUnit unit = orgUnitRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Đơn vị không tồn tại: " + id));

        // Check for children (BR-014)
        long childCount = orgUnitRepo.countByParentIdAndDeletedAtIsNull(id);
        if (childCount > 0) {
            throw new IllegalArgumentException(
                    "Không thể xóa đơn vị có " + childCount + " đơn vị con. "
                            + "Vui lòng xóa hoặc di chuyển các đơn vị con trước.");
        }

        String details = String.format("Xóa đơn vị '%s'", unit.getName());
        unit.softDelete(SecurityUtils.getCurrentUserId());
        orgUnitRepo.save(unit);
        orgUnitCacheService.evictAfterCommit();

        log.info("Soft-deleted org unit: {} ({})", unit.getName(), unit.getId());
    }

    // ═══════════════════════════════════════════════════════════════════
    // ── Private helpers ──────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════

    private void requireAllowed(OrgUnitScopeService.Scope scope, UUID unitId) {
        if (scope != null && !scope.allows(unitId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Bạn không có quyền truy cập hoặc thay đổi đơn vị ngoài phạm vi được phân quyền");
        }
    }

    private void saveHistory(OrgUnit unit, String action, String details,
            UUID performedBy, String performedByName) {
        // REQUIRES_NEW via TransactionTemplate to isolate from
        // auth-loaded User entity (avoids User.groups shared-reference JPA bug)
        transactionTemplate.executeWithoutResult(status -> {
            UnitHistory history = UnitHistory.create(unit.getId(), action, details,
                    performedBy, performedByName);
            history.setUnitName(unit.getName());
            unitHistoryRepo.save(history);
        });
    }
}
