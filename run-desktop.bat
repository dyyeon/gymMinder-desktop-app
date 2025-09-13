@echo off
echo 💪 GymMinder 데스크톱 애플리케이션을 시작합니다...
echo.

REM Java가 설치되어 있는지 확인
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 오류: Java가 설치되어 있지 않거나 PATH에 설정되어 있지 않습니다.
    echo Java 11 이상을 설치하고 PATH에 추가해주세요.
    pause
    exit /b 1
)

echo 🔨 Java 컴파일을 시작합니다...
javac -d target/classes -cp "src/main/java" src/main/java/com/gymminder/*.java

if %errorlevel% neq 0 (
    echo ❌ 컴파일 실패. 오류를 확인해주세요.
    pause
    exit /b 1
)

echo.
echo 🚀 멋진 데스크톱 애플리케이션을 시작합니다...
echo.

java -cp "target/classes" com.gymminder.GymMinderDesktopApp

pause