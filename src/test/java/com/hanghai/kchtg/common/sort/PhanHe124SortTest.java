package com.hanghai.kchtg.common.sort;

import com.hanghai.kchtg.aissystem.controller.AisSystemController;
import com.hanghai.kchtg.station.controller.CoastalStationCospasSarsatController;
import com.hanghai.kchtg.station.controller.CoastalStationHaiphongController;
import com.hanghai.kchtg.station.controller.CoastalStationInmarsatController;
import com.hanghai.kchtg.station.controller.CoastalStationLRITController;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Sort;

import java.lang.reflect.Method;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Kiểm thử chuẩn hóa sắp xếp Phân hệ 1, 2, 4 (Sort Resolution Tests)")
class PhanHe124SortTest {

    // ──────────────────────────────────────────────────────────────────────────
    // 1. Phân hệ 1: Hệ thống VTS (VtsSystemService)
    // ──────────────────────────────────────────────────────────────────────────
    private Sort resolveVtsSort(String sort) throws Exception {
        Class<?> clazz = Class.forName("com.hanghai.kchtg.vtssystem.service.VtsSystemService");
        Method method = clazz.getDeclaredMethod("resolveListSort", String.class);
        method.setAccessible(true);
        return (Sort) method.invoke(null, sort);
    }

    @Test
    @DisplayName("PH1 - VtsSystemService: Sắp xếp theo systemName có NULLS LAST và LOWER")
    void testVtsSystem_SystemNameSort() throws Exception {
        Sort sort = resolveVtsSort("systemName,desc");
        assertNotNull(sort);
        List<Sort.Order> orders = sort.toList();
        assertTrue(orders.size() >= 2);
        assertEquals("CASE WHEN t.systemName IS NULL THEN 1 ELSE 0 END", orders.get(0).getProperty());
        assertEquals(Sort.Direction.ASC, orders.get(0).getDirection());
        assertEquals("LOWER(t.systemName)", orders.get(1).getProperty());
        assertEquals(Sort.Direction.DESC, orders.get(1).getDirection());
    }

    @Test
    @DisplayName("PH1 - VtsSystemService: Sắp xếp theo provinceId có pv.sortOrder và NULLS LAST")
    void testVtsSystem_ProvinceSort() throws Exception {
        Sort sort = resolveVtsSort("provinceId,desc");
        List<Sort.Order> orders = sort.toList();
        assertEquals("CASE WHEN pv.id IS NULL THEN 1 ELSE 0 END", orders.get(0).getProperty());
        assertEquals(Sort.Direction.ASC, orders.get(0).getDirection());
        assertEquals("pv.sortOrder", orders.get(1).getProperty());
        assertEquals(Sort.Direction.DESC, orders.get(1).getDirection());
    }

