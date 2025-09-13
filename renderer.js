// GymMinder Renderer Process
const { ipcRenderer } = require('electron');

class GymMinderApp {
    constructor() {
        this.currentRoutine = null;
        this.routineHistory = [];
        this.currentModalRoutine = null;
        this.isModalFromHistory = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showSection('routine-generator');
        this.loadHistory();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });

        // Routine Generation
        document.getElementById('generate-routine').addEventListener('click', () => {
            this.generateRoutine();
        });

        // View routine detail
        document.getElementById('view-routine-detail').addEventListener('click', () => {
            this.showRoutineModal(this.currentRoutine, false);
        });

        // History
        document.getElementById('load-history').addEventListener('click', () => {
            this.loadHistory();
        });

        // Search
        document.getElementById('history-search').addEventListener('input', (e) => {
            this.searchHistory(e.target.value);
        });

        // Modal events
        document.getElementById('modal-save-routine').addEventListener('click', () => {
            this.saveRoutine();
        });

        document.getElementById('modal-export-routine').addEventListener('click', () => {
            this.exportRoutine();
        });

        document.getElementById('modal-edit-routine').addEventListener('click', () => {
            this.editRoutine();
        });

        document.getElementById('modal-delete-routine').addEventListener('click', () => {
            this.deleteRoutineFromModal();
        });

        document.getElementById('modal-close-routine').addEventListener('click', () => {
            this.closeModal();
        });

        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        // Menu events
        ipcRenderer.on('menu-new-routine', () => {
            this.showSection('routine-generator');
        });

        ipcRenderer.on('menu-save-routine', () => {
            this.saveRoutine();
        });

        ipcRenderer.on('menu-export-routine', () => {
            this.exportRoutine();
        });

        ipcRenderer.on('menu-about', () => {
            this.showAbout();
        });

        // Split option selection
        document.querySelectorAll('.split-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.split-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                option.classList.add('selected');
            });
        });

        // Muscle selection
        document.querySelectorAll('.muscle-item').forEach(item => {
            item.addEventListener('click', () => {
                const checkbox = item.querySelector('input[type="checkbox"]');
                checkbox.checked = !checkbox.checked;
                item.classList.toggle('selected', checkbox.checked);
            });
        });
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Show selected section
        document.getElementById(sectionId).classList.add('active');
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');

        // Load section-specific data
        if (sectionId === 'routine-history') {
            this.loadHistory();
        }
    }

    async generateRoutine() {
        const splitType = document.querySelector('input[name="split-type"]:checked')?.value;
        const yesterdayMuscles = Array.from(document.querySelectorAll('input[name="yesterday-muscles"]:checked'))
            .map(cb => cb.value);
        const soreMuscles = Array.from(document.querySelectorAll('input[name="sore-muscles"]:checked'))
            .map(cb => cb.value);

        if (!splitType) {
            this.showMessage('분할 유형을 선택해주세요.', 'error');
            return;
        }

        try {
            this.showMessage('루틴을 생성하고 있습니다...', 'info');
            
            const routineData = await this.callRoutineGenerator({
                splitType,
                yesterdayMuscles,
                soreMuscles
            });

            this.currentRoutine = routineData;
            this.displayRoutine(routineData);
            this.showMessage('루틴이 성공적으로 생성되었습니다!', 'success');

            // Auto-save if enabled
            if (document.getElementById('auto-save')?.checked) {
                this.saveRoutine();
            }

        } catch (error) {
            console.error('루틴 생성 오류:', error);
            this.showMessage('루틴 생성 중 오류가 발생했습니다.', 'error');
        }
    }

    async callRoutineGenerator(data) {
        // 루틴 생성 로직
        const exercises = this.getExercisesForSplit(data.splitType, data.yesterdayMuscles, data.soreMuscles);
        
        return {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString('ko-KR'),
            splitType: this.getSplitTypeName(data.splitType),
            estimatedTime: this.calculateEstimatedTime(exercises),
            exercises: exercises
        };
    }

    getExercisesForSplit(splitType, yesterdayMuscles, soreMuscles) {
        const allExercises = {
            chest: [
                { name: '벤치프레스', sets: 4, reps: '8-12', difficulty: 'intermediate' },
                { name: '인클라인 덤벨프레스', sets: 3, reps: '10-15', difficulty: 'intermediate' },
                { name: '딥스', sets: 3, reps: '8-12', difficulty: 'beginner' },
                { name: '케이블 플라이', sets: 3, reps: '12-15', difficulty: 'beginner' }
            ],
            back: [
                { name: '데드리프트', sets: 4, reps: '5-8', difficulty: 'advanced' },
                { name: '풀업', sets: 3, reps: '8-12', difficulty: 'intermediate' },
                { name: '랫풀다운', sets: 3, reps: '10-15', difficulty: 'beginner' },
                { name: '바벨 로우', sets: 3, reps: '8-12', difficulty: 'intermediate' }
            ],
            shoulders: [
                { name: '오버헤드 프레스', sets: 4, reps: '8-12', difficulty: 'intermediate' },
                { name: '사이드 레터럴 레이즈', sets: 3, reps: '12-15', difficulty: 'beginner' },
                { name: '리어 델트 플라이', sets: 3, reps: '12-15', difficulty: 'beginner' },
                { name: '페이스 풀', sets: 3, reps: '12-15', difficulty: 'beginner' }
            ],
            biceps: [
                { name: '바벨 컬', sets: 3, reps: '8-12', difficulty: 'beginner' },
                { name: '해머 컬', sets: 3, reps: '10-15', difficulty: 'beginner' },
                { name: '프리처 컬', sets: 3, reps: '8-12', difficulty: 'intermediate' }
            ],
            triceps: [
                { name: '클로즈그립 벤치프레스', sets: 3, reps: '8-12', difficulty: 'intermediate' },
                { name: '오버헤드 익스텐션', sets: 3, reps: '10-15', difficulty: 'beginner' },
                { name: '트라이셉 딥스', sets: 3, reps: '8-12', difficulty: 'intermediate' }
            ],
            legs: [
                { name: '스쿼트', sets: 4, reps: '8-12', difficulty: 'intermediate' },
                { name: '루마니안 데드리프트', sets: 3, reps: '8-12', difficulty: 'intermediate' },
                { name: '레그 프레스', sets: 3, reps: '12-15', difficulty: 'beginner' },
                { name: '런지', sets: 3, reps: '10-12', difficulty: 'beginner' }
            ],
            abs: [
                { name: '플랭크', sets: 3, reps: '30-60초', difficulty: 'beginner' },
                { name: '크런치', sets: 3, reps: '15-20', difficulty: 'beginner' },
                { name: '러시안 트위스트', sets: 3, reps: '20-25', difficulty: 'beginner' }
            ]
        };

        let selectedMuscles = [];
        
        switch (splitType) {
            case 'fullbody':
                selectedMuscles = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'abs'];
                break;
            case 'upperlower':
                selectedMuscles = ['chest', 'back', 'shoulders', 'biceps', 'triceps'];
                break;
            case 'pushpulllegs':
                selectedMuscles = ['chest', 'shoulders', 'triceps'];
                break;
            case 'bro':
                selectedMuscles = ['chest', 'triceps', 'abs'];
                break;
        }

        // 어제 운동한 부위와 근육통 부위 제외
        const availableMuscles = selectedMuscles.filter(muscle => 
            !yesterdayMuscles.includes(muscle) && !soreMuscles.includes(muscle)
        );

        if (availableMuscles.length === 0) {
            availableMuscles.push('abs');
        }

        const exercises = [];
        availableMuscles.forEach(muscle => {
            const muscleExercises = allExercises[muscle];
            const selectedExercise = muscleExercises[Math.floor(Math.random() * muscleExercises.length)];
            exercises.push({
                name: selectedExercise.name,
                sets: selectedExercise.sets,
                reps: selectedExercise.reps,
                muscle: this.getMuscleName(muscle),
                difficulty: selectedExercise.difficulty,
                difficultyText: this.getDifficultyText(selectedExercise.difficulty)
            });
        });

        return exercises;
    }

    getSplitTypeName(splitType) {
        const names = {
            'fullbody': '전신',
            'upperlower': '상하체 분할',
            'pushpulllegs': '푸시/풀/레그',
            'bro': '브로 분할'
        };
        return names[splitType] || splitType;
    }

    getMuscleName(muscle) {
        const names = {
            'chest': '가슴',
            'back': '등',
            'shoulders': '어깨',
            'biceps': '이두근',
            'triceps': '삼두근',
            'legs': '하체',
            'abs': '복근'
        };
        return names[muscle] || muscle;
    }

    getDifficultyText(difficulty) {
        const texts = {
            'beginner': '초급',
            'intermediate': '중급',
            'advanced': '고급'
        };
        return texts[difficulty] || difficulty;
    }

    calculateEstimatedTime(exercises) {
        return exercises.length * 5;
    }

    displayRoutine(routine) {
        // 루틴 요약 표시
        const summaryHtml = `
            <div class="routine-meta">
                <div class="meta-item">
                    <i class="fas fa-calendar"></i>
                    <span>${routine.date}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-dumbbell"></i>
                    <span>${routine.splitType}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-clock"></i>
                    <span>${routine.estimatedTime}분</span>
                </div>
            </div>
            <div class="routine-summary">
                <div class="summary-card">
                    <h4><i class="fas fa-dumbbell"></i> 총 운동 수</h4>
                    <p>${routine.exercises.length}개</p>
                </div>
                <div class="summary-card">
                    <h4><i class="fas fa-clock"></i> 예상 시간</h4>
                    <p>${routine.estimatedTime}분</p>
                </div>
                <div class="summary-card">
                    <h4><i class="fas fa-fire"></i> 분할 유형</h4>
                    <p>${routine.splitType}</p>
                </div>
            </div>
        `;
        
        document.getElementById('routine-summary').innerHTML = summaryHtml;
        document.getElementById('routine-result').style.display = 'block';
    }

    renderTemplate(template, data) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] || '';
        }).replace(/\{\{#exercises\}\}([\s\S]*?)\{\{\/exercises\}\}/g, (match, exerciseTemplate) => {
            return data.exercises.map(exercise => {
                return exerciseTemplate.replace(/\{\{(\w+)\}\}/g, (match, key) => {
                    return exercise[key] || '';
                });
            }).join('');
        });
    }

    renderRoutineTable(routine) {
        const tableHtml = `
            <div class="routine-info">
                <div class="routine-meta">
                    <div class="meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${routine.date}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-dumbbell"></i>
                        <span>${routine.splitType}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${routine.estimatedTime}분</span>
                    </div>
                </div>
            </div>
            <div class="table-container">
                <table class="routine-table">
                    <thead>
                        <tr>
                            <th><i class="fas fa-dumbbell"></i> 운동</th>
                            <th><i class="fas fa-layer-group"></i> 세트</th>
                            <th><i class="fas fa-repeat"></i> 반복</th>
                            <th><i class="fas fa-bullseye"></i> 부위</th>
                            <th><i class="fas fa-star"></i> 난이도</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${routine.exercises.map(exercise => `
                            <tr>
                                <td class="exercise-name">${exercise.name}</td>
                                <td class="exercise-sets">${exercise.sets}</td>
                                <td class="exercise-reps">${exercise.reps}</td>
                                <td class="exercise-muscle">${exercise.muscle}</td>
                                <td class="exercise-difficulty">
                                    <span class="difficulty-badge difficulty-${exercise.difficulty}">${exercise.difficultyText}</span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        return tableHtml;
    }

    async saveRoutine() {
        if (!this.currentRoutine) {
            this.showMessage('저장할 루틴이 없습니다.', 'error');
            return;
        }

        try {
            const result = await ipcRenderer.invoke('save-routine', this.currentRoutine);
            if (result.success) {
                this.showMessage(result.message, 'success');
                this.routineHistory.unshift(this.currentRoutine);
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('저장 오류:', error);
            this.showMessage('루틴 저장 중 오류가 발생했습니다.', 'error');
        }
    }

    async exportRoutine() {
        if (!this.currentRoutine) {
            this.showMessage('내보낼 루틴이 없습니다.', 'error');
            return;
        }

        try {
            const result = await ipcRenderer.invoke('export-routine', this.currentRoutine);
            if (result.success) {
                this.showMessage(result.message, 'success');
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('내보내기 오류:', error);
            this.showMessage('루틴 내보내기 중 오류가 발생했습니다.', 'error');
        }
    }

    async loadHistory() {
        try {
            const result = await ipcRenderer.invoke('load-history');
            if (result.success) {
                this.routineHistory = result.data;
                this.displayHistory(this.routineHistory);
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('기록 로드 오류:', error);
            this.showMessage('기록을 불러오는 중 오류가 발생했습니다.', 'error');
        }
    }

    displayHistory(history) {
        const container = document.getElementById('history-list');
        
        if (history.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>저장된 루틴이 없습니다.</p></div>';
            return;
        }

        const template = document.getElementById('history-item-template').innerHTML;
        const rendered = history.map(routine => {
            return this.renderTemplate(template, routine);
        }).join('');

        container.innerHTML = rendered;

        // 이벤트 리스너 추가
        container.querySelectorAll('.view-routine').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.view-routine').dataset.id;
                this.viewRoutine(id);
            });
        });

        container.querySelectorAll('.delete-routine').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.delete-routine').dataset.id;
                this.deleteRoutine(id);
            });
        });
    }

    viewRoutine(id) {
        const routine = this.routineHistory.find(r => r.id === id);
        if (routine) {
            // 히스토리에서 가져온 루틴 데이터를 완전한 루틴 객체로 변환
            const fullRoutine = {
                id: routine.id,
                date: routine.date,
                splitType: routine.splitType,
                estimatedTime: routine.estimatedTime,
                exercises: this.generateMockExercises(routine.exerciseCount, routine.splitType)
            };
            this.showRoutineModal(fullRoutine, true);
        }
    }

    generateMockExercises(count, splitType) {
        // 간단한 모의 운동 데이터 생성
        const exerciseNames = {
            '전신': ['벤치프레스', '스쿼트', '데드리프트', '풀업', '오버헤드 프레스'],
            '상하체 분할': ['벤치프레스', '랫풀다운', '오버헤드 프레스', '스쿼트', '루마니안 데드리프트'],
            '푸시/풀/레그': ['벤치프레스', '오버헤드 프레스', '트라이셉 딥스', '스쿼트', '레그 프레스'],
            '브로 분할': ['벤치프레스', '인클라인 덤벨프레스', '케이블 플라이', '트라이셉 딥스', '크런치']
        };

        const muscleGroups = ['가슴', '등', '어깨', '이두근', '삼두근', '하체', '복근'];
        const difficulties = [
            { level: 'beginner', text: '초급' },
            { level: 'intermediate', text: '중급' },
            { level: 'advanced', text: '고급' }
        ];

        const names = exerciseNames[splitType] || exerciseNames['전신'];
        const exercises = [];

        for (let i = 0; i < count; i++) {
            const name = names[i % names.length] || `운동 ${i + 1}`;
            const muscle = muscleGroups[i % muscleGroups.length];
            const difficulty = difficulties[i % difficulties.length];
            
            exercises.push({
                name: name,
                sets: 3 + (i % 2),
                reps: i % 2 === 0 ? '8-12' : '10-15',
                muscle: muscle,
                difficulty: difficulty.level,
                difficultyText: difficulty.text
            });
        }

        return exercises;
    }

    showRoutineModal(routine, isFromHistory = false) {
        if (!routine) return;

        this.currentModalRoutine = routine;
        this.isModalFromHistory = isFromHistory;

        // 모달 헤더 설정
        const modalHeader = document.querySelector('.modal-header h3');
        modalHeader.innerHTML = `<i class="fas fa-dumbbell"></i> 루틴 상세보기`;

        // 루틴 정보 표시
        const routineInfo = document.getElementById('modal-routine-info');
        routineInfo.innerHTML = `
            <div class="routine-meta">
                <div class="meta-item">
                    <i class="fas fa-calendar"></i>
                    <span>${routine.date}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-dumbbell"></i>
                    <span>${routine.splitType}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-clock"></i>
                    <span>${routine.estimatedTime}분</span>
                </div>
            </div>
        `;

        // 루틴 테이블 표시
        const tableHtml = this.renderRoutineTable(routine);
        document.getElementById('modal-routine-table-container').innerHTML = tableHtml;

        // 버튼 표시/숨김 설정
        const saveBtn = document.getElementById('modal-save-routine');
        const exportBtn = document.getElementById('modal-export-routine');
        const editBtn = document.getElementById('modal-edit-routine');
        const deleteBtn = document.getElementById('modal-delete-routine');
        const closeBtn = document.getElementById('modal-close-routine');

        if (isFromHistory) {
            saveBtn.style.display = 'none';
            exportBtn.style.display = 'inline-flex';
            editBtn.style.display = 'inline-flex';
            deleteBtn.style.display = 'inline-flex';
            closeBtn.textContent = '확인';
        } else {
            saveBtn.style.display = 'inline-flex';
            exportBtn.style.display = 'inline-flex';
            editBtn.style.display = 'none';
            deleteBtn.style.display = 'none';
            closeBtn.textContent = '확인';
        }

        // 모달 표시
        const modal = document.getElementById('routine-detail-modal');
        modal.classList.add('show');
    }

    closeModal() {
        const modal = document.getElementById('routine-detail-modal');
        modal.classList.remove('show');
        this.currentModalRoutine = null;
        this.isModalFromHistory = false;
    }

    editRoutine() {
        if (this.currentModalRoutine) {
            this.closeModal();
            this.showSection('routine-generator');
            // 루틴 편집 로직 (향후 구현)
            this.showMessage('루틴 편집 기능은 준비 중입니다.', 'info');
        }
    }

    deleteRoutineFromModal() {
        if (this.currentModalRoutine && this.isModalFromHistory) {
            if (confirm('정말로 이 루틴을 삭제하시겠습니까?')) {
                this.deleteRoutine(this.currentModalRoutine.id);
                this.closeModal();
            }
        }
    }

    async deleteRoutine(id) {
        if (confirm('정말로 이 루틴을 삭제하시겠습니까?')) {
            try {
                const result = await ipcRenderer.invoke('delete-routine', id);
                if (result.success) {
                    this.routineHistory = this.routineHistory.filter(r => r.id !== id);
                    this.displayHistory(this.routineHistory);
                    this.showMessage(result.message, 'success');
                } else {
                    this.showMessage(result.message, 'error');
                }
            } catch (error) {
                console.error('삭제 오류:', error);
                this.showMessage('루틴 삭제 중 오류가 발생했습니다.', 'error');
            }
        }
    }

    searchHistory(searchTerm) {
        const filtered = this.routineHistory.filter(routine => 
            routine.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
            routine.splitType.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.displayHistory(filtered);
    }

    showMessage(message, type = 'info') {
        // 기존 메시지 제거
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // 새 메시지 생성
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        
        const icon = type === 'success' ? 'fas fa-check-circle' : 
                    type === 'error' ? 'fas fa-exclamation-circle' : 
                    'fas fa-info-circle';
        
        messageDiv.innerHTML = `<i class="${icon}"></i>${message}`;

        // 메시지 삽입
        const mainContent = document.querySelector('.main-content');
        mainContent.insertBefore(messageDiv, mainContent.firstChild);

        // 3초 후 자동 제거
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }

    showAbout() {
        const aboutText = `
            <div style="text-align: center; padding: 20px;">
                <h2 style="color: #ff6b35; margin-bottom: 20px;">💪 GymMinder v1.0</h2>
                <p style="margin-bottom: 15px; color: #888;">웨이트 트레이닝 루틴 자동 생성 및 관리 데스크톱 애플리케이션</p>
                <div style="text-align: left; max-width: 400px; margin: 0 auto;">
                    <h3 style="color: #fff; margin-bottom: 10px;">🔥 주요 기능:</h3>
                    <ul style="color: #888; line-height: 1.8;">
                        <li>🚀 자동 루틴 생성</li>
                        <li>🏋️ 분할 유형 지원</li>
                        <li>🧠 지능형 운동 선택</li>
                        <li>💾 로컬 파일 저장</li>
                        <li>📤 JSON 내보내기</li>
                        <li>📚 루틴 히스토리 관리</li>
                    </ul>
                </div>
                <p style="margin-top: 20px; color: #ff6b35; font-weight: 600;">⚡ 개발: GymMinder Team</p>
            </div>
        `;
        
        // 간단한 알림으로 표시
        this.showMessage('GymMinder v1.0 - 웨이트 트레이닝 루틴 관리 앱', 'info');
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    new GymMinderApp();
});
