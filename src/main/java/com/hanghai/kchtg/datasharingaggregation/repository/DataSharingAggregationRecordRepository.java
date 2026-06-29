package com.hanghai.kchtg.datasharingaggregation.repository;

import com.hanghai.kchtg.datasharingaggregation.entity.DataSharingAggregationRecord;
import com.hanghai.kchtg.datasharingaggregation.enums.SharingStatus;
import com.hanghai.kchtg.datasharingaggregation.enums.SharingType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DataSharingAggregationRecordRepository extends JpaRepository<DataSharingAggregationRecord, String> {
    List<DataSharingAggregationRecord> findBySharingType(SharingType sharingType);
    List<DataSharingAggregationRecord> findByStatus(SharingStatus status);
    List<DataSharingAggregationRecord> findBySharingTypeAndStatus(SharingType sharingType, SharingStatus status);
    List<DataSharingAggregationRecord> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    List<DataSharingAggregationRecord> findByTargetSystem(String targetSystem);
    long countBySharingType(SharingType sharingType);
    long countByStatus(SharingStatus status);

    @Query("SELECT s FROM DataSharingAggregationRecord s WHERE s.sharingType = :type AND s.status = :status ORDER BY s.createdAt DESC")
    List<DataSharingAggregationRecord> findByTypeAndStatusOrdered(@Param("type") SharingType type, @Param("status") SharingStatus status);

    @Query("SELECT s FROM DataSharingAggregationRecord s WHERE s.shareDate BETWEEN :start AND :end")
    List<DataSharingAggregationRecord> findByShareDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
