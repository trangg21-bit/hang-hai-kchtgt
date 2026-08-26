---
id: AM-de7ed50a5986191a
kind: gotcha
topic: hibernate-enum-param-bind
tags: []
importance: 0.8
agent: 
created: 2026-08-22T09:31:55.012Z
updated: 2026-08-22T09:31:55.012Z
---

GOTCHA Spring Data JPA (Hibernate 6): khi JPQL so sánh cột enum (`p.status = :status` với BuoyStation.status là StationStatus) thì Hibernate INFER kiểu param = enum, từ chối bind String dù repository khai @Param String — lỗi 'Argument [PUBLISHED] of type [java.lang.String] did not match parameter type [StationStatus]'. Fix 2026-08-22 (TRI-1787390960364-0283): đổi @Param sang StationStatus + convert String→enum (valueOf + toUpperCase + try/catch null) trong BuoyStationService.search. Buoy/BeaconLight dùng String status nên không dính.
