# Scripts

## d1_sync.py - Project Mapping & Telemetry Sync

**Purpose:** Infrastructure to sync telemetry data from local cache to Cloudflare D1. Uses content markdown files as the source of truth for valid projects.

### How to Use

**Step 1: Define Your Projects**

Add `project_id` and `project_aliases` to markdown files in `src/content/garden/` that you want to track as projects.

Example frontmatter:
```yaml
---
title: "Your Project Title"
project_id: "Canonical Project Name"
project_aliases: ["Alias 1", "Alias 2", "Alias 3"]
---
```

**Step 2: Run Dry-Run to Test**

```bash
python3 scripts/d1_sync.py
```

This shows what would sync (without actually syncing).

**Step 3: Review Output**

The script will show:
- Which projects it found in your content files
- Which telemetry entries match valid projects
- Which entries would be skipped (unrecognized)
- How aliases get normalized to canonical names

### How It Works

1. Scans `src/content/garden/*.md` for `project_id` + `project_aliases` fields
2. Builds mapping: `{alias: canonical_id}`
3. Filters telemetry to only include recognized projects
4. Normalizes aliases before sync (merges related sessions)

### Dependencies

- Python 3.7+
- PyYAML (`pip install pyyaml`)

### TODO

- [ ] Implement actual D1 API sync (currently dry-run only)
- [ ] Add privacy filtering (remove PII before sync)
- [ ] Add cron job for daily sync
