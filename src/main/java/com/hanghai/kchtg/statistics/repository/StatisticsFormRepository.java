package com.hanghai.kchtg.statistics.repository;

import com.hanghai.kchtg.statistics.entity.StatFormStatus;
import com.hanghai.kchtg.statistics.entity.StatFormType;
import com.hanghai.kchtg.statistics.entity.StatisticsForm;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StatisticsFormRepository extends JpaRepository<StatisticsForm, Long> {

    Optional<StatisticsForm> findByFormCode(String formCode);

    List<StatisticsForm> findByFormType(StatFormType formType);

    Page<StatisticsForm> findByFormStatus(StatFormStatus status, Pageable pageable);

    Page<StatisticsForm> findByFormTypeAndFormStatus(
            StatFormType type, StatFormStatus status, Pageable pageable);

    @Query("SELECT s FROM StatisticsForm s WHERE s.formType = :type AND s.reportingPeriod = :period")
    List<StatisticsForm> findByFormTypeAndPeriod(
            @Param("type") StatFormType type,
            @Param("period") String period);

    @Query("SELECT COUNT(s) FROM StatisticsForm s WHERE s.formStatus = :status")
    Long countByStatus(@Param("status") StatFormStatus status);

    @Query("SELECT s FROM StatisticsForm s WHERE s.reportingPeriod LIKE %:year% AND s.formType = :type")
    List<StatisticsForm> findByYearAndType(
            @Param("year") String year,
            @Param("type") StatFormType type);
}
