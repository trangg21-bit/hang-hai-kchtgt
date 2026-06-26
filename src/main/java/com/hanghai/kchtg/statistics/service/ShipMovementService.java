package com.hanghai.kchtg.statistics.service;

import com.hanghai.kchtg.statistics.entity.StatFormType;
import com.hanghai.kchtg.statistics.entity.StatisticsForm;
import com.hanghai.kchtg.statistics.repository.StatisticsFormRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for SHIP_MOVEMENT forms (Biểu 04-6T/N, 04B-N, 11-T, 11B-T, 16-Q, 17-Q).
 *
 * Provides port-period queries and year-based queries for vessel movement statistics.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ShipMovementService {

    private final StatisticsFormRepository repository;

    @Transactional(readOnly = true)
    public List<StatisticsForm> getByPortAndPeriod(String portCode, String period) {
        return repository.findByFormTypeAndPeriod(StatFormType.SHIP_MOVEMENT, period);
    }

    @Transactional(readOnly = true)
    public List<StatisticsForm> getByInternationalYear(String year) {
        return repository.findByYearAndType(year, StatFormType.SHIP_MOVEMENT);
    }
}
