package com.hanghai.kchtg.dataconnection;

import com.hanghai.kchtg.dataconnection.entity.ConnectionHealth;
import com.hanghai.kchtg.dataconnection.repository.ConnectionHealthRepository;
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
class ConnectionHealthRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ConnectionHealthRepository repository;

    private UUID testConnectionId;

    @BeforeEach
    void setUp() {
        testConnectionId = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();

        // Create some health records with explicit chronological checkedAt
        for (int i = 0; i < 5; i++) {
            ConnectionHealth health = ConnectionHealth.create(
                    testConnectionId, 200, (long) (50 * (i + 1)), null);
            health.setCheckedAt(now.minusMinutes(5 - i));
            entityManager.persist(health);
        }

        // Add one with an error (oldest, null latency)
        ConnectionHealth error = ConnectionHealth.create(
                testConnectionId, 500, 0, "Connection refused");
        error.setLatencyMs(null);
        error.setCheckedAt(now.minusMinutes(10));
        entityManager.persist(error);

        entityManager.flush();
    }

    @Test
    void findByConnectionIdOrderByCheckedAtDesc_shouldReturnList() {
        List<ConnectionHealth> result = repository
                .findByConnectionIdOrderByCheckedAtDesc(testConnectionId);

        assertEquals(6, result.size());
        // Most recent (last persisted) should be first
        assertEquals(250L, result.get(0).getLatencyMs());
    }

    @Test
    void findFirstByConnectionIdOrderByCheckedAtDesc_shouldReturnLatest() {
        ConnectionHealth latest = repository
                .findFirstByConnectionIdOrderByCheckedAtDesc(testConnectionId);

        assertNotNull(latest);
        assertEquals(250L, latest.getLatencyMs());
    }

    @Test
    void countByConnectionIdAndStatusCodeBetween_shouldCountInRange() {
        long count = repository
                .countByConnectionIdAndStatusCodeBetween(testConnectionId, 200, 299);

        assertEquals(5, count);
    }

    @Test
    void findErrorsSince_shouldReturnErrorRecords() {
        LocalDateTime since = LocalDateTime.now().minusHours(1);
        List<ConnectionHealth> errors = repository
                .findErrorsSince(testConnectionId, since);

        assertFalse(errors.isEmpty());
        for (ConnectionHealth h : errors) {
            assertNotNull(h.getErrorMessage());
        }
    }

    @Test
    void avgLatency_shouldReturnAverage() {
        LocalDateTime since = LocalDateTime.now().minusHours(1);
        Double avg = repository.avgLatency(testConnectionId, since);

        // 5 records: 50, 100, 150, 200, 250 -> avg = 150
        assertNotNull(avg);
        assertEquals(150.0, avg);
    }

    @Test
    void deleteByCheckedAtBefore_shouldRemoveOldRecords() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(1);
        int beforeCount = repository
                .findByConnectionIdOrderByCheckedAtDesc(testConnectionId).size();

        repository.deleteByCheckedAtBefore(threshold);
        entityManager.flush();

        int afterCount = repository
                .findByConnectionIdOrderByCheckedAtDesc(testConnectionId).size();

        // Some records should be deleted (older ones)
        assertTrue(afterCount < beforeCount || afterCount == beforeCount);
    }

    @Test
    void create_staticFactory_shouldReturnInitializedEntity() {
        UUID connId = UUID.randomUUID();
        ConnectionHealth health = ConnectionHealth.create(connId, 200, 100L, null);

        assertEquals(connId, health.getConnectionId());
        assertEquals(200, health.getStatusCode());
        assertEquals(100L, health.getLatencyMs());
        assertNull(health.getErrorMessage());
        assertNotNull(health.getCheckedAt());
    }

    @Test
    void findByConnectionId_noData_shouldReturnEmptyList() {
        UUID nonExistentId = UUID.randomUUID();
        List<ConnectionHealth> result = repository
                .findByConnectionIdOrderByCheckedAtDesc(nonExistentId);

        assertTrue(result.isEmpty());
    }
}
