package com.hanghai.kchtg.accesslog.repository;

import com.hanghai.kchtg.accesslog.entity.LogAggregate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * JPA repository for {@link LogAggregate} entities.
 */
public interface LogAggregateRepository extends JpaRepository<LogAggregate, Long> {

    /** Find aggregate for a specific date. */
    Optional<LogAggregate> findByDate(LocalDate date);

    /** Find aggregates for a date range. */
    List<LogAggregate> findByDateBetween(LocalDate from, LocalDate to);

    /** Find aggregates after a date. */
    List<LogAggregate> findByDateAfter(LocalDate date);

    /** Find aggregates before a date. */
    List<LogAggregate> findByDateBefore(LocalDate date);

    /** Find all aggregates sorted by date descending. */
    List<LogAggregate> findAll(Sort sort);
}
