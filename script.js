/* ============================================
   SALAR KING 👑 — Unified Operations Dashboard
   Two independent modules: BomberApp & GatewayApp
   Custom Vercel proxy for SMS Bomber — no more CORS failures
   ============================================ */

(function () {
    'use strict';

    /* ==========================================
       MODULE 1: SMS BOMBER
       Proxy: https://salar-king-dashboard.vercel.app/api/send
       ========================================== */

    const BomberApp = {
        init() {
            this.form = document.getElementById('bomber-form');
            this.phoneInput = document.getElementById('bomber-phone');
            this.countInput = document.getElementById('bomber-count');
            this.btn = document.getElementById('bomber-btn');
            this.btnStatus = document.getElementById('bomber-btn-status');
            this.responseIcon = document.getElementById('bomber-response-icon');
            this.responseText = document.getElementById('bomber-response-text');
            this.responseBox = document.getElementById('bomber-response');

            this.API_PROXY = 'https://salar-king-dashboard.vercel.app/api/send';

            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        },

        setResponse(message, type) {
            const iconMap = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                info: '🛡️'
            };
            const colorMap = {
                success: '#10b981',
                error: '#FF0033',
                warning: '#f59e0b',
                info: '#FF0033'
            };

            this.responseIcon.textContent = iconMap[type] || '🛡️';
            this.responseIcon.style.color = colorMap[type];
            this.responseText.textContent = message;
            this.responseBox.style.borderLeftColor = colorMap[type];
            this.responseBox.style.boxShadow = `0 0 18px ${colorMap[type]}15`;
        },

        normalizePhoneNumber(rawPhone) {
            let cleaned = rawPhone.replace(/[^\d+]/g, '');
            cleaned = cleaned.replace(/^(\+92|92|0)/, '');
            return cleaned;
        },

        validatePhone(normalizedPhone) {
            return normalizedPhone.length === 10 && /^[3]/.test(normalizedPhone);
        },

        async handleSubmit(e) {
            e.preventDefault();

            const rawPhone = this.phoneInput.value.trim();
            const countStr = this.countInput.value.trim();
            const count = parseInt(countStr, 10);

            if (!rawPhone) {
                this.setResponse('Please enter target coordinates (Phone Number).', 'warning');
                return;
            }

            const normalizedPhone = this.normalizePhoneNumber(rawPhone);

            if (!this.validatePhone(normalizedPhone)) {
                this.setResponse('Invalid target. Must be a valid Pakistani number (e.g., 03xx, +923xx).', 'error');
                return;
            }

            if (!countStr || isNaN(count) || count < 1) {
                this.setResponse('Strike count must be at least 1.', 'warning');
                return;
            }

            if (count > 100) {
                this.setResponse('Max payload capacity is 100 per strike.', 'error');
                return;
            }

            this.setBtnLoading(true, 'Transmitting...');
            this.setResponse(`📤 Locking target: ${normalizedPhone} | Payload: ${count}x`, 'info');

            await new Promise((resolve) => setTimeout(resolve, 1500));

            await this.sendBomb(normalizedPhone, count);
        },

        setBtnLoading(isLoading, statusText) {
            if (isLoading) {
                this.btn.classList.add('loading');
                this.btnStatus.textContent = statusText || 'Transmitting...';
            } else {
                this.btn.classList.remove('loading');
            }
        },

        async fetchWithTimeout(url, options = {}, timeout = 20000) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            try {
                const response = await fetch(url, { ...options, signal: controller.signal });
                return response;
            } finally {
                clearTimeout(timeoutId);
            }
        },

        async sendBomb(cleanPhone, count) {
            try {
                const proxyUrl = `${this.API_PROXY}?phone=${cleanPhone}&count=${count}`;

                const response = await this.fetchWithTimeout(proxyUrl, {
                    method: 'GET',
                    headers: { Accept: 'application/json' }
                }, 20000);

                const data = await response.json();

                if (data && data.status === 'success') {
                    this.setResponse(`✅ ${data.message || 'Strike successful! Target hit.'}`, 'success');
                } else {
                    const errMsg = data.message || data.error || 'Server responded with an error.';
                    this.setResponse(`❌ ${errMsg}`, 'error');
                }
            } catch (error) {
                this.setResponse(`❌ Connection failed: ${error.message}`, 'error');
            } finally {
                this.setBtnLoading(false);
            }
        }
    };

    /* ==========================================
       MODULE 2: GATEWAY DISPATCHER
       Client-side packet simulation
       ========================================== */

    const GatewayApp = {
        init() {
            this.form = document.getElementById('gateway-form');
            this.targetInput = document.getElementById('gateway-target');
            this.countInput = document.getElementById('gateway-count');
            this.delayInput = document.getElementById('gateway-delay');
            this.btn = document.getElementById('gateway-btn');
            this.progressContainer = document.getElementById('gateway-progress');
            this.progressBar = document.getElementById('gateway-bar');
            this.percentText = document.getElementById('gateway-percent');
            this.statusText = document.getElementById('gateway-status');
            this.logBox = document.getElementById('gateway-log');
            this.canvas = document.getElementById('gateway-matrix');

            this.matrixInterval = null;
            this.progressInterval = null;
            this.resetTimeout = null;
            this.fontSize = 12;
            this.letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()';

            this.initMatrix();
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            window.addEventListener('resize', () => this.resizeCanvas());
        },

        initMatrix() {
            this.ctx = this.canvas.getContext('2d');
            this.resizeCanvas();
            this.matrixInterval = setInterval(() => this.drawMatrix(), 50);
        },

        resizeCanvas() {
            if (!this.canvas || !this.canvas.parentElement) return;
            const parent = this.canvas.parentElement;
            this.canvas.width = parent.clientWidth;
            this.canvas.height = parent.clientHeight;
            this.columns = Math.ceil(this.canvas.width / this.fontSize);
            this.drops = [];
            for (let i = 0; i < this.columns; i++) {
                this.drops[i] = Math.floor((Math.random() * this.canvas.height) / this.fontSize);
            }
        },

        drawMatrix() {
            if (!this.ctx || !this.canvas) return;
            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;

            ctx.fillStyle = 'rgba(5, 5, 5, 0.15)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#FF0033';
            ctx.font = `${this.fontSize}px monospace`;

            for (let i = 0; i < this.drops.length; i++) {
                const text = this.letters.charAt(Math.floor(Math.random() * this.letters.length));
                ctx.fillText(text, i * this.fontSize, this.drops[i] * this.fontSize);

                if (this.drops[i] * this.fontSize > h && Math.random() > 0.975) {
                    this.drops[i] = 0;
                }
                this.drops[i]++;
            }
        },

        handleSubmit(e) {
            e.preventDefault();

            const target = this.targetInput.value.trim();
            const count = parseInt(this.countInput.value, 10);
            const delay = Math.max(0, parseInt(this.delayInput.value, 10) || 0);

            if (!target) {
                this.logBox.innerHTML = '<p>&gt; Error: No target specified.</p>';
                return;
            }
            if (isNaN(count) || count < 1) {
                this.logBox.innerHTML = '<p>&gt; Error: Packet count must be at least 1.</p>';
                return;
            }

            this.form.style.display = 'none';
            this.progressContainer.classList.remove('hidden');
            this.progressBar.style.width = '0%';
            this.percentText.textContent = '0%';
            this.statusText.textContent = 'Processing packets...';
            this.logBox.innerHTML =
                `<p>&gt; Target locked: ${target}</p>` +
                `<p>&gt; Opening socket connections...</p>`;

            let current = 0;
            const total = Math.min(count, 100);

            this.progressInterval = setInterval(() => {
                current++;
                const percent = Math.floor((current / total) * 100);
                this.progressBar.style.width = percent + '%';
                this.percentText.textContent = percent + '%';

                if (current % 3 === 0 || current === total) {
                    const p = document.createElement('p');
                    p.textContent = `> Packet #${current} dispatched successfully [200 OK]`;
                    this.logBox.appendChild(p);
                }

                if (current >= total) {
                    clearInterval(this.progressInterval);
                    this.progressInterval = null;
                    this.statusText.textContent = 'Sequence Completed Successfully!';

                    const finalMsg = document.createElement('p');
                    finalMsg.className = 'text-white';
                    finalMsg.textContent = '> All operations executed. Session closed safely.';
                    this.logBox.appendChild(finalMsg);

                    this.logBox.scrollTop = this.logBox.scrollHeight;

                    this.resetTimeout = setTimeout(() => {
                        this.form.reset();
                        this.form.style.display = 'block';
                        this.progressContainer.classList.add('hidden');
                        this.progressBar.style.width = '0%';
                        this.percentText.textContent = '0%';
                    }, 5000);
                }

                this.logBox.scrollTop = this.logBox.scrollHeight;
            }, Math.max(delay, 50));
        }
    };

    /* ==========================================
       BACKGROUND PARTICLES
       ========================================== */

    const ParticleBackground = {
        init() {
            this.container = document.getElementById('bg-particles');
            if (!this.container) return;

            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReducedMotion) return;

            this.particleCount = 28;
            this.createParticles();
        },

        createParticles() {
            for (let i = 0; i < this.particleCount; i++) {
                const span = document.createElement('span');
                const size = Math.random() * 2 + 1.5;
                const left = Math.random() * 100;
                const duration = Math.random() * 14 + 10;
                const delay = Math.random() * 12;

                span.style.left = left + '%';
                span.style.width = size + 'px';
                span.style.height = size + 'px';
                span.style.animationDuration = duration + 's';
                span.style.animationDelay = delay + 's';

                this.container.appendChild(span);
            }
        }
    };

    /* ==========================================
       BOOT
       ========================================== */

    document.addEventListener('DOMContentLoaded', () => {
        BomberApp.init();
        GatewayApp.init();
        ParticleBackground.init();
        console.log('[SALAR KING 👑] All systems online.');
    });
})();                         }
                        throw new Error('Invalid AllOrigins response format');
                    }
                },
                {
                    name: 'corsproxy-org',
                    url: `https://corsproxy.org/?${encodedUrl}`,
                    parse: (response) => response.json()
                },
                {
                    name: 'thingproxy',
                    url: `https://thingproxy.freeboard.io/fetch/${url}`,
                    parse: (response) => response.json()
                }
            ];

            let lastError = null;

            for (const proxy of proxyChain) {
                try {
                    console.log(`[Bomber] Trying ${proxy.name}...`);

                    const response = await this.fetchWithTimeout(proxy.url, {
                        method: 'GET',
                        headers: { Accept: 'application/json' }
                    }, 15000);

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const data = await proxy.parse(response);

                    if (data && data.status === 'success') {
                        this.setResponse(`✅ ${data.message || 'Strike successful! Target hit.'}`, 'success');
                        return;
                    } else if (data && (data.message || data.error)) {
                        const errMsg = data.message || data.error;
                        this.setResponse(`❌ ${errMsg}`, 'error');
                        return;
                    } else {
                        throw new Error('Unexpected response structure');
                    }
                } catch (error) {
                    console.warn(`[Bomber] ${proxy.name} failed:`, error.message);
                    lastError = error;
                }
            }

            this.setResponse(`❌ All connection routes failed. Last error: ${lastError ? lastError.message : 'Unknown error'}`, 'error');
        }
    };

    /* ==========================================
       MODULE 2: GATEWAY DISPATCHER
       Client-side packet simulation
       ========================================== */

    const GatewayApp = {
        init() {
            this.form = document.getElementById('gateway-form');
            this.targetInput = document.getElementById('gateway-target');
            this.countInput = document.getElementById('gateway-count');
            this.delayInput = document.getElementById('gateway-delay');
            this.btn = document.getElementById('gateway-btn');
            this.progressContainer = document.getElementById('gateway-progress');
            this.progressBar = document.getElementById('gateway-bar');
            this.percentText = document.getElementById('gateway-percent');
            this.statusText = document.getElementById('gateway-status');
            this.logBox = document.getElementById('gateway-log');
            this.canvas = document.getElementById('gateway-matrix');

            this.matrixInterval = null;
            this.progressInterval = null;
            this.resetTimeout = null;
            this.fontSize = 12;
            this.letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()';

            this.initMatrix();
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            window.addEventListener('resize', () => this.resizeCanvas());
        },

        initMatrix() {
            this.ctx = this.canvas.getContext('2d');
            this.resizeCanvas();
            this.matrixInterval = setInterval(() => this.drawMatrix(), 50);
        },

        resizeCanvas() {
            if (!this.canvas || !this.canvas.parentElement) return;
            const parent = this.canvas.parentElement;
            this.canvas.width = parent.clientWidth;
            this.canvas.height = parent.clientHeight;
            this.columns = Math.ceil(this.canvas.width / this.fontSize);
            this.drops = [];
            for (let i = 0; i < this.columns; i++) {
                this.drops[i] = Math.floor((Math.random() * this.canvas.height) / this.fontSize);
            }
        },

        drawMatrix() {
            if (!this.ctx || !this.canvas) return;
            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;

            ctx.fillStyle = 'rgba(5, 5, 5, 0.15)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#FF0033';
            ctx.font = `${this.fontSize}px monospace`;

            for (let i = 0; i < this.drops.length; i++) {
                const text = this.letters.charAt(Math.floor(Math.random() * this.letters.length));
                ctx.fillText(text, i * this.fontSize, this.drops[i] * this.fontSize);

                if (this.drops[i] * this.fontSize > h && Math.random() > 0.975) {
                    this.drops[i] = 0;
                }
                this.drops[i]++;
            }
        },

        handleSubmit(e) {
            e.preventDefault();

            const target = this.targetInput.value.trim();
            const count = parseInt(this.countInput.value, 10);
            const delay = Math.max(0, parseInt(this.delayInput.value, 10) || 0);

            if (!target) {
                this.logBox.innerHTML = '<p>&gt; Error: No target specified.</p>';
                return;
            }
            if (isNaN(count) || count < 1) {
                this.logBox.innerHTML = '<p>&gt; Error: Packet count must be at least 1.</p>';
                return;
            }

            this.form.style.display = 'none';
            this.progressContainer.classList.remove('hidden');
            this.progressBar.style.width = '0%';
            this.percentText.textContent = '0%';
            this.statusText.textContent = 'Processing packets...';
            this.logBox.innerHTML =
                `<p>&gt; Target locked: ${target}</p>` +
                `<p>&gt; Opening socket connections...</p>`;

            let current = 0;
            const total = Math.min(count, 100);

            this.progressInterval = setInterval(() => {
                current++;
                const percent = Math.floor((current / total) * 100);
                this.progressBar.style.width = percent + '%';
                this.percentText.textContent = percent + '%';

                if (current % 3 === 0 || current === total) {
                    const p = document.createElement('p');
                    p.textContent = `> Packet #${current} dispatched successfully [200 OK]`;
                    this.logBox.appendChild(p);
                }

                if (current >= total) {
                    clearInterval(this.progressInterval);
                    this.progressInterval = null;
                    this.statusText.textContent = 'Sequence Completed Successfully!';

                    const finalMsg = document.createElement('p');
                    finalMsg.className = 'text-white';
                    finalMsg.textContent = '> All operations executed. Session closed safely.';
                    this.logBox.appendChild(finalMsg);

                    this.logBox.scrollTop = this.logBox.scrollHeight;

                    this.resetTimeout = setTimeout(() => {
                        this.form.reset();
                        this.form.style.display = 'block';
                        this.progressContainer.classList.add('hidden');
                        this.progressBar.style.width = '0%';
                        this.percentText.textContent = '0%';
                    }, 5000);
                }

                this.logBox.scrollTop = this.logBox.scrollHeight;
            }, Math.max(delay, 50));
        }
    };

    /* ==========================================
       BACKGROUND PARTICLES
       ========================================== */

    const ParticleBackground = {
        init() {
            this.container = document.getElementById('bg-particles');
            if (!this.container) return;

            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReducedMotion) return;

            this.particleCount = 28;
            this.createParticles();
        },

        createParticles() {
            for (let i = 0; i < this.particleCount; i++) {
                const span = document.createElement('span');
                const size = Math.random() * 2 + 1.5;
                const left = Math.random() * 100;
                const duration = Math.random() * 14 + 10;
                const delay = Math.random() * 12;

                span.style.left = left + '%';
                span.style.width = size + 'px';
                span.style.height = size + 'px';
                span.style.animationDuration = duration + 's';
                span.style.animationDelay = delay + 's';

                this.container.appendChild(span);
            }
        }
    };

    /* ==========================================
       BOOT
       ========================================== */

    document.addEventListener('DOMContentLoaded', () => {
        BomberApp.init();
        GatewayApp.init();
        ParticleBackground.init();
        console.log('[SALAR KING 👑] All systems online.');
    });
})();
