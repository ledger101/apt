# Merge Conflict Resolution Guide

## Pre-Merge Checklist

Before merging, ensure you have:
1. ✅ All changes committed in this worktree
2. ✅ Your main branch is up to date
3. ✅ You have a backup or can recover if needed

## Step-by-Step Merge Process

### Step 1: Commit Changes in Worktree

```bash
cd C:\Users\kuziw\APPS\testPad.worktrees\copilot-worktree-2026-01-31T10-04-31

# Check what's changed
git status

# Stage all changes
git add .

# Commit
git commit -m "Implement site-based Firestore structure

- Add Site model and update Borehole model
- Implement hierarchical Firestore paths
- Update services and components for new structure
- Add documentation (storagePlan.md, IMPLEMENTATION_SUMMARY.md)"

# Check the branch name
git branch --show-current
```

### Step 2: Prepare Main Branch

```bash
# Navigate to main repository
cd C:\Users\kuziw\APPS\testPad

# Switch to your main branch
git checkout main  # or master

# Pull latest changes (if working with remote)
git pull origin main

# Check for any uncommitted changes
git status
```

### Step 3: Merge with Conflict Detection

```bash
# Merge the worktree branch
git merge <worktree-branch-name>

# If conflicts occur, you'll see:
# CONFLICT (content): Merge conflict in <filename>
# Automatic merge failed; fix conflicts and then commit the result.
```

## Common Conflicts and Resolutions

### Conflict Type 1: Model Changes (`pumping-data.model.ts`)

**Likely conflict area:**
```typescript
<<<<<<< HEAD
// Main branch version
export interface Borehole {
  boreholeId: string;
  boreholeNo: string;
  siteName: string;  // This field exists in main
=======
// Your worktree version
export interface Site {
  siteId: string;
  siteName: string;
}
export interface Borehole {
  boreholeId: string;
  boreholeNo: string;
  // siteName removed
>>>>>>> feature-branch
```

**Resolution:**
Keep the new structure with Site interface AND updated Borehole:
```typescript
// Keep both changes
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
  // site-level fields removed
  elevation_m?: number;
  boreholeDepth_m?: number;
  // ... rest of borehole-specific fields
}
```

### Conflict Type 2: Service Methods (`firestore.service.ts`)

**Likely conflict:**
```typescript
<<<<<<< HEAD
// Main branch version
async saveBorehole(borehole: Borehole): Promise<void> {
  const boreholesCollection = collection(this.firestore, 'boreholes');
=======
// Your worktree version
async saveBorehole(siteId: string, borehole: Borehole): Promise<void> {
  const boreholesCollection = collection(this.firestore, `sites/${siteId}/boreholes`);
>>>>>>> feature-branch
```

**Resolution:**
Keep the new hierarchical version (worktree version):
```typescript
async saveBorehole(siteId: string, borehole: Borehole): Promise<void> {
  const boreholesCollection = collection(this.firestore, `sites/${siteId}/boreholes`);
  // ... rest of method
}
```

**IMPORTANT:** If main branch has this method being called elsewhere, you'll need to update those calls too.

### Conflict Type 3: Component State (`upload.component.ts`)

**Likely conflict:**
```typescript
<<<<<<< HEAD
// Main branch
interface UploadState {
  borehole: Borehole | null;
  // no site field
=======
// Your worktree
interface UploadState {
  site: Site | null;
  borehole: Borehole | null;
>>>>>>> feature-branch
```

**Resolution:**
Keep the worktree version with both site and borehole:
```typescript
interface UploadState {
  // ... other fields
  site: Site | null;
  borehole: Borehole | null;
  // ... rest of fields
}
```

### Conflict Type 4: Import Statements

**Likely conflict:**
```typescript
<<<<<<< HEAD
import { Borehole, DischargeTest } from '../models';
=======
import { Site, Borehole, DischargeTest } from '../models';
>>>>>>> feature-branch
```

**Resolution:**
Keep the worktree version with Site added:
```typescript
import { Site, Borehole, DischargeTest } from '../models';
```

