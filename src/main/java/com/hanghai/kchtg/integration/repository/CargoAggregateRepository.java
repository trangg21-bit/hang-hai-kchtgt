package com.hanghai.kchtg.integration.repository;

import com.hanghai.kchtg.integration.entity.CargoAggregate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CargoAggregateRepository extends JpaRepository<CargoAggregate, UUID> {

    Page<CargoAggregate> findByPortCode(String portCode, Pageable pageable);

    Page<CargoAggregate> findByPortCodeAndPeriodType(String portCode, String periodType, Pageable pageable);

    Page<CargoAggregate> findByPeriodType(String periodType, Pageable pageable);
}
