@echo off
REM Batch script to commit and merge site-based Firestore structure changes
REM Run this from the worktree directory

echo ====================================
echo Git Merge Implementation Script
echo ====================================
echo.

REM Check if we're in the right directory
if not exist "storagePlan.md" (
    echo ERROR: Not in the correct worktree directory!
    echo Please run this from: C:\Users\kuziw\APPS\testPad.worktrees\copilot-worktree-2026-01-31T10-04-31
    pause
    exit /b 1
)

echo Step 1: Staging all changes...
git add .
if errorlevel 1 (
    echo ERROR: Failed to stage changes
    pause
    exit /b 1
)
echo ✓ Changes staged successfully
echo.

echo Step 2: Checking status...
git status
echo.

echo Step 3: Committing changes...
git commit -m "Implement site-based Firestore structure for discharge data" -m "- Add Site model with site-level fields (siteName, client, contractor, province, district, coordinates)" -m "- Update Borehole model to remove site-level fields, keeping only borehole-specific data" -m "- Restructure Firestore paths: sites/{siteId}/boreholes/{boreholeId}/tests/{testId}" -m "- Add saveSite(), saveBorehole(), saveDischargeTest() with hierarchical paths" -m "- Update FirestoreService with new query methods: getTestsBySite(), getBoreholesBySite()" -m "- Update ExcelParsingService to separate site and borehole data extraction" -m "- Update UploadComponent to save data hierarchically (Site -> Borehole -> Test -> Series/Quality)" -m "- Update UI to display site and borehole information separately" -m "- Add comprehensive documentation: storagePlan.md, IMPLEMENTATION_SUMMARY.md, MERGE_GUIDE.md"

if errorlevel 1 (
    echo ERROR: Failed to commit changes
    echo This might be because there are no changes to commit, or there's an issue
    pause
    exit /b 1
)
echo ✓ Changes committed successfully
echo.

echo Step 4: Getting current branch name...
for /f "tokens=*" %%i in ('git branch --show-current') do set BRANCH_NAME=%%i
echo Current branch: %BRANCH_NAME%
echo.

echo ====================================
echo COMMIT COMPLETED SUCCESSFULLY
echo ====================================
echo.
echo Next steps to merge:
echo.
echo 1. Navigate to main repository:
echo    cd C:\Users\kuziw\APPS\testPad
echo.
echo 2. Checkout main branch:
echo    git checkout main
echo.
echo 3. Merge this branch:
echo    git merge %BRANCH_NAME%
echo.
echo 4. If conflicts occur, resolve them and run:
echo    git add .
echo    git commit
echo.
echo 5. Verify the merge:
echo    npm run build
echo.
echo Press any key to open the merge guide...
pause > nul
start MERGE_GUIDE.md

echo.
echo Do you want to automatically proceed with the merge now? (Y/N)
set /p PROCEED=
if /i "%PROCEED%"=="Y" goto merge
if /i "%PROCEED%"=="y" goto merge
goto end

:merge
echo.
echo ====================================
echo STARTING MERGE PROCESS
echo ====================================
echo.

echo Navigating to main repository...
cd ..\..\..\testPad
if errorlevel 1 (
    echo ERROR: Could not navigate to main repository
    echo Please manually navigate to: C:\Users\kuziw\APPS\testPad
    pause
    exit /b 1
)

echo Current directory: %CD%
echo.

echo Checking current branch...
git branch --show-current
echo.

echo Switching to main branch...
git checkout main
if errorlevel 1 (
    echo ERROR: Failed to checkout main branch
    echo You may need to stash or commit changes first
    pause
    exit /b 1
)
echo ✓ Switched to main branch
echo.

echo Pulling latest changes...
git pull origin main
echo.

echo Merging branch: %BRANCH_NAME%
git merge %BRANCH_NAME%

if errorlevel 1 (
    echo.
    echo ====================================
    echo MERGE CONFLICTS DETECTED
    echo ====================================
    echo.
    echo Please resolve conflicts manually:
    echo 1. Open VS Code: code .
    echo 2. Resolve conflicts in each file
    echo 3. Run: git add .
    echo 4. Run: git commit
    echo.
    echo See MERGE_GUIDE.md for detailed help
    pause
    exit /b 1
)

echo.
echo ====================================
echo MERGE COMPLETED SUCCESSFULLY
echo ====================================
echo.
echo Running build to verify...
call npm run build

if errorlevel 1 (
    echo.
    echo WARNING: Build failed after merge
    echo Please check for TypeScript errors
    pause
    exit /b 1
)

echo.
echo ====================================
echo SUCCESS! 
echo ====================================
echo.
echo The site-based Firestore structure has been implemented and merged.
echo.
echo Next steps:
echo 1. Test uploading an Excel file
echo 2. Verify data appears in correct Firestore paths
echo 3. Check Firebase console: sites/{siteId}/boreholes/{boreholeId}/tests/{testId}
echo.

:end
echo.
echo Script completed.
pause
