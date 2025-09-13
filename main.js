const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

// 데이터 저장소 초기화
const store = new Store();

let mainWindow;

function createWindow() {
  // 메인 윈도우 생성
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    titleBarStyle: 'default',
    show: false,
    backgroundColor: '#0a0a0a'
  });

  // HTML 파일 로드
  mainWindow.loadFile('index.html');

  // 윈도우가 준비되면 표시
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // 개발 모드에서 DevTools 열기
    if (process.argv.includes('--dev')) {
      mainWindow.webContents.openDevTools();
    }
  });

  // 윈도우가 닫힐 때
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 메뉴 설정
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: '파일',
      submenu: [
        {
          label: '새 루틴',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-routine');
          }
        },
        {
          label: '루틴 저장',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save-routine');
          }
        },
        {
          label: 'JSON 내보내기',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('menu-export-routine');
          }
        },
        { type: 'separator' },
        {
          label: '종료',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '편집',
      submenu: [
        { role: 'undo', label: '실행 취소' },
        { role: 'redo', label: '다시 실행' },
        { type: 'separator' },
        { role: 'cut', label: '잘라내기' },
        { role: 'copy', label: '복사' },
        { role: 'paste', label: '붙여넣기' }
      ]
    },
    {
      label: '보기',
      submenu: [
        { role: 'reload', label: '새로고침' },
        { role: 'forceReload', label: '강제 새로고침' },
        { role: 'toggleDevTools', label: '개발자 도구' },
        { type: 'separator' },
        { role: 'resetZoom', label: '실제 크기' },
        { role: 'zoomIn', label: '확대' },
        { role: 'zoomOut', label: '축소' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '전체 화면' }
      ]
    },
    {
      label: '도움말',
      submenu: [
        {
          label: '정보',
          click: () => {
            mainWindow.webContents.send('menu-about');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 앱이 준비되면 윈도우 생성
app.whenReady().then(createWindow);

// 모든 윈도우가 닫히면 앱 종료 (macOS 제외)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 앱이 활성화되면 윈도우 생성 (macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC 핸들러들
ipcMain.handle('save-routine', async (event, routineData) => {
  try {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const routinesDir = path.join(dataDir, 'routines');
    if (!fs.existsSync(routinesDir)) {
      fs.mkdirSync(routinesDir, { recursive: true });
    }
    
    const fileName = `routine_${routineData.date}_${Date.now()}.json`;
    const filePath = path.join(routinesDir, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(routineData, null, 2));
    
    // 히스토리에 추가
    const history = store.get('routineHistory', []);
    history.unshift({
      id: routineData.id,
      date: routineData.date,
      splitType: routineData.splitType,
      exerciseCount: routineData.exercises.length,
      estimatedTime: routineData.estimatedTime,
      fileName: fileName
    });
    
    // 최대 100개까지만 저장
    if (history.length > 100) {
      history.splice(100);
    }
    
    store.set('routineHistory', history);
    
    return { success: true, message: '루틴이 성공적으로 저장되었습니다!' };
  } catch (error) {
    return { success: false, message: '저장 중 오류가 발생했습니다: ' + error.message };
  }
});

ipcMain.handle('load-history', async () => {
  try {
    const history = store.get('routineHistory', []);
    return { success: true, data: history };
  } catch (error) {
    return { success: false, message: '히스토리 로드 중 오류가 발생했습니다: ' + error.message };
  }
});

ipcMain.handle('export-routine', async (event, routineData) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '루틴 내보내기',
      defaultPath: `gymminder_routine_${routineData.date}.json`,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (!result.canceled) {
      fs.writeFileSync(result.filePath, JSON.stringify(routineData, null, 2));
      return { success: true, message: '루틴이 성공적으로 내보내졌습니다!' };
    } else {
      return { success: false, message: '내보내기가 취소되었습니다.' };
    }
  } catch (error) {
    return { success: false, message: '내보내기 중 오류가 발생했습니다: ' + error.message };
  }
});

ipcMain.handle('delete-routine', async (event, routineId) => {
  try {
    const history = store.get('routineHistory', []);
    const routineIndex = history.findIndex(r => r.id === routineId);
    
    if (routineIndex !== -1) {
      const routine = history[routineIndex];
      
      // 파일 삭제
      const filePath = path.join(__dirname, 'data', 'routines', routine.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // 히스토리에서 제거
      history.splice(routineIndex, 1);
      store.set('routineHistory', history);
      
      return { success: true, message: '루틴이 삭제되었습니다.' };
    } else {
      return { success: false, message: '루틴을 찾을 수 없습니다.' };
    }
  } catch (error) {
    return { success: false, message: '삭제 중 오류가 발생했습니다: ' + error.message };
  }
});
