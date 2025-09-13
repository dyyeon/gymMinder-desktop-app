# GymMinder 설치 가이드

## 🚀 빠른 시작

### 1. Java 설치 (필수)

#### Windows

1. [Oracle Java 11](https://www.oracle.com/java/technologies/javase/jdk11-archive-downloads.html) 또는 [OpenJDK 11](https://adoptium.net/) 다운로드
2. 설치 후 환경변수 PATH에 Java bin 폴더 추가
3. 명령 프롬프트에서 `java -version` 확인

#### macOS

```bash
# Homebrew 사용
brew install openjdk@11

# 또는 Oracle JDK 다운로드
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install openjdk-11-jdk
```

### 2. Maven 설치 (선택사항)

#### Windows

1. [Maven 다운로드](https://maven.apache.org/download.cgi)
2. 압축 해제 후 환경변수 PATH에 bin 폴더 추가
3. 명령 프롬프트에서 `mvn -version` 확인

#### macOS

```bash
brew install maven
```

#### Linux

```bash
sudo apt install maven
```

## 🎯 실행 방법

### 방법 1: Maven 사용 (권장)

```bash
# Windows
run.bat

# Linux/Mac
./run.sh
```

### 방법 2: Java만 사용

```bash
# Windows
simple-run-no-maven.bat

# 또는 수동 실행
javac -d target/classes -cp "src/main/java" src/main/java/com/gymminder/*.java
java -cp "target/classes" com.gymminder.SimpleGymMinderApp
```

### 방법 3: 브라우저에서 직접 열기

1. `index.html` 파일을 브라우저에서 직접 열기
2. 일부 기능은 제한될 수 있음 (파일 저장 등)

## 🔧 문제 해결

### Java가 인식되지 않는 경우

1. Java 설치 확인: `java -version`
2. 환경변수 PATH 확인
3. 시스템 재시작 후 다시 시도

### 포트 8080이 사용 중인 경우

`SimpleGymMinderApp.java`에서 포트 번호를 변경:

```java
private static final int PORT = 8081; // 다른 포트로 변경
```

### 컴파일 오류가 발생하는 경우

1. Java 11 이상인지 확인
2. 파일 경로에 한글이나 특수문자가 없는지 확인
3. 관리자 권한으로 실행

## 📱 사용법

1. 애플리케이션 실행 후 브라우저에서 `http://localhost:8080` 접속
2. 분할 유형 선택 (전신, 상하체, 푸시/풀/레그, 브로 분할)
3. 어제 운동한 부위와 근육통 부위 체크
4. "루틴 생성" 버튼 클릭
5. 생성된 루틴을 저장하거나 JSON으로 내보내기

## 🎨 주요 기능

- ✅ **자동 루틴 생성**: 분할 유형에 따른 맞춤형 운동 선택
- ✅ **지능형 제외**: 어제 운동한 부위와 근육통 부위 자동 제외
- ✅ **로컬 저장**: JSON 및 텍스트 파일로 루틴 저장
- ✅ **기록 관리**: 과거 루틴 조회 및 검색
- ✅ **현대적 UI**: Spotify 스타일의 다크 테마

## 📁 데이터 저장 위치

- **루틴 파일**: `./data/routines/`
- **히스토리**: `./data/history.txt`
- **설정**: 브라우저 로컬 스토리지

## 🆘 지원

문제가 발생하면 다음을 확인해주세요:

1. Java 버전 (11 이상)
2. 포트 8080 사용 가능 여부
3. 파일 권한
4. 방화벽 설정

---

**GymMinder**로 체계적인 웨이트 트레이닝을 시작하세요! 💪
