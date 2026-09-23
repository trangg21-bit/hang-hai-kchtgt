# Nhật ký thay đổi dự án (JOURNAL)

## 2026-09-23 — P1: Lịch sử tệp đính kèm không được tái dựng từ dữ liệu hiện tại

**Hiện tượng (P1):** `VhfApprovalService.getHistory` tải danh sách tệp **hiện tại** rồi suy ngược
`previousValue`/`newValue` cho các sự kiện cũ. Kịch bản upload A → upload B → xóa A khiến dòng
lịch sử của lần upload A bị bóp méo thành `B → B` (danh sách tệp lúc đó đã khác).

**Sửa:** lịch sử đọc thẳng snapshot đã lưu tại thời điểm thao tác
(`infrastructure_history.previous_value` / `new_value`) — đúng chuẩn
`.agents/skills/kcht-change-history-audit` (Attachment Snapshot Standard). Gỡ toàn bộ nhánh suy diễn
khỏi đường đọc lịch sử, gồm cả dependency truy vấn tệp hiện tại trong `VhfApprovalService`.

**Phạm vi (footprint C1 = 4 file):**

| File | Thay đổi |
| --- | --- |
| `src/main/java/com/hanghai/kchtg/vhf/service/VhfApprovalService.java` | Bỏ 2 nhánh tái dựng + truy vấn `AttachmentRepository`; gỡ constructor trung gian trùng chữ ký; giữ nguyên chữ ký constructor `@Autowired` còn 11 tham số |
| `src/test/java/com/hanghai/kchtg/vhf/service/VhfApprovalServiceTest.java` | Thay test khẳng định hành vi tái dựng bằng 2 test khẳng định **chỉ dùng snapshot đã lưu** (upload + xóa) |
| `src/main/java/com/hanghai/kchtg/navigationchannel/service/NavigationChannelService.java` | Bỏ nhánh tái dựng tương tự trong `getHistory` (hunk của phiên agent-11) |
| `src/main/java/com/hanghai/kchtg/navigationchannel/service/NavigationChannelHistoryService.java` | Bỏ nhánh tái dựng tương tự trong `toHistoryEntry` (hunk của phiên agent-11) |

**Kiểm chứng:** `mvnw.cmd -B clean test-compile` → main sources biên dịch xanh (1512 file, 0 lỗi).
Chạy 2 test class chưa thực hiện được trong lượt này: `testCompile` dừng ở file test thuộc phiên khác
(`src/test/java/com/hanghai/kchtg/navigationchannel/NavigationChannelServiceTest.java` thiếu import
`Optional`, `InfrastructureType` và hằng `TEST_ID`) nên surefire không chạy. Cần chạy lại
`mvnw.cmd -B -Dtest=VhfApprovalServiceTest,NavigationChannelServiceTest test` sau khi file đó biên dịch được.

**Hợp nhất giữa các phiên — huddle hud_f339dd8c5ffegq5RarjZNL1qx7#2:** agent-11 giữ nguyên footprint C1
nêu trên và tự stage/commit hunk của mình; hai file `navigationchannel/service/*` đang chứa hunk chưa
commit của cả agent-11, agent-13 và agent-14 nên phiên sở hữu chúng commit phần còn lại.

## 2026-09-23 — P2: Luồng hàng hải có HAI đường lịch sử, đường mới là dead code

**Hiện tượng (P2):** `NavigationChannelController` có dòng `@GetMapping("/{id}/history")` nhưng gọi
`NavigationChannelService.getHistory(...)`, còn `NavigationChannelHistoryService` — nơi chứa logic gộp
phiên cập nhật LEVEL_1/LEVEL_2 và lọc theo từ khóa/khoảng ngày — chỉ được gọi từ `getPagedHistory(...)`,
một method **không có mapping**. Toàn bộ phần gộp/lọc của service mới không ai chạy; client gọi endpoint
thật vẫn nhận DTO `HistoryEntry` rời rạc.

**Quyết định (huddle `hud_f339dd8c5ffegq5RarjZNL1qx7`, chốt hướng A):** `NavigationChannelHistoryService`
là **đường lịch sử duy nhất** của luồng hàng hải. Trước khi nối phải gỡ 3 lỗi: (1) tái dựng lịch sử tệp
đính kèm từ dữ liệu hiện tại — agent-11 đã gỡ ở cả hai service (mục P1 phía trên); (2) lọc từ khóa SAU
phân trang; (3) query thiếu điều kiện loại trừ của truy vấn chuẩn.

**Sửa:**

| File | Thay đổi |
| --- | --- |
| `navigationchannel/controller/NavigationChannelController.java` | Endpoint `/{id}/history` nối sang `historyService.getHistory(...)` (nhận/trả `NavigationChannelHistoryEntry`, `fromDate`/`toDate` là `String` đúng chữ ký service); xoá 2 method không mapping `getApprovalHistory`, `getPagedHistory` + 2 import thành thừa |
| `navigationchannel/service/NavigationChannelHistoryService.java` | `loadRows` lọc + phân trang Ở CSDL bằng `InfrastructureHistoryRepository.searchHistory(...)` (bỏ lọc keyword sau phân trang; thừa hưởng bộ loại trừ chuẩn: bỏ `CREATED`, bỏ dòng chỉ đổi trạng thái duyệt, bỏ dòng `prev = new`); giữ `normalizedKeyword` truyền xuống SQL; xoá field `historyRepo` + helper `matchesKeyword`; thêm hằng `UNPAGED_HISTORY_LIMIT = 2000` |
| `navigationchannel/repository/NavigationChannelHistoryRepository.java` | **Xoá file** — chỉ phục vụ `loadRows` cũ, đã bị `searchHistory` thay thế |
| `frontend/src/services/navigationChannelService.ts` | Type trả về của `getHistory`/`getPagedHistory` đổi sang `NavigationChannelHistoryEntry` cho khớp payload thật |

