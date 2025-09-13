@echo off
echo 💪 GymMinder 현대적인 데스크톱 애플리케이션을 시작합니다...
echo.

REM Node.js가 설치되어 있는지 확인
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 오류: Node.js가 설치되어 있지 않거나 PATH에 설정되어 있지 않습니다.
    echo Node.js 16 이상을 설치하고 PATH에 추가해주세요.
    echo https://nodejs.org 에서 다운로드하세요.
    pause
    exit /b 1
)

REM npm이 설치되어 있는지 확인
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 오류: npm이 설치되어 있지 않습니다.
    echo Node.js와 함께 npm이 설치되어야 합니다.
    pause
    exit /b 1
)

echo 📦 의존성을 설치합니다...
npm install

if %errorlevel% neq 0 (
    echo ❌ 의존성 설치 실패. 오류를 확인해주세요.
    pause
    exit /b 1
)

echo.
echo 🚀 멋진 데스크톱 애플리케이션을 시작합니다...
echo.

npm start

pause
