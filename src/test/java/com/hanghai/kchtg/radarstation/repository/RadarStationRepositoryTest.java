package com.hanghai.kchtg.radarstation.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.radarstation.entity.RadarStation;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class RadarStationRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private RadarStationRepository repository;

    @Test
    void testFindAllApprovedOptions_OnlyIncludesOperationalAndApproved() {
        RadarStation r1 = createRadar("RADAR-01", "Trạm Radar A", ApprovalStatus.APPROVED, "1");
        repository.save(r1);

        RadarStation r2 = createRadar("RADAR-02", "Trạm Radar B", ApprovalStatus.APPROVED, "0");
        repository.save(r2);

        RadarStation r3 = createRadar("RADAR-03", "Trạm Radar C", ApprovalStatus.APPROVED_LEVEL2, "2");
        repository.save(r3);

        RadarStation draft = createRadar("RADAR-DRAFT", "Trạm Radar Chưa Duyệt", ApprovalStatus.DRAFT, "1");
        repository.save(draft);

        RadarStation deleted = createRadar("RADAR-DEL", "Trạm Radar Đã Xóa", ApprovalStatus.APPROVED, "1");
        deleted.setDeletedAt(LocalDateTime.now());
        repository.save(deleted);

        entityManager.flush();

        List<RadarStation> options = repository.findAllApprovedOptions(false, List.of());
        List<String> names = options.stream().map(RadarStation::getStationName).toList();

        assertEquals(1, options.size());
        assertEquals(List.of("Trạm Radar A"), names);
    }

    @Test
    void testSearchPaged_Sorting_AscAndDesc() {
        RadarStation r1 = createRadar("RADAR-ALPHA", "Trạm Radar Alpha", ApprovalStatus.APPROVED, "1");
        repository.save(r1);

        RadarStation r2 = createRadar("RADAR-ZETA", "Trạm Radar Zeta", ApprovalStatus.APPROVED, "1");
        repository.save(r2);

        entityManager.flush();

        org.springframework.data.domain.Page<RadarStation> pageAsc = repository.searchPaged(
                false, List.of(), null, null, null, null, null, null, null, null, null, null, false, null, null, null,
                org.springframework.data.domain.PageRequest.of(0, 10, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.ASC, "stationName"))
        );
        List<String> namesAsc = pageAsc.getContent().stream().map(RadarStation::getStationName).filter(n -> n.contains("Radar Alpha") || n.contains("Radar Zeta")).toList();
        assertEquals(List.of("Trạm Radar Alpha", "Trạm Radar Zeta"), namesAsc);

        org.springframework.data.domain.Page<RadarStation> pageDesc = repository.searchPaged(
                false, List.of(), null, null, null, null, null, null, null, null, null, null, false, null, null, null,
                org.springframework.data.domain.PageRequest.of(0, 10, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "stationName"))
        );
        List<String> namesDesc = pageDesc.getContent().stream().map(RadarStation::getStationName).filter(n -> n.contains("Radar Alpha") || n.contains("Radar Zeta")).toList();
        assertEquals(List.of("Trạm Radar Zeta", "Trạm Radar Alpha"), namesDesc);
    }

    private RadarStation createRadar(String code, String name, ApprovalStatus approvalStatus, String conditionStatus) {
        return RadarStation.builder()
                .code(code)
                .stationName(name)
                .approvalStatus(approvalStatus)
                .conditionStatus(conditionStatus)
                .orgUnitId(UUID.randomUUID())
                .location("Vị trí " + code)
                .stationType("Cố định")
                .build();
    }
}
