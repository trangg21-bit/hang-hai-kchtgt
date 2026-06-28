package com.hanghai.kchtg.orgunit.service;

import com.hanghai.kchtg.orgunit.dto.CreateOrgUnitRequest;
import com.hanghai.kchtg.orgunit.dto.OrgUnitResponse;
import com.hanghai.kchtg.orgunit.dto.UpdateOrgUnitRequest;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * @deprecated Use {@link OrganizationService} for all CRUD operations on org units.
 * This class delegates to OrganizationService and will be removed in a future release.
 */
@Deprecated(forRemoval = true)
@Service
@Transactional
public class OrgUnitService {

    private final OrganizationService organizationService;

    public OrgUnitService(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    // ── Delegated queries ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<OrgUnitResponse> findAll() {
        return organizationService.findAll();
    }

    @Transactional(readOnly = true)
    public List<OrgUnitResponse> findTree() {
        return organizationService.buildTree();
    }

    @Transactional(readOnly = true)
    public List<OrgUnitResponse> findByParentId(UUID parentId) {
        return organizationService.findByParentId(parentId);
    }

    @Transactional(readOnly = true)
    public OrgUnitResponse findById(UUID id) {
        return organizationService.findById(id);
    }

    // ── Delegated mutations ──────────────────────────────────────────

    // Note: create/update/delete on this deprecated service use null operator info.
    // For new development, call OrganizationService directly with operator context.

    public OrgUnitResponse create(CreateOrgUnitRequest request) {
        return organizationService.create(request, null, null);
    }

    public OrgUnitResponse update(UUID id, UpdateOrgUnitRequest request) {
        return organizationService.update(id, request, null, null);
    }

    public void delete(UUID id) {
        organizationService.delete(id, null, null);
    }
}
