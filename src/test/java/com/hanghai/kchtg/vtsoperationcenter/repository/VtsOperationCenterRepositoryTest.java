package com.hanghai.kchtg.vtsoperationcenter.repository;

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
                "u.fullName", "t.updatedAt", "t.createdAt");

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