    @Test
    @DisplayName("PH1 - VtsSystemService: Sắp xếp theo updatedByName có COALESCE creator và NULLS LAST")
    void testVtsSystem_UpdatedByNameSort() throws Exception {
        Sort sort = resolveVtsSort("updatedByName,desc");
        List<Sort.Order> orders = sort.toList();
        assertEquals("CASE WHEN COALESCE(u.fullName, uCreate.fullName) IS NULL THEN 1 ELSE 0 END", orders.get(0).getProperty());
        assertEquals("LOWER(COALESCE(u.fullName, uCreate.fullName))", orders.get(1).getProperty());
        assertEquals(Sort.Direction.DESC, orders.get(1).getDirection());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. Phân hệ 2: Hệ thống AIS (AisSystemController)
    // ──────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("PH2 - AisSystemController: Sắp xếp theo name có NULLS LAST và LOWER")
    void testAisSystem_NameSort() {
        Sort sort = AisSystemController.resolveListSort("name", "DESC", null);
        assertNotNull(sort);
        List<Sort.Order> orders = sort.toList();
        assertTrue(orders.size() >= 2);
        assertEquals("CASE WHEN t.name IS NULL THEN 1 ELSE 0 END", orders.get(0).getProperty());
        assertEquals(Sort.Direction.ASC, orders.get(0).getDirection());
        assertEquals("LOWER(t.name)", orders.get(1).getProperty());
        assertEquals(Sort.Direction.DESC, orders.get(1).getDirection());
    }

    @Test
    @DisplayName("PH2 - AisSystemController: Sắp xếp theo vtsOperationCenterName có COALESCE radar và NULLS LAST")
    void testAisSystem_VtsOperationCenterNameSort() {
        Sort sort = AisSystemController.resolveListSort("vtsOperationCenterName", "DESC", null);
        List<Sort.Order> orders = sort.toList();
        assertEquals("CASE WHEN COALESCE(voc.name, rs.stationName) IS NULL THEN 1 ELSE 0 END", orders.get(0).getProperty());
        assertEquals("LOWER(COALESCE(voc.name, rs.stationName))", orders.get(1).getProperty());
        assertEquals(Sort.Direction.DESC, orders.get(1).getDirection());
    }

    @Test
    @DisplayName("PH2 - AisSystemController: Sắp xếp theo provinceId có pv.sortOrder")
    void testAisSystem_ProvinceSort() {
        Sort sort = AisSystemController.resolveListSort("provinceId", "DESC", null);
        List<Sort.Order> orders = sort.toList();
        assertEquals("CASE WHEN pv.id IS NULL THEN 1 ELSE 0 END", orders.get(0).getProperty());
        assertEquals("pv.sortOrder", orders.get(1).getProperty());
        assertEquals(Sort.Direction.DESC, orders.get(1).getDirection());
    }

    @Test
    @DisplayName("PH2 - AisSystemController: Sắp xếp theo updatedByName có COALESCE creator")
    void testAisSystem_UpdatedByNameSort() {
        Sort sort = AisSystemController.resolveListSort("updatedByName", "DESC", null);
        List<Sort.Order> orders = sort.toList();
        assertEquals("CASE WHEN COALESCE(u.fullName, uCreate.fullName) IS NULL THEN 1 ELSE 0 END", orders.get(0).getProperty());
        assertEquals("LOWER(COALESCE(u.fullName, uCreate.fullName))", orders.get(1).getProperty());
        assertEquals(Sort.Direction.DESC, orders.get(1).getDirection());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. Phân hệ 4: Các Đài thông tin duyên hải
    // ──────────────────────────────────────────────────────────────────────────
    private Sort resolveLritSort(String sortBy, String sortDir) throws Exception {
        Method m = CoastalStationLRITController.class.getDeclaredMethod("resolveListSort", Sort.class, String.class, String.class, String.class);
        m.setAccessible(true);
        return (Sort) m.invoke(null, null, sortBy, sortDir, null);
    }

    private Sort resolveInmarsatSort(String sortBy, String sortDir) throws Exception {
        Method m = CoastalStationInmarsatController.class.getDeclaredMethod("resolveListSort", Sort.class, String.class, String.class, String.class);
        m.setAccessible(true);
        return (Sort) m.invoke(null, null, sortBy, sortDir, null);
    }

    private Sort resolveHaiphongSort(String sortBy, String sortDir) throws Exception {
        Method m = CoastalStationHaiphongController.class.getDeclaredMethod("resolveListSort", Sort.class, String.class, String.class, String.class);
        m.setAccessible(true);
        return (Sort) m.invoke(null, null, sortBy, sortDir, null);
    }

    private Sort resolveCospasSort(String sort) throws Exception {
        Method m = CoastalStationCospasSarsatController.class.getDeclaredMethod("resolveListSort", String.class);
        m.setAccessible(true);
        return (Sort) m.invoke(null, sort);
    }

    @Test
    @DisplayName("PH4 - Đài LRIT: Sắp xếp theo name có NULLS LAST và LOWER")
    void testStationLRIT_Sort() throws Exception {
        Sort sort = resolveLritSort("name", "desc");
        List<Sort.Order> orders = sort.toList();
        assertEquals("CASE WHEN t.name IS NULL THEN 1 ELSE 0 END", orders.get(0).getProperty());
        assertEquals("LOWER(t.name)", orders.get(1).getProperty());
        assertEquals(Sort.Direction.DESC, orders.get(1).getDirection());

        Sort sortUpdated = resolveLritSort("updatedInfo", "desc");
        List<Sort.Order> updatedOrders = sortUpdated.toList();
        assertEquals("CASE WHEN COALESCE(uu.fullName, uc.fullName) IS NULL THEN 1 ELSE 0 END", updatedOrders.get(0).getProperty());
    }

    @Test
    @DisplayName("PH4 - Đài Inmarsat: Sắp xếp theo name và updatedByName")
    void testStationInmarsat_Sort() throws Exception {
        Sort sort = resolveInmarsatSort("name", "desc");
        List<Sort.Order> orders = sort.toList();
        assertEquals("CASE WHEN t.name IS NULL THEN 1 ELSE 0 END", orders.get(0).getProperty());
        assertEquals("LOWER(t.name)", orders.get(1).getProperty());

        Sort sortUpdated = resolveInmarsatSort("updatedByName", "desc");
        List<Sort.Order> updatedOrders = sortUpdated.toList();
        assertEquals("CASE WHEN COALESCE(uu.fullName, uc.fullName) IS NULL THEN 1 ELSE 0 END", updatedOrders.get(0).getProperty());
    }

    @Test
    @DisplayName("PH4 - Đài Hải Phòng / Hà Nội: Sắp xếp theo name và provinceId")
    void testStationHaiphong_Sort() throws Exception {
        Sort sort = resolveHaiphongSort("name", "desc");
        List<Sort.Order> orders = sort.toList();
        assertEquals("CASE WHEN t.name IS NULL THEN 1 ELSE 0 END", orders.get(0).getProperty());
        assertEquals("LOWER(t.name)", orders.get(1).getProperty());

        Sort sortProv = resolveHaiphongSort("provinceId", "desc");
        List<Sort.Order> provOrders = sortProv.toList();
        assertEquals("CASE WHEN pv.id IS NULL THEN 1 ELSE 0 END", provOrders.get(0).getProperty());
        assertEquals("pv.sortOrder", provOrders.get(1).getProperty());
    }

    @Test
    @DisplayName("PH4 - Đài Cospas-Sarsat: Sắp xếp theo name và updatedByName")
    void testStationCospas_Sort() throws Exception {
        Sort sort = resolveCospasSort("name,desc");
        List<Sort.Order> orders = sort.toList();
        assertEquals("CASE WHEN c.name IS NULL THEN 1 ELSE 0 END", orders.get(0).getProperty());
        assertEquals("LOWER(c.name)", orders.get(1).getProperty());

        Sort sortUpdated = resolveCospasSort("updatedByName,desc");
        List<Sort.Order> updatedOrders = sortUpdated.toList();
        assertEquals("CASE WHEN COALESCE(uu.fullName, uc.fullName) IS NULL THEN 1 ELSE 0 END", updatedOrders.get(0).getProperty());
    }
}
