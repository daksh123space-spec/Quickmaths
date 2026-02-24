document.addEventListener('DOMContentLoaded', () => {
    const quizIntro = document.getElementById('quiz-intro');
    const quizActive = document.getElementById('quiz-active');
    const quizResults = document.getElementById('quiz-results');
    const beginBtn = document.getElementById('begin-quiz');
    const quizInput = document.getElementById('quiz-input');
    const questionText = document.getElementById('question-text');
    const questionCountText = document.getElementById('question-count');
    const timerProgress = document.getElementById('timer-progress');

    let currentQuestion = 0;
    let correctCount = 0;
    let startTime = 0;
    let totalTime = 0;
    let quizQuestions = [];
    let timerInterval;

    const generateQuestion = (index) => {
        let q = "", a = 0;
        const level = (index / 15);

        if (level < 0.2) {
            let n1 = Math.floor(Math.random() * 150) + 50;
            let n2 = Math.floor(Math.random() * 150) + 50;
            if (Math.random() > 0.5) {
                q = `${n1} + ${n2}`; a = n1 + n2;
            } else {
                q = `${n1 + n2} - ${n1}`; a = n2;
            }
        } else if (level < 0.4) {
            if (Math.random() > 0.5) {
                let m1 = Math.floor(Math.random() * 15) + 3;
                let m2 = Math.floor(Math.random() * 15) + 3;
                q = `${m1} × ${m2}`; a = m1 * m2;
            } else {
                let s = Math.floor(Math.random() * 25) + 5;
                q = `${s}²`; a = s * s;
            }
        } else if (level < 0.6) {
            if (Math.random() > 0.5) {
                let base = [20, 25, 40, 50, 60, 80, 100, 200, 500][Math.floor(Math.random() * 9)];
                let perc = [5, 10, 15, 20, 25, 30][Math.floor(Math.random() * 6)];
                q = `${perc}% of ${base}`; a = (perc / 100) * base;
            } else {
                let den = [2, 3, 4, 5, 8][Math.floor(Math.random() * 5)];
                let num = Math.floor(Math.random() * (den - 1)) + 1;
                let base = den * (Math.floor(Math.random() * 20) + 2);
                q = `(${num}/${den}) of ${base}`; a = (num / den) * base;
            }
        } else if (level < 0.8) {
            if (Math.random() > 0.5) {
                let base = Math.floor(Math.random() * 5) + 2;
                let exp = Math.floor(Math.random() * 3) + 2;
                q = `${base}^${exp}`; a = Math.pow(base, exp);
            } else {
                let s1 = Math.floor(Math.random() * 10) + 2;
                let s2 = Math.floor(Math.random() * 10) + 2;
                q = `√${s1 * s1} + √${s2 * s2}`; a = s1 + s2;
            }
        } else {
            let c1 = Math.floor(Math.random() * 5) + 3;
            let c2 = Math.floor(Math.random() * 4) + 2;
            let c3 = Math.floor(Math.random() * 8) + 2;
            let c4 = Math.floor(Math.random() * 5) + 1;
            if (Math.random() > 0.5) {
                q = `(${c1}³) + ${c2}(${c3}-${c4})²`;
                a = Math.pow(c1, 3) + c2 * Math.pow((c3 - c4), 2);
            } else {
                let m1 = Math.floor(Math.random() * 20) + 10;
                let m2 = Math.floor(Math.random() * 8) + 3;
                let p1 = Math.floor(Math.random() * 6) + 2;
                let p2 = Math.floor(Math.random() * 10) + 2;
                q = `(${m1} × ${m2}) - (${p1}² + ${p2})`;
                a = (m1 * m2) - (p1 * p1 + p2);
            }
        }
        return { q, a };
    };

    const startQuestionTimer = () => {
        clearInterval(timerInterval);
        let progress = 100;
        timerProgress.style.width = '100%';
        // 15 seconds per question allowance for the bar
        const totalDuration = 15000;
        const interval = 100;
        const step = (interval / totalDuration) * 100;

        timerInterval = setInterval(() => {
            progress -= step;
            if (progress < 0) progress = 0;
            timerProgress.style.width = `${progress}%`;
            if (progress <= 0) {
                // We don't force skip, just show the bar is empty
                clearInterval(timerInterval);
            }
        }, interval);
    };

    const showQuestion = () => {
        const question = generateQuestion(currentQuestion);
        quizQuestions[currentQuestion] = question;
        questionText.innerText = question.q;
        questionCountText.innerText = `Question ${currentQuestion + 1} / 15`;
        quizInput.value = '';
        quizInput.focus();
        startTime = Date.now();
        startQuestionTimer();
    };

    beginBtn.onclick = () => {
        quizIntro.style.display = 'none';
        quizActive.style.display = 'block';
        currentQuestion = 0;
        correctCount = 0;
        totalTime = 0;
        showQuestion();
    };

    quizInput.onkeyup = (e) => {
        if (e.key === 'Enter') {
            const val = parseFloat(quizInput.value);
            if (isNaN(val)) return;

            const timeTaken = (Date.now() - startTime) / 1000;
            totalTime += timeTaken;

            if (Math.abs(val - quizQuestions[currentQuestion].a) < 0.01) {
                correctCount++;
            }

            currentQuestion++;
            if (currentQuestion < 15) {
                showQuestion();
            } else {
                showResults();
            }
        }
    };

    const showResults = () => {
        clearInterval(timerInterval);
        quizActive.style.display = 'none';
        quizResults.style.display = 'block';

        const accuracy = (correctCount / 15) * 100;
        const avgSpeed = totalTime / 15;

        // Speed score: 100 points if <= 3s, 0 points if >= 15s
        let speedScore = Math.max(0, 100 - (avgSpeed - 3) * 8.33);
        if (avgSpeed <= 3) speedScore = 100;

        // Final score: 70% accuracy, 30% speed
        const finalScore = Math.round((accuracy * 0.7) + (speedScore * 0.3));

        const rankBadge = document.getElementById('rank-badge');
        const rankText = document.getElementById('rank-text');
        rankBadge.className = 'rank-badge';

        let rank = "";
        if (finalScore >= 80) {
            rank = 'Advanced';
            rankBadge.classList.add('rank-advanced');
        } else if (finalScore >= 60) {
            rank = 'Intermediate';
            rankBadge.classList.add('rank-intermediate');
        } else {
            rank = 'Beginner';
        }

        rankBadge.innerText = rank;
        rankText.innerText = rank;
        document.getElementById('final-score').innerText = finalScore;
        document.getElementById('stat-accuracy').innerText = `${Math.round(accuracy)}%`;
        document.getElementById('stat-speed').innerText = `${avgSpeed.toFixed(1)}s`;
    };
});
