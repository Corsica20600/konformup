@echo off
setlocal

set "GIT_EXE="
for %%G in (
  git.exe
  "C:\Program Files\Git\cmd\git.exe"
  "C:\Program Files\Git\bin\git.exe"
  "%LocalAppData%\Programs\Git\cmd\git.exe"
  "%LocalAppData%\Programs\Git\bin\git.exe"
  "%ProgramFiles%\GitHub Desktop\resources\app\git\cmd\git.exe"
) do (
  if not defined GIT_EXE (
    for %%H in (%%~G) do (
      if exist "%%~fH" set "GIT_EXE=%%~fH"
    )
  )
)

if not defined GIT_EXE (
  where git >nul 2>&1
  if not errorlevel 1 set "GIT_EXE=git"
)

echo.
echo ========================================
echo Demarrage du script pushgit
echo Dossier : %cd%
echo Heure   : %date% %time%
echo ========================================

if not defined GIT_EXE (
  echo.
  echo Git est introuvable.
  echo Installe Git for Windows ou remets git.exe dans le PATH, puis relance le script.
  pause
  exit /b 1
)

echo Git detecte : %GIT_EXE%

for /f "delims=" %%i in ('"%GIT_EXE%" rev-parse --abbrev-ref HEAD 2^>nul') do set "CURRENT_BRANCH=%%i"
if not defined CURRENT_BRANCH (
  echo.
  echo Impossible de detecter la branche Git courante.
  echo Verifie que ce dossier est bien un depot Git et que Git fonctionne correctement.
  pause
  exit /b 1
)

echo Branche : %CURRENT_BRANCH%

echo ========================================
echo Etape 1/6 - Verification TypeScript
echo ========================================
call npm run typecheck
if errorlevel 1 (
  echo.
  echo Typecheck en echec. Push annule.
  pause
  exit /b 1
)
echo OK - Typecheck termine.

echo.
echo ========================================
echo Etape 2/6 - Build de production
echo ========================================
call npm run build
if errorlevel 1 (
  echo.
  echo Build en echec. Push annule.
  pause
  exit /b 1
)
echo OK - Build termine.

echo.
echo ========================================
echo Etape 3/6 - Preparation du commit
echo ========================================
echo Fichiers modifies detectes :
"%GIT_EXE%" status --short

"%GIT_EXE%" add .
"%GIT_EXE%" diff --cached --quiet
if errorlevel 1 (
  echo.
  echo Commit en cours : update
  "%GIT_EXE%" commit -m "update"
  if errorlevel 1 (
    echo.
    echo Commit en echec. Push annule.
    pause
    exit /b 1
  )
  echo OK - Commit cree.
) else (
  echo.
  echo Aucun changement a commit. Rien a envoyer si le remote est deja a jour.
)

echo.
echo ========================================
echo Etape 4/6 - Recuperation des changements distants
echo ========================================
"%GIT_EXE%" fetch origin
if errorlevel 1 (
  echo.
  echo Git fetch en echec. Push annule.
  pause
  exit /b 1
)
echo OK - Git fetch termine.

echo.
echo ========================================
echo Etape 5/6 - Rebase local sur origin/%CURRENT_BRANCH%
echo ========================================
"%GIT_EXE%" rev-parse --verify origin/%CURRENT_BRANCH% >nul 2>&1
if errorlevel 1 (
  echo.
  echo Aucune branche distante origin/%CURRENT_BRANCH% detectee. Passage direct au push.
) else (
  "%GIT_EXE%" rebase origin/%CURRENT_BRANCH%
  if errorlevel 1 (
    echo.
    echo Rebase en echec. Resolvez les conflits puis relancez le script.
    pause
    exit /b 1
  )
  echo OK - Rebase termine.
)

echo.
echo ========================================
echo Etape 6/6 - Envoi vers GitHub
echo ========================================
"%GIT_EXE%" push origin %CURRENT_BRANCH%
if errorlevel 1 (
  echo.
  echo Git push en echec.
  pause
  exit /b 1
)

echo.
echo ========================================
echo Push termine. Vercel devrait lancer le deploiement automatiquement.
echo ========================================
pause