## Manual Conflict Resolution Steps

### 1. Open the conflicted file in VS Code
```bash
# Git will mark files with conflicts
# Open each file listed as conflicted
code <filename>
```

### 2. Look for conflict markers
```
<<<<<<< HEAD
[main branch code]
=======
[your worktree code]
>>>>>>> branch-name
```

### 3. Choose the correct version
- Click "Accept Incoming Change" for worktree version
- Click "Accept Both Changes" if you need to merge sections
- Manually edit if complex logic is needed

### 4. Test after resolving each file
```bash
# After resolving conflicts in a file
git add <filename>

# Continue until all conflicts resolved
git status  # Should show "all conflicts fixed"
```

### 5. Complete the merge
```bash
# After resolving all conflicts
git commit -m "Merge site-based Firestore structure

Resolved conflicts by:
- Keeping new Site model and updated Borehole model
- Using hierarchical Firestore paths
- Updating all service method signatures
- Adding site field to component state"
```

## Verification After Merge

### 1. Check TypeScript compilation
```bash
npm run build
# OR
ng build

# Look for any TypeScript errors
```

### 2. Run tests (if available)
```bash
npm test
```

### 3. Manual verification
- [ ] Check `src/app/models/pumping-data.model.ts` has both Site and updated Borehole
- [ ] Check `src/app/models/index.ts` exports Site
- [ ] Check FirestoreService methods have correct signatures
- [ ] Check upload component has both site and borehole in state
- [ ] Check upload.component.html references state.site.* correctly

## Rollback Plan (If Merge Goes Wrong)

### Option 1: Abort the merge
```bash
# Before committing the merge
git merge --abort
```

### Option 2: Revert the merge commit
```bash
# After committing the merge
git log  # Find the merge commit hash
git revert -m 1 <merge-commit-hash>
```

### Option 3: Hard reset (CAUTION: loses changes)
```bash
# Find commit before merge
git log
# Reset to that commit
git reset --hard <commit-hash-before-merge>
```

## Files Most Likely to Have Conflicts

Based on the changes made, these files are most likely to conflict:

1. **High probability:**
   - `src/app/models/pumping-data.model.ts` - Core model changes
   - `src/app/services/firestore.service.ts` - Method signature changes
   - `src/app/components/upload/upload.component.ts` - State and save logic changes

2. **Medium probability:**
   - `src/app/models/index.ts` - Export additions
   - `src/app/services/excel-parsing.service.ts` - Return type changes
   - `src/app/components/upload/upload.component.html` - Template changes

3. **Low probability (new files):**
   - `storagePlan.md` - New file, shouldn't conflict
   - `IMPLEMENTATION_SUMMARY.md` - New file, shouldn't conflict

## Getting Help

If you encounter a conflict you're unsure about:

1. **Take a screenshot** of the conflict
2. **Note the file name** and line numbers
3. **Check what each version does**:
   - Main branch version (above `=======`)
   - Worktree version (below `=======`)
4. **General rule**: Keep worktree version for files listed in IMPLEMENTATION_SUMMARY.md

## Quick Reference Commands

```bash
# Show files with conflicts
git diff --name-only --diff-filter=U

# Show detailed conflict markers in a file
git diff <filename>

# Mark file as resolved
git add <filename>

# Check merge status
git status

# Abort merge
git merge --abort

# Complete merge after resolving all conflicts
git commit
```

## Post-Merge Testing Checklist

After successful merge:

- [ ] Application builds without errors
- [ ] TypeScript compilation succeeds
- [ ] No console errors when running app
- [ ] Can upload Excel file and see site/borehole split in preview
- [ ] Data saves to correct Firestore paths (check Firebase console)
- [ ] No breaking changes to existing functionality

## Need More Help?

If you get stuck during the merge:
1. Run `git status` to see current state
2. Check which files still have conflicts
3. Use VS Code's built-in merge conflict resolver
4. Test incrementally after resolving each file
5. Don't hesitate to abort and try again if needed
