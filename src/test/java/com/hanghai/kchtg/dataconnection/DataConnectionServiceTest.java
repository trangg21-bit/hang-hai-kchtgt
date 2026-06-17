package com.hanghai.kchtg.dataconnection;

import com.hanghai.kchtg.dataconnection.model.DataConnection;
import com.hanghai.kchtg.dataconnection.model.ConnectionStatus;
import com.hanghai.kchtg.dataconnection.model.ConnectionType;
import com.hanghai.kchtg.dataconnection.repository.DataConnectionRepository;
import com.hanghai.kchtg.dataconnection.service.DataConnectionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DataConnectionServiceTest {

    @Mock
    private DataConnectionRepository connectionRepository;

    @InjectMocks
    private DataConnectionService connectionService;

    private DataConnection testConnection;

    @BeforeEach
    void setUp() {
        testConnection = new DataConnection();
        testConnection.setId(UUID.randomUUID());
        testConnection.setName("Maritime DB");
        testConnection.setConnectionType(ConnectionType.SQL_SERVER);
        testConnection.setHost("db.hanghai.vn");
        testConnection.setPort(1433);
        testConnection.setDatabaseName("hanghai_db");
        testConnection.setStatus(ConnectionStatus.ACTIVE);
        testConnection.setIsActive(true);
    }

    @Nested
    @DisplayName("Create Connection")
    class CreateTests {

        @Test
        @DisplayName("Should create MSSQL connection")
        void createMSSQL_success() {
            when(connectionRepository.existsByName("DB2")).thenReturn(false);
            when(connectionRepository.save(any(DataConnection.class))).thenReturn(testConnection);

            DataConnection created = connectionService.createConnection(
                    "DB2", "SQL Server", ConnectionType.SQL_SERVER,
                    "db2.hanghai.vn", 1433, "secondary_db",
                    "sa", "SecurePass!");

            assertNotNull(created);
            assertEquals("DB2", created.getName());
            assertEquals(ConnectionType.SQL_SERVER, created.getConnectionType());
        }

        @Test
        @DisplayName("Should create PostgreSQL connection")
        void createPostgreSQL_success() {
            when(connectionRepository.existsByName("PG_DB")).thenReturn(false);
            when(connectionRepository.save(any(DataConnection.class))).thenReturn(testConnection);

            DataConnection created = connectionService.createConnection(
                    "PG_DB", "PostgreSQL", ConnectionType.POSTGRESQL,
                    "pg.hanghai.vn", 5432, "analytics_db",
                    "admin", "PgPass!");

            assertNotNull(created);
            assertEquals(ConnectionType.POSTGRESQL, created.getConnectionType());
        }

        @Test
        @DisplayName("Should throw when name already exists")
        void createDuplicateName_throwsException() {
            when(connectionRepository.existsByName("Maritime DB")).thenReturn(true);

            assertThrows(IllegalArgumentException.class, () ->
                    connectionService.createConnection("Maritime DB", "Dup",
                            ConnectionType.SQL_SERVER, "host", 1433, "db", "u", "p"));
        }
    }

    @Nested
    @DisplayName("Read Connections")
    class ReadTests {

        @Test
        @DisplayName("Should find connection by ID")
        void findById_success() {
            when(connectionRepository.findById(testConnection.getId()))
                    .thenReturn(Optional.of(testConnection));

            assertTrue(connectionService.findById(testConnection.getId()).isPresent());
        }

        @Test
        @DisplayName("Should return all active connections")
        void findAllActive_success() {
            when(connectionRepository.findByIsActive(true))
                    .thenReturn(Arrays.asList(testConnection));

            List<DataConnection> result = connectionService.findAllActive();
            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should filter by connection type")
        void findByType_success() {
            when(connectionRepository.findByConnectionType(ConnectionType.SQL_SERVER))
                    .thenReturn(Arrays.asList(testConnection));

            List<DataConnection> result = connectionService.findByType(ConnectionType.SQL_SERVER);
            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should get connections by status")
        void findByStatus_success() {
            when(connectionRepository.findByStatus(ConnectionStatus.ACTIVE))
                    .thenReturn(Arrays.asList(testConnection));

            List<DataConnection> result = connectionService.findByStatus(ConnectionStatus.ACTIVE);
            assertEquals(ConnectionStatus.ACTIVE, result.get(0).getStatus());
        }

        @Test
        @DisplayName("Should test connection and return health status")
        void testConnection_success() {
            when(connectionRepository.findById(testConnection.getId()))
                    .thenReturn(Optional.of(testConnection));

            Map<String, Object> health = connectionService.testConnection(testConnection.getId());
            assertNotNull(health);
        }
    }

    @Nested
    @DisplayName("Update Connection")
    class UpdateTests {

        @Test
        @DisplayName("Should update connection details")
        void update_success() {
            when(connectionRepository.findById(testConnection.getId()))
                    .thenReturn(Optional.of(testConnection));

            DataConnection updated = connectionService.updateConnection(testConnection.getId(),
                    "Updated Name", "new-host.vn", 1433, "new_db");

            assertNotNull(updated);
            verify(connectionRepository).save(any(DataConnection.class));
        }

        @Test
        @DisplayName("Should update credentials securely")
        void updateCredentials_success() {
            when(connectionRepository.findById(testConnection.getId()))
                    .thenReturn(Optional.of(testConnection));

            connectionService.updateCredentials(testConnection.getId(), "newuser", "NewPass!");
            verify(connectionRepository).save(any(DataConnection.class));
        }
    }

    @Nested
    @DisplayName("Connection Lifecycle")
    class LifecycleTests {

        @Test
        @DisplayName("Should activate connection")
        void activate_success() {
            when(connectionRepository.findById(testConnection.getId()))
                    .thenReturn(Optional.of(testConnection));

            DataConnection activated = connectionService.activate(testConnection.getId());
            assertEquals(ConnectionStatus.ACTIVE, activated.getStatus());
        }

        @Test
        @DisplayName("Should deactivate connection")
        void deactivate_success() {
            when(connectionRepository.findById(testConnection.getId()))
                    .thenReturn(Optional.of(testConnection));

            DataConnection deactivated = connectionService.deactivate(testConnection.getId());
            assertEquals(ConnectionStatus.INACTIVE, deactivated.getStatus());
        }

        @Test
        @DisplayName("Should toggle active flag")
        void toggleActive_success() {
            when(connectionRepository.findById(testConnection.getId()))
                    .thenReturn(Optional.of(testConnection));

            DataConnection toggled = connectionService.toggleActive(testConnection.getId());
            assertNotNull(toggled);
        }
    }
}
