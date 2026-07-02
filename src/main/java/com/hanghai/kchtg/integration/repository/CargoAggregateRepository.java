package com.hanghai.kchtg.integration.repository;

import com.hanghai.kchtg.integration.entity.CargoAggregate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.UUID;
public interface CargoAggregateRepository extends JpaRepository<CargoAggregate, UUID> {

    @Query(value = "SELECT COUNT(*) FROM kchtgt_cargo_aggregates WHERE port_code = :portCode AND period_type = :periodType AND period_start = :periodStart", nativeQuery = true)
    long countByPortCodeAndPeriodTypeAndPeriodStartIncludingDeleted(
            @Param("portCode") String portCode,
            @Param("periodType") String periodType,
            @Param("periodStart") java.time.LocalDate periodStart
    );

    Page<CargoAggregate> findByPortCode(String portCode, Pageable pageable);

    Page<CargoAggregate> findByPortCodeAndPeriodType(String portCode, String periodType, Pageable pageable);

    Page<CargoAggregate> findByPeriodType(String periodType, Pageable pageable);
}