package com.hanghai.kchtg.port;

import com.hanghai.kchtg.port.repository.PortRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Query;

import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@DisplayName("PortRepository status query")
class PortRepositoryQueryTest {

    @Test
    @DisplayName("tab từ chối cấp Cảng vụ không gộp bản ghi từ chối cấp Cục")
    void rejectedLevelOne_doesNotIncludeRejectedLevelTwo() {
        var method = Arrays.stream(PortRepository.class.getDeclaredMethods())
                .filter(candidate -> candidate.getName().equals("searchPorts"))
                .findFirst()
                .orElseThrow();
        Query query = method.getAnnotation(Query.class);

        assertNotNull(query);
        assertFalse(query.value().contains("ApprovalStatus.REJECTED_LEVEL2"));
    }
}
