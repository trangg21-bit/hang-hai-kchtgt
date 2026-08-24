#!/usr/bin/env python3
"""Copy 8 DRAFT files to correct feature directories."""
import shutil, os

BASE = os.path.expanduser("~/workspace/hang-hai-kchtgt")
FEAT = "docs/modules/M-002-quan-ly-tai-san-kchtgt-cang-ben/_features"

MAP = {
    f"{BASE}/F-026-feature-brief-DRAFT.md": f"{BASE}/{FEAT}/F-026-ql-cct-tao-moi/feature-brief.md",
    f"{BASE}/F-027-feature-brief-DRAFT.md": f"{BASE}/{FEAT}/F-027-ql-cct-cap-nhat/feature-brief.md",
    f"{BASE}/F-028-feature-brief-DRAFT.md": f"{BASE}/{FEAT}/F-028-ql-cct-xoa/feature-brief.md",
    f"{BASE}/F-029-feature-brief-DRAFT.md": f"{BASE}/{FEAT}/F-029-phe-duyet-cct/feature-brief.md",
    f"{BASE}/F-030-feature-brief-DRAFT.md": f"{BASE}/{FEAT}/F-030-xem-cct/feature-brief.md",
    f"{BASE}/F-031-feature-brief-DRAFT.md": f"{BASE}/{FEAT}/F-031-ql-cct-lich-su/feature-brief.md",
    f"{BASE}/F-083-feature-brief-DRAFT.md": f"{BASE}/{FEAT}/F-083-ui-ql-cct-danh-sach/feature-brief.md",
    f"{BASE}/F-106-feature-brief-DRAFT.md": f"{BASE}/{FEAT}/F-106-ui-upload-giayto-cct/feature-brief.md",
}

for src, dst in MAP.items():
    shutil.copy2(src, dst)
    print(f"✅ Copied: {os.path.basename(dst)}")

print("\n🎉 Done! Now delete DRAFT files: rm F-*-feature-brief-DRAFT.md")
