package com.hanghai.kchtg.backup.service;

import com.hanghai.kchtg.backup.entity.DatabaseBackup;
import com.hanghai.kchtg.backup.repository.DatabaseBackupRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class BackupServiceTest {

    @Mock
    private DatabaseBackupRepository backupRepository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private BackupService backupService;

    private final String testBackupDir = "./target/test_backups";

    @BeforeEach
    void setUp() throws IOException {
        ReflectionTestUtils.setField(backupService, "datasourceUrl", "jdbc:h2:mem:testdb");
        ReflectionTestUtils.setField(backupService, "backupDir", testBackupDir);
        ReflectionTestUtils.setField(backupService, "retentionCount", 3);

        // Clear folder if exists
        Path path = Path.of(testBackupDir);
        if (Files.exists(path)) {
            Files.walk(path)
                    .map(Path::toFile)
                    .forEach(File::delete);
        }
    }

    @Test
    void performBackup_whenH2_shouldExecuteScriptToAndSaveSuccessRecord() {
        DatabaseBackup mockSaved = new DatabaseBackup();
        mockSaved.setId(UUID.randomUUID());
        mockSaved.setStatus(DatabaseBackup.BackupStatus.SUCCESS);
        mockSaved.setFilename("test_backup.sql");
        mockSaved.setBackupType(DatabaseBackup.BackupType.MANUAL);

        when(backupRepository.save(any(DatabaseBackup.class))).thenAnswer(invocation -> {
            DatabaseBackup record = invocation.getArgument(0);
            record.setId(UUID.randomUUID());
            return record;
        });

        DatabaseBackup result = backupService.performBackup(DatabaseBackup.BackupType.MANUAL);

        assertNotNull(result);
        assertEquals(DatabaseBackup.BackupStatus.SUCCESS, result.getStatus());
        assertEquals(DatabaseBackup.BackupType.MANUAL, result.getBackupType());
        verify(jdbcTemplate).execute(contains("SCRIPT TO"));
        verify(backupRepository).save(any(DatabaseBackup.class));
    }

    @Test
    void restoreBackup_whenRecordExistsAndSuccess_shouldExecuteRunscript() {
        UUID backupId = UUID.randomUUID();
        DatabaseBackup backup = new DatabaseBackup();
        backup.setId(backupId);
        backup.setStatus(DatabaseBackup.BackupStatus.SUCCESS);
        backup.setFilePath("./target/test_backups/dummy.sql");
        backup.setFilename("dummy.sql");

        // Create dummy file to avoid File Not Found check
        try {
            Files.createDirectories(Path.of(testBackupDir));
            Files.writeString(Path.of(backup.getFilePath()), "SELECT 1;");
        } catch (IOException e) {
            fail("Failed to setup dummy file");
        }

        when(backupRepository.findById(backupId)).thenReturn(Optional.of(backup));

        assertDoesNotThrow(() -> backupService.restoreBackup(backupId));

        verify(jdbcTemplate).execute(contains("RUNSCRIPT FROM"));
    }

    @Test
    void restoreBackup_whenRecordFailed_shouldThrowException() {
        UUID backupId = UUID.randomUUID();
        DatabaseBackup backup = new DatabaseBackup();
        backup.setId(backupId);
        backup.setStatus(DatabaseBackup.BackupStatus.FAILED);

        when(backupRepository.findById(backupId)).thenReturn(Optional.of(backup));

        assertThrows(IllegalArgumentException.class, () -> backupService.restoreBackup(backupId));
    }
}
