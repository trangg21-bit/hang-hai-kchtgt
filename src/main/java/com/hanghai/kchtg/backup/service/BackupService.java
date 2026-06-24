package com.hanghai.kchtg.backup.service;

import com.hanghai.kchtg.backup.entity.DatabaseBackup;
import com.hanghai.kchtg.backup.repository.DatabaseBackupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class BackupService {

    private final DatabaseBackupRepository backupRepository;
    private final JdbcTemplate jdbcTemplate;

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username:}")
    private String datasourceUsername;

    @Value("${spring.datasource.password:}")
    private String datasourcePassword;

    @Value("${backup.dir:./backups}")
    private String backupDir;

    @Value("${backup.retention-count:10}")
    private int retentionCount;

    /**
     * Triggers a database backup.
     *
     * @param type manual or automatic
     * @return the created backup record
     */
    @Transactional
    public DatabaseBackup performBackup(DatabaseBackup.BackupType type) {
        log.info("Starting database backup process ({})", type);
        
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String suffix = datasourceUrl.contains(":h2:") ? ".sql" : ".dump";
        String filename = "db_backup_" + timestamp + suffix;
        
        Path dirPath = Path.of(backupDir);
        Path filePath = dirPath.resolve(filename);
        
        DatabaseBackup record = new DatabaseBackup();
        record.setFilename(filename);
        record.setFilePath(filePath.toAbsolutePath().toString());
        record.setBackupType(type);
        record.setFileSize(0L); // Temporary
        record.setStatus(DatabaseBackup.BackupStatus.FAILED); // Fail by default

        try {
            Files.createDirectories(dirPath);
            
            if (datasourceUrl.contains(":h2:")) {
                backupH2(filePath.toAbsolutePath().toString());
            } else if (datasourceUrl.contains(":postgresql:")) {
                backupPostgres(filePath.toAbsolutePath().toString());
            } else {
                throw new UnsupportedOperationException("Database dialect not supported for backups: " + datasourceUrl);
            }
            
            // Success
            File file = filePath.toFile();
            record.setFileSize(file.length());
            record.setStatus(DatabaseBackup.BackupStatus.SUCCESS);
            log.info("Backup successfully completed: {} ({} bytes)", filename, record.getFileSize());
            
        } catch (Exception e) {
            log.error("Backup failed: {}", e.getMessage(), e);
            record.setErrorDetail(e.getMessage() != null ? e.getMessage() : e.toString());
        }

        DatabaseBackup saved = backupRepository.save(record);
        
        // Retain only latest backups
        cleanupOldBackupFiles();
        
        return saved;
    }

    /**
     * Restore database from a backup record.
     *
     * @param id the backup ID
     */
    @Transactional
    public void restoreBackup(UUID id) {
        DatabaseBackup record = backupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Backup record not found: " + id));

        if (record.getStatus() != DatabaseBackup.BackupStatus.SUCCESS) {
            throw new IllegalArgumentException("Cannot restore from a failed backup.");
        }

        log.info("Restoring database from backup: {}", record.getFilename());
        
        try {
            Path path = Path.of(record.getFilePath());
            if (!Files.exists(path)) {
                throw new IllegalArgumentException("Backup file does not exist on disk: " + record.getFilePath());
            }

            if (datasourceUrl.contains(":h2:")) {
                restoreH2(path.toAbsolutePath().toString());
            } else if (datasourceUrl.contains(":postgresql:")) {
                restorePostgres(path.toAbsolutePath().toString());
            } else {
                throw new UnsupportedOperationException("Database dialect not supported for restores: " + datasourceUrl);
            }
            log.info("Database restore successfully completed from: {}", record.getFilename());
            
        } catch (Exception e) {
            log.error("Database restore failed: {}", e.getMessage(), e);
            throw new RuntimeException("Restore failed: " + e.getMessage(), e);
        }
    }

    /**
     * Retrieve all backup records.
     */
    public List<DatabaseBackup> getAllBackups() {
        return backupRepository.findAllByOrderByCreatedAtDesc();
    }

    // =========================================================================
    // Backup Strategies
    // =========================================================================

    private void backupH2(String filePath) {
        // H2 script to dump the in-memory database to file
        jdbcTemplate.execute("SCRIPT TO '" + filePath + "'");
    }

    private void restoreH2(String filePath) {
        // H2 runscript to drop everything and reload data
        jdbcTemplate.execute("RUNSCRIPT FROM '" + filePath + "'");
    }

    private void backupPostgres(String filePath) throws Exception {
        Map<String, String> db = parseJdbcUrl(datasourceUrl);
        ProcessBuilder pb = new ProcessBuilder(
                "pg_dump",
                "-h", db.get("host"),
                "-p", db.get("port"),
                "-U", datasourceUsername,
                "-F", "c",
                "-b",
                "-v",
                "-f", filePath,
                db.get("dbName")
        );
        pb.environment().put("PGPASSWORD", datasourcePassword);
        Process p = pb.start();
        int exitCode = p.waitFor();
        if (exitCode != 0) {
            String errors = new String(p.getErrorStream().readAllBytes());
            throw new RuntimeException("pg_dump process failed: " + errors);
        }
    }

    private void restorePostgres(String filePath) throws Exception {
        Map<String, String> db = parseJdbcUrl(datasourceUrl);
        ProcessBuilder pb = new ProcessBuilder(
                "pg_restore",
                "-h", db.get("host"),
                "-p", db.get("port"),
                "-U", datasourceUsername,
                "-d", db.get("dbName"),
                "-c",
                "-v",
                filePath
        );
        pb.environment().put("PGPASSWORD", datasourcePassword);
        Process p = pb.start();
        int exitCode = p.waitFor();
        if (exitCode != 0) {
            String errors = new String(p.getErrorStream().readAllBytes());
            throw new RuntimeException("pg_restore process failed: " + errors);
        }
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private Map<String, String> parseJdbcUrl(String url) {
        Map<String, String> result = new HashMap<>();
        try {
            String clean = url.substring(5); // remove 'jdbc:'
            URI uri = new URI(clean);
            result.put("host", uri.getHost());
            result.put("port", String.valueOf(uri.getPort() == -1 ? 5432 : uri.getPort()));
            result.put("dbName", uri.getPath().substring(1));
        } catch (Exception e) {
            result.put("host", "localhost");
            result.put("port", "5432");
            result.put("dbName", "kchtg_m001");
        }
        return result;
    }

    private void cleanupOldBackupFiles() {
        try {
            List<DatabaseBackup> successBackups = backupRepository.findAll().stream()
                    .filter(b -> b.getStatus() == DatabaseBackup.BackupStatus.SUCCESS)
                    .sorted(Comparator.comparing(DatabaseBackup::getCreatedAt).reversed())
                    .toList();

            if (successBackups.size() > retentionCount) {
                for (int i = retentionCount; i < successBackups.size(); i++) {
                    DatabaseBackup oldBackup = successBackups.get(i);
                    File file = new File(oldBackup.getFilePath());
                    if (file.exists() && file.delete()) {
                        log.info("Deleted old backup file from disk: {}", oldBackup.getFilename());
                    }
                    backupRepository.delete(oldBackup);
                }
            }
        } catch (Exception e) {
            log.error("Failed to clean up old backup files", e);
        }
    }

    /**
     * Auto backup cron: Weekly on Sunday at midnight (0 0 0 * * SUN)
     */
    @Scheduled(cron = "${cron.database-backup:0 0 0 * * SUN}")
    public void scheduledBackup() {
        log.info("Triggering scheduled weekly backup...");
        performBackup(DatabaseBackup.BackupType.AUTOMATIC);
    }
}
