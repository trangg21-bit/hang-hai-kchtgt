package com.hanghai.kchtg.backup.repository;

import com.hanghai.kchtg.backup.entity.DatabaseBackup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.List;

@Repository
public interface DatabaseBackupRepository extends JpaRepository<DatabaseBackup, UUID> {
    List<DatabaseBackup> findAllByOrderByCreatedAtDesc();
}
