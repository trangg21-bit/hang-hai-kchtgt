package com.hanghai.kchtg.orgunit.service;

import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service providing materialized-path tree operations for organisational units.
 *
 * <p>
 * Core responsibilities:
 * <ul>
 *   <li>Path computation: given a parent UUID, compute the full path for a child</li>
 *   <li>Circular reference detection: verify a node is not its own ancestor</li>
 *   <li>Level auto-calculation: depth from root</li>
 *   <li>Ancestor/descendant queries via path-based LIKE</li>
 *   <li>Subtree cascade move: update path for a moved node and all descendants</li>
 * </ul>
 * </p>
 *
 * <p>
 * Path format: /1/5/12/ (trailing slash, enables LIKE '/1/%' prefix match).
 * Root unit: /{rootId}/
 * </p>
 */
@Service
@RequiredArgsConstructor
public class MaterializedPathService {

    private static final Logger log = LoggerFactory.getLogger(MaterializedPathService.class);

    private final OrgUnitRepository repo;
    private final EntityManager entityManager;

    // ── Path computation ─────────────────────────────────────────────

    /**
     * Compute the materialized path for a new child under the given parent.
     *
     * <p>
     * Algorithm: traverse up from parent to root, collecting IDs.
     * Path format: /id1/id2/id3/
     * </p>
     *
     * @param parentId  UUID of the parent unit (null = root)
     * @param childId   UUID of the child unit (must be set before calling)
     * @return computed path string with trailing slash, e.g. "/1/5/"
     */
    public String computePath(UUID parentId, UUID childId) {
        if (parentId == null) {
            // Root unit: path is just its own ID
            return "/" + childId + "/";
        }

        // Build path by walking up from parent to root
        List<UUID> ancestorIds = new ArrayList<>();
        UUID currentId = parentId;
        while (currentId != null) {
            ancestorIds.add(0, currentId); // prepend to reverse order
            OrgUnit parent = repo.findById(currentId).orElse(null);
            if (parent == null || parent.getParentId() == null) {
                break; // reached root
            }
            currentId = parent.getParentId();
        }

        // Build path: /id1/id2/.../childId/
        StringBuilder path = new StringBuilder();
        for (UUID id : ancestorIds) {
            path.append("/").append(id);
        }
        path.append("/").append(childId).append("/");
        return path.toString();
    }

    /**
     * Compute path for a unit already persisted (reads its path from entity).
     * Useful when the unit was created with a temporary path.
     *
     * @param unit the unit entity to compute path for
     * @return computed path string
     */
    public String computePathForUnit(OrgUnit unit) {
        if (unit.getParentId() == null) {
            // Root: use its own ID
            return "/" + unit.getId() + "/";
        }
        return computePath(unit.getParentId(), unit.getId());
    }

    /**
     * Compute path for a new root unit (no parent).
     */
    public String computeRootPath(UUID rootId) {
        return "/" + rootId + "/";
    }

    // ── Level calculation ────────────────────────────────────────────

    /**
     * Calculate the level (depth from root) for a unit.
     * Root = 1, child of root = 2, grandchild = 3.
     *
     * @param path the materialized path string
     * @return level as integer (number of path segments)
     */
    public int calculateLevel(String path) {
        if (path == null || path.isEmpty()) {
            return 0;
        }
        // Count segments: "/1/5/12/" has 3 segments
        String[] parts = path.split("/");
        int count = 0;
        for (String part : parts) {
            if (!part.isEmpty()) {
                count++;
            }
        }
        return count;
    }

    // ── Circular reference detection ─────────────────────────────────

    /**
     * Detect circular reference: check if candidateParentId is an ancestor of nodeId.
     *
     * <p>
     * BR-003-02 / AC-003-02: A unit cannot be set as its own parent or ancestor.
     * This check prevents circular hierarchy (infinite recursion).
     * </p>
     *
     * @param nodeId            the unit whose ancestry we're checking
     * @param candidateParentId the proposed new parent
     * @return true if candidateParentId IS an ancestor of nodeId (circular!)
     */
    public boolean isAncestor(UUID nodeId, UUID candidateParentId) {
        OrgUnit node = repo.findById(nodeId)
                .orElseThrow(() -> new EntityNotFoundException("Đơn vị không tồn tại: " + nodeId));

        String nodePath = node.getPath();
        if (nodePath == null || nodePath.isEmpty()) {
            return false; // no path yet, can't be ancestor
        }

        // Check if candidateParentId appears in the node's path (excluding the node itself)
        String candidatePathFragment = "/" + candidateParentId;
        return nodePath.contains(candidatePathFragment + "/");
    }

    /**
     * Check if a node is its own direct parent (self-parenting).
     */
    public boolean isSelfParent(UUID nodeId, UUID newParentId) {
        return nodeId.equals(newParentId);
    }

