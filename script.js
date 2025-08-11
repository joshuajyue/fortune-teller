// Chinese Fortune Teller - Multiple Stochastic Processes
class FortuneOracle {
    constructor() {
        this.canvas = document.getElementById('brownian-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.startButton = document.getElementById('start-button');
        this.resetButton = document.getElementById('reset-button');
        this.positionValue = document.getElementById('position-value');
        this.stepCount = document.getElementById('step-count');
        this.fortuneContainer = document.getElementById('fortune-container');
        this.fortuneTitle = document.getElementById('fortune-title');
        this.fortuneText = document.getElementById('fortune-text');
        this.fortuneExplanation = document.getElementById('fortune-explanation');
        
        // Process selection
        this.processButtons = document.querySelectorAll('.process-btn');
        this.currentProcess = 'brownian';
        
        // Simulation parameters
        this.position = { x: 5.0, y: 5.0 }; // Support 2D positions
        this.steps = 0;
        this.isRunning = false;
        this.baseStepSize = 0.3;
        this.stepSize = 0.3;
        this.animationSpeed = 50;
        this.scrollOffset = 0;
        this.path = [];
        
        // Process-specific parameters
        this.poissonEvents = 0;
        this.poissonTargetTime = 10; // Target: 10 events with λ≈0.967 gives exactly 50/50 odds
        this.graphNodes = [];
        this.currentNode = 0;
        
        // Canvas settings
        this.setupCanvas();
        this.path = []; // Start with empty path to avoid middle-to-left artifact
        
        // Fortune collections
        this.goodFortunes = [
            {
                text: "A golden dragon brings prosperity to your path. Success flows like a mighty river.",
                explanation: "The cosmic forces align in your favor. New opportunities await those who dare to seize them."
            },
            {
                text: "Like bamboo, you will bend but never break. Resilience is your greatest strength.",
                explanation: "Your flexible nature allows you to weather any storm and emerge stronger than before."
            },
            {
                text: "The phoenix rises from ashes. Transformation brings magnificent success.",
                explanation: "What seems like an ending is actually a glorious new beginning. Embrace the change."
            },
            {
                text: "Jade stones reveal hidden treasures. Your patience will be richly rewarded.",
                explanation: "Good fortune comes to those who wait wisely. Your investments will bear golden fruit."
            },
            {
                text: "The lotus blooms in muddy waters. Beauty emerges from unexpected places.",
                explanation: "Your current challenges are preparing you for extraordinary achievements."
            },
            {
                text: "Twin fish swim in harmony. Partnership and collaboration bring abundance.",
                explanation: "Working with others amplifies your natural talents. Seek meaningful connections."
            },
            {
                text: "The crane dances on one leg. Balance brings perfect harmony to your life.",
                explanation: "Your centered approach to life's challenges will lead to lasting happiness."
            },
            {
                text: "Golden coins fall like autumn leaves. Wealth flows naturally into your hands.",
                explanation: "Your generous spirit returns to you tenfold. Prosperity is your natural state."
            },
            {
                text: "The wise turtle knows the secret paths. Ancient wisdom guides your journey.",
                explanation: "Trust your intuition. The answers you seek are already within your heart."
            },
            {
                text: "Cherry blossoms herald spring's arrival. New love and joy enter your world.",
                explanation: "A season of happiness begins now. Open your heart to receive abundant blessings."
            }
        ];
        
        this.challengingFortunes = [
            {
                text: "Storm clouds gather, but remember - rain nourishes growth and brings renewal.",
                explanation: "This difficult period is temporary. The universe is preparing something beautiful for you."
            },
            {
                text: "The wise turtle knows when to retreat into its shell. Sometimes patience is courage.",
                explanation: "Take time to reflect and recharge. This quiet period will restore your strength."
            },
            {
                text: "Every winter is followed by spring's gentle awakening. Hold faith in cycles.",
                explanation: "Nature teaches us that all seasons pass. Your spring is closer than you think."
            },
            {
                text: "The mountain appears unmovable, yet rivers carve valleys with gentle persistence.",
                explanation: "Your consistent efforts will overcome any obstacle. Keep flowing forward."
            },
            {
                text: "Clouds may hide the sun, but they cannot extinguish its eternal light.",
                explanation: "Your inner strength remains undiminished. This shadow will pass, revealing your brilliance."
            },
            {
                text: "The oak tree bends in fierce winds but its roots grow deeper.",
                explanation: "These challenges are strengthening your foundation for future success."
            },
            {
                text: "Night is darkest before dawn breaks with golden promises.",
                explanation: "You are closer to breakthrough than you realize. Maintain hope in the darkness."
            },
            {
                text: "The river meets rocks but always finds its way to the sea.",
                explanation: "Your path may seem blocked, but new routes to success will reveal themselves."
            },
            {
                text: "Butterflies must struggle to leave their cocoon and gain strength to fly.",
                explanation: "This struggle is preparing you for a beautiful transformation. Keep pushing forward."
            },
            {
                text: "Seeds sleep quietly in winter soil, gathering strength for spring's explosion.",
                explanation: "Use this quiet time to plant seeds for your future. Growth is happening beneath the surface."
            }
        ];
        
        this.initializeEventListeners();
        this.initializeProcess();
        this.drawInitialState();
    }
    
    initializeProcess() {
        // Set up the fortune board based on current process
        this.updateFortuneBoard();
        
        // Initialize position and path based on process
        switch(this.currentProcess) {
            case 'brownian':
                this.position = { x: 5.0, y: 5.0 };
                break;
            case '2d-walk':
                this.position = { x: 5.0, y: 5.0 }; // Center of 10x10 grid
                break;
            case 'poisson':
                this.position = { x: 0, y: 0 };
                this.poissonEvents = 0;
                this.startTime = null;
                break;
            case 'graph-walk':
                this.initializeGraph();
                this.currentNode = Math.floor(this.graphNodes.length / 2); // Find center node
                break;
        }
        this.path = [];
        this.scrollOffset = 0;
    }
    
    initializeGraph() {
        // Create symmetric graph: Red node - Big cycle (20 nodes) - Connector - Start - Connector - Big cycle (20 nodes) - Green node
        this.graphNodes = [];
        this.graphEdges = [];
        
        // Use actual canvas dimensions for proper centering
        const canvasWidth = this.canvasWidth || 600;
        const canvasHeight = this.canvasHeight || 300;
        const cycleRadius = Math.max(60, Math.min(canvasWidth, canvasHeight) * 0.2); // Larger minimum radius
        const k = 20; // cycle size
        
        let nodeId = 0;
        const margin = canvasWidth * 0.08; // Dynamic margin based on canvas width
        
        // Left terminal node (bad fortune - red)
        this.graphNodes.push({
            id: nodeId++,
            name: 'Misfortune',
            x: margin,
            y: canvasHeight / 2,
            type: 'bad'
        });
        
        // Left cycle nodes
        const leftCycleStart = nodeId;
        const leftCycleCenter = { x: margin + cycleRadius + 30, y: canvasHeight / 2 };
        for (let i = 0; i < k; i++) {
            const angle = (i / k) * 2 * Math.PI;
            const x = leftCycleCenter.x + cycleRadius * Math.cos(angle);
            const y = leftCycleCenter.y + cycleRadius * Math.sin(angle);
            
            this.graphNodes.push({
                id: nodeId++,
                name: `Left Path ${i + 1}`,
                x: x,
                y: y,
                type: 'neutral'
            });
        }
        
        // Left connector node
        const leftConnectorId = nodeId++;
        this.graphNodes.push({
            id: leftConnectorId,
            name: 'Left Bridge',
            x: canvasWidth / 2 - 60,
            y: canvasHeight / 2,
            type: 'connector'
        });
        
        // Center start node
        const centerNodeId = nodeId++;
        this.graphNodes.push({
            id: centerNodeId,
            name: 'Crossroads',
            x: canvasWidth / 2,
            y: canvasHeight / 2,
            type: 'start'
        });
        
        // Right connector node
        const rightConnectorId = nodeId++;
        this.graphNodes.push({
            id: rightConnectorId,
            name: 'Right Bridge',
            x: canvasWidth / 2 + 60,
            y: canvasHeight / 2,
            type: 'connector'
        });
        
        // Right cycle nodes
        const rightCycleStart = nodeId;
        const rightCycleCenter = { x: canvasWidth - margin - cycleRadius - 30, y: canvasHeight / 2 };
        for (let i = 0; i < k; i++) {
            const angle = (i / k) * 2 * Math.PI;
            const x = rightCycleCenter.x + cycleRadius * Math.cos(angle);
            const y = rightCycleCenter.y + cycleRadius * Math.sin(angle);
            
            this.graphNodes.push({
                id: nodeId++,
                name: `Right Path ${i + 1}`,
                x: x,
                y: y,
                type: 'neutral'
            });
        }
        
        // Right terminal node (good fortune - green)
        this.graphNodes.push({
            id: nodeId++,
            name: 'Great Fortune',
            x: canvasWidth - margin,
            y: canvasHeight / 2,
            type: 'good'
        });
        
        // Create edges
        // Connect left terminal to left cycle (connect to the leftmost point of the cycle)
        // For k=20: leftmost point is at index 10 (k/2), which corresponds to π radians = leftmost
        const leftCycleConnectionPoint = leftCycleStart + 10; // Explicitly use index 10 for leftmost point
        this.graphEdges.push([0, leftCycleConnectionPoint]);
        
        // Connect left cycle nodes in a cycle
        for (let i = 0; i < k; i++) {
            const current = leftCycleStart + i;
            const next = leftCycleStart + ((i + 1) % k);
            this.graphEdges.push([current, next]);
        }
        
        // Connect left cycle to left connector (connect from the rightmost point of the cycle)
        const leftCycleExitPoint = leftCycleStart; // Rightmost side of circle (0 degrees = rightmost)
        this.graphEdges.push([leftCycleExitPoint, leftConnectorId]);
        
        // Connect left connector to center
        this.graphEdges.push([leftConnectorId, centerNodeId]);
        
        // Connect center to right connector
        this.graphEdges.push([centerNodeId, rightConnectorId]);
        
        // Connect right connector to right cycle (connect to the leftmost point of the cycle)
        const rightCycleEntryPoint = rightCycleStart + Math.floor(k/2); // Leftmost side of circle (π radians = leftmost)
        this.graphEdges.push([rightConnectorId, rightCycleEntryPoint]);
        
        // Connect right cycle nodes in a cycle
        for (let i = 0; i < k; i++) {
            const current = rightCycleStart + i;
            const next = rightCycleStart + ((i + 1) % k);
            this.graphEdges.push([current, next]);
        }
        
        // Connect right cycle to right terminal (connect from the rightmost point of the cycle)
        const rightCycleExitPoint = rightCycleStart; // Rightmost side of circle (0 degrees = rightmost)
        this.graphEdges.push([rightCycleExitPoint, nodeId - 1]);
        
        // Set starting position to center node
        this.currentNode = centerNodeId;
    }
    
    updateFortuneBoard() {
        const fortuneBoard = document.querySelector('.fortune-board');
        
        switch(this.currentProcess) {
            case 'brownian':
                fortuneBoard.innerHTML = `
                    <div class="boundary lucky-boundary">
                        <span class="boundary-label">吉 Good Fortune</span>
                        <div class="boundary-value">10</div>
                    </div>
                    <div class="motion-area">
                        <canvas id="brownian-canvas"></canvas>
                        <div class="starting-line">
                            <span class="start-label">起点 Starting Point: 5</span>
                        </div>
                    </div>
                    <div class="boundary unlucky-boundary">
                        <span class="boundary-label">凶 Challenging Times</span>
                        <div class="boundary-value">0</div>
                    </div>
                `;
                break;
                
            case '2d-walk':
                fortuneBoard.innerHTML = `
                    <div class="motion-area-2d">
                        <div class="axis-labels">
                            <div class="axis-label top">Fortune & Success</div>
                            <div class="axis-label right">Achievement</div>
                            <div class="axis-label bottom">Hardship</div>
                            <div class="axis-label left">Delay</div>
                        </div>
                        <canvas id="brownian-canvas"></canvas>
                        <div class="center-marker">起点</div>
                    </div>
                `;
                break;
                
            case 'poisson':
                fortuneBoard.innerHTML = `
                    <div class="poisson-display">
                        <div class="time-target">
                            <span class="target-label">Target: ${this.poissonTargetTime} events in 10 seconds</span>
                            <div class="progress-bar">
                                <div class="progress-fill" id="progress-fill"></div>
                            </div>
                        </div>
                        <canvas id="brownian-canvas"></canvas>
                        <div class="event-counter">
                            <span class="events-label">Events: </span>
                            <span id="event-count">0</span>
                        </div>
                    </div>
                `;
                break;
                
            case 'graph-walk':
                fortuneBoard.innerHTML = `
                    <div class="graph-display">
                        <canvas id="brownian-canvas"></canvas>
                        <div class="graph-legend">
                            <span>🔴 Misfortune</span>
                            <span>⚪ Neutral Path</span>
                            <span>🟣 Bridge</span>
                            <span>🟡 Crossroads</span>
                            <span>🟢 Great Fortune</span>
                        </div>
                    </div>
                `;
                break;
        }
        
        // Re-get canvas reference
        this.canvas = document.getElementById('brownian-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
    }
    
    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Set actual canvas dimensions
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        // Scale the context for high DPI displays
        this.ctx.scale(dpr, dpr);
        
        // Set the CSS dimensions
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Store logical dimensions for drawing calculations
        this.canvasWidth = rect.width;
        this.canvasHeight = rect.height;
    }
    
    initializeEventListeners() {
        this.startButton.addEventListener('click', () => this.startSimulation());
        this.resetButton.addEventListener('click', () => this.resetSimulation());
        
        // Math explanation button
        const mathButton = document.getElementById('math-button');
        mathButton.addEventListener('click', () => {
            window.open('math-explanation.html', '_blank');
        });
        
        // Process selection
        this.processButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.isRunning) return; // Don't allow changing during simulation
                
                // Update active state
                this.processButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Change process
                this.currentProcess = btn.dataset.process;
                this.initializeProcess();
                this.drawInitialState();
            });
        });
        
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.drawCurrentState();
        });
    }
    
    drawBackground() {
        // Draw background gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
        gradient.addColorStop(0, 'rgba(220, 38, 38, 0.1)');
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
        gradient.addColorStop(1, 'rgba(251, 191, 36, 0.1)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Draw boundary lines
        this.ctx.strokeStyle = '#dc2626';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        // Top boundary (position 10)
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvasHeight * 0.1);
        this.ctx.lineTo(this.canvasWidth, this.canvasHeight * 0.1);
        this.ctx.stroke();
        
        // Bottom boundary (position 0)
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvasHeight * 0.9);
        this.ctx.lineTo(this.canvasWidth, this.canvasHeight * 0.9);
        this.ctx.stroke();
        
        // Center line (position 5)
        this.ctx.strokeStyle = '#fbbf24';
        this.ctx.setLineDash([2, 2]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvasHeight * 0.5);
        this.ctx.lineTo(this.canvasWidth, this.canvasHeight * 0.5);
        this.ctx.stroke();
    }
    
    drawInitialState() {
        // Draw the appropriate initial state for each process
        switch(this.currentProcess) {
            case 'brownian':
                this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
                this.drawBackground();
                this.drawParticle(this.canvasWidth / 2, this.canvasHeight / 2, false);
                break;
            case '2d-walk':
                this.draw2DWalkState();
                break;
            case 'poisson':
                this.drawPoissonState();
                break;
            case 'graph-walk':
                this.drawGraphWalkState();
                break;
        }
    }
    
    drawCurrentState() {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        switch(this.currentProcess) {
            case 'brownian':
                this.drawBrownianState();
                break;
            case '2d-walk':
                this.draw2DWalkState();
                break;
            case 'poisson':
                this.drawPoissonState();
                break;
            case 'graph-walk':
                this.drawGraphWalkState();
                break;
        }
    }
    
    drawBrownianState() {
        this.drawBackground();
        
        // Calculate scroll offset
        if (this.path.length > 0) {
            const lastPoint = this.path[this.path.length - 1];
            if (lastPoint.x > this.canvasWidth - 50) {
                this.scrollOffset = lastPoint.x - (this.canvasWidth - 50);
            }
        }
        
        // Draw path with scrolling
        if (this.path.length > 1) {
            this.ctx.strokeStyle = '#fbbf24';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([]);
            this.ctx.globalAlpha = 0.7;
            
            this.ctx.beginPath();
            let pathStarted = false;
            
            for (let i = 0; i < this.path.length; i++) {
                const point = this.path[i];
                const x = point.x - this.scrollOffset;
                const y = point.y;
                
                if (x >= -10 && x <= this.canvasWidth + 10) {
                    if (!pathStarted) {
                        this.ctx.moveTo(x, y);
                        pathStarted = true;
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }
            }
            
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        }
        
        // Draw current particle
        if (this.path.length > 0) {
            const lastPoint = this.path[this.path.length - 1];
            const particleX = lastPoint.x - this.scrollOffset;
            if (particleX >= -20 && particleX <= this.canvasWidth + 20) {
                this.drawParticle(particleX, lastPoint.y, this.isRunning);
            }
        }
    }
    
    draw2DWalkState() {
        // Draw 2D grid background
        this.ctx.strokeStyle = 'rgba(251, 191, 36, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([2, 2]);
        
        // Grid lines
        for (let i = 0; i <= 10; i++) {
            const x = (i / 10) * (this.canvasWidth - 40) + 20;
            const y = (i / 10) * (this.canvasHeight - 40) + 20;
            
            // Vertical lines
            this.ctx.beginPath();
            this.ctx.moveTo(x, 20);
            this.ctx.lineTo(x, this.canvasHeight - 20);
            this.ctx.stroke();
            
            // Horizontal lines
            this.ctx.beginPath();
            this.ctx.moveTo(20, y);
            this.ctx.lineTo(this.canvasWidth - 20, y);
            this.ctx.stroke();
        }
        
        // Draw danger zones (left and bottom)
        this.ctx.fillStyle = 'rgba(220, 38, 38, 0.1)';
        this.ctx.fillRect(20, this.canvasHeight - 40, this.canvasWidth - 40, 20); // bottom
        this.ctx.fillRect(20, 20, 20, this.canvasHeight - 40); // left
        
        // Draw success zones (right and top)
        this.ctx.fillStyle = 'rgba(251, 191, 36, 0.1)';
        this.ctx.fillRect(this.canvasWidth - 40, 20, 20, this.canvasHeight - 40); // right
        this.ctx.fillRect(20, 20, this.canvasWidth - 40, 20); // top
        
        // Draw path
        if (this.path.length > 1) {
            this.ctx.strokeStyle = '#fbbf24';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([]);
            this.ctx.globalAlpha = 0.8;
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.path[0].x, this.path[0].y);
            
            for (let i = 1; i < this.path.length; i++) {
                this.ctx.lineTo(this.path[i].x, this.path[i].y);
            }
            
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        }
        
        // Draw current particle
        if (this.path.length > 0) {
            const lastPoint = this.path[this.path.length - 1];
            this.drawParticle(lastPoint.x, lastPoint.y, this.isRunning);
        }
    }
    
    drawPoissonState() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Draw background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Draw time axis
        this.ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(30, this.canvasHeight / 2);
        this.ctx.lineTo(this.canvasWidth - 30, this.canvasHeight / 2);
        this.ctx.stroke();
        
        // Draw time markers
        this.ctx.fillStyle = 'rgba(251, 191, 36, 0.6)';
        this.ctx.font = '12px Inter';
        this.ctx.textAlign = 'center';
        for (let i = 0; i <= 10; i += 2) {
            const x = 30 + (i / 10) * (this.canvasWidth - 60);
            this.ctx.fillText(`${i}s`, x, this.canvasHeight / 2 + 20);
            
            // Tick marks
            this.ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.canvasHeight / 2 - 5);
            this.ctx.lineTo(x, this.canvasHeight / 2 + 5);
            this.ctx.stroke();
        }
        
        // Draw target line
        const targetX = 30 + (this.poissonTargetTime / 10) * (this.canvasWidth - 60);
        this.ctx.strokeStyle = '#dc2626';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(targetX, this.canvasHeight / 2 - 30);
        this.ctx.lineTo(targetX, this.canvasHeight / 2 + 30);
        this.ctx.stroke();
        
        // Draw events
        this.path.forEach(event => {
            if (event.isEvent) {
                this.ctx.fillStyle = '#fbbf24';
                this.ctx.beginPath();
                this.ctx.arc(event.x, event.y, 4, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Event line
                this.ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
                this.ctx.lineWidth = 1;
                this.ctx.setLineDash([]);
                this.ctx.beginPath();
                this.ctx.moveTo(event.x, this.canvasHeight / 2 - 20);
                this.ctx.lineTo(event.x, this.canvasHeight / 2 + 20);
                this.ctx.stroke();
            }
        });
    }
    
    drawGraphWalkState() {
        // Clear and set background
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Draw background gradient
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvasWidth, 0);
        gradient.addColorStop(0, 'rgba(220, 38, 38, 0.1)');
        gradient.addColorStop(0.5, 'rgba(251, 191, 36, 0.05)');
        gradient.addColorStop(1, 'rgba(34, 197, 94, 0.1)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Draw graph edges
        this.ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([]);
        
        this.graphEdges.forEach(edge => {
            const node1 = this.graphNodes[edge[0]];
            const node2 = this.graphNodes[edge[1]];
            
            this.ctx.beginPath();
            this.ctx.moveTo(node1.x, node1.y);
            this.ctx.lineTo(node2.x, node2.y);
            this.ctx.stroke();
        });
        
        // Draw nodes
        this.graphNodes.forEach((node, index) => {
            let color, size;
            switch(node.type) {
                case 'good': 
                    color = '#10b981'; 
                    size = 12;
                    break;
                case 'bad': 
                    color = '#dc2626'; 
                    size = 12;
                    break;
                case 'start': 
                    color = '#fbbf24'; 
                    size = 14;
                    break;
                case 'connector':
                    color = '#8b5cf6';
                    size = 10;
                    break;
                default: 
                    color = '#6b7280'; 
                    size = 8;
                    break;
            }
            
            // Node background
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Node outline
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
            
            // Current position indicator with pulsing effect
            if (index === this.currentNode) {
                const time = Date.now() * 0.005;
                const pulseSize = 20 + Math.sin(time) * 5;
                
                this.ctx.strokeStyle = '#fbbf24';
                this.ctx.lineWidth = 3;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
        });
        
        // Draw movement path
        if (this.path.length > 1) {
            this.ctx.strokeStyle = '#fbbf24';
            this.ctx.lineWidth = 4;
            this.ctx.globalAlpha = 0.7;
            this.ctx.setLineDash([]);
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.path[0].x, this.path[0].y);
            
            for (let i = 1; i < this.path.length; i++) {
                this.ctx.lineTo(this.path[i].x, this.path[i].y);
            }
            
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
            
            // Draw movement direction indicators
            for (let i = 1; i < this.path.length; i++) {
                const prevPoint = this.path[i - 1];
                const currPoint = this.path[i];
                
                // Calculate arrow direction
                const dx = currPoint.x - prevPoint.x;
                const dy = currPoint.y - prevPoint.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                
                if (length > 0) {
                    const midX = (prevPoint.x + currPoint.x) / 2;
                    const midY = (prevPoint.y + currPoint.y) / 2;
                    
                    // Draw small arrow
                    const arrowSize = 6;
                    const normalizedDx = dx / length;
                    const normalizedDy = dy / length;
                    
                    this.ctx.fillStyle = '#fbbf24';
                    this.ctx.beginPath();
                    this.ctx.moveTo(midX, midY);
                    this.ctx.lineTo(
                        midX - arrowSize * normalizedDx + arrowSize * normalizedDy * 0.5,
                        midY - arrowSize * normalizedDy - arrowSize * normalizedDx * 0.5
                    );
                    this.ctx.lineTo(
                        midX - arrowSize * normalizedDx - arrowSize * normalizedDy * 0.5,
                        midY - arrowSize * normalizedDy + arrowSize * normalizedDx * 0.5
                    );
                    this.ctx.closePath();
                    this.ctx.fill();
                }
            }
        }
    }
    
    drawParticle(x, y, isActive = false) {
        this.ctx.save();
        
        if (isActive) {
            // Animated glow effect
            const time = Date.now() * 0.01;
            const glowSize = 8 + Math.sin(time) * 3;
            
            this.ctx.shadowColor = '#fbbf24';
            this.ctx.shadowBlur = glowSize;
        }
        
        // Draw particle
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Inner core
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    positionToY(position) {
        // Convert position (0-10) to canvas y coordinate
        const normalizedPos = (10 - position) / 10; // Flip so 10 is at top
        return this.canvasHeight * (0.1 + normalizedPos * 0.8);
    }
    
    startSimulation() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.startButton.style.display = 'none';
        this.resetButton.style.display = 'inline-block';
        
        this.updateFortuneDisplay("The Oracle Speaks...", "Your destiny unfolds with each step through the realm of probability.", "Watch as the cosmic forces guide your path through chance and fate.");
        
        this.runSimulationStep();
    }
    
    runSimulationStep() {
        if (!this.isRunning) return;
        
        switch(this.currentProcess) {
            case 'brownian':
                this.runBrownianStep();
                break;
            case '2d-walk':
                this.run2DWalkStep();
                break;
            case 'poisson':
                this.runPoissonStep();
                break;
            case 'graph-walk':
                this.runGraphWalkStep();
                break;
        }
        
        // Continue simulation
        setTimeout(() => this.runSimulationStep(), this.animationSpeed);
    }
    
    runBrownianStep() {
        // Check for boundary conditions
        if (this.position.x <= 0) {
            this.endSimulation(false);
            return;
        }
        if (this.position.x >= 10) {
            this.endSimulation(true);
            return;
        }
        
        // Increase variance every 100 steps
        if (this.steps > 0 && this.steps % 100 === 0) {
            this.stepSize = this.baseStepSize * Math.pow(1.1, Math.floor(this.steps / 100));
        }
        
        // Take a random step
        const randomStep = (Math.random() - 0.5) * 2 * this.stepSize;
        this.position.x += randomStep;
        this.steps++;
        
        // Clamp position to bounds for display
        const clampedPosition = Math.max(0, Math.min(10, this.position.x));
        
        // Add to path
        const stepWidth = 4;
        const newX = 20 + (this.steps * stepWidth);
        const newY = this.positionToY(clampedPosition);
        
        if (this.path.length === 0) {
            this.path.push({ x: 20, y: this.positionToY(5.0), position: 5.0 });
        }
        
        this.path.push({ x: newX, y: newY, position: clampedPosition });
        
        // Update display
        this.positionValue.textContent = clampedPosition.toFixed(2);
        this.stepCount.textContent = this.steps;
        
        this.drawCurrentState();
    }
    
    run2DWalkStep() {
        // Check for boundary conditions (edges of 10x10 grid)
        if (this.position.x <= 0 || this.position.y <= 0) {
            this.endSimulation(false); // Left or bottom edge = bad
            return;
        }
        if (this.position.x >= 10 || this.position.y >= 10) {
            this.endSimulation(true); // Right or top edge = good
            return;
        }
        
        // Take random 2D step
        const direction = Math.floor(Math.random() * 4); // 0=up, 1=right, 2=down, 3=left
        const stepSize = 0.5;
        
        switch(direction) {
            case 0: this.position.y += stepSize; break; // up
            case 1: this.position.x += stepSize; break; // right
            case 2: this.position.y -= stepSize; break; // down
            case 3: this.position.x -= stepSize; break; // left
        }
        
        this.steps++;
        
        // Clamp for display
        const clampedX = Math.max(0, Math.min(10, this.position.x));
        const clampedY = Math.max(0, Math.min(10, this.position.y));
        
        // Add to path (map to canvas coordinates)
        const newX = (clampedX / 10) * (this.canvasWidth - 40) + 20;
        const newY = (1 - clampedY / 10) * (this.canvasHeight - 40) + 20;
        
        if (this.path.length === 0) {
            this.path.push({ x: this.canvasWidth / 2, y: this.canvasHeight / 2 });
        }
        
        this.path.push({ x: newX, y: newY });
        
        // Update display
        this.positionValue.textContent = `(${clampedX.toFixed(1)}, ${clampedY.toFixed(1)})`;
        this.stepCount.textContent = this.steps;
        
        this.drawCurrentState();
    }
    
    runPoissonStep() {
        if (!this.startTime) {
            this.startTime = Date.now();
        }
        
        const elapsed = (Date.now() - this.startTime) / 1000; // seconds
        
        // Check if time is up
        if (elapsed >= 10) {
            const success = this.poissonEvents >= this.poissonTargetTime;
            this.endSimulation(success);
            return;
        }
        
        // Poisson process: rate λ ≈ 0.96687146 per second gives exactly 50/50 odds
        // Mean events in 10s: μ = λT ≈ 9.6687, P(N(10) ≥ 10) = P(N(10) ≤ 9) = 0.5
        const dt = this.animationSpeed / 1000; // time step in seconds
        const lambda = 0.96687146; // events per second (mathematically precise for 50/50 split)
        const eventProbability = lambda * dt;
        
        if (Math.random() < eventProbability) {
            this.poissonEvents++;
            
            // Add visual event to path
            const x = (elapsed / 10) * (this.canvasWidth - 40) + 20;
            const y = this.canvasHeight / 2 + (Math.random() - 0.5) * 40;
            this.path.push({ x, y, isEvent: true });
        }
        
        this.steps++;
        
        // Update progress bar
        const progressFill = document.getElementById('progress-fill');
        if (progressFill) {
            progressFill.style.width = `${(elapsed / 10) * 100}%`;
        }
        
        // Update display
        const eventCount = document.getElementById('event-count');
        if (eventCount) {
            eventCount.textContent = this.poissonEvents;
        }
        this.positionValue.textContent = `${elapsed.toFixed(1)}s`;
        this.stepCount.textContent = this.poissonEvents;
        
        this.drawCurrentState();
    }
    
    runGraphWalkStep() {
        // Check for end conditions
        const currentNodeData = this.graphNodes[this.currentNode];
        if (currentNodeData.type === 'good') {
            this.endSimulation(true); // Reached good fortune
            return;
        }
        if (currentNodeData.type === 'bad') {
            this.endSimulation(false); // Reached misfortune
            return;
        }
        
        // Find all connected nodes
        const connectedNodes = [];
        
        this.graphEdges.forEach(edge => {
            if (edge[0] === this.currentNode) {
                connectedNodes.push(edge[1]);
            } else if (edge[1] === this.currentNode) {
                connectedNodes.push(edge[0]);
            }
        });
        
        // Random walk: choose one of the connected nodes
        if (connectedNodes.length > 0) {
            const randomIndex = Math.floor(Math.random() * connectedNodes.length);
            this.currentNode = connectedNodes[randomIndex];
            
            this.steps++;
            
            // Add to path
            const currentNodeData = this.graphNodes[this.currentNode];
            this.path.push({ 
                x: currentNodeData.x, 
                y: currentNodeData.y, 
                node: this.currentNode 
            });
            
            // Update display
            this.positionValue.textContent = currentNodeData.name;
            this.stepCount.textContent = this.steps;
            
            this.drawCurrentState();
        }
    }
    
    endSimulation(isGoodFortune) {
        this.isRunning = false;
        
        // Select random fortune
        const fortunes = isGoodFortune ? this.goodFortunes : this.challengingFortunes;
        const selectedFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
        
        // Update fortune display
        const title = isGoodFortune ? "🐉 Good Fortune Smiles Upon You! 吉" : "🌧️ Challenging Times Bring Growth 凶";
        this.updateFortuneDisplay(title, selectedFortune.text, selectedFortune.explanation);
        
        // Style the fortune container
        this.fortuneContainer.className = `fortune-container ${isGoodFortune ? 'fortune-good' : 'fortune-bad'}`;
        
        // For Brownian motion only, add the dramatic final segment
        if (this.currentProcess === 'brownian') {
            const lastPoint = this.path[this.path.length - 1];
            const finalY = isGoodFortune ? this.canvasHeight * 0.1 : this.canvasHeight * 0.9;
            
            // Create a dramatic final segment for Brownian motion
            for (let i = 1; i <= 5; i++) {
                const extendedX = lastPoint.x + (i * 8);
                const lerpY = lastPoint.y + ((finalY - lastPoint.y) * (i / 5));
                this.path.push({ x: extendedX, y: lerpY, position: isGoodFortune ? 10 : 0 });
            }
        }
        
        this.drawCurrentState();
        
        // Final position update based on process type
        switch(this.currentProcess) {
            case 'brownian':
                this.positionValue.textContent = isGoodFortune ? "10.0" : "0.0";
                break;
            case '2d-walk':
                // Keep the final position as is, don't change it
                break;
            case 'graph-walk':
                // Keep the final node name as is, don't change it
                break;
            case 'poisson':
                // Keep the final time as is, don't change it
                break;
        }
    }
    
    updateFortuneDisplay(title, text, explanation) {
        this.fortuneTitle.textContent = title;
        this.fortuneText.textContent = text;
        this.fortuneExplanation.textContent = explanation;
    }
    
    resetSimulation() {
        this.isRunning = false;
        this.steps = 0;
        this.stepSize = this.baseStepSize;
        this.scrollOffset = 0;
        this.path = [];
        
        // Reset process-specific variables
        this.poissonEvents = 0;
        this.startTime = null;
        
        // Reset position based on process
        switch(this.currentProcess) {
            case 'brownian':
                this.position = { x: 5.0, y: 5.0 };
                break;
            case '2d-walk':
                this.position = { x: 5.0, y: 5.0 };
                break;
            case 'poisson':
                this.position = { x: 0, y: 0 };
                break;
            case 'graph-walk':
                this.initializeGraph();
                this.currentNode = Math.floor(this.graphNodes.length / 2); // Center node
                break;
        }
        
        // Reset UI
        this.startButton.style.display = 'inline-block';
        this.resetButton.style.display = 'none';
        this.fortuneContainer.className = 'fortune-container';
        
        // Update display based on process
        switch(this.currentProcess) {
            case 'brownian':
                this.positionValue.textContent = '5.0';
                break;
            case '2d-walk':
                this.positionValue.textContent = '(5.0, 5.0)';
                break;
            case 'poisson':
                this.positionValue.textContent = '0.0s';
                const eventCount = document.getElementById('event-count');
                if (eventCount) eventCount.textContent = '0';
                const progressFill = document.getElementById('progress-fill');
                if (progressFill) progressFill.style.width = '0%';
                break;
            case 'graph-walk':
                this.positionValue.textContent = 'Crossroads';
                break;
        }
        
        this.stepCount.textContent = '0';
        
        this.updateFortuneDisplay(
            "Your Destiny Awaits",
            "Click \"Seek Your Fortune\" to begin your journey through the realm of chance and fate.",
            "The ancient art of divination through mathematical principles will guide you."
        );
        
        this.drawInitialState();
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const oracle = new FortuneOracle();
    
    // Add some sparkle to the page
    createFloatingElements();
});

// Create floating decorative elements
function createFloatingElements() {
    const elements = ['🏮', '🎋', '🧧', '🌸', '🔮'];
    
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            const element = document.createElement('div');
            element.textContent = elements[Math.floor(Math.random() * elements.length)];
            element.style.position = 'fixed';
            element.style.fontSize = '20px';
            element.style.pointerEvents = 'none';
            element.style.zIndex = '-1';
            element.style.opacity = '0.3';
            element.style.left = Math.random() * window.innerWidth + 'px';
            element.style.top = window.innerHeight + 'px';
            
            document.body.appendChild(element);
            
            // Animate upward
            element.animate([
                { transform: 'translateY(0px) rotate(0deg)', opacity: 0.3 },
                { transform: `translateY(-${window.innerHeight + 100}px) rotate(360deg)`, opacity: 0 }
            ], {
                duration: 15000 + Math.random() * 10000,
                easing: 'linear'
            }).onfinish = () => {
                element.remove();
            };
        }, i * 2000);
    }
    
    // Repeat the animation
    setTimeout(createFloatingElements, 20000);
}
