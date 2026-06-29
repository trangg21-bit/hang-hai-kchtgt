package com.hanghai.kchtg.dataconnection;

import com.hanghai.kchtg.dataconnection.entity.SyncLog;
import com.hanghai.kchtg.dataconnection.repository.SyncLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class SyncLogRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private SyncLogRepository repository;

    private UUID testConnectionId;

    @BeforeEach
    void setUp() {
        testConnectionId = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();

        // Create completed sync logs
        for (int i = 0; i < 3; i++) {
            SyncLog log = SyncLog.createPending(testConnectionId);
            log.complete(100 * (i + 1), 0);
            log.setStartTime(now.minusDays(2 - i));
            entityManager.persist(log);
        }

        // Create one failed log
        SyncLog failed = SyncLog.createPending(testConnectionId);
        failed.fail("Timeout");
        failed.setStartTime(now.minusHours(2));
        entityManager.persist(failed);

        entityManager.flush();
    }

    @Test
    void findByConnectionIdOrderByStartTimeDesc_shouldReturnList() {
        List<SyncLog> result = repository
                .findByConnectionIdOrderByStartTimeDesc(testConnectionId);

        assertTrue(result.size() >= 4);
        // Most recent should be first
        assertEquals(300, result.get(0).getRecordsProcessed());
    }

    @Test
    void findFirstByConnectionIdOrderByStartTimeDesc_shouldReturnLatest() {
        SyncLog latest = repository
                .findFirstByConnectionIdOrderByStartTimeDesc(testConnectionId);

        assertNotNull(latest);
        assertEquals(300, latest.getRecordsProcessed());
    }

    @Test
    void countByConnectionIdAndStatus_completed() {
        long count = repository.countByConnectionIdAndStatus(
                testConnectionId, SyncLog.SyncStatus.COMPLETED);

        assertEquals(3, count);
    }

    @Test
    void countByConnectionIdAndStatus_failed() {
        long count = repository.countByConnectionIdAndStatus(
                testConnectionId, SyncLog.SyncStatus.FAILED);

        assertEquals(1, count);
    }

    @Test
    void findByStatus_shouldReturnByStatus() {
        List<SyncLog> completed = repository.findByStatus(SyncLog.SyncStatus.COMPLETED);
        List<SyncLog> failed = repository.findByStatus(SyncLog.SyncStatus.FAILED);

        assertTrue(completed.size() >= 3);
        assertTrue(failed.size() >= 1);
    }

    @Test
    void createPending_shouldCreateWithCorrectDefaults() {
        SyncLog log = SyncLog.createPending(testConnectionId);

        assertEquals(testConnectionId, log.getConnectionId());
        assertEquals(SyncLog.SyncStatus.PENDING, log.getStatus());
        assertNotNull(log.getStartTime());
        assertNull(log.getEndTime());
        assertEquals(0, log.getRecordsProcessed());
        assertEquals(0, log.getRecordsFailed());
    }

    @Test
    void complete_withNoFailures_shouldSetCompleted() {
        SyncLog log = SyncLog.createPending(testConnectionId);
        log.complete(500, 0);
        log.setStartTime(LocalDateTime.now().minusMinutes(5));

        assertEquals(SyncLog.SyncStatus.COMPLETED, log.getStatus());
        assertEquals(500, log.getRecordsProcessed());
        assertEquals(0, log.getRecordsFailed());
        assertNotNull(log.getEndTime());
    }

    @Test
    void complete_withFailures_shouldSetPartial() {
        SyncLog log = SyncLog.createPending(testConnectionId);
        log.complete(500, 5);
        log.setStartTime(LocalDateTime.now().minusMinutes(5));

        assertEquals(SyncLog.SyncStatus.PARTIAL, log.getStatus());
        assertEquals(500, log.getRecordsProcessed());
        assertEquals(5, log.getRecordsFailed());
        assertNotNull(log.getEndTime());
    }

    @Test
    void fail_shouldSetFailed() {
        SyncLog log = SyncLog.createPending(testConnectionId);
        log.fail("Database timeout");
        log.setStartTime(LocalDateTime.now().minusMinutes(5));

        assertEquals(SyncLog.SyncStatus.FAILED, log.getStatus());
        assertEquals(1, log.getRecordsFailed());
        assertNotNull(log.getEndTime());
    }

    @Test
    void findFailedBetween_shouldReturnInRange() {
        LocalDateTime from = LocalDateTime.now().minusDays(1);
        LocalDateTime to = LocalDateTime.now();

        List<SyncLog> failed = repository.findFailedBetween(
                SyncLog.SyncStatus.FAILED, from, to);

        assertFalse(failed.isEmpty());
        for (SyncLog s : failed) {
            assertEquals(SyncLog.SyncStatus.FAILED, s.getStatus());
        }
    }

    @Test
    void sumProcessed_shouldSumRecords() {
        Long total = repository.sumProcessed(testConnectionId, SyncLog.SyncStatus.PENDING);

        // 3 completed logs: 100 + 200 + 300 = 600
        assertNotNull(total);
        assertTrue(total >= 600);
    }

    @Test
    void sumProcessed_noMatchingRecords_shouldReturnNull() {
        UUID nonExistentId = UUID.randomUUID();
        Long total = repository.sumProcessed(nonExistentId, SyncLog.SyncStatus.PENDING);

        assertNull(total); // SUM with no rows returns null
    }
}
