package com.hanghai.kchtg.document.repository;

import java.util.UUID;

import com.hanghai.kchtg.document.entity.IncidentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IncidentRecordRepository extends JpaRepository<IncidentRecord, UUID> {
}
