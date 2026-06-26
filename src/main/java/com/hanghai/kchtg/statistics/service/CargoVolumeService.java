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
 * Service for CARGO_VOLUME forms (Biểu 03-Q/N, 12-T, 12-N).
 *
 * Provides month-based and year-based queries for cargo statistics.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CargoVolumeService {

    private final StatisticsFormRepository repository;

    @Transactional(readOnly = true)
    public List<StatisticsForm> getByMonth(String month) {
        return repository.findByFormTypeAndPeriod(StatFormType.CARGO_VOLUME, month);
    }

    @Transactional(readOnly = true)
    public List<StatisticsForm> getByYear(String year) {
        return repository.findByYearAndType(year, StatFormType.CARGO_VOLUME);
    }
}
