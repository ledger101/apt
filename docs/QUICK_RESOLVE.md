# Quick Conflict Resolution Guide

## Step-by-Step Resolution Process

### Step 1: Identify Conflicted Files

Run this command:
```cmd
git status
```

Look for files marked as "both modified" - these have conflicts.

### Step 2: For Each Conflicted File

Open the file in VS Code and look for these conflict markers:

```
<<<<<<< HEAD
[Code from main branch]
=======
[Code from your worktree - THE ONE YOU WANT]
>>>>>>> [branch-name]
```

### Step 3: Resolution Strategy by File

#### File: `src/app/models/pumping-data.model.ts`
**Action:** Accept INCOMING (your worktree version)
- This has the NEW Site interface
- This has the UPDATED Borehole interface (without site-level fields)

**What to keep:**
```typescript
export interface Site {
  siteId: string;
  siteName: string;
  coordinates?: { lat: number; lon: number };
  client?: string;
  contractor?: string;
  province?: string;
  district?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Borehole {
  boreholeId: string;
  boreholeNo: string;
  altBhNo?: string;
  // NO siteName, client, contractor, etc.
  elevation_m?: number;
  boreholeDepth_m?: number;
  // ... rest of borehole-specific fields
}
```

---

#### File: `src/app/models/index.ts`
**Action:** Accept INCOMING (your worktree version)
- This exports the NEW Site interface

**What to keep:**
```typescript
export type {
  // ... other exports
  Site,  // <-- This should be added
  Borehole,
  // ... rest of exports
}
```

---

#### File: `src/app/services/firestore.service.ts`
**Action:** Accept INCOMING (your worktree version)
- This has the NEW hierarchical methods with siteId and boreholeId parameters

**What to keep:**
```typescript
// Import Site
import { ..., Site, Borehole, ... } from '../models';

// New saveSite method
async saveSite(site: Site): Promise<void> { ... }

// Updated saveBorehole method (with siteId parameter)
async saveBorehole(siteId: string, borehole: Borehole): Promise<void> {
  const boreholesCollection = collection(this.firestore, `sites/${siteId}/boreholes`);
  // ...
}

// Updated saveDischargeTest (with siteId and boreholeId)
async saveDischargeTest(siteId: string, boreholeId: string, test: DischargeTest): Promise<void> {
  const testsCollection = collection(this.firestore, `sites/${siteId}/boreholes/${boreholeId}/tests`);
  // ...
}

// Updated saveSeries
async saveSeries(siteId: string, boreholeId: string, testId: string, series: Series[]): Promise<void> { ... }

// Updated saveQuality
async saveQuality(siteId: string, boreholeId: string, testId: string, quality: Quality[]): Promise<void> { ... }

// New query methods
async getTestsBySite(siteId: string): Promise<DischargeTest[]> { ... }
async getBoreholesBySite(siteId: string): Promise<Borehole[]> { ... }
```

---

#### File: `src/app/services/excel-parsing.service.ts`
**Action:** Accept INCOMING (your worktree version)
- This imports Site
- This returns site data in parseFile() and extractDischargeData()

**What to keep:**
```typescript
// Import Site
import { ..., Site, Borehole, ... } from '../models';

// Updated parseFile return type
async parseFile(file: File): Promise<{
  type: 'progress_report' | 'stepped_discharge' | 'constant_discharge' | 'unknown';
  data: Report | DischargeTest | null;
  site: Site | null;  // <-- This should be added
  borehole: Borehole | null;
  // ...
}> { ... }

// extractDischargeData creates Site object
private extractDischargeData(...): {
  data: DischargeTest | null;
  site: Site | null;  // <-- Added
  borehole: Borehole | null;
  // ...
} {
  // Creates siteId from siteName
  const siteId = this.slugify(normalized.meta.siteName || 'unknown-site');
  
  // Creates Site object with site-level fields
  const site: Site = {
    siteId,
    siteName: normalized.meta.siteName || '',
    coordinates: ...,
    client: ...,
    contractor: ...,
    // ...
  };
  
  // Creates Borehole without site-level fields
  const borehole: Borehole = {
    boreholeId: ...,
    boreholeNo: ...,
    // NO siteName, client, etc.
  };
  
  return { data: test, site, borehole, series, quality, validation };
}
```

