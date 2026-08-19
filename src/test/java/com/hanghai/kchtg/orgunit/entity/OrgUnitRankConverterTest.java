package com.hanghai.kchtg.orgunit.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link OrgUnitRankConverter} — ordinal persistence + range guard (BR-003-10).
 */
class OrgUnitRankConverterTest {

    private final OrgUnitRankConverter converter = new OrgUnitRankConverter();

    @Test
    @DisplayName("shouldWriteOrdinalToDatabaseColumn")
    void shouldWriteOrdinalToDatabaseColumn() {
        assertEquals(Short.valueOf((short) 0), converter.convertToDatabaseColumn(OrgUnitRank.DEPARTMENT));
        assertEquals(Short.valueOf((short) 1),
                converter.convertToDatabaseColumn(OrgUnitRank.BRANCH));
        assertEquals(Short.valueOf((short) 2), converter.convertToDatabaseColumn(OrgUnitRank.REPRESENTATIVE));
    }

    @Test
    @DisplayName("shouldWriteNullToDatabaseColumnWhenNull")
    void shouldWriteNullToDatabaseColumnWhenNull() {
        assertNull(converter.convertToDatabaseColumn(null));
    }

    @Test
    @DisplayName("shouldReadOrdinalFromDatabaseColumn")
    void shouldReadOrdinalFromDatabaseColumn() {
        assertEquals(OrgUnitRank.DEPARTMENT, converter.convertToEntityAttribute((short) 0));
        assertEquals(OrgUnitRank.BRANCH,
                converter.convertToEntityAttribute((short) 1));
        assertEquals(OrgUnitRank.REPRESENTATIVE, converter.convertToEntityAttribute((short) 2));
    }

    @Test
    @DisplayName("shouldReturnNullForOutOfRangeOrdinal")
    void shouldReturnNullForOutOfRangeOrdinal() {
        assertNull(converter.convertToEntityAttribute((short) -1));
        assertNull(converter.convertToEntityAttribute((short) 3));
    }

    @Test
    @DisplayName("shouldReturnNullWhenDatabaseColumnIsNull")
    void shouldReturnNullWhenDatabaseColumnIsNull() {
        assertNull(converter.convertToEntityAttribute(null));
    }
}
