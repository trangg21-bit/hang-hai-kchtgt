package com.hanghai.kchtg.admin;

import com.hanghai.kchtg.admin.model.SystemConfig;
import com.hanghai.kchtg.admin.repository.SystemConfigRepository;
import com.hanghai.kchtg.admin.service.AdminService;
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
class AdminServiceTest {

    @Mock
    private SystemConfigRepository configRepository;

    @InjectMocks
    private AdminService adminService;

    private SystemConfig testConfig;

    @BeforeEach
    void setUp() {
        testConfig = new SystemConfig();
        testConfig.setId(UUID.randomUUID());
        testConfig.setKey("app.name");
        testConfig.setValue("Hang Hai MTIS");
        testConfig.setCategory("general");
        testConfig.setDescription("Application display name");
        testConfig.setIsSystem(true);
    }

    @Nested
    @DisplayName("System Config")
    class ConfigTests {

        @Test
        @DisplayName("Should get config by key")
        void getConfigByKey_success() {
            when(configRepository.findByKey("app.name")).thenReturn(Optional.of(testConfig));

            Optional<SystemConfig> found = adminService.getConfigByKey("app.name");
            assertTrue(found.isPresent());
            assertEquals("Hang Hai MTIS", found.get().getValue());
        }

        @Test
        @DisplayName("Should return default when key not found")
        void getConfigByKey_notFound_returnsDefault() {
            when(configRepository.findByKey("app.unknown")).thenReturn(Optional.empty());

            String value = adminService.getConfigValueByKey("app.unknown", "default-value");
            assertEquals("default-value", value);
        }

        @Test
        @DisplayName("Should set config value")
        void setConfig_success() {
            when(configRepository.findByKey("app.name")).thenReturn(Optional.of(testConfig));

            SystemConfig updated = adminService.setConfig("app.name", "New Name");
            assertEquals("New Name", updated.getValue());
            verify(configRepository).save(any(SystemConfig.class));
        }

        @Test
        @DisplayName("Should create new config when key doesn't exist")
        void createConfig_success() {
            when(configRepository.findByKey("app.newkey")).thenReturn(Optional.empty());
            when(configRepository.save(any(SystemConfig.class))).thenAnswer(inv -> {
                SystemConfig c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                return c;
            });

            SystemConfig created = adminService.setConfig("app.newkey", "new-value");
            assertNotNull(created);
            assertNotNull(created.getId());
        }

        @Test
        @DisplayName("Should get all configs by category")
        void getConfigsByCategory_success() {
            when(configRepository.findByCategory("general"))
                    .thenReturn(Arrays.asList(testConfig));

            List<SystemConfig> configs = adminService.getConfigsByCategory("general");
            assertEquals(1, configs.size());
        }

        @Test
        @DisplayName("Should get all system configs")
        void getAllConfigs_success() {
            when(configRepository.findAll()).thenReturn(Arrays.asList(testConfig));

            List<SystemConfig> all = adminService.getAllConfigs();
            assertEquals(1, all.size());
        }

        @Test
        @DisplayName("Should delete system config")
        void deleteConfig_success() {
            when(configRepository.findByKey("app.name")).thenReturn(Optional.of(testConfig));

            adminService.deleteConfig("app.name");
            verify(configRepository).delete(testConfig);
        }

        @Test
        @DisplayName("Should prevent deleting system config")
        void deleteSystemConfig_throwsException() {
            when(configRepository.findByKey("app.name")).thenReturn(Optional.of(testConfig));

            assertThrows(IllegalStateException.class, () ->
                    adminService.deleteConfig("app.name"));
        }
    }

    @Nested
    @DisplayName("System Health")
    class HealthTests {

        @Test
        @DisplayName("Should return system health status")
        void getHealthStatus_success() {
            Map<String, Object> health = adminService.getHealthStatus();
            assertNotNull(health);
            assertTrue(health.containsKey("status"));
        }

        @Test
        @DisplayName("Should get system metrics")
        void getMetrics_success() {
            Map<String, Object> metrics = adminService.getSystemMetrics();
            assertNotNull(metrics);
        }
    }

    @Nested
    @DisplayName("System Maintenance")
    class MaintenanceTests {

        @Test
        @DisplayName("Should clear cache successfully")
        void clearCache_success() {
            adminService.clearSystemCache();
            verify(configRepository, atLeastOnce()).findAll();
        }

        @Test
        @DisplayName("Should generate system report")
        void generateReport_success() {
            Map<String, Object> report = adminService.generateSystemReport();
            assertNotNull(report);
        }
    }

    @Nested
    @DisplayName("Batch Operations")
    class BatchTests {

        @Test
        @DisplayName("Should set multiple configs in a transaction")
        void setConfigs_batch() {
            Map<String, String> configs = new HashMap<>();
            configs.put("app.name", "Test App");
            configs.put("app.version", "1.0.0");

            when(configRepository.findByKey(anyString())).thenReturn(Optional.empty());
            when(configRepository.save(any(SystemConfig.class))).thenAnswer(inv -> {
                SystemConfig c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                return c;
            });

            Map<String, SystemConfig> result = adminService.setConfigs(configs);
            assertEquals(2, result.size());
        }
    }
}
