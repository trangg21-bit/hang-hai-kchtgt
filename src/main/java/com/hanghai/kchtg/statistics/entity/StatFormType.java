package com.hanghai.kchtg.statistics.entity;

/**
 * Enumerates all 28 statistical form types for the chuyên đề (thematic statistics) module.
 * Each type maps to one or more official Biểu (report) codes used in maritime administration.
 */
public enum StatFormType {

    PORT_THROUGHPUT,       // Biểu 01-N, 01B-N, 06-N, 07-N
    DOCK_CAPACITY,          // Biểu 02-N
    CARGO_VOLUME,           // Biểu 03-Q/N, 12-T, 12-N
    SHIP_MOVEMENT,          // Biểu 04-6T/N, 04B-N, 11-T, 11B-T, 16-Q, 17-Q
    BERTH_ANCHORAGE,        // Biểu 05-N
    LIGHTING_SYSTEM,        // Biểu 06-N
    BUOY_SYSTEM,            // Biểu 07-6T/N, 07B-6T/N
    VTS_SYSTEM,             // Biểu 08-N
    COASTAL_INFO_SYSTEM,    // Biểu 09-N
    DIKE_BREAKWATER,        // Biểu 10-N
    CREW_STATISTICS,        // Biểu 21-6T/N, 22-6T/N
    REPAIR_DAMAGE,          // Biểu 31-N
    OTHER                   // Biểu 13-T, 14-T, 15-T, 16-Q, 17-Q
}
