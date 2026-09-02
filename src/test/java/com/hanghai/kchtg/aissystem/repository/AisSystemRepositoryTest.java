package com.hanghai.kchtg.aissystem.repository;

import com.hanghai.kchtg.aissystem.entity.AisSystem;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.JpaSort;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Kiểm thử truy vấn danh sách hệ thống AIS.
 */
@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class AisSystemRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private AisSystemRepository repository;

    /**
     * Mọi cột trong {@code AisSystemController.SORTABLE_LIST_FIELDS} phải chạy được.
     * Các cột tên hiển thị trỏ vào alias của LEFT JOIN, nên nếu ai đó gỡ join ra khỏi
     * truy vấn thì test này phải đỏ chứ không để lọt thành lỗi 500 ở giao diện.
     */
    @Test
    void testSearch_EverySortablePropertyResolves() {
        repository.save(createAisSystem("AIS-S1", "Trạm A"));
        entityManager.flush();

        List<String> sortableProperties = List.of(
                "t.name", "t.code", "t.detailedLocation",
                "t.conditionStatus", "t.approvalStatus", "t.provinceId",
                "t.unitOfMeasure", "t.quantity", "t.commissioningYear",
                "o.name", "t.orgUnitId",
                "COALESCE(oo.name, oorg.name)", "t.operatingOrgId",
                "voc.name", "t.vtsOperationCenterId",
                "t.updatedAt", "t.createdAt");

        for (String property : sortableProperties) {
            for (Sort.Direction direction : Sort.Direction.values()) {
                var pageable = PageRequest.of(0, 20,
                        JpaSort.unsafe(direction, property)
                                .and(JpaSort.unsafe(Sort.Direction.DESC, "t.createdAt")));
                assertDoesNotThrow(
                        () -> repository.search(false, List.of(), null, null, null, null, null, null, null,
                                null, null, null, null, null, null, pageable).getContent(),
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
        repository.save(createAisSystem("AIS-C", "Cờ"));
        repository.save(createAisSystem("AIS-A", "An"));
        repository.save(createAisSystem("AIS-B", "Bê"));
        entityManager.flush();

        List<String> ascending = repository.search(false, List.of(), null, null, null, null, null, null, null,
                null, null, null, null, null, null,
                PageRequest.of(0, 20, JpaSort.unsafe(Sort.Direction.ASC, "t.name")))
                .getContent().stream().map(AisSystem::getName).toList();
        assertEquals(List.of("An", "Bê", "Cờ"), ascending);

        List<String> descending = repository.search(false, List.of(), null, null, null, null, null, null, null,
                null, null, null, null, null, null,
                PageRequest.of(0, 20, JpaSort.unsafe(Sort.Direction.DESC, "t.name")))
                .getContent().stream().map(AisSystem::getName).toList();
        assertEquals(List.of("Cờ", "Bê", "An"), descending);
    }

    /**
     * Tab "Từ chối" trên giao diện gửi xuống {@code REJECTED_LEVEL1} và phải gom cả
     * hồ sơ mang mã cũ {@code REJECTED} — nếu không, số trên tab (có đếm mã cũ) sẽ
     * lớn hơn số dòng trong bảng.
     */
    @Test
    void testSearch_RejectedFilterIncludesLegacyRejected() {
        AisSystem legacy = createAisSystem("AIS-R0", "Từ chối mã cũ");
        legacy.setApprovalStatus(ApprovalStatus.REJECTED);
        repository.save(legacy);

        AisSystem level1 = createAisSystem("AIS-R1", "Cảng vụ trả về");
        level1.setApprovalStatus(ApprovalStatus.REJECTED_LEVEL1);
        repository.save(level1);

        AisSystem level2 = createAisSystem("AIS-R2", "Cục trả về");
        level2.setApprovalStatus(ApprovalStatus.REJECTED_LEVEL2);
        repository.save(level2);

        AisSystem approved = createAisSystem("AIS-R3", "Đã duyệt");
        approved.setApprovalStatus(ApprovalStatus.APPROVED);
        repository.save(approved);

        entityManager.flush();

        var result = repository.search(false, List.of(), null, null, null, null, null, null, null,
                ApprovalStatus.REJECTED_LEVEL1, null, null, null, null, null,
                PageRequest.of(0, 20, JpaSort.unsafe(Sort.Direction.DESC, "t.createdAt")));

        assertEquals(3, result.getTotalElements());
    }

    /** Join thêm để sắp xếp không được nhân bản dòng. */
    @Test
    void testSearch_JoinsDoNotDuplicateRows() {
        repository.save(createAisSystem("AIS-D1", "Trạm D"));
        entityManager.flush();

        var page = repository.search(false, List.of(), null, null, null, null, null, null, null,
                null, null, null, null, null, null,
                PageRequest.of(0, 20, JpaSort.unsafe(Sort.Direction.DESC, "t.createdAt")));

        assertEquals(1, page.getTotalElements());
        assertEquals(1, page.getContent().size());
    }

    private AisSystem createAisSystem(String code, String name) {
        AisSystem entity = new AisSystem();
        entity.setCode(code);
        entity.setName(name);
        entity.setConditionStatus(ConditionStatus.OPERATIONAL);
        entity.setOrgUnitId(UUID.randomUUID());
        entity.setOperatingOrgId(UUID.randomUUID());
        entity.setDetailedLocation("Địa điểm " + code);
        entity.setQuantity(1);
        entity.setUnitOfMeasure(com.hanghai.kchtg.common.enums.UnitOfMeasure.SET);
        return entity;
    }
}
