package com.hanghai.kchtg.beacon.entity;

/**
 * Discriminator enum for BeaconHistory records.
 * Indicates whether a history entry belongs to a BeaconLight or a Buoy.
 */
public enum BeaconType {
    BEACON_LIGHT,
    BUOY
}
