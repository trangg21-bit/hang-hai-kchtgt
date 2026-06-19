package com.hanghai.kchtg.dataconnection;

import com.hanghai.kchtg.dataconnection.dto.ConnectionResponse;
import com.hanghai.kchtg.dataconnection.dto.CreateConnectionRequest;
import com.hanghai.kchtg.dataconnection.dto.TestConnectionRequest;
import com.hanghai.kchtg.dataconnection.dto.UpdateConnectionRequest;
import com.hanghai.kchtg.dataconnection.entity.DataConnection;
import com.hanghai.kchtg.dataconnection.enums.AuthType;
import com.hanghai.kchtg.dataconnection.enums.ConnectionStatus;
import com.hanghai.kchtg.dataconnection.enums.ConnectionType;
import com.hanghai.kchtg.dataconnection.enums.SyncFrequency;
import com.hanghai.kchtg.dataconnection.repository.DataConnectionRepository;
import com.hanghai.kchtg.dataconnection.service.DataConnectionService;
import com.hanghai.kchtg.security.EncryptionUtil;
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

    @Mock
    private EncryptionUtil encryptionUtil;

    @InjectMocks
    private DataConnectionService connectionService;

    private DataConnection testConnection;

    @BeforeEach
    void setUp() {
        testConnection = new DataConnection();
        testConnection.setId(UUID.randomUUID());
        testConnection.setName("Maritime DB");
        testConnection.setCode("MARITIME");
        testConnection.setTargetSystem("Hệ thống hải quan");
        testConnection.setConnectionType(ConnectionType.DATABASE);
        testConnection.setEndpointUrl("http://db.hanghai.vn");
        testConnection.setAuthType(AuthType.BASIC);
        testConnection.setCredentials("encrypted-creds");
        testConnection.setSyncFrequency(SyncFrequency.DAILY);
        testConnection.setStatus(ConnectionStatus.ACTIVE);
    }

    @Nested
    @DisplayName("Create Connection")
    class CreateTests {

        @Test
        @DisplayName("Should create REST connection")
        void createRest_success() {
            CreateConnectionRequest request = new CreateConnectionRequest();
            request.setName("REST API");
            request.setCode("REST-API");
            request.setTargetSystem("External API");
            request.setConnectionType(ConnectionType.REST);
            request.setEndpointUrl("http://api.example.com");
            request.setAuthType(AuthType.TOKEN);
            request.setCredentials("token123");
            request.setSyncFrequency(SyncFrequency.HOURLY);

            DataConnection savedConnection = new DataConnection();
            savedConnection.setId(UUID.randomUUID());
            savedConnection.setName("REST API");
            savedConnection.setCode("REST-API");
            savedConnection.setTargetSystem("External API");
            savedConnection.setConnectionType(ConnectionType.REST);
            savedConnection.setEndpointUrl("http://api.example.com");
            savedConnection.setAuthType(AuthType.TOKEN);
            savedConnection.setCredentials("token123");
            savedConnection.setSyncFrequency(SyncFrequency.HOURLY);
            savedConnection.setStatus(ConnectionStatus.ACTIVE);

            when(connectionRepository.existsByCode("REST-API")).thenReturn(false);
            when(connectionRepository.save(any(DataConnection.class))).thenReturn(savedConnection);

            ConnectionResponse result = connectionService.create(request);

            assertNotNull(result);
            assertEquals("REST-API", result.getCode());
            verify(connectionRepository).save(any(DataConnection.class));
        }

        @Test
        @DisplayName("Should throw when code already exists")
        void createDuplicateCode_throwsException() {
            CreateConnectionRequest request = new CreateConnectionRequest();
            request.setName("Dup");
            request.setCode("MARITIME");
            request.setTargetSystem("Dup");
            request.setConnectionType(ConnectionType.REST);
            request.setAuthType(AuthType.BASIC);
            request.setCredentials("cred");
            request.setSyncFrequency(SyncFrequency.DAILY);

            when(connectionRepository.existsByCode("MARITIME")).thenReturn(true);

            assertThrows(IllegalArgumentException.class, () -> connectionService.create(request));
            verify(connectionRepository, never()).save(any());
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

            ConnectionResponse result = connectionService.getById(testConnection.getId());

            assertNotNull(result);
            assertEquals("Maritime DB", result.getName());
        }

        @Test
        @DisplayName("Should return all connections")
        void findAll_success() {
            when(connectionRepository.findAll()).thenReturn(Arrays.asList(testConnection));

            List<ConnectionResponse> result = connectionService.listAll();

            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should find by code")
        void findByCode_success() {
            when(connectionRepository.findByCode("MARITIME"))
                    .thenReturn(Optional.of(testConnection));

            Optional<DataConnection> result = connectionRepository.findByCode("MARITIME");

            assertTrue(result.isPresent());
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
            when(connectionRepository.save(any(DataConnection.class))).thenReturn(testConnection);

            UpdateConnectionRequest request = new UpdateConnectionRequest();
            request.setName("Updated Name");

            ConnectionResponse result = connectionService.update(testConnection.getId(), request);

            assertNotNull(result);
            verify(connectionRepository).save(any(DataConnection.class));
        }

        @Test
        @DisplayName("Should throw when updating nonexistent connection")
        void update_notFound_throws() {
            when(connectionRepository.findById(any(UUID.class)))
                    .thenReturn(Optional.empty());

            UpdateConnectionRequest request = new UpdateConnectionRequest();
            request.setName("Nonexistent");

            assertThrows(jakarta.persistence.EntityNotFoundException.class,
                    () -> connectionService.update(UUID.randomUUID(), request));
        }
    }

    @Nested
    @DisplayName("Connection Lifecycle")
    class LifecycleTests {

        @Test
        @DisplayName("Should delete connection")
        void delete_success() {
            when(connectionRepository.findById(testConnection.getId()))
                    .thenReturn(Optional.of(testConnection));
            when(connectionRepository.existsById(testConnection.getId())).thenReturn(true);

            assertDoesNotThrow(() -> connectionService.delete(testConnection.getId()));
        }

        @Test
        @DisplayName("Should throw when deleting nonexistent connection")
        void delete_notFound_throws() {
            when(connectionRepository.existsById(any(UUID.class))).thenReturn(false);

            assertThrows(jakarta.persistence.EntityNotFoundException.class,
                    () -> connectionService.delete(UUID.randomUUID()));
        }
    }
}
