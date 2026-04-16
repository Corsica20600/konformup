@echo off
setlocal

echo.
echo ========================================
echo Demarrage du script pushgit
echo Dossier : %cd%
echo Heure   : %date% %time%
echo ========================================

for /f "delims=" %%i in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "CURRENT_BRANCH=%%i"
if not defined CURRENT_BRANCH (
  echo.
  echo Impossible de detecter la branche Git courante.
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
git status --short

git add .
git diff --cached --quiet
if errorlevel 1 (
  echo.
  echo Commit en cours : update
  git commit -m "update"
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
git fetch origin
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
git rev-parse --verify origin/%CURRENT_BRANCH% >nul 2>&1
if errorlevel 1 (
  echo.
  echo Aucune branche distante origin/%CURRENT_BRANCH% detectee. Passage direct au push.
) else (
  git rebase origin/%CURRENT_BRANCH%
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
git push origin %CURRENT_BRANCH%
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
