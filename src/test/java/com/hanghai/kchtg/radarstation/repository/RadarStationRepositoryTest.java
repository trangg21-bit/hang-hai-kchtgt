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
    void testFindAllApprovedOptions_IncludesAllConditionStatusesWhenApproved() {
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

        assertEquals(3, options.size());
        assertEquals(List.of("Trạm Radar A", "Trạm Radar B", "Trạm Radar C"), names);
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
