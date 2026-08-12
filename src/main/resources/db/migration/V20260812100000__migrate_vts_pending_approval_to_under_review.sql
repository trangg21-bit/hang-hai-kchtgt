-- VTS uses the documented approval flow: PROPOSED -> UNDER_REVIEW -> APPROVED.
-- ApprovalStatus.UNDER_REVIEW is appended to preserve existing enum ordinals;
-- legacy VTS rows stored the same business state as PENDING_APPROVAL (value 2).
UPDATE vts_system
SET approval_status = 7
WHERE approval_status = 2;
