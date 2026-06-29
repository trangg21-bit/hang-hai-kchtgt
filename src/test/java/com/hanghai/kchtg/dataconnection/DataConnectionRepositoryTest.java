package com.hanghai.kchtg.dataconnection;

import com.hanghai.kchtg.dataconnection.entity.DataConnection;
import com.hanghai.kchtg.dataconnection.enums.*;
import com.hanghai.kchtg.dataconnection.repository.DataConnectionRepository;
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
class DataConnectionRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private DataConnectionRepository repository;

    private DataConnection sampleEntity;

    @BeforeEach
    void setUp() {
        sampleEntity = new DataConnection();
        sampleEntity.setName("Hệ thống hải quan");
        sampleEntity.setCode("DC-HQ");
        sampleEntity.setTargetSystem("Hải quan điện tử");
        sampleEntity.setConnectionType(ConnectionType.REST);
        sampleEntity.setEndpointUrl("https://api.customs.example.gov.vn");
        sampleEntity.setAuthType(AuthType.TOKEN);
        sampleEntity.setCredentials("ENCRYPTED_TOKEN");
        sampleEntity.setSyncFrequency(SyncFrequency.REALTIME);
        sampleEntity.setStatus(ConnectionStatus.ACTIVE);
        sampleEntity.setLastSyncAt(LocalDateTime.now());

        entityManager.persist(sampleEntity);
        entityManager.flush();
    }

    @Test
    void findByCode_shouldReturnEntity() {
        var result = repository.findByCode("DC-HQ");

        assertTrue(result.isPresent());
        assertEquals("Hệ thống hải quan", result.get().getName());
    }

    @Test
    void findByCode_notFound_shouldReturnEmpty() {
        var result = repository.findByCode("DC-NOT-EXIST");

        assertFalse(result.isPresent());
    }

    @Test
    void existsByCode_true() {
        assertTrue(repository.existsByCode("DC-HQ"));
    }

    @Test
    void existsByCode_false() {
        assertFalse(repository.existsByCode("DC-NOT-EXIST"));
    }

    @Test
    void findAll_shouldReturnAllEntities() {
        DataConnection second = new DataConnection();
        second.setName("Hệ thống tài chính");
        second.setCode("DC-FIN");
        second.setTargetSystem("Tài chính");
        second.setConnectionType(ConnectionType.SOAP);
        second.setAuthType(AuthType.BASIC);
        second.setSyncFrequency(SyncFrequency.DAILY);
        second.setStatus(ConnectionStatus.INACTIVE);
        entityManager.persist(second);
        entityManager.flush();

        List<DataConnection> result = repository.findAll();

        assertTrue(result.size() >= 2);
        assertTrue(result.stream().anyMatch(c -> "DC-HQ".equals(c.getCode())));
        assertTrue(result.stream().anyMatch(c -> "DC-FIN".equals(c.getCode())));
    }

    @Test
    void findById_shouldReturnEntity() {
        UUID id = sampleEntity.getId();
        var result = repository.findById(id);

        assertTrue(result.isPresent());
        assertEquals("DC-HQ", result.get().getCode());
    }

    @Test
    void save_shouldPersistNewEntity() {
        DataConnection newConn = new DataConnection();
        newConn.setName("Hệ thống mới");
        newConn.setCode("DC-NEW");
        newConn.setTargetSystem("Mới");
        newConn.setConnectionType(ConnectionType.FILE);
        newConn.setAuthType(AuthType.NONE);
        newConn.setSyncFrequency(SyncFrequency.MANUAL);
        newConn.setStatus(ConnectionStatus.INACTIVE);

        DataConnection saved = repository.save(newConn);

        assertNotNull(saved.getId());
        assertNotNull(saved.getCreatedAt());
        assertNotNull(saved.getUpdatedAt());

        var found = repository.findById(saved.getId());
        assertTrue(found.isPresent());
        assertEquals("Hệ thống mới", found.get().getName());
    }

    @Test
    void uniqueCodeConstraint_shouldPreventDuplicates() {
        DataConnection dup = new DataConnection();
        dup.setName("Duplicate");
        dup.setCode("DC-HQ");
        dup.setTargetSystem("Dup");
        dup.setConnectionType(ConnectionType.REST);
        dup.setAuthType(AuthType.NONE);
        dup.setSyncFrequency(SyncFrequency.MANUAL);
        dup.setStatus(ConnectionStatus.INACTIVE);

        assertThrows(Exception.class, () -> {
            repository.save(dup);
            entityManager.flush();
        });
    }

    @Test
    void softDelete_shouldSetDeletedAt() {
        sampleEntity.softDelete();
        repository.save(sampleEntity);
        entityManager.flush();
        entityManager.clear();

        // Because of @SQLRestriction("deleted_at IS NULL"), soft-deleted
        // entities are automatically excluded from queries
        assertFalse(repository.existsByCode("DC-HQ"));
    }
}
