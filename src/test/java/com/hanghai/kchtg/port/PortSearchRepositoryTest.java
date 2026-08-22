package com.hanghai.kchtg.port;

import com.hanghai.kchtg.beacon.entity.Buoy;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.port.entity.Berth;
import com.hanghai.kchtg.port.entity.DryPort;
import com.hanghai.kchtg.port.entity.Pier;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.BerthRepository;
import com.hanghai.kchtg.port.repository.DryPortRepository;
import com.hanghai.kchtg.port.repository.PierRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.station.entity.BuoyStation;
import com.hanghai.kchtg.station.repository.BuoyStationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Verifies accent-insensitive (gõ không dấu) search on the six KCHT list screens:
 * Port (cảng biển), Pier (cầu cảng), Berth (bến cảng), DryPort (cảng cạn),
 * Buoy (phao tiêu), BuoyStation (nhà trạm phao tiêu).
 *
 * Both the no-diacritics keyword ("cang") and the full-diacritics keyword ("cảng")
 * must match a Vietnamese name, thanks to immutable_unaccent applied to BOTH sides
 * of every LIKE (H2 alias registered in application-test.properties; PostgreSQL
 * function public.immutable_unaccent from V20260812170000).
 */
@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class PortSearchRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private PortRepository portRepository;

    @Autowired
    private PierRepository pierRepository;

    @Autowired
    private BerthRepository berthRepository;

    @Autowired
    private DryPortRepository dryPortRepository;

    @Autowired
    private BuoyRepository buoyRepository;

    @Autowired
    private BuoyStationRepository buoyStationRepository;

    private Port savedPort;
    private Pier savedPier;
    private Berth savedBerth;
    private DryPort savedDryPort;
    private Buoy savedBuoy;
    private BuoyStation savedBuoyStation;

    @BeforeEach
    void setUp() {
        savedPort = portRepository.saveAndFlush(createPort("CB-HAIPHONG", "Cảng biển Hải Phòng"));
        savedBerth = berthRepository.saveAndFlush(createBerth("BC-SG", "Bến cảng Sài Gòn", savedPort.getId()));
        savedPier = pierRepository.saveAndFlush(createPier("CC-NR", "Cầu cảng Nhà Rồng", savedBerth.getId()));
        savedDryPort = dryPortRepository.saveAndFlush(createDryPort("CCAN-LB", "Cảng cạn Long Biên"));
        savedBuoy = buoyRepository.saveAndFlush(createBuoy("PB-HD", "Phao tiêu Hòn Dấu"));
        savedBuoyStation = buoyStationRepository.saveAndFlush(createBuoyStation("NT-HD", "Nhà trạm Hòn Dấu"));
        entityManager.flush();
    }

    @Test
    void portSearch_matchesWithAndWithoutDiacritics() {
        assertTrue(containsPort(portRepository.searchPorts(
                true, List.of(), null, null, null, null, null, null, null, null, null,
                "cang", PageRequest.of(0, 10))));
        assertTrue(containsPort(portRepository.searchPorts(
                true, List.of(), null, null, null, null, null, null, null, null, null,
                "cảng", PageRequest.of(0, 10))));
    }

    @Test
    void pierSearch_matchesWithAndWithoutDiacritics() {
        assertTrue(containsPier(pierRepository.searchPiers(
                null, "cau", null, null, null, null, PageRequest.of(0, 10))));
        assertTrue(containsPier(pierRepository.searchPiers(
                null, "cầu", null, null, null, null, PageRequest.of(0, 10))));
    }

    @Test
    void berthSearch_matchesWithAndWithoutDiacritics() {
        assertTrue(containsBerth(berthRepository.searchBerths(
                null, "ben", null, null, null, null, null, null, null, PageRequest.of(0, 10))));
        assertTrue(containsBerth(berthRepository.searchBerths(
                null, "bến", null, null, null, null, null, null, null, PageRequest.of(0, 10))));
    }

    @Test
    void dryPortSearch_matchesWithAndWithoutDiacritics() {
        assertTrue(containsDryPort(dryPortRepository.searchDryPorts(
                null, null, "cang", null, null, PageRequest.of(0, 10))));
        assertTrue(containsDryPort(dryPortRepository.searchDryPorts(
                null, null, "cảng", null, null, PageRequest.of(0, 10))));
    }

    @Test
    void buoySearchFiltered_matchesWithAndWithoutDiacritics() {
        assertTrue(containsBuoy(buoyRepository.searchFiltered(
                "hon dau", null, null, null, null, null, null, null)));
        assertTrue(containsBuoy(buoyRepository.searchFiltered(
                "Hòn Dấu", null, null, null, null, null, null, null)));
        assertTrue(buoyRepository.searchFiltered(
                "khong-ton-tai", null, null, null, null, null, null, null).isEmpty());
    }

    @Test
    void buoySearchGis_matchesWithoutDiacritics() {
        assertTrue(containsBuoy(buoyRepository.searchGis(null, "%hon dau%")));
        assertTrue(containsBuoy(buoyRepository.searchGis(null, "%Hòn Dấu%")));
    }

    @Test
    void buoyStationSearchFiltered_matchesWithAndWithoutDiacritics() {
        assertTrue(containsBuoyStation(buoyStationRepository.searchFiltered(
                "hon dau", null, null, null, null, null, null, null)));
        assertTrue(containsBuoyStation(buoyStationRepository.searchFiltered(
                "Hòn Dấu", null, null, null, null, null, null, null)));
    }

    @Test
    void buoyStationSearchGis_matchesWithoutDiacritics() {
        assertTrue(containsBuoyStation(buoyStationRepository.searchGis(null, "%hon dau%")));
        assertTrue(containsBuoyStation(buoyStationRepository.searchGis(null, "%Hòn Dấu%")));
    }

    // ── helpers ──

    private boolean containsPort(org.springframework.data.domain.Page<Port> page) {
        return page.getContent().stream().anyMatch(p -> p.getId().equals(savedPort.getId()));
    }

    private boolean containsPier(org.springframework.data.domain.Page<Pier> page) {
        return page.getContent().stream().anyMatch(p -> p.getId().equals(savedPier.getId()));
    }

    private boolean containsBerth(org.springframework.data.domain.Page<Berth> page) {
        return page.getContent().stream().anyMatch(b -> b.getId().equals(savedBerth.getId()));
    }

    private boolean containsDryPort(org.springframework.data.domain.Page<DryPort> page) {
        return page.getContent().stream().anyMatch(d -> d.getId().equals(savedDryPort.getId()));
    }

    private boolean containsBuoy(List<Buoy> list) {
        return list.stream().anyMatch(b -> b.getId().equals(savedBuoy.getId()));
    }

    private boolean containsBuoyStation(List<BuoyStation> list) {
        return list.stream().anyMatch(s -> s.getId().equals(savedBuoyStation.getId()));
    }

    private Port createPort(String code, String name) {
        Port port = new Port();
        port.setPortCode(code);
        port.setPortName(name);
        port.setApprovalStatus(ApprovalStatus.APPROVED);
        return port;
    }

    private Berth createBerth(String code, String name, java.util.UUID portId) {
        Berth berth = new Berth();
        berth.setBerthCode(code);
        berth.setBerthName(name);
        berth.setPortId(portId);
        berth.setApprovalStatus(ApprovalStatus.APPROVED);
        return berth;
    }

    private Pier createPier(String code, String name, java.util.UUID berthId) {
        Pier pier = new Pier();
        pier.setPierCode(code);
        pier.setPierName(name);
        pier.setBerthId(berthId);
        pier.setApprovalStatus(ApprovalStatus.APPROVED);
        return pier;
    }

    private DryPort createDryPort(String code, String name) {
        DryPort dryPort = new DryPort();
        dryPort.setDryPortCode(code);
        dryPort.setDryPortName(name);
        dryPort.setPortStatus(1);
        dryPort.setApprovalStatus(ApprovalStatus.APPROVED);
        return dryPort;
    }

    private Buoy createBuoy(String code, String name) {
        Buoy buoy = new Buoy();
        buoy.setCode(code);
        buoy.setName(name);
        buoy.setRange(5.0);
        buoy.setApprovalStatus(ApprovalStatus.APPROVED);
        return buoy;
    }

    private BuoyStation createBuoyStation(String code, String name) {
        BuoyStation station = new BuoyStation();
        station.setCode(code);
        station.setName(name);
        return station;
    }
}