---

#### File: `src/app/components/upload/upload.component.ts`
**Action:** Accept INCOMING (your worktree version)
- This adds site: Site | null to UploadState
- This updates confirmUpload() to save hierarchically

**What to keep:**
```typescript
// Import Site
import { ..., Site, Borehole, ... } from '../../models';

interface UploadState {
  // ... other fields
  site: Site | null;  // <-- Added
  borehole: Borehole | null;
  // ...
}

// In confirmUpload() method
if (this.state.site) {
  await this.firestoreService.saveSite(this.state.site);
}

if (this.state.site && this.state.borehole) {
  await this.firestoreService.saveBorehole(this.state.site.siteId, this.state.borehole);
}

if (this.state.site && this.state.borehole) {
  await this.firestoreService.saveDischargeTest(
    this.state.site.siteId,
    this.state.borehole.boreholeId,
    test
  );
  
  await this.firestoreService.saveSeries(
    this.state.site.siteId,
    this.state.borehole.boreholeId,
    test.testId,
    this.state.series
  );
  
  await this.firestoreService.saveQuality(
    this.state.site.siteId,
    this.state.borehole.boreholeId,
    test.testId,
    this.state.quality
  );
}
```

---

#### File: `src/app/components/upload/upload.component.html`
**Action:** Accept INCOMING (your worktree version)
- This displays site and borehole info separately
- Uses state.site.* instead of state.borehole.siteName

**What to keep:**
```html
<!-- Site input field -->
<div *ngIf="state.site">
  <input [(ngModel)]="state.site.siteName" ... >
</div>

<!-- Borehole tab shows both site and borehole -->
<div *ngIf="state.activeTab === 'borehole'">
  <h4>Site & Borehole Information</h4>
  
  <!-- Site Details -->
  <div *ngIf="state.site">
    <h5>Site Details</h5>
    <div>{{ state.site.siteName }}</div>
    <div>{{ state.site.client }}</div>
    <div>{{ state.site.contractor }}</div>
  </div>
  
  <!-- Borehole Details -->
  <div *ngIf="state.borehole">
    <h5>Borehole Details</h5>
    <div>{{ state.borehole.boreholeNo }}</div>
    <!-- NO state.borehole.siteName -->
  </div>
</div>
```

---

## Quick Commands After Resolution

### Once you've resolved all conflicts in VS Code:

```cmd
# Stage all resolved files
git add .

# Commit the merge
git commit -m "Merge site-based Firestore structure - conflicts resolved"

# Verify the build
npm run build
```

---

## VS Code Quick Tips

1. **Open Command Palette:** `Ctrl+Shift+P`
2. **Search for:** "Merge Conflict"
3. **Use:** "Accept Incoming" for all our modified files
4. **Or click buttons** above each conflict:
   - ❌ "Accept Current Change" (main branch - DON'T USE)
   - ✅ "Accept Incoming Change" (your changes - USE THIS)
   - "Accept Both Changes" (if needed)

---

## Verification Checklist

After resolving and committing:

- [ ] `npm run build` succeeds without errors
- [ ] TypeScript compilation passes
- [ ] All imports include `Site`
- [ ] FirestoreService methods have siteId and boreholeId parameters
- [ ] UploadComponent has `site: Site | null` in state
- [ ] HTML template uses `state.site.*` for site fields

---

## If You Get Stuck

Run this to see remaining conflicts:
```cmd
git diff --check
```

Or abort and start fresh:
```cmd
git merge --abort
merge-implementation.bat
```