    // ── Ancestor / descendant queries ────────────────────────────────

    /**
     * Get all direct ancestors of a unit (from parent up to root).
     */
    @Transactional(readOnly = true)
    public List<OrgUnit> getAncestors(UUID nodeId) {
        OrgUnit node = repo.findById(nodeId)
                .orElseThrow(() -> new EntityNotFoundException("Đơn vị không tồn tại: " + nodeId));

        String path = node.getPath();
        if (path == null || path.isEmpty()) {
            return Collections.emptyList();
        }

        // Extract parent IDs from path (exclude the node's own ID)
        String nodeFragment = "/" + nodeId;
        String ancestorPath = path.replace(nodeFragment, "");
        if (ancestorPath.isEmpty() || ancestorPath.equals("/")) {
            return Collections.emptyList();
        }

        List<String> ancestorIds = new ArrayList<>();
        String[] parts = ancestorPath.split("/");
        for (String part : parts) {
            if (!part.isEmpty()) {
                ancestorIds.add(part);
            }
        }

        return ancestorIds.stream()
                .map(UUID::fromString)
                .map(repo::findById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toList());
    }

    /**
     * Get all descendants of a unit (full subtree).
     */
    @Transactional(readOnly = true)
    public List<OrgUnit> getDescendants(UUID nodeId) {
        OrgUnit node = repo.findById(nodeId)
                .orElseThrow(() -> new EntityNotFoundException("Đơn vị không tồn tại: " + nodeId));

        String prefix = node.getPath();
        // All descendants have paths that start with prefix + descendantId/
        String childPrefix = prefix + "/";
        return repo.findByPathLikeAndDeletedAtIsNull(childPrefix);
    }

    /**
     * Get all descendants including the node itself (full subtree with root).
     */
    @Transactional(readOnly = true)
    public List<OrgUnit> getSubtree(UUID nodeId) {
        OrgUnit node = repo.findById(nodeId)
                .orElseThrow(() -> new EntityNotFoundException("Đơn vị không tồn tại: " + nodeId));

        String prefix = node.getPath();
        return repo.findAllByPathLikeOrderBySortOrder(prefix + "%");
    }

    // ── Subtree cascade move ─────────────────────────────────────────

    /**
     * Recalculate paths for a moved subtree using native SQL.
     *
     * <p>
     * When node X is moved to a new parent Y:
     * 1. Compute new path for X: Y.path + X.id + "/"
     * 2. UPDATE all descendants: path = CONCAT(newXPath, SUBSTR(oldPath, LENGTH(X.path) + 1))
     * 3. Recalculate level for all affected nodes
     * </p>
     *
     * @param movedNodeId   UUID of the node being moved
     * @param newParentId   UUID of the new parent (null = root)
     */
    @Transactional
    public void cascadePathRebuild(UUID movedNodeId, UUID newParentId) {
        OrgUnit movedNode = repo.findById(movedNodeId)
                .orElseThrow(() -> new EntityNotFoundException("Đơn vị không tồn tại: " + movedNodeId));

        String oldPath = movedNode.getPath();
        String newPath = computePath(newParentId, movedNodeId);
        int newLevel = calculateLevel(newPath);
        int oldLevel = calculateLevel(oldPath);

        log.info("Cascade path rebuild: node {} path {} → {}", movedNodeId, oldPath, newPath);

        // Update all descendants: replace old path prefix with new path prefix
        String oldPathPattern = oldPath + "%";
        int oldPathLength = oldPath.length();

        entityManager.createNativeQuery(
                "UPDATE org_units SET path = CONCAT(:newPath, SUBSTR(path, :oldLen + 1)), " +
                "level = CASE " +
                "  WHEN id = :movedId THEN :newLevel " +
                "  ELSE level + (:newLevel - :oldLevel) END " +
                "WHERE path LIKE :oldPattern AND deleted_at IS NULL"
        )
        .setParameter("newPath", newPath)
        .setParameter("oldLen", oldPathLength)
        .setParameter("movedId", movedNodeId)
        .setParameter("newLevel", newLevel)
        .setParameter("oldLevel", oldLevel)
        .setParameter("oldPattern", oldPathPattern)
        .executeUpdate();

        // Update the moved node itself
        movedNode.setPath(newPath);
        movedNode.setLevel(newLevel);
        repo.save(movedNode);

        // Refresh all affected entities from DB to ensure consistency
        List<OrgUnit> affected = repo.findByPathLikeAndDeletedAtIsNull(newPath + "%");
        affected.add(movedNode);
        for (OrgUnit u : affected) {
            u.setLevel(calculateLevel(u.getPath()));
        }
        repo.saveAll(affected);

        log.info("Cascade path rebuild complete for node {}", movedNodeId);
    }
}
