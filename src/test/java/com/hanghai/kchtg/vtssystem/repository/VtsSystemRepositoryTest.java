package com.hanghai.kchtg.vtssystem.repository;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;

/**
 * JPA repository tests for VtsSystem — verifies unique code constraint,
 * query behavior, and Flyway migration effects on the actual database schema.
 */
@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class VtsSystemRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private VtsSystemRepository repository;

    private UUID testOrgUnitId;
    private UUID testOwningOrgId;
    private UUID testOperatingOrgId;

    @BeforeEach
    void setUp() {
        testOrgUnitId = UUID.randomUUID();
        testOwningOrgId = UUID.randomUUID();
        testOperatingOrgId = UUID.randomUUID();
        // Clean up any existing test records
        repository.deleteAll();
        entityManager.flush();
    }

    @Test
    void testUniqueCodeConstraint() {
        VtsSystem first = createVtsSystem("VTS-UNIQUE");
        repository.saveAndFlush(first);

        VtsSystem duplicate = createVtsSystem("VTS-UNIQUE");

        assertThrows(org.springframework.dao.DataIntegrityViolationException.class, () -> {
            repository.saveAndFlush(duplicate);
        });
    }

    @Test
    void testExistsByCode() {
        repository.save(createVtsSystem("VTS-EXISTS"));
        entityManager.flush();

        assertTrue(repository.existsByCode("VTS-EXISTS"));
        assertFalse(repository.existsByCode("VTS-NOT-EXIST"));
        assertFalse(repository.existsByCode(""));
        assertFalse(repository.existsByCode(null));
    }

    @Test
    void testExistsByCodeAndIdNot() {
        VtsSystem existing = repository.save(createVtsSystem("VTS-EXISTING"));
        entityManager.flush();

        // Same code, different ID → true
        assertTrue(repository.existsByCodeAndIdNot("VTS-EXISTING", UUID.randomUUID()));

        // Same code, same ID → false
        assertFalse(repository.existsByCodeAndIdNot("VTS-EXISTING", existing.getId()));

        // Different code → false
        assertFalse(repository.existsByCodeAndIdNot("VTS-DIFFERENT", existing.getId()));
    }

    @Test
    void testFindByApprovalStatusAndIsDeletedFalse() {
        VtsSystem proposed = repository.save(createVtsSystem("VTS-1"));
        proposed.setApprovalStatus(ApprovalStatus.PROPOSED);
        repository.save(proposed);

        VtsSystem approved = repository.save(createVtsSystem("VTS-2"));
        approved.setApprovalStatus(ApprovalStatus.APPROVED);
        repository.save(approved);

        VtsSystem rejected = repository.save(createVtsSystem("VTS-3"));
        rejected.setApprovalStatus(ApprovalStatus.REJECTED);
        repository.save(rejected);

        entityManager.flush();

        assertEquals(1, repository.findByApprovalStatusAndIsDeletedFalse(ApprovalStatus.PROPOSED).size());
        assertEquals(1, repository.findByApprovalStatusAndIsDeletedFalse(ApprovalStatus.APPROVED).size());
        assertEquals(1, repository.findByApprovalStatusAndIsDeletedFalse(ApprovalStatus.REJECTED).size());
        assertEquals(0, repository.findByApprovalStatusAndIsDeletedFalse(ApprovalStatus.DRAFT).size());
    }

    @Test
    void testFindByApprovalStatus_ExcludesDeleted() {
        VtsSystem proposed = repository.save(createVtsSystem("VTS-DELETED"));
        proposed.setApprovalStatus(ApprovalStatus.PROPOSED);
        repository.save(proposed);
        proposed.softDelete(UUID.randomUUID());
        repository.save(proposed);
        entityManager.flush();

        assertEquals(0, repository.findByApprovalStatusAndIsDeletedFalse(ApprovalStatus.PROPOSED).size());
    }

    @Test
    void testSearchKeyword_MatchesCodeAndName() {
        repository.save(createVtsSystemWithCodeAndName("VTS-HAIPHONG", "VTS Hải Phòng"));
        repository.save(createVtsSystemWithCodeAndName("VTS-HANOI", "VTS Hà Nội"));
        entityManager.flush();

        List<VtsSystem> results = repository.searchFiltered(null, "%haiphong%");
        assertEquals(1, results.size());
        assertEquals("VTS-HAIPHONG", results.get(0).getCode());

        results = repository.searchFiltered(null, "%hai phong%");
        assertEquals(1, results.size());
        assertEquals("VTS Hải Phòng", results.get(0).getSystemName());
    }

    @Test
    void testSearchFilteredWithOrgUnitId() {
        VtsSystem vts = repository.save(createVtsSystem("VTS-ORG"));
        UUID orgId = vts.getOrgUnitId();
        entityManager.flush();

        List<VtsSystem> results = repository.searchFiltered(orgId, "%vts-org%");
        assertEquals(1, results.size());
        assertEquals(vts.getId(), results.get(0).getId());

        // Different org unit should exclude
        List<VtsSystem> excluded = repository.searchFiltered(UUID.randomUUID(), "%vts-org%");
        assertEquals(0, excluded.size());
    }

    @Test
    void testCountByApprovalStatus() {
        repository.save(createVtsSystem("VTS-A1"));
        repository.save(createVtsSystem("VTS-A2"));
        entityManager.flush();

        List<Object[]> counts = repository.countByApprovalStatus(
                false, List.of(), null, null, null);

        assertNotNull(counts);
        long draftCount = 0;
        for (Object[] row : counts) {
            if (row[0] instanceof ApprovalStatus && ((ApprovalStatus) row[0]) == ApprovalStatus.DRAFT) {
                draftCount = ((Number) row[1]).longValue();
            }
        }
        assertEquals(2, draftCount);
    }

    @Test
    void testFindById() {
        VtsSystem saved = repository.save(createVtsSystem("VTS-FIND"));
        entityManager.flush();

        Optional<VtsSystem> found = repository.findById(saved.getId());
        assertTrue(found.isPresent());
        assertEquals("VTS-FIND", found.get().getCode());
        assertEquals("VTS VTS-FIND", found.get().getSystemName());
    }

    @Test
    void testUpdate() {
        VtsSystem saved = repository.save(createVtsSystem("VTS-UPDATE"));
        entityManager.flush();

        saved.setSystemName("VTS Updated");
        saved.setConditionStatus(ConditionStatus.MAINTENANCE);
        VtsSystem updated = repository.save(saved);
        entityManager.flush();

        assertEquals("VTS Updated", updated.getSystemName());
        assertEquals(ConditionStatus.MAINTENANCE, updated.getConditionStatus());
    }

    @Test
    void testSearchList_WithPendingApproval_MatchesPendingApproval() {
        VtsSystem pending1 = createVtsSystem("VTS-P1");
        pending1.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        repository.save(pending1);

        VtsSystem pending2 = createVtsSystem("VTS-P2");
        pending2.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        repository.save(pending2);

        VtsSystem approved = createVtsSystem("VTS-P3");
        approved.setApprovalStatus(ApprovalStatus.APPROVED);
        repository.save(approved);

        entityManager.flush();

        var result = repository.searchList(false, List.of(), null, null, null,
                ApprovalStatus.PENDING_APPROVAL, null, null, org.springframework.data.domain.PageRequest.of(0, 20));

        assertEquals(2, result.getTotalElements());
    }

    @Test
    void testSearchList_WithApproved_MatchesApproved() {
        VtsSystem app1 = createVtsSystem("VTS-A1");
        app1.setApprovalStatus(ApprovalStatus.APPROVED);
        repository.save(app1);

        VtsSystem app2 = createVtsSystem("VTS-A2");
        app2.setApprovalStatus(ApprovalStatus.APPROVED);
        repository.save(app2);

        VtsSystem pending = createVtsSystem("VTS-A3");
        pending.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        repository.save(pending);

        entityManager.flush();

        var result = repository.searchList(false, List.of(), null, null, null,
                ApprovalStatus.APPROVED, null, null, org.springframework.data.domain.PageRequest.of(0, 20));

        assertEquals(2, result.getTotalElements());
        assertNotNull(result.getContent().get(0).getUpdatedDate(), "updatedDate must not be null in searchList projection");
    }

    @Test
    void testSearchList_WithRejected_MatchesRejectedLevel1AndLevel2() {
        VtsSystem r1 = createVtsSystem("VTS-R1");
        r1.setApprovalStatus(ApprovalStatus.REJECTED_LEVEL1);
        repository.save(r1);

        VtsSystem r2 = createVtsSystem("VTS-R2");
        r2.setApprovalStatus(ApprovalStatus.REJECTED_LEVEL2);
        repository.save(r2);

        VtsSystem pending = createVtsSystem("VTS-R3");
        pending.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        repository.save(pending);

        entityManager.flush();

        var result = repository.searchList(false, List.of(), null, null, null,
                ApprovalStatus.REJECTED_LEVEL1, null, null, org.springframework.data.domain.PageRequest.of(0, 20));

        assertEquals(2, result.getTotalElements());
    }

    @Test
    void testFindOptions_IncludesApprovedRecordsRegardlessOfConditionStatus() {
        VtsSystem operational = createVtsSystemWithCodeAndName("VTS-OPT-1", "VTS Đang vận hành");
        operational.setApprovalStatus(ApprovalStatus.APPROVED);
        operational.setConditionStatus(ConditionStatus.OPERATIONAL);
        repository.save(operational);

        VtsSystem stopped = createVtsSystemWithCodeAndName("VTS-OPT-2", "VTS Dừng vận hành");
        stopped.setApprovalStatus(ApprovalStatus.APPROVED);
        stopped.setConditionStatus(ConditionStatus.STOPPED);
        repository.save(stopped);

        VtsSystem maintenance = createVtsSystemWithCodeAndName("VTS-OPT-3", "VTS Bảo trì cấp 2");
        maintenance.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL2);
        maintenance.setConditionStatus(ConditionStatus.MAINTENANCE);
        repository.save(maintenance);

        VtsSystem draft = createVtsSystemWithCodeAndName("VTS-OPT-4", "VTS Chưa duyệt");
        draft.setApprovalStatus(ApprovalStatus.DRAFT);
        repository.save(draft);

        VtsSystem deleted = createVtsSystemWithCodeAndName("VTS-OPT-5", "VTS Đã xóa");
        deleted.setApprovalStatus(ApprovalStatus.APPROVED);
        deleted.setDeletedAt(java.time.LocalDateTime.now());
        repository.save(deleted);

        entityManager.flush();

        var options = repository.findOptions(false, List.of(), false, List.of());
        List<String> names = options.stream()
                .map(com.hanghai.kchtg.vtssystem.dto.VtsSystemOptionResponse::getName)
                .toList();

        assertEquals(3, options.size());
        assertEquals(List.of("VTS Bảo trì cấp 2", "VTS Dừng vận hành", "VTS Đang vận hành"), names);
    }

    /**
     * Mọi cột trong danh sách cho phép sắp xếp của
     * {@code VtsSystemService.SORTABLE_LIST_FIELDS} phải chạy được trên
     * {@code searchList}. Trước đây map trỏ tới các alias {@code o}, {@code own},
     * {@code p} không hề tồn tại trong câu truy vấn, nên bấm sắp xếp ở 3 cột
     * "Đơn vị quản lý" / "Đơn vị chủ quản" / "Thuộc cảng biển" là màn danh sách
     * trả HTTP 500.
     */
    @Test
    void testSearchList_EverySortablePropertyResolves() {
        repository.save(createVtsSystem("VTS-S1"));
        entityManager.flush();

        List<String> sortableProperties = List.of(
                "t.systemName", "t.code", "t.address", "t.operationStartDate",
                "t.conditionStatus", "t.approvalStatus", "t.rejectionReason",
                "o.name", "t.orgUnitId",
                "own.name", "t.owningOrgId",
                "op.name", "t.operatingOrgId",
                "p.portName", "t.portId",
                "u.fullName",
                "t.updatedAt", "t.updatedBy", "t.createdAt");

        for (String property : sortableProperties) {
            for (org.springframework.data.domain.Sort.Direction direction
                    : org.springframework.data.domain.Sort.Direction.values()) {
                var pageable = org.springframework.data.domain.PageRequest.of(0, 20,
                        org.springframework.data.domain.Sort.by(direction, property)
                                .and(org.springframework.data.domain.Sort.by(
                                        org.springframework.data.domain.Sort.Direction.DESC, "t.createdAt")));
                assertDoesNotThrow(
                        () -> repository.searchList(false, List.of(), null, null, null, null, null, null, pageable)
                                .getContent(),
                        "Không sắp xếp được theo " + property + " " + direction);
            }
        }
    }

    @Test
    void testFindOptions_IncludesApprovedRegardlessOfConditionStatus() {
        // 1. Approved + Operational -> Should be included
        VtsSystem sys1 = createVtsSystemWithCodeAndName("VTS-OPT1", "VTS Operational");
        sys1.setApprovalStatus(ApprovalStatus.APPROVED);
        sys1.setConditionStatus(ConditionStatus.OPERATIONAL);
        repository.save(sys1);

        // 2. Approved + Not Yet Operational -> Must be included (Bug 2 fix)
        VtsSystem sys2 = createVtsSystemWithCodeAndName("VTS-OPT2", "VTS Not Yet Operational");
        sys2.setApprovalStatus(ApprovalStatus.APPROVED);
        sys2.setConditionStatus(ConditionStatus.NOT_YET_OPERATIONAL);
        repository.save(sys2);

        // 3. Approved + Suspended -> Must be included (Bug 2 fix)
        VtsSystem sys3 = createVtsSystemWithCodeAndName("VTS-OPT3", "VTS Suspended");
        sys3.setApprovalStatus(ApprovalStatus.APPROVED);
        sys3.setConditionStatus(ConditionStatus.SUSPENDED);
        repository.save(sys3);

        // 4. Draft + Operational -> Must NOT be included
        VtsSystem sys4 = createVtsSystemWithCodeAndName("VTS-OPT4", "VTS Draft");
        sys4.setApprovalStatus(ApprovalStatus.DRAFT);
        sys4.setConditionStatus(ConditionStatus.OPERATIONAL);
        repository.save(sys4);

        // 5. Approved + Soft Deleted -> Must NOT be included
        VtsSystem sys5 = createVtsSystemWithCodeAndName("VTS-OPT5", "VTS Deleted");
        sys5.setApprovalStatus(ApprovalStatus.APPROVED);
        sys5.setConditionStatus(ConditionStatus.OPERATIONAL);
        sys5.setDeletedAt(java.time.LocalDateTime.now());
        repository.save(sys5);

        entityManager.flush();

        var options = repository.findOptions(false, List.of(), false, List.of());

        assertEquals(3, options.size(), "Options should include 3 approved VTS systems regardless of conditionStatus");
        List<String> optionCodes = options.stream().map(com.hanghai.kchtg.vtssystem.dto.VtsSystemOptionResponse::getCode).toList();
        assertTrue(optionCodes.contains("VTS-OPT1"));
        assertTrue(optionCodes.contains("VTS-OPT2"));
        assertTrue(optionCodes.contains("VTS-OPT3"));
        assertFalse(optionCodes.contains("VTS-OPT4"));
        assertFalse(optionCodes.contains("VTS-OPT5"));
    }

    @Test
    void testFindOptionsWithPortId() {
        UUID portA = UUID.randomUUID();
        UUID portB = UUID.randomUUID();

        VtsSystem sysA = createVtsSystemWithCodeAndName("VTS-PORTA", "VTS Port A");
        sysA.setApprovalStatus(ApprovalStatus.APPROVED);
        sysA.setPortId(portA);
        repository.save(sysA);

        VtsSystem sysB = createVtsSystemWithCodeAndName("VTS-PORTB", "VTS Port B");
        sysB.setApprovalStatus(ApprovalStatus.APPROVED);
        sysB.setPortId(portB);
        repository.save(sysB);

        entityManager.flush();

        var optionsPortA = repository.findOptions(false, List.of(), false, List.of(), true, portA);
        assertEquals(1, optionsPortA.size());
        assertEquals("VTS-PORTA", optionsPortA.get(0).getCode());
        assertEquals(portA, optionsPortA.get(0).getPortId());
    }

    // Helper methods

    private VtsSystem createVtsSystem(String code) {
        return createVtsSystemWithCodeAndName(code, "VTS " + code);
    }

    private VtsSystem createVtsSystemWithCodeAndName(String code, String name) {
        VtsSystem vts = new VtsSystem();
        vts.setCode(code);
        vts.setSystemName(name);
        vts.setConditionStatus(ConditionStatus.OPERATIONAL);
        vts.setOrgUnitId(testOrgUnitId);
        vts.setOwningOrgId(testOwningOrgId);
        vts.setOperatingOrgId(testOperatingOrgId);
        vts.setProvinceId(1);
        vts.setApprovalStatus(ApprovalStatus.DRAFT);
        return vts;
    }
}
