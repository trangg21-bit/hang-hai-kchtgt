package com.hanghai.kchtg.vtsoperationcenter.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Sort;

@DisplayName("VtsOperationCenterController Sort Resolution Tests")
class VtsOperationCenterControllerTest {

    @Test
    @DisplayName("Sắp xếp theo thuộc hệ thống VTS (vtsSystemName) phải có NULLS LAST và LOWER")
    void testResolveListSort_VtsSystemName() {
        Sort sortDesc = VtsOperationCenterController.resolveListSort("vtsSystemName", "DESC");
        assertNotNull(sortDesc);

        List<Sort.Order> orders = sortDesc.toList();
        assertTrue(orders.size() >= 2);
        assertEquals("(CASE WHEN vs.systemName IS NULL THEN 1 ELSE 0 END)", orders.get(0).getProperty());
        assertEquals(Sort.Direction.ASC, orders.get(0).getDirection());
        assertEquals("LOWER(vs.systemName)", orders.get(1).getProperty());
        assertEquals(Sort.Direction.DESC, orders.get(1).getDirection());

        Sort sortAsc = VtsOperationCenterController.resolveListSort("vtsSystemName", "ASC");
        List<Sort.Order> ordersAsc = sortAsc.toList();
        assertEquals("(CASE WHEN vs.systemName IS NULL THEN 1 ELSE 0 END)", ordersAsc.get(0).getProperty());
        assertEquals(Sort.Direction.ASC, ordersAsc.get(0).getDirection());
        assertEquals("LOWER(vs.systemName)", ordersAsc.get(1).getProperty());
        assertEquals(Sort.Direction.ASC, ordersAsc.get(1).getDirection());
    }

    @Test
    @DisplayName("Sắp xếp theo đơn vị quản lý (orgUnitName) phải có NULLS LAST và LOWER")
    void testResolveListSort_OrgUnitName() {
        Sort sortDesc = VtsOperationCenterController.resolveListSort("orgUnitName", "DESC");
        List<Sort.Order> orders = sortDesc.toList();
        assertEquals("(CASE WHEN o.name IS NULL THEN 1 ELSE 0 END)", orders.get(0).getProperty());
        assertEquals(Sort.Direction.ASC, orders.get(0).getDirection());
        assertEquals("LOWER(o.name)", orders.get(1).getProperty());
        assertEquals(Sort.Direction.DESC, orders.get(1).getDirection());
    }

    @Test
    @DisplayName("Sắp xếp theo thuộc cảng biển (portName) phải có NULLS LAST và LOWER")
    void testResolveListSort_PortName() {
        Sort sortDesc = VtsOperationCenterController.resolveListSort("portName", "DESC");
        List<Sort.Order> orders = sortDesc.toList();
        assertEquals("(CASE WHEN p.portName IS NULL THEN 1 ELSE 0 END)", orders.get(0).getProperty());
        assertEquals(Sort.Direction.ASC, orders.get(0).getDirection());
        assertEquals("LOWER(p.portName)", orders.get(1).getProperty());
        assertEquals(Sort.Direction.DESC, orders.get(1).getDirection());
    }

    @Test
    @DisplayName("Sắp xếp theo cán bộ cập nhật (updatedByName) phải COALESCE creator khi chưa cập nhật")
    void testResolveListSort_UpdatedByName() {
        Sort sortDesc = VtsOperationCenterController.resolveListSort("updatedByName", "DESC");
        List<Sort.Order> orders = sortDesc.toList();
        assertEquals("(CASE WHEN COALESCE(u.fullName, uCreated.fullName) IS NULL THEN 1 ELSE 0 END)", orders.get(0).getProperty());
        assertEquals("LOWER(COALESCE(u.fullName, uCreated.fullName))", orders.get(1).getProperty());
        assertEquals(Sort.Direction.DESC, orders.get(1).getDirection());
    }

    @Test
    @DisplayName("Sắp xếp theo địa điểm Tỉnh/TP (provinceId) phải có NULLS LAST và pv.sortOrder")
    void testResolveListSort_ProvinceId() {
        Sort sortDesc = VtsOperationCenterController.resolveListSort("provinceId", "DESC");
        List<Sort.Order> orders = sortDesc.toList();
        assertEquals("(CASE WHEN pv.id IS NULL THEN 1 ELSE 0 END)", orders.get(0).getProperty());
        assertEquals("pv.sortOrder", orders.get(1).getProperty());
        assertEquals(Sort.Direction.DESC, orders.get(1).getDirection());
    }

    @Test
    @DisplayName("Mọi trường trong SORTABLE_LIST_FIELDS đều giải quyết được và có NULLS LAST")
    void testResolveListSort_EverySortableFieldHasNullGuard() {
        for (String field : VtsOperationCenterController.SORTABLE_LIST_FIELDS.keySet()) {
            Sort sort = VtsOperationCenterController.resolveListSort(field, "DESC");
            assertNotNull(sort, "Sort không được null cho field: " + field);
            List<Sort.Order> orders = sort.toList();
            assertFalse(orders.isEmpty(), "Orders không được rỗng cho field: " + field);
            assertTrue(orders.get(0).getProperty().startsWith("(CASE WHEN ") && orders.get(0).getProperty().endsWith(" IS NULL THEN 1 ELSE 0 END)"),
                    "Field " + field + " thiếu null guard ở đầu: " + orders.get(0).getProperty());
            assertEquals(Sort.Direction.ASC, orders.get(0).getDirection(), "Null guard phải luôn là ASC");
        }
    }

    @Test
    @DisplayName("SortBy rỗng hoặc null trả về mặc định createdAt DESC")
    void testResolveListSort_Default() {
        Sort sortNull = VtsOperationCenterController.resolveListSort(null, null);
        assertEquals("createdAt", sortNull.toList().get(0).getProperty());
        assertEquals(Sort.Direction.DESC, sortNull.toList().get(0).getDirection());

        Sort sortUnknown = VtsOperationCenterController.resolveListSort("unknownField", "ASC");
        assertEquals("createdAt", sortUnknown.toList().get(0).getProperty());
        assertEquals(Sort.Direction.DESC, sortUnknown.toList().get(0).getDirection());
    }
}
