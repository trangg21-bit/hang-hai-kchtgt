package com.hanghai.kchtg.vtsoperationcenter.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.vtsoperationcenter.entity.VtsOperationCenter;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Kiểm thử truy vấn danh sách trung tâm điều hành VTS.
 */
@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class VtsOperationCenterRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private VtsOperationCenterRepository repository;

    /**
     * Mọi cột trong danh sách cho phép sắp xếp của
     * {@code VtsOperationCenterController.SORTABLE_LIST_FIELDS} phải chạy được.
     * Các cột tên hiển thị trỏ vào alias của LEFT JOIN, nên nếu ai đó gỡ join ra
     * khỏi truy vấn thì test này phải đỏ chứ không để lọt ra thành lỗi 500 ở giao diện.
     */
    @Test
    void testSearch_EverySortablePropertyResolves() {
        repository.save(createCenter("VTSOC-S1", "Trung tâm A"));
        entityManager.flush();

        List<String> sortableProperties = List.of(
                "t.name", "t.code", "t.detailedLocation",
                "t.conditionStatus", "t.approvalStatus", "t.provinceId",
                "o.name", "t.orgUnitId",
                "p.portName", "t.portId",
                "vs.systemName", "t.vtsSystemId",
                "u.fullName", "t.updatedAt", "t.createdAt",
                "uSub.fullName", "t.submittedAt",
                "uApp1.fullName", "t.approvedDateLevel1",
                "uApp2.fullName", "t.approvedDateLevel2");

        for (String property : sortableProperties) {
            for (Sort.Direction direction : Sort.Direction.values()) {
                var pageable = PageRequest.of(0, 20,
                        Sort.by(direction, property).and(Sort.by(Sort.Direction.DESC, "t.createdAt")));
                assertDoesNotThrow(
                        () -> repository.search(false, List.of(), null, null, null, null, null, null, null,
                                null, null, pageable).getContent(),
                        "Không sắp xếp được theo " + property + " " + direction);
            }
        }
    }

    /**
     * Truy vấn KHÔNG được cố định ORDER BY: nếu cố định thì thứ tự người dùng chọn
     * chỉ còn tác dụng phá hòa, tức bấm sắp xếp gần như không đổi gì.
     */
    @Test
    void testSearch_PageableSortActuallyOrdersResult() {
        repository.save(createCenter("VTSOC-C", "Cờ"));
        repository.save(createCenter("VTSOC-A", "An"));
        repository.save(createCenter("VTSOC-B", "Bê"));
        entityManager.flush();

        List<String> ascending = repository.search(false, List.of(), null, null, null, null, null, null, null,
                null, null, PageRequest.of(0, 20, Sort.by(Sort.Direction.ASC, "t.name")))
                .getContent().stream().map(VtsOperationCenter::getName).toList();
        assertEquals(List.of("An", "Bê", "Cờ"), ascending);

        List<String> descending = repository.search(false, List.of(), null, null, null, null, null, null, null,
                null, null, PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "t.name")))
                .getContent().stream().map(VtsOperationCenter::getName).toList();
        assertEquals(List.of("Cờ", "Bê", "An"), descending);
    }

    /** Join thêm để sắp xếp không được nhân bản dòng. */
    @Test
    void testSearch_JoinsDoNotDuplicateRows() {
        repository.save(createCenter("VTSOC-D1", "Trung tâm D"));
        entityManager.flush();

        var page = repository.search(false, List.of(), null, null, null, null, null, null, null, null, null,
                PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "t.createdAt")));

        assertEquals(1, page.getTotalElements());
        assertEquals(1, page.getContent().size());
    }

    @Test
    void testFindOptions_IncludesApprovedRecordsRegardlessOfConditionStatus() {
        VtsOperationCenter op1 = createCenter("VTSOC-OP1", "TT Đang vận hành");
        op1.setApprovalStatus(ApprovalStatus.APPROVED);
        op1.setConditionStatus(ConditionStatus.OPERATIONAL);
        repository.save(op1);

        VtsOperationCenter op2 = createCenter("VTSOC-OP2", "TT Dừng vận hành");
        op2.setApprovalStatus(ApprovalStatus.APPROVED);
        op2.setConditionStatus(ConditionStatus.STOPPED);
        repository.save(op2);

        VtsOperationCenter op3 = createCenter("VTSOC-OP3", "TT Bảo trì cấp 2");
        op3.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL2);
        op3.setConditionStatus(ConditionStatus.MAINTENANCE);
        repository.save(op3);

        VtsOperationCenter draft = createCenter("VTSOC-DRAFT", "TT Chưa duyệt");
        draft.setApprovalStatus(ApprovalStatus.DRAFT);
        draft.setConditionStatus(ConditionStatus.OPERATIONAL);
        repository.save(draft);

        VtsOperationCenter deleted = createCenter("VTSOC-DEL", "TT Đã xóa");
        deleted.setApprovalStatus(ApprovalStatus.APPROVED);
        deleted.setConditionStatus(ConditionStatus.OPERATIONAL);
        deleted.setDeletedAt(java.time.LocalDateTime.now());
        repository.save(deleted);

        entityManager.flush();

        var options = repository.findOptions(false, List.of(), false, List.of());
        List<String> names = options.stream().map(com.hanghai.kchtg.vtsoperationcenter.dto.VtsOperationCenterOptionResponse::getName).toList();

        assertEquals(3, options.size());
        assertEquals(List.of("TT Bảo trì cấp 2", "TT Dừng vận hành", "TT Đang vận hành"), names);
    }

    @Test
    void testSearch_ArchivedTab_ReturnsDeletedRecords() {
        VtsOperationCenter active = createCenter("VTSOC-ACT", "TT Đang hoạt động");
        active.setApprovalStatus(ApprovalStatus.APPROVED);
        repository.save(active);

        VtsOperationCenter deleted = createCenter("VTSOC-DEL2", "TT Đã bị xóa");
        deleted.setApprovalStatus(ApprovalStatus.APPROVED);
        deleted.setDeletedAt(java.time.LocalDateTime.now());
        repository.save(deleted);

        entityManager.flush();

        var page = repository.search(false, List.of(), null, null, null, null, null,
                ApprovalStatus.ARCHIVED, null, null, null, PageRequest.of(0, 20));

        assertEquals(1, page.getTotalElements());
        assertEquals("TT Đã bị xóa", page.getContent().get(0).getName());
    }

    @Test
    void testSearch_AllTab_IncludesBothActiveAndDeletedRecords() {
        VtsOperationCenter active = createCenter("VTSOC-ACT-ALL", "TT Hoạt động Tất cả");
        active.setApprovalStatus(ApprovalStatus.APPROVED);
        repository.save(active);

        VtsOperationCenter deleted = createCenter("VTSOC-DEL-ALL", "TT Đã xóa Tất cả");
        deleted.setApprovalStatus(ApprovalStatus.APPROVED);
        deleted.setDeletedAt(java.time.LocalDateTime.now());
        repository.save(deleted);

        entityManager.flush();

        var page = repository.search(false, List.of(), null, null, null, null, null,
                null, null, null, null, PageRequest.of(0, 20));

        // Bao gồm cả bản ghi đang hoạt động và bản ghi đã xóa
        var names = page.getContent().stream().map(VtsOperationCenter::getName).toList();
        org.junit.jupiter.api.Assertions.assertTrue(names.contains("TT Hoạt động Tất cả"));
        org.junit.jupiter.api.Assertions.assertTrue(names.contains("TT Đã xóa Tất cả"));
    }

    @Test
    void testSearch_SpecificStatus_ExcludesDeletedRecords() {
        VtsOperationCenter active = createCenter("VTSOC-ACT-APP", "TT Đã duyệt Active");
        active.setApprovalStatus(ApprovalStatus.APPROVED);
        repository.save(active);

        VtsOperationCenter deleted = createCenter("VTSOC-DEL-APP", "TT Đã duyệt nhưng đã xóa");
        deleted.setApprovalStatus(ApprovalStatus.APPROVED);
        deleted.setDeletedAt(java.time.LocalDateTime.now());
        repository.save(deleted);

        entityManager.flush();

        var page = repository.search(false, List.of(), null, null, null, null, null,
                ApprovalStatus.APPROVED, null, null, null, PageRequest.of(0, 20));

        var names = page.getContent().stream().map(VtsOperationCenter::getName).toList();
        org.junit.jupiter.api.Assertions.assertTrue(names.contains("TT Đã duyệt Active"));
        org.junit.jupiter.api.Assertions.assertFalse(names.contains("TT Đã duyệt nhưng đã xóa"));
    }

    private VtsOperationCenter createCenter(String code, String name) {
        VtsOperationCenter entity = new VtsOperationCenter();
        entity.setCode(code);
        entity.setName(name);
        entity.setConditionStatus(ConditionStatus.OPERATIONAL);
        entity.setOrgUnitId(UUID.randomUUID());
        entity.setPortId(UUID.randomUUID());
        entity.setDetailedLocation("Địa điểm " + code);
        return entity;
    }
}
