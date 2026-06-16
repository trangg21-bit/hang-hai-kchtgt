# Hệ thống Quản lý Kết cấu Hạ tầng Giao thông Hàng hải

> **Owner:** Cục Hàng hải Việt Nam  
> **Contractor:** ETC  
> **Budget:** 22.4B VND (2021-2025)

## 📋 Project Status

| Phase | Status |
|-------|--------|
| Layer 1 (TKCT Analysis) | ✅ Complete |
| Layer 2 (URD Analysis) | ✅ Complete |
| Layer 3 (Survey Analysis) | ✅ Complete |
| SDLC Pipeline | ⏳ Ready to start |

**Modules:** 12 | **Features:** 321 | **Risk Score:** 4/5 (Path L)

## 🛠️ Tech Stack

- **Backend:** Spring Boot Java 17+
- **Frontend:** ReactJS
- **Database:** MSSQL 2022
- **GIS:** GeoServer
- **Security:** SIEM Integration
- **Deployment:** Docker

## 📁 Project Structure

```
docs/
├── intel/                 # Intelligence layer (catalog, specs)
│   ├── catalog.json       # 12 modules, 321 features
│   ├── urd-extract.md     # URD business rules
│   ├── survey-extract.md  # Survey findings
│   └── modules/*.json     # Per-module data
├── modules/               # SDLC module scaffolds
│   └── M-XXX-*/           # 12 module directories
└── inputs/                # Source documents (not in git)
```

## 🚀 Quick Start

```bash
# Clone repo
git clone <repo-url>
cd hang-hai

# Read handoff document
cat HANDOFF.md

# Continue SDLC with AI Assistant
# Command: /resume-module M-001
```

## 📖 Documentation

- [HANDOFF.md](HANDOFF.md) — Resume guide for AI Assistant
- [AGENTS.md](AGENTS.md) — Workspace governance
- [docs/intel/](docs/intel/) — All intelligence artifacts

## 📞 Key Contacts

| Role | Contact |
|------|---------|
| Project Owner | Cục Hàng hải Việt Nam |
| Contractor | ETC |

---

*Last updated: 2026-06-16*
