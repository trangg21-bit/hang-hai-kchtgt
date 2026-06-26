package com.hanghai.kchtg.nhatram.repository;

import com.hanghai.kchtg.nhatram.entity.NhaTramHistory;
import com.hanghai.kchtg.nhatram.entity.NhaTramHistoryActionType;
import com.hanghai.kchtg.nhatram.entity.NhaTramType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface NhaTramHistoryRepository extends JpaRepository<NhaTramHistory, UUID> {
    Page<NhaTramHistory> findByEntityIdAndTramType(UUID entityId, NhaTramType tramType, Pageable pageable);
    
    Page<NhaTramHistory> findByEntityIdAndTramTypeAndActionType(
            UUID entityId, NhaTramType tramType, NhaTramHistoryActionType actionType, Pageable pageable);
            
    @Query("SELECT h FROM NhaTramHistory h WHERE h.entityId = :entityId AND h.tramType = :tramType AND h.changedAt BETWEEN :from AND :to")
    Page<NhaTramHistory> findByDateRange(
            @Param("entityId") UUID entityId, 
            @Param("tramType") NhaTramType tramType, 
            @Param("from") LocalDateTime from, 
            @Param("to") LocalDateTime to, 
            Pageable pageable);
            
    Page<NhaTramHistory> findByTramTypeAndActionType(NhaTramType tramType, NhaTramHistoryActionType actionType, Pageable pageable);
    
    @Query("SELECT h FROM NhaTramHistory h WHERE h.tramType = :tramType AND h.changedAt BETWEEN :from AND :to")
    Page<NhaTramHistory> findByTramTypeAndDateRange(
            @Param("tramType") NhaTramType tramType, 
            @Param("from") LocalDateTime from, 
            @Param("to") LocalDateTime to, 
            Pageable pageable);
            
    Page<NhaTramHistory> findByTramType(NhaTramType tramType, Pageable pageable);
}
