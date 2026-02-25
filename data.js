// ============================================================
// QuickMaths - Core Data & State Management
// ============================================================

const QM = {

    // ---- USER STATE ----
    getUser: () => JSON.parse(localStorage.getItem('qm_user') || 'null'),
    saveUser: (u) => localStorage.setItem('qm_user', JSON.stringify(u)),

    defaultUser: () => ({
        username: '',
        email: '',
        xp: 0,
        streakDays: 0,
        lastActivity: null,
        streakFreezes: 0,
        level: 'beginner', // beginner | intermediate | advanced
        diagnosticScore: null,
        // progress[sectionId][lessonId] = { read: bool, score: number, mastered: bool }
        progress: {},
        // masteryChecks[sectionId] = { passed: bool, score: number }
        masteryChecks: {}
    }),

    initUser(username, email, level) {
        const u = this.defaultUser();
        u.username = username;
        u.email = email;
        u.level = level;
        u.lastActivity = new Date().toDateString();
        this.saveUser(u);
        return u;
    },

    addXP(amount) {
        const u = this.getUser();
        if (!u) return;
        u.xp += amount;
        // Streak
        const today = new Date().toDateString();
        if (u.lastActivity !== today) {
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            if (u.lastActivity === yesterday) {
                u.streakDays += 1;
            } else {
                u.streakDays = 1;
            }
            u.lastActivity = today;
        }
        this.saveUser(u);
    },

    markLessonRead(sectionId, lessonId) {
        const u = this.getUser();
        if (!u.progress[sectionId]) u.progress[sectionId] = {};
        if (!u.progress[sectionId][lessonId]) u.progress[sectionId][lessonId] = {};
        if (!u.progress[sectionId][lessonId].read) {
            u.progress[sectionId][lessonId].read = true;
            this.saveUser(u);
            this.addXP(10);
        }
    },

    markLessonScore(sectionId, lessonId, score) {
        const u = this.getUser();
        if (!u.progress[sectionId]) u.progress[sectionId] = {};
        if (!u.progress[sectionId][lessonId]) u.progress[sectionId][lessonId] = {};
        u.progress[sectionId][lessonId].score = score;
        u.progress[sectionId][lessonId].mastered = score >= 70;
        this.saveUser(u);
        this.addXP(50);
    },

    isLessonMastered(sectionId, lessonId) {
        const u = this.getUser();
        return u?.progress?.[sectionId]?.[lessonId]?.mastered || false;
    },

    isSectionMastered(sectionId) {
        const u = this.getUser();
        return u?.masteryChecks?.[sectionId]?.passed || false;
    },

    markMasteryCheck(sectionId, score) {
        const u = this.getUser();
        if (!u.masteryChecks) u.masteryChecks = {};
        u.masteryChecks[sectionId] = { passed: score >= 80, score };
        if (score >= 80) {
            // Mark all lessons in section as mastered
            const sec = CURRICULUM.find(s => s.id === sectionId);
            if (sec) {
                if (!u.progress[sectionId]) u.progress[sectionId] = {};
                sec.lessons.forEach(l => {
                    u.progress[sectionId][l.id] = { mastered: true, read: true, score: 100 };
                });
            }
            this.saveUser(u);
            this.addXP(500);
        } else {
            this.saveUser(u);
        }
    },

    // Which lesson index is the user unlocked up to in a section
    getUnlockedUpTo(sectionId) {
        const u = this.getUser();
        if (!u) return 0;
        const sec = CURRICULUM.find(s => s.id === sectionId);
        if (!sec) return 0;
        let idx = 0;
        for (let i = 0; i < sec.lessons.length; i++) {
            if (this.isLessonMastered(sectionId, sec.lessons[i].id)) {
                idx = i + 1;
            } else break;
        }
        return idx; // can click lessons 0..idx
    }
};

