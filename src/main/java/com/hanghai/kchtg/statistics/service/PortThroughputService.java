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
 * Service for PORT_THROUGHPUT forms (Biểu 01-N, 01B-N, 06-N, 07-N).
 *
 * Provides port-specific period queries and form-code generation conventions.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PortThroughputService {

    private final StatisticsFormRepository repository;

    @Transactional(readOnly = true)
    public List<StatisticsForm> getByPortAndPeriod(String portCode, String period) {
        // Filter by type + period pattern (e.g. "F01N-2026-06")
        String codePattern = "F01N-" + period;
        return repository.findByFormType(StatFormType.PORT_THROUGHPUT)
                .stream()
                .filter(f -> f.getFormCode() != null && f.getFormCode().startsWith(codePattern))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StatisticsForm> getByYear(String year) {
        return repository.findByYearAndType(year, StatFormType.PORT_THROUGHPUT);
    }

    /**
     * Generate a form code following convention: PREFIX-PERIOD
     */
    public String generateFormCode(String type, String period) {
        String prefix = switch (type) {
            case "PORT_THROUGHPUT" -> "F01N";
            default -> "FUNKNOWN";
        };
        return prefix + "-" + period;
    }
}
