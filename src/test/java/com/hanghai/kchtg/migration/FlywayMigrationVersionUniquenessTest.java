package com.hanghai.kchtg.migration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Flyway migration version convention")
class FlywayMigrationVersionUniquenessTest {

    private static final Path MIGRATION_DIRECTORY =
            Path.of("src", "main", "resources", "db", "migration");
    private static final Pattern VERSIONED_MIGRATION =
            Pattern.compile("^V([^_]+)__.+\\.sql$");

    @Test
    @DisplayName("each version is used by exactly one migration")
    void migrationVersionsAreUnique() throws IOException {
        Map<String, List<String>> filesByVersion;
        try (var files = Files.list(MIGRATION_DIRECTORY)) {
            filesByVersion = files
                    .filter(Files::isRegularFile)
                    .map(path -> path.getFileName().toString())
                    .filter(name -> VERSIONED_MIGRATION.matcher(name).matches())
                    .collect(Collectors.groupingBy(
                            name -> {
                                var matcher = VERSIONED_MIGRATION.matcher(name);
                                if (!matcher.matches()) {
                                    throw new IllegalStateException("Invalid Flyway migration name: " + name);
                                }
                                return matcher.group(1);
                            },
                            TreeMap::new,
                            Collectors.toList()));
        }

        Map<String, List<String>> duplicates = filesByVersion.entrySet().stream()
                .filter(entry -> entry.getValue().size() > 1)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        assertThat(duplicates)
                .as("Flyway versions must be unique in %s", MIGRATION_DIRECTORY)
                .isEmpty();
    }
}