// ============================================================
// CURRICULUM DATA
// ============================================================
const CURRICULUM = [
    {
        id: 's1', title: 'Fundamental Operations', icon: '➕',
        skipFor: ['intermediate', 'advanced'],
        lessons: [
            {
                id: 's1l1', title: 'Addition Methods', icon: '➕',
                content: `
<h2>Addition — 3 Mental Methods</h2>
<h3>Method 1: Place-Value Decomposition (Partitioning)</h3>
<p>Break numbers into hundreds, tens, and ones — then calculate each part separately. This works because of place value: 45 = 40 + 5. Smaller chunks reduce mental overload.</p>
<div class="steps"><div class="step">Split each number into tens and ones</div><div class="step">Add the tens together</div><div class="step">Add the ones together</div><div class="step">Combine the results</div></div>
<div class="example"><strong>Example 1:</strong> 45 + 87<br>45 = 40 + 5 &nbsp; 87 = 80 + 7<br>40 + 80 = 120 &nbsp; 5 + 7 = 12<br><strong>120 + 12 = 132 ✓</strong></div>
<div class="example"><strong>Example 2:</strong> 368 + 254<br>368 = 300 + 60 + 8 &nbsp; 254 = 200 + 50 + 4<br>300+200=500 &nbsp; 60+50=110 &nbsp; 8+4=12<br><strong>500 + 110 + 12 = 622 ✓</strong></div>
<h3>Method 2: Sequential Chunking</h3>
<p>Keep one number whole, then add the other in chunks (tens first, then ones).</p>
<div class="example"><strong>Example:</strong> 56 + 32 → 56 + 30 = 86 → 86 + 2 = <strong>88 ✓</strong></div>
<div class="example"><strong>Example:</strong> 247 + 68 → 247 + 60 = 307 → 307 + 8 = <strong>315 ✓</strong></div>
<h3>Method 3: Compensation (Rounding & Adjusting)</h3>
<p>Round a tricky number to the nearest 10, calculate, then adjust.</p>
<div class="example"><strong>Example:</strong> 45 + 29 → 29 ≈ 30 → 45 + 30 = 75 → 75 − 1 = <strong>74 ✓</strong></div>
<div class="example"><strong>Example:</strong> 248 + 99 → 99 ≈ 100 → 248 + 100 = 348 → 348 − 1 = <strong>347 ✓</strong></div>
` },
            {
                id: 's1l2', title: 'Subtraction Methods', icon: '➖',
                content: `
<h2>Subtraction — 4 Mental Methods</h2>
<h3>Method 1: Place-Value Decomposition</h3>
<p>Break numbers into place values and subtract each part.</p>
<div class="example"><strong>Example:</strong> 85 − 22 → 80−20=60, 5−2=3 → <strong>63 ✓</strong></div>
<h3>Method 2: Sequential Chunking</h3>
<div class="example"><strong>Example:</strong> 53 − 28 → 53 − 20 = 33 → 33 − 8 = <strong>25 ✓</strong></div>
<h3>Method 3: Compensation</h3>
<div class="example"><strong>Example:</strong> 75 − 39 → 39 ≈ 40 → 75 − 40 = 35 → 35 + 1 = <strong>36 ✓</strong></div>
<div class="example"><strong>Example:</strong> 502 − 199 → 502 − 200 = 302 → 302 + 1 = <strong>303 ✓</strong></div>
<h3>Method 4: Add-Up Subtraction (Counting Up)</h3>
<p>Instead of subtracting, count UP from the smaller to the larger number.</p>
<div class="steps"><div class="step">Start at the smaller number</div><div class="step">Jump to the next multiple of 10</div><div class="step">Continue to the target</div><div class="step">Add all jumps</div></div>
<div class="example"><strong>Example:</strong> 82 − 47 → 47→50 (+3), 50→80 (+30), 80→82 (+2) → 3+30+2 = <strong>35 ✓</strong></div>
<div class="example"><strong>Example:</strong> 401 − 198 → 198→200 (+2), 200→400 (+200), 400→401 (+1) = <strong>203 ✓</strong></div>
<h3>Method 5: Constant Difference</h3>
<p>Add (or subtract) the same small amount from both numbers to make them cleaner.</p>
<div class="example"><strong>Example:</strong> 75 − 39 → add 1 to both → 76 − 40 = <strong>36 ✓</strong></div>
` },
            {
                id: 's1l3', title: 'Multiplication Methods', icon: '✖️',
                content: `
<h2>Multiplication — 6 Mental Methods</h2>
<h3>Method 1: Partitioning (Distributive Property)</h3>
<p>Split one number into tens + ones, multiply each part separately: a(b+c) = ab + ac</p>
<div class="example"><strong>Example:</strong> 23 × 14 → 23×10=230, 23×4=92 → 230+92 = <strong>322 ✓</strong></div>
<h3>Method 2: Doubling & Halving</h3>
<p>Halve one number and double the other — the product stays the same!</p>
<div class="example"><strong>Example:</strong> 16 × 25 → 8 × 50 = <strong>400 ✓</strong></div>
<div class="example"><strong>Example:</strong> 32 × 125 → 16×250 → 8×500 = <strong>4000 ✓</strong></div>
<h3>Method 3: Compensation (Rounding)</h3>
<div class="example"><strong>Example:</strong> 29 × 6 → 30×6=180, minus 1×6=6 → <strong>174 ✓</strong></div>
<div class="example"><strong>Example:</strong> 99 × 7 → 100×7=700, minus 7 = <strong>693 ✓</strong></div>
<h3>Method 4: Base Multiples of 10</h3>
<div class="example"><strong>Example:</strong> 40 × 70 → 4×7=28, attach two zeros = <strong>2800 ✓</strong></div>
<h3>Method 5: Multiply by 25 → use 100÷4</h3>
<div class="example"><strong>Example:</strong> 48 × 25 → 48 × 100 = 4800 ÷ 4 = <strong>1200 ✓</strong></div>
<h3>Method 6: Multiply by 11</h3>
<p>Write first and last digits; middle = sum of both digits (carry if &gt;9).</p>
<div class="example"><strong>Example:</strong> 43 × 11 → 4&nbsp;(4+3=7)&nbsp;3 = <strong>473 ✓</strong></div>
<div class="example"><strong>Example:</strong> 68 × 11 → 6&nbsp;(6+8=14, carry)&nbsp;8 = <strong>748 ✓</strong></div>
` },
            {
                id: 's1l4', title: 'Division Methods', icon: '➗',
                content: `
<h2>Division — 4 Mental Methods</h2>
<h3>Method 1: Partial Quotients</h3>
<p>Subtract large friendly chunks, add the partial quotients.</p>
<div class="example"><strong>Example:</strong> 156 ÷ 6 → 6×20=120, 156−120=36, 36÷6=6 → 20+6 = <strong>26 ✓</strong></div>
<h3>Method 2: Halving & Halving</h3>
<p>Halve BOTH numbers — the answer stays the same!</p>
<div class="example"><strong>Example:</strong> 96 ÷ 24 → 48÷12 → 24÷6 → 12÷3 = <strong>4 ✓</strong></div>
<h3>Method 3: Place Value Shortcut</h3>
<div class="example"><strong>Example:</strong> 3600 ÷ 9 → 36÷9=4, attach two zeros = <strong>400 ✓</strong></div>
<div class="example"><strong>Example:</strong> 420 ÷ 7 → 42÷7=6, attach one zero = <strong>60 ✓</strong></div>
<h3>Method 4: Round & Estimate</h3>
<div class="example"><strong>Example:</strong> 198 ÷ 9 → 180÷9=20, remainder 18÷9=2 → <strong>22 ✓</strong></div>
<div class="example"><strong>Example:</strong> 302 ÷ 5 → 300÷5=60, 2÷5=0.4 → <strong>60.4 ✓</strong></div>
` }
        ]
    },
    {
        id: 's2', title: 'Fractions', icon: '½',
        skipFor: ['advanced'],
        lessons: [
            {
                id: 's2l1', title: 'Fraction Simplification', icon: '🔢',
                content: `<h2>Fraction Simplification</h2><p>Divide the numerator and denominator by their Greatest Common Factor (GCF).</p><div class="steps"><div class="step">Find a common factor of top and bottom</div><div class="step">Divide both by that factor</div><div class="step">Repeat until fully simplified</div></div><div class="example"><strong>Example:</strong> 12/18 → both ÷ 6 = <strong>2/3 ✓</strong></div><div class="example"><strong>Example:</strong> 45/60 → both ÷ 15 = <strong>3/4 ✓</strong></div>`
            },
            {
                id: 's2l2', title: 'Fraction ↔ Decimal', icon: '🔄',
                content: `<h2>Fraction to Decimal Conversion</h2><p>A fraction IS a division. Simply divide the numerator by the denominator.</p><div class="example"><strong>Example:</strong> 3/4 → 3 ÷ 4 = <strong>0.75 ✓</strong></div><div class="example"><strong>Example:</strong> 1/8 → 1 ÷ 8 = <strong>0.125 ✓</strong></div><div class="example"><strong>Example:</strong> 5/2 → 5 ÷ 2 = <strong>2.5 ✓</strong></div>`
            },
            {
                id: 's2l3', title: 'Fraction ↔ Percentage', icon: '%',
                content: `<h2>Fraction to Percentage</h2><p>Convert to decimal first, then multiply by 100.</p><div class="example"><strong>Example:</strong> 3/4 → 0.75 × 100 = <strong>75% ✓</strong></div><div class="example"><strong>Example:</strong> 7/8 → 0.875 × 100 = <strong>87.5% ✓</strong></div>`
            },
            {
                id: 's2l4', title: 'Fraction Add & Subtract', icon: '➕',
                content: `<h2>Fraction Addition & Subtraction</h2><p>Find a common denominator before adding or subtracting.</p><div class="example"><strong>Example:</strong> 1/3 + 1/6 → LCD=6 → 2/6 + 1/6 = <strong>3/6 = 1/2 ✓</strong></div><div class="example"><strong>Example:</strong> 5/6 − 1/4 → LCD=12 → 10/12 − 3/12 = <strong>7/12 ✓</strong></div>`
            },
            {
                id: 's2l5', title: 'Fraction Multiplication', icon: '✖️',
                content: `<h2>Fraction Multiplication</h2><p>Multiply straight across: top × top, bottom × bottom. Then simplify.</p><div class="example"><strong>Example:</strong> 2/3 × 3/4 = 6/12 = <strong>1/2 ✓</strong></div><div class="example"><strong>Example:</strong> 5/8 × 2/3 = 10/24 = <strong>5/12 ✓</strong></div>`
            },
            {
                id: 's2l6', title: 'Fraction Division', icon: '➗',
                content: `<h2>Fraction Division — KCF (Keep, Change, Flip)</h2><p>Keep the first fraction, Change ÷ to ×, Flip the second fraction.</p><div class="example"><strong>Example:</strong> 3/4 ÷ 1/2 → 3/4 × 2/1 = 6/4 = <strong>3/2 ✓</strong></div><div class="example"><strong>Example:</strong> 5/6 ÷ 2/3 → 5/6 × 3/2 = 15/12 = <strong>5/4 ✓</strong></div>`
            },
            {
                id: 's2l7', title: 'Mixed Numbers', icon: '🔢',
                content: `<h2>Mixed Numbers → Improper Fractions</h2><p>Multiply the whole number by the denominator, then add the numerator.</p><div class="example"><strong>Example:</strong> 2⅓ → 2×3=6, 6+1=7 → <strong>7/3 ✓</strong></div><div class="example"><strong>Example:</strong> 3⅖ → 3×5=15, 15+2=17 → <strong>17/5 ✓</strong></div>`
            }
        ]
    },
    {
        id: 's3', title: 'Decimals', icon: '.',
        skipFor: ['advanced'],
        lessons: [
            { id: 's3l1', title: 'Decimal Add & Subtract', icon: '➕', content: `<h2>Decimal Addition & Subtraction</h2><p>Always align the decimal points first before adding or subtracting.</p><div class="example"><strong>Example:</strong> 7.25 − 3.1 → 7.25 − 3.10 = <strong>4.15 ✓</strong></div><div class="example"><strong>Example:</strong> 12.6 + 3.47 = <strong>16.07 ✓</strong></div>` },
            { id: 's3l2', title: 'Decimal Multiplication', icon: '✖️', content: `<h2>Decimal Multiplication</h2><p>Ignore decimals, multiply normally, then count total decimal places and insert decimal.</p><div class="example"><strong>Example:</strong> 0.4 × 0.3 → 4×3=12, 2 decimal places → <strong>0.12 ✓</strong></div><div class="example"><strong>Example:</strong> 3.2 × 1.4 → 32×14=448, 2 places → <strong>4.48 ✓</strong></div>` },
            { id: 's3l3', title: 'Decimal Division', icon: '➗', content: `<h2>Decimal Division</h2><p>Remove decimals by multiplying both numbers by 10 (or 100). Then divide normally.</p><div class="example"><strong>Example:</strong> 4.8 ÷ 0.6 → ×10 → 48 ÷ 6 = <strong>8 ✓</strong></div><div class="example"><strong>Example:</strong> 6.3 ÷ 0.9 → ×10 → 63 ÷ 9 = <strong>7 ✓</strong></div>` },
            { id: 's3l4', title: 'Decimal ↔ Percentage', icon: '%', content: `<h2>Decimal ↔ Percentage Conversion</h2><p>To convert decimal to %: move decimal 2 places RIGHT (×100).<br>To convert % to decimal: move decimal 2 places LEFT (÷100).</p><div class="example"><strong>Example:</strong> 0.75 → <strong>75% ✓</strong></div><div class="example"><strong>Example:</strong> 125% → <strong>1.25 ✓</strong></div>` }
        ]
    },
    {
        id: 's4', title: 'Percentages', icon: '%',
        skipFor: [],
        lessons: [
            { id: 's4l1', title: 'Percentage of a Number', icon: '%', content: `<h2>Percentage of a Number</h2><p>Use 10% as your building block. 10% = divide by 10. Build other percentages from there.</p><div class="example"><strong>Example:</strong> 25% of 80 → 10%=8, 20%=16, 5%=4 → 16+4 = <strong>20 ✓</strong></div><div class="example"><strong>Example:</strong> 12% of 50 → 10%=5, 2%=1 → <strong>6 ✓</strong></div>` },
            { id: 's4l2', title: 'Percentage Increase', icon: '📈', content: `<h2>Percentage Increase</h2><p>New value = Original + (Percentage × Original)</p><div class="example"><strong>Example:</strong> Increase 200 by 10% → +20 = <strong>220 ✓</strong></div><div class="example"><strong>Example:</strong> Increase 150 by 12% → 10%=15, 2%=3 → +18 → <strong>168 ✓</strong></div>` },
            { id: 's4l3', title: 'Percentage Decrease', icon: '📉', content: `<h2>Percentage Decrease</h2><p>New value = Original − (Percentage × Original)</p><div class="example"><strong>Example:</strong> Decrease 300 by 20% → 20%=60 → 300−60 = <strong>240 ✓</strong></div><div class="example"><strong>Example:</strong> Decrease 250 by 15% → 37.5 → <strong>212.5 ✓</strong></div>` },
            { id: 's4l4', title: 'Reverse Percentages', icon: '🔄', content: `<h2>Reverse Percentages</h2><p>When you know the FINAL value after a % change, divide by the multiplier to find the original.</p><div class="steps"><div class="step">Identify the multiplier (10% increase = 1.10, 20% decrease = 0.80)</div><div class="step">Divide the final value by the multiplier</div></div><div class="example"><strong>Example:</strong> After 10% increase, price = £110 → 110 ÷ 1.10 = <strong>100 ✓</strong></div><div class="example"><strong>Example:</strong> After 20% decrease, price = £80 → 80 ÷ 0.80 = <strong>100 ✓</strong></div>` }
        ]
    },
    {
        id: 's5', title: 'Powers & Roots', icon: '²',
        skipFor: [],
        lessons: [
            { id: 's5l1', title: 'Squares', icon: '²', content: `<h2>Squaring Any 2-Digit Number</h2><p>Use the formula: (a+b)² = a² + 2ab + b², where a = tens, b = ones</p><div class="steps"><div class="step">Square the tens digit (a²)</div><div class="step">Square the ones digit (b²)</div><div class="step">Calculate 2×a×b (the cross term)</div><div class="step">Combine: a² | 2ab | b² (watch carries!)</div></div><div class="example"><strong>Example:</strong> 31² → a=3,b=1 → 9 | 6 | 1 = <strong>961 ✓</strong></div><div class="example"><strong>Example:</strong> 42² → 16 | 16 | 4 → carry → <strong>1764 ✓</strong></div><div class="example"><strong>Example:</strong> 87² → 64 | 112 | 49 → carry carefully = <strong>7569 ✓</strong></div>` },
            { id: 's5l2', title: 'Square Roots (Perfect)', icon: '√', content: `<h2>Square Roots of Perfect Squares</h2><p>Use last-digit pattern recognition and number splitting.</p><div class="steps"><div class="step">Look at the last digit to identify possible answer endings</div><div class="step">Remove the last two digits</div><div class="step">Find the largest integer whose square ≤ remaining digits</div><div class="step">Test both possible last-digit options</div></div><div class="example"><strong>Example:</strong> √625 → last digit 5 → answer ends in 5 → left with 6 → 2²=4 ≤ 6 → <strong>25 ✓</strong></div><div class="example"><strong>Example:</strong> √841 → last digit 1 → ends in 1 or 9 → left 8 → 2²=4 ≤ 8 → 2×3=6 &lt; 8 → choose 9 → <strong>29 ✓</strong></div>` },
            { id: 's5l3', title: 'Square Roots (Non-Perfect)', icon: '≈√', content: `<h2>Approximating Non-Perfect Square Roots</h2><p>Formula: √N ≈ a + (N − a²) / (2a), where a = nearest smaller perfect square root</p><div class="example"><strong>Example:</strong> √87 → a=9 (81) → (87−81)/(2×9) = 6/18 ≈ 0.33 → <strong>≈ 9.33 ✓</strong></div><div class="example"><strong>Example:</strong> √39 → a=6 (36) → (39−36)/12 = 3/12 = 0.25 → <strong>≈ 6.25 ✓</strong></div>` }
        ]
    },
    {
        id: 's6', title: 'Advanced Skills', icon: '🧠',
        skipFor: [],
        lessons: [
            { id: 's6l1', title: 'Mental Estimation', icon: '≈', content: `<h2>Mental Estimation for Formulas</h2><p>Round inputs to friendly numbers BEFORE applying the formula.</p><div class="example"><strong>Example:</strong> Area of circle, r=4.8 → round to 5 → π×25 ≈ 3×25 = <strong>≈75 ✓</strong></div><div class="example"><strong>Example:</strong> Speed = 198÷4 → round to 200÷4 = <strong>≈50 km/h ✓</strong></div>` },
            { id: 's6l2', title: 'Rearranging Formulas', icon: '🔄', content: `<h2>Quick Formula Rearranging</h2><p>Isolate the unknown by applying inverse operations in reverse order.</p><div class="example"><strong>Example:</strong> F=ma, find m when F=20, a=4 → m = F÷a = 20÷4 = <strong>5 ✓</strong></div><div class="example"><strong>Example:</strong> v=d/t, find d when v=30, t=3 → d = v×t = <strong>90 ✓</strong></div>` },
            { id: 's6l3', title: 'Mental Approximation', icon: '~', content: `<h2>Mental Approximation Techniques</h2><p>Keep only the first 1–2 significant digits and round the rest.</p><div class="example"><strong>Example:</strong> 198×49 → 200×50 = <strong>≈10,000 ✓</strong></div><div class="example"><strong>Example:</strong> 503÷9 → 500÷10 = <strong>≈50 (actual: 55.9) ✓</strong></div>` },
            { id: 's6l4', title: 'Comparing Magnitudes', icon: '⚖️', content: `<h2>Comparing Magnitudes Quickly</h2><p>Compare the highest place values first. Only go deeper if they're equal.</p><div class="example"><strong>Example:</strong> 3.9² vs 4² → 3.9 &lt; 4, so 3.9² &lt; 16 → <strong>4² is larger ✓</strong></div><div class="example"><strong>Example:</strong> 0.99×100 vs 1.01×98 → 99 vs 98.98 → <strong>0.99×100 is larger ✓</strong></div>` }
        ]
    },
    {
        id: 's7', title: 'Real World Applications', icon: '🌍',
        skipFor: [],
        lessons: [
            { id: 's7l1', title: 'Currency Conversion', icon: '💱', content: `<h2>Currency Conversion</h2><p>Multiply the amount by the exchange rate. Use % techniques for speed.</p><div class="example"><strong>Example:</strong> $50 at rate 1.2 → 50×1.2 = <strong>60 ✓</strong></div><div class="example"><strong>Example:</strong> $120 at rate 1.15 → 10%=12, 5%=6 → 120+18 = <strong>138 ✓</strong></div>` },
            { id: 's7l2', title: 'Discounts', icon: '🏷️', content: `<h2>Discount Calculations</h2><p>Final Price = Original − Discount. Use 10% chunks for speed.</p><div class="example"><strong>Example:</strong> $200, 20% off → 20%=40 → <strong>$160 ✓</strong></div><div class="example"><strong>Example:</strong> $150, 15% off → 10%=15, 5%=7.5 → −22.5 → <strong>$127.50 ✓</strong></div>` },
            { id: 's7l3', title: 'Tax Calculations', icon: '🧾', content: `<h2>Tax Calculations</h2><p>Final Price = Original + Tax. Break percentage into 10% chunks.</p><div class="example"><strong>Example:</strong> $250, 12% tax → 10%=25, 2%=5 → +30 → <strong>$280 ✓</strong></div><div class="example"><strong>Example:</strong> $75, 5% tax → 10%=7.5, half=3.75 → <strong>$78.75 ✓</strong></div>` },
            { id: 's7l4', title: 'Simple Interest', icon: '💰', content: `<h2>Simple Interest: I = P × R × T</h2><ul><li><strong>P</strong> = Principal (starting amount)</li><li><strong>R</strong> = Rate (as decimal)</li><li><strong>T</strong> = Time (in years)</li></ul><div class="example"><strong>Example:</strong> $1000, 5%, 1yr → 1000×0.05×1 = <strong>$50 interest ✓</strong></div><div class="example"><strong>Example:</strong> $2000, 4%, 2yr → 2000×0.04×2 = <strong>$160 ✓</strong></div>` }
        ]
    }
];

