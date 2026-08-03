package com.hanghai.kchtg.dashboard.repository;

import com.hanghai.kchtg.dashboard.entity.DashboardSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DashboardSnapshotRepository extends JpaRepository<DashboardSnapshot, UUID> {
    @Query("SELECT d FROM DashboardSnapshot d LEFT JOIN FETCH d.details WHERE d.snapshotYear = :year AND d.provinceId = :provinceId")
    Optional<DashboardSnapshot> findByYearAndProvince(Integer year, Integer provinceId);

    @Query("SELECT d FROM DashboardSnapshot d LEFT JOIN FETCH d.details WHERE d.snapshotYear = :year AND d.provinceId IS NULL")
    Optional<DashboardSnapshot> findByYearNational(Integer year);
}
