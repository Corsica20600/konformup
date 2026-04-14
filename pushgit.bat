@echo off
setlocal

echo.
echo ========================================
echo Demarrage du script pushgit
echo Dossier : %cd%
echo Heure   : %date% %time%
echo ========================================

echo ========================================
echo Etape 1/5 - Verification TypeScript
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
echo Etape 2/5 - Build de production
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
echo Etape 3/5 - Synchronisation Git
echo ========================================
git pull
if errorlevel 1 (
  echo.
  echo Git pull en echec. Push annule.
  pause
  exit /b 1
)
echo OK - Git pull termine.

echo.
echo ========================================
echo Etape 4/5 - Preparation du commit
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
echo Etape 5/5 - Envoi vers GitHub
echo ========================================
git push
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
