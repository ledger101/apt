@echo off
REM Script to check and resolve merge conflicts

echo ====================================
echo Merge Conflict Resolution Helper
echo ====================================
echo.

echo Checking git status...
git status

echo.
echo ====================================
echo.
echo The files listed above with "both modified" have conflicts.
echo.
echo OPTIONS:
echo.
echo 1. Abort the merge and start fresh
echo 2. See which files have conflicts
echo 3. Open VS Code to resolve conflicts
echo 4. Show me the conflict resolution guide
echo.
set /p CHOICE="Enter your choice (1-4): "

if "%CHOICE%"=="1" goto abort_merge
if "%CHOICE%"=="2" goto show_conflicts
if "%CHOICE%"=="3" goto open_vscode
if "%CHOICE%"=="4" goto show_guide

:abort_merge
echo.
echo Aborting the merge...
git merge --abort
if errorlevel 1 (
    echo ERROR: Could not abort merge
    echo You may need to reset manually
    pause
    exit /b 1
)
echo ✓ Merge aborted successfully
echo.
echo You can now start the merge process fresh by running:
echo   merge-implementation.bat
echo.
pause
exit /b 0

:show_conflicts
echo.
echo Files with conflicts:
git diff --name-only --diff-filter=U
echo.
echo To see detailed conflicts in a file, run:
echo   git diff [filename]
echo.
pause
exit /b 0

:open_vscode
echo.
echo Opening VS Code...
code .
echo.
echo In VS Code:
echo 1. Look for files marked with conflicts (shown with ⚠️)
echo 2. Click on each conflicted file
echo 3. You'll see conflict markers with options:
echo    - Accept Current Change (main branch)
echo    - Accept Incoming Change (your changes)
echo    - Accept Both Changes
echo 4. Choose "Accept Incoming Change" for most cases
echo 5. After resolving all conflicts, save the files
echo 6. Then come back here and press any key...
pause
echo.
echo Now run:
echo   git add .
echo   git commit
echo.
pause
exit /b 0

:show_guide
echo.
echo Opening merge guide...
if exist MERGE_GUIDE.md (
    start MERGE_GUIDE.md
) else (
    echo MERGE_GUIDE.md not found!
    echo Please refer to the conflict resolution section above
)
echo.
pause
exit /b 0