// ============================================================
// QUESTION GENERATORS
// ============================================================
const QGen = {
    rand: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

    s1l1: () => { // Addition
        const ops = [
            () => { const a = QGen.rand(20, 150), b = QGen.rand(20, 150); return { q: `${a} + ${b}`, a: a + b }; },
            () => { const a = QGen.rand(200, 500), b = QGen.rand(50, 200); return { q: `${a} + ${b}`, a: a + b }; }
        ];
        return ops[QGen.rand(0, ops.length - 1)]();
    },
    s1l2: () => { // Subtraction
        const a = QGen.rand(50, 300), b = QGen.rand(10, a - 1);
        return { q: `${a} − ${b}`, a: a - b };
    },
    s1l3: () => { // Multiplication
        const ops = [
            () => { const a = QGen.rand(11, 30), b = QGen.rand(2, 12); return { q: `${a} × ${b}`, a: a * b }; },
            () => { const a = [11, 12, 15, 25, 50, 100][QGen.rand(0, 5)]; const b = QGen.rand(2, 20); return { q: `${b} × ${a}`, a: a * b }; }
        ];
        return ops[0]();
    },
    s1l4: () => { // Division
        const divisors = [2, 3, 4, 5, 6, 7, 8, 9, 10];
        const d = divisors[QGen.rand(0, divisors.length - 1)];
        const ans = QGen.rand(2, 50);
        return { q: `${d * ans} ÷ ${d}`, a: ans };
    },
    s2l1: () => { // Fraction simplification
        const pairs = [[12, 18], [24, 36], [45, 60], [8, 12], [15, 25], [6, 9], [10, 15], [20, 30], [16, 24]];
        const [n, d] = pairs[QGen.rand(0, pairs.length - 1)];
        const gcd = (a, b) => b ? gcd(b, a % b) : a;
        const g = gcd(n, d);
        return { q: `Simplify ${n}/${d}`, a: `${n / g}/${d / g}`, isText: true };
    },
    s2l2: () => { // Fraction to decimal
        const fracs = [[1, 2], [3, 4], [1, 4], [1, 8], [3, 8], [5, 8], [7, 8], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10]];
        const [n, d] = fracs[QGen.rand(0, fracs.length - 1)];
        return { q: `${n}/${d} as a decimal`, a: +(n / d).toFixed(3) };
    },
    s2l3: () => { // Fraction to %
        const fracs = [[1, 2], [3, 4], [1, 4], [1, 5], [2, 5], [3, 5], [1, 10], [3, 10], [7, 10]];
        const [n, d] = fracs[QGen.rand(0, fracs.length - 1)];
        return { q: `${n}/${d} as a percentage`, a: +(n / d * 100).toFixed(1) };
    },
    s2l4: () => { // Fraction add/sub
        const denoms = [2, 3, 4, 5, 6, 8, 10];
        const d = denoms[QGen.rand(0, denoms.length - 1)];
        const n1 = QGen.rand(1, d - 1), n2 = QGen.rand(1, d - 1);
        const isAdd = Math.random() > 0.5;
        const gcd = (a, b) => b ? gcd(b, a % b) : a;
        const rn = isAdd ? n1 + n2 : Math.abs(n1 - n2), rd = d;
        const g = gcd(rn, rd);
        return { q: `${n1}/${d} ${isAdd ? '+' : '-'} ${n2}/${d}`, a: `${rn / g}/${rd / g}`, isText: true };
    },
    s2l5: () => { // Fraction multiply
        const fracs = [[1, 2], [2, 3], [3, 4], [1, 3], [1, 4], [2, 5], [3, 5]];
        const [n1, d1] = fracs[QGen.rand(0, fracs.length - 1)];
        const [n2, d2] = fracs[QGen.rand(0, fracs.length - 1)];
        const gcd = (a, b) => b ? gcd(b, a % b) : a;
        const rn = n1 * n2, rd = d1 * d2, g = gcd(rn, rd);
        return { q: `${n1}/${d1} × ${n2}/${d2}`, a: `${rn / g}/${rd / g}`, isText: true };
    },
    s2l6: () => { // Fraction divide
        const fracs = [[3, 4], [2, 3], [5, 6], [1, 2], [3, 5]];
        const [n1, d1] = fracs[QGen.rand(0, fracs.length - 1)];
        const [n2, d2] = fracs[QGen.rand(0, fracs.length - 1)];
        const gcd = (a, b) => b ? gcd(b, a % b) : a;
        const rn = n1 * d2, rd = d1 * n2, g = gcd(rn, rd);
        return { q: `${n1}/${d1} ÷ ${n2}/${d2}`, a: `${rn / g}/${rd / g}`, isText: true };
    },
    s2l7: () => { // Mixed numbers
        const w = QGen.rand(1, 5), d = QGen.rand(2, 6), n = QGen.rand(1, d - 1);
        return { q: `Convert ${w} ${n}/${d} to improper fraction`, a: `${w * d + n}/${d}`, isText: true };
    },
    s3l1: () => { const a = +(QGen.rand(10, 200) / 10).toFixed(1), b = +(QGen.rand(10, 200) / 10).toFixed(1); const isAdd = Math.random() > 0.5; return { q: `${Math.max(a, b)} ${isAdd ? '+' : '-'} ${Math.min(a, b)}`, a: +(isAdd ? a + b : Math.abs(a - b)).toFixed(2) }; },
    s3l2: () => { const a = QGen.rand(1, 9) / 10, b = QGen.rand(1, 9) / 10; return { q: `${a} × ${b}`, a: +(a * b).toFixed(3) }; },
    s3l3: () => { const d = QGen.rand(1, 9) / 10; const ans = QGen.rand(1, 20); return { q: `${+(d * ans).toFixed(2)} ÷ ${d}`, a: ans }; },
    s3l4: () => { const d = QGen.rand(5, 95) / 100; return Math.random() > 0.5 ? { q: `${d} as a percentage`, a: +(d * 100).toFixed(1) } : { q: `${Math.round(d * 100)}% as a decimal`, a: d }; },
    s4l1: () => { const percs = [5, 10, 15, 20, 25, 30, 40, 50]; const p = percs[QGen.rand(0, percs.length - 1)]; const bases = [20, 40, 50, 60, 80, 100, 120, 150, 200, 250]; const b = bases[QGen.rand(0, bases.length - 1)]; return { q: `${p}% of ${b}`, a: p * b / 100 }; },
    s4l2: () => { const percs = [5, 10, 15, 20, 25]; const p = percs[QGen.rand(0, percs.length - 1)]; const b = QGen.rand(2, 20) * 10; return { q: `Increase ${b} by ${p}%`, a: b + p * b / 100 }; },
    s4l3: () => { const percs = [5, 10, 15, 20, 25]; const p = percs[QGen.rand(0, percs.length - 1)]; const b = QGen.rand(2, 20) * 10; return { q: `Decrease ${b} by ${p}%`, a: b - p * b / 100 }; },
    s4l4: () => { const percs = [10, 15, 20, 25]; const p = percs[QGen.rand(0, percs.length - 1)]; const orig = QGen.rand(5, 20) * 10; const isInc = Math.random() > 0.5; const final = isInc ? orig * (1 + p / 100) : orig * (1 - p / 100); return { q: `A price after a ${p}% ${isInc ? 'increase' : 'decrease'} is ${final}. What was the original?`, a: orig }; },
    s5l1: () => { const n = QGen.rand(11, 29); return { q: `${n}²`, a: n * n }; },
    s5l2: () => { const roots = [16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225, 289, 324, 400, 441, 484, 529, 625]; const r = roots[QGen.rand(0, roots.length - 1)]; return { q: `√${r}`, a: Math.round(Math.sqrt(r)) }; },
    s5l3: () => { const n = QGen.rand(2, 99); const a = Math.floor(Math.sqrt(n)); return { q: `√${n} (approximate to 2 decimal places)`, a: +Math.sqrt(n).toFixed(2) }; },
    s6l1: () => { const v = QGen.rand(50, 500); const t = QGen.rand(2, 8); return { q: `Estimate: ${v} ÷ ${t} (round to nearest 10)`, a: Math.round(v / t / 10) * 10 }; },
    s6l2: () => { const a = QGen.rand(2, 10), v = QGen.rand(10, 50); return { q: `F = ma. Find m when F=${a * v}, a=${a}`, a: v }; },
    s6l3: () => { const a = QGen.rand(10, 50) * 10, b = QGen.rand(10, 50) * 10; return { q: `Estimate: ${a + QGen.rand(1, 9)} × ${b + QGen.rand(1, 9)}`, a: a * b }; },
    s6l4: () => { const a = QGen.rand(3, 9), b = QGen.rand(3, 9); return { q: `Which is larger: ${a}² or ${b + 1}²`, a: `${Math.max(a * a, (b + 1) * (b + 1))}`, isText: true }; },
    s7l1: () => { const rates = [1.1, 1.2, 1.3, 0.8, 0.9, 1.15]; const r = rates[QGen.rand(0, rates.length - 1)]; const a = QGen.rand(2, 20) * 10; return { q: `Convert $${a} at rate ${r}`, a: +(a * r).toFixed(2) }; },
    s7l2: () => { const d = [10, 15, 20, 25, 30]; const disc = d[QGen.rand(0, d.length - 1)]; const p = QGen.rand(2, 20) * 10; return { q: `$${p} with ${disc}% discount`, a: p - p * disc / 100 }; },
    s7l3: () => { const rates = [5, 8, 10, 12, 15]; const r = rates[QGen.rand(0, rates.length - 1)]; const p = QGen.rand(2, 20) * 10; return { q: `$${p} with ${r}% tax`, a: +(p + p * r / 100).toFixed(2) }; },
    s7l4: () => { const p = QGen.rand(5, 20) * 100; const r = QGen.rand(3, 8); const t = QGen.rand(1, 5); return { q: `Simple interest: P=$${p}, R=${r}%, T=${t} years`, a: p * r / 100 * t }; },

    // Diagnostic questions
    diagnostic: (index) => {
        const level = index / 15;
        if (level < 0.2) return QGen.s1l1();
        if (level < 0.35) return QGen.s1l2();
        if (level < 0.5) return QGen.s1l3();
        if (level < 0.6) return QGen.s2l1();
        if (level < 0.7) return QGen.s4l1();
        if (level < 0.8) return QGen.s5l1();
        if (level < 0.9) return QGen.s5l2();
        return QGen.s7l2();
    },

    // Get generator for a section/lesson
    getGen(sectionId, lessonId) {
        const key = lessonId;
        return QGen[key] || QGen.s1l1;
    },

    // Classic/endless/survival - mixed (legacy fallback)
    mixed(difficulty = 'medium') {
        const gens = [QGen.s1l1, QGen.s1l2, QGen.s1l3, QGen.s1l4, QGen.s4l1, QGen.s5l1, QGen.s5l2];
        const gen = gens[QGen.rand(0, gens.length - 1)];
        return gen();
    },

    // ---- CONFIGURABLE GENERATOR FOR TRAIN MODES ----
    // config = { digits: [1,2,3,4], ops: ['+','-','×','÷'], concepts: ['s1','s2',...] }
    _digitRange(digits) {
        // returns [min, max] for a given digit-count array
        const ranges = { 1: [1, 9], 2: [10, 99], 3: [100, 999], 4: [1000, 9999] };
        let min = 9999, max = 1;
        (digits || [2]).forEach(d => {
            const r = ranges[d] || ranges[2];
            if (r[0] < min) min = r[0];
            if (r[1] > max) max = r[1];
        });
        return [min, max];
    },

    configuredQ(config) {
        const ops = config.ops || ['+', '-', '×', '÷'];
        const concepts = config.concepts || ['s1', 's2', 's3', 's4', 's5', 's6', 's7'];
        const digits = config.digits || [2];

        // Build a pool of eligible generators
        const pool = [];

        // Map concepts → generators
        const conceptMap = {
            s1: { // Fundamental Operations (filter by ops)
                '+': 'add', '-': 'sub', '×': 'mul', '÷': 'div'
            },
            s2: ['s2l1', 's2l2', 's2l3', 's2l4', 's2l5', 's2l6', 's2l7'],
            s3: ['s3l1', 's3l2', 's3l3', 's3l4'],
            s4: ['s4l1', 's4l2', 's4l3', 's4l4'],
            s5: ['s5l1', 's5l2', 's5l3'],
            s6: ['s6l1', 's6l2', 's6l3', 's6l4'],
            s7: ['s7l1', 's7l2', 's7l3', 's7l4']
        };

        concepts.forEach(cid => {
            if (cid === 's1') {
                // For fundamentals, respect the ops filter
                ops.forEach(op => {
                    pool.push({ type: 'arithmetic', op, digits });
                });
            } else {
                const lessons = conceptMap[cid];
                if (lessons) {
                    lessons.forEach(lid => {
                        if (QGen[lid]) pool.push({ type: 'lesson', gen: lid });
                    });
                }
            }
        });

        // If pool is empty, fall back to basic addition
        if (pool.length === 0) {
            pool.push({ type: 'arithmetic', op: '+', digits: [2] });
        }

        // Pick from pool
        const pick = pool[QGen.rand(0, pool.length - 1)];

        if (pick.type === 'arithmetic') {
            return QGen._genArithmetic(pick.op, pick.digits);
        } else {
            return QGen[pick.gen]();
        }
    },

    _genArithmetic(op, digits) {
        const [min, max] = QGen._digitRange(digits);
        switch (op) {
            case '+': {
                const a = QGen.rand(min, max), b = QGen.rand(min, max);
                return { q: `${a} + ${b}`, a: a + b };
            }
            case '-': {
                let a = QGen.rand(min, max), b = QGen.rand(min, max);
                if (b > a) [a, b] = [b, a];
                return { q: `${a} − ${b}`, a: a - b };
            }
            case '×': {
                // For multiplication, keep one number smaller to be reasonable
                const bigMax = Math.min(max, 999);
                const smallMax = Math.min(max, 12);
                const a = QGen.rand(Math.max(min, 2), bigMax);
                const b = QGen.rand(2, Math.max(smallMax, 9));
                return { q: `${a} × ${b}`, a: a * b };
            }
            case '÷': {
                const divisors = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
                const d = divisors[QGen.rand(0, divisors.length - 1)];
                const ans = QGen.rand(Math.max(Math.floor(min / d), 2), Math.floor(max / d) || 20);
                return { q: `${d * ans} ÷ ${d}`, a: ans };
            }
            default: {
                const a = QGen.rand(min, max), b = QGen.rand(min, max);
                return { q: `${a} + ${b}`, a: a + b };
            }
        }
    }
};