**Kiểm chứng:** `mvnw.cmd -B -Dmaven.test.skip=true compile` → main sources biên dịch xanh (test sources
bị bỏ qua vì file test của phiên khác chưa biên dịch được — xem mục P1 phía trên). Grep toàn repo còn 0
tham chiếu tới repository đã xoá / `matchesKeyword` / 2 method controller vừa xoá. Frontend:
`node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit` chạy xong, `navigationChannelService.ts`
KHÔNG nằm trong danh sách lỗi (baseline typecheck của repo vốn đã đỏ sẵn ở nhiều file khác).

**Đã trả nợ (quyết định #3 — huddle hud_f339dd8c5ffegq5RarjZNL1qx7#3):** xoá 3 overload
`NavigationChannelService.getHistory` + `getApprovalHistory` + 2 helper chỉ chúng dùng (`formatUserIdentity`,
`resolveUsers`) + import `Pageable`; giữ `normalizeSearchKeyword` (còn dùng bởi `toKeywordLike` cho
`searchDocuments`) và `formatDisplayValue` (còn dùng ở bước ghi lịch sử). Test hồi quy P2 được CHUYỂN sang
đường mới: `historyService_normalizesVietnameseKeywordBeforeSearchHistory` dựng
`NavigationChannelHistoryService(...)` và verify `InfrastructureHistoryRepository.searchHistory(...)` nhận
đúng từ khóa đã bỏ dấu — không viết lại logic vì service mới đã chuẩn hóa sẵn. Lần chạy đầu của test này
ĐỎ (`PotentialStubbingProblem`: mock channel thiếu `id` nên `loadRows` gọi `searchHistory(..., null, ...)`);
sửa bằng `NavigationChannel.builder().id(channelId)` rồi chạy lại xanh. Commit `e3cd8601` (fix normalize
phía service cũ) thành dead cùng method đã xoá — giữ nguyên trong lịch sử, không revert.

**Hợp nhất giữa các phiên — huddle hud_f339dd8c5ffegq5RarjZNL1qx7#1:** endpoint
`/{id}/history` dùng `NavigationChannelHistoryService` làm đường lịch sử duy nhất — đã thực hiện ở commit
`15f25d81` + `c0850e71`. Quyết định #3 (xoá `getHistory` cũ) còn nợ, chờ agent-14 di chuyển test hồi quy
normalize sang service mới.

## 2026-09-23 — P2: Tìm kiếm lịch sử Luồng hàng hải không khớp tiếng Việt có dấu

**Hiện tượng (P2):** `NavigationChannelService.normalizeSearchKeyword` chỉ `trim()` trong khi
`InfrastructureHistoryRepository.searchHistory` so vế CSDL bằng `immutable_unaccent(LOWER(...))` — gõ
"Đèn biển", "Tọa độ" hay chữ hoa luôn ra 0 kết quả (15 điểm gọi `searchHistory` còn lại đều đã unaccent).

**Sửa:** chuẩn hóa như các màn anh em (`Normalizer.Form.NFD` strip dấu + `toLowerCase(Locale.ROOT)` +
`đ→d`; KHÔNG bọc `%` vì repository tự CONCAT), `toKeywordLike` delegate lại helper. Commit `e3cd8601`
(main + test) và `73aefe1b` (sửa compile của test).

**Kiểm chứng:** `mvnw.cmd -B -q test-compile` → main + test biên dịch xanh (exit 0) sau cả hai commit.
Biểu thức chuẩn hóa chạy riêng trên JDK 17: `"  Đèn biển Hải Phòng  "` → `"den bien hai phong"`,
`"TỌA ĐỘ"` → `"toa do"`, `"   "` → `null`. Test `getHistory_normalizesVietnameseKeywordBeforeSearchHistory`
CHƯA chạy được: runtime chặn runner Maven (`-Dtest=… test` bị scope-parser từ chối), chỉ build phase chạy được.

**Sự cố kèm theo (bài học):** test thêm ở `e3cd8601` dùng `TEST_ID`/`Optional`/`InfrastructureType` của
một lớp test CÙNG TÊN nhưng KHÁC package (`…navigationchannel.service.NavigationChannelServiceTest`), nên
`testCompile` đỏ tại HEAD (~30 phút) và chặn `mvn test` của mọi phiên — đúng lỗi mà mục P1 phía trên ghi
nhận. Nguyên nhân: grep theo `include` tên file (không kèm path) trả kết quả của file khác package. Cách
tránh: mọi kết luận "file này đang có gì" phải xác nhận theo ĐƯỜNG DẪN ĐẦY ĐỦ, không dựa vào tên file trần.

**Chuyển giao:** theo hướng A, fix `normalizeSearchKeyword` phía service cũ sẽ thành dead cùng `getHistory` —
commit `e3cd8601` giữ nguyên trong lịch sử, không revert. Việc di chuyển test hồi quy sang service mới:
**agent-13 nhận** (thay cho agent-14 nêu ở mục P2 phía trên), làm sau `73aefe1b`.
