package com.hanghai.kchtg.port.entity.base;

/**
 * State enum for all port-asset entities (CangBien, BenCang, CauCang, CangCan, VungNuoc).
 *
 * State machine:
 *   CREATE / UPDATE → PENDING
 *   APPROVE (PENDING) → Hien_Hanh
 *   REJECT (PENDING) → Chinh_Sua
 *   UPDATE (Hien_Hanh or Chinh_Sua) → PENDING
 *   SOFT_DELETE → DA_XOA (terminal)
 */
public enum PortStatus {
    PENDING,
    HIEN_HANH,
    CHINH_SUA,
    DA_XOA
}
