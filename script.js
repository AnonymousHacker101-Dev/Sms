/* ============================================
   SALAR KING 👑 — Unified Operations Dashboard
   Modules: BomberApp, GatewayApp, TrueCallerApp,
            IndianSimApp, NexGenSimApp, ParticleBackground
   ============================================ */

(function () {
    'use strict';

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

    /* ============================================
       Lookup Core (shared helpers)
       ============================================ */

    const LookupCore = {
        async fetchJSON(url, timeout = 25000) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeout);
            try {
                const res = await fetch(url, {
                    method: 'GET',
                    headers: { Accept: 'application/json' },
                    signal: controller.signal
                });
                const text = await res.text();
                let data;
                try { data = JSON.parse(text); }
                catch (e) { data = { raw_response: text.slice(0, 800) || '(empty body)' }; }

                if (!res.ok) {
                    const err = new Error(
                        (data && (data.message || data.error)) || `HTTP ${res.status}`
                    );
                    err.payload = data;
                    throw err;
                }
                return data;
            } finally {
                clearTimeout(timer);
            }
        },

        flatten(obj, prefix = '', out = {}) {
            if (obj === null || typeof obj !== 'object') {
                out[prefix || 'value'] = obj;
                return out;
            }
            if (Array.isArray(obj)) {
                obj.forEach((item, i) => this.flatten(item, `${prefix}[${i}]`, out));
                return out;
            }
            Object.keys(obj).forEach((k) => {
                const key = prefix ? `${prefix}.${k}` : k;
                const v = obj[k];
                if (v !== null && typeof v === 'object') this.flatten(v, key, out);
                else out[key] = v;
            });
            return out;
        },

        isErrorPayload(data) {
            if (!data || typeof data !== 'object') return false;
            if (data.status && String(data.status).toLowerCase() === 'error') return true;
            if (data.success === false) return true;
            if (data.error && !data.data && !data.result) return true;
            return false;
        },

        clear(container) {
            container.innerHTML = '';
            container.classList.add('hidden');
        },

        render(container, data) {
            container.innerHTML = '';

            if (data === null || data === undefined) {
                container.innerHTML =
                    '<div class="result-row"><span class="result-val result-val--empty">Empty response.</span></div>';
                container.classList.remove('hidden');
                return;
            }

            const flat = this.flatten(data);
            const keys = Object.keys(flat);

            if (!keys.length) {
                container.innerHTML =
                    '<div class="result-row"><span class="result-val result-val--empty">No fields returned.</span></div>';
                container.classList.remove('hidden');
                return;
            }

            keys.slice(0, 120).forEach((k) => {
                const row = document.createElement('div');
                row.className = 'result-row';

                const keyEl = document.createElement('span');
                keyEl.className = 'result-key';
                keyEl.textContent = k.replace(/[_\.]/g, ' ');

                const valEl = document.createElement('span');
                valEl.className = 'result-val';
                const v = flat[k];
                const isEmpty = (v === '' || v === null || v === undefined);
                if (isEmpty) {
                    valEl.classList.add('result-val--empty');
                    valEl.textContent = '—';
                } else {
                    valEl.textContent = String(v);
                }

                row.appendChild(keyEl);
                row.appendChild(valEl);
                container.appendChild(row);
            });

            if (keys.length > 120) {
                const more = document.createElement('div');
                more.className = 'result-row';
                more.innerHTML = `<span class="result-val result-val--empty">+ ${keys.length - 120} more fields truncated.</span>`;
                container.appendChild(more);
            }

            container.classList.remove('hidden');
        }
    };

    /* ============================================
       TrueCaller Worldwide Lookup
       ============================================ */

    const TrueCallerApp = {
        init() {
            this.form = document.getElementById('truecaller-form');
            this.cc = document.getElementById('truecaller-cc');
            this.num = document.getElementById('truecaller-num');
            this.btn = document.getElementById('truecaller-btn');
            this.btnStatus = document.getElementById('truecaller-btn-status');
            this.responseBox = document.getElementById('truecaller-response');
            this.responseIcon = document.getElementById('truecaller-response-icon');
            this.responseText = document.getElementById('truecaller-response-text');
            this.result = document.getElementById('truecaller-result');

            this.API = 'https://sbsakib.eu.cc/apis/truecaller';
            this.KEY = 'Demo';

            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        },

        setResponse(message, type) {
            const iconMap = { success: '✅', error: '❌', warning: '⚠️', info: '🛡️' };
            const colorMap = { success: '#10b981', error: '#FF0033', warning: '#f59e0b', info: '#FF0033' };
            this.responseIcon.textContent = iconMap[type] || '🛡️';
            this.responseIcon.style.color = colorMap[type];
            this.responseText.textContent = message;
            this.responseBox.style.borderLeftColor = colorMap[type];
            this.responseBox.style.boxShadow = `0 0 18px ${colorMap[type]}15`;
        },

        setLoading(isLoading, text) {
            if (isLoading) {
                this.btn.classList.add('loading');
                this.btnStatus.textContent = text || 'Resolving...';
            } else {
                this.btn.classList.remove('loading');
            }
        },

        async handleSubmit(e) {
            e.preventDefault();

            const digits = this.num.value.replace(/\D/g, '').replace(/^0+/, '');

            if (!digits || digits.length < 6) {
                this.setResponse('Enter a valid number (min 6 digits, no leading zero).', 'warning');
                return;
            }

            const full = `${this.cc.value}${digits}`;
            this.setLoading(true, 'Resolving...');
            this.setResponse(`🌐 Querying TrueCaller for ${full} ...`, 'info');
            LookupCore.clear(this.result);

            try {
                const url = `${this.API}?key=${encodeURIComponent(this.KEY)}&num=${encodeURIComponent(full)}`;
                const data = await LookupCore.fetchJSON(url, 25000);

                LookupCore.render(this.result, data);

                if (LookupCore.isErrorPayload(data)) {
                    this.setResponse(`⚠️ ${data.message || data.error || 'Lookup returned an error payload.'}`, 'warning');
                } else {
                    this.setResponse(`✅ Identity resolved for ${full}.`, 'success');
                }
            } catch (error) {
                if (error.payload) LookupCore.render(this.result, error.payload);
                this.setResponse(`❌ Lookup failed: ${error.message}`, 'error');
            } finally {
                this.setLoading(false);
            }
        }
    };

    /* ============================================
       Indian SIM Database
       ============================================ */

    const IndianSimApp = {
        init() {
            this.form = document.getElementById('indian-form');
            this.num = document.getElementById('indian-num');
            this.btn = document.getElementById('indian-btn');
            this.btnStatus = document.getElementById('indian-btn-status');
            this.responseBox = document.getElementById('indian-response');
            this.responseIcon = document.getElementById('indian-response-icon');
            this.responseText = document.getElementById('indian-response-text');
            this.result = document.getElementById('indian-result');

            this.API = 'https://tfqdeadlo-inddataapi.hf.space/search';

            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        },

        setResponse(message, type) {
            const iconMap = { success: '✅', error: '❌', warning: '⚠️', info: '🛡️' };
            const colorMap = { success: '#10b981', error: '#FF0033', warning: '#f59e0b', info: '#FF0033' };
            this.responseIcon.textContent = iconMap[type] || '🛡️';
            this.responseIcon.style.color = colorMap[type];
            this.responseText.textContent = message;
            this.responseBox.style.borderLeftColor = colorMap[type];
            this.responseBox.style.boxShadow = `0 0 18px ${colorMap[type]}15`;
        },

        setLoading(isLoading, text) {
            if (isLoading) {
                this.btn.classList.add('loading');
                this.btnStatus.textContent = text || 'Searching...';
            } else {
                this.btn.classList.remove('loading');
            }
        },

        normalize(raw) {
            let digits = raw.replace(/\D/g, '');
            digits = digits.replace(/^91(?=\d{10}$)/, '');
            digits = digits.replace(/^0+/, '');
            return digits;
        },

        async handleSubmit(e) {
            e.preventDefault();

            const mobile = this.normalize(this.num.value.trim());

            if (mobile.length !== 10) {
                this.setResponse('Indian mobile must be exactly 10 digits (e.g. 9289910639).', 'warning');
                return;
            }

            this.setLoading(true, 'Searching...');
            this.setResponse(`🕵️ Querying Indian SIM database for ${mobile} ...`, 'info');
            LookupCore.clear(this.result);

            try {
                const url = `${this.API}?mobile=${encodeURIComponent(mobile)}`;
                const data = await LookupCore.fetchJSON(url, 40000);

                LookupCore.render(this.result, data);

                if (LookupCore.isErrorPayload(data)) {
                    this.setResponse(`⚠️ ${data.message || data.error || 'No records returned.'}`, 'warning');
                } else {
                    this.setResponse(`✅ Records retrieved for +91 ${mobile}.`, 'success');
                }
            } catch (error) {
                if (error.payload) LookupCore.render(this.result, error.payload);
                this.setResponse(`❌ Query failed: ${error.message}`, 'error');
            } finally {
                this.setLoading(false);
            }
        }
    };

    /* ============================================
       NexGen SIM API (Pakistan)
       ============================================ */

    const NexGenSimApp = {
        init() {
            this.form = document.getElementById('nexgen-form');
            this.num = document.getElementById('nexgen-num');
            this.btn = document.getElementById('nexgen-btn');
            this.btnStatus = document.getElementById('nexgen-btn-status');
            this.responseBox = document.getElementById('nexgen-response');
            this.responseIcon = document.getElementById('nexgen-response-icon');
            this.responseText = document.getElementById('nexgen-response-text');
            this.result = document.getElementById('nexgen-result');

            this.API = 'https://nexgen-tech-sim-api-v-01.vercel.app/api/search';

            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        },

        setResponse(message, type) {
            const iconMap = { success: '✅', error: '❌', warning: '⚠️', info: '🛡️' };
            const colorMap = { success: '#10b981', error: '#FF0033', warning: '#f59e0b', info: '#FF0033' };
            this.responseIcon.textContent = iconMap[type] || '🛡️';
            this.responseIcon.style.color = colorMap[type];
            this.responseText.textContent = message;
            this.responseBox.style.borderLeftColor = colorMap[type];
            this.responseBox.style.boxShadow = `0 0 18px ${colorMap[type]}15`;
        },

        setLoading(isLoading, text) {
            if (isLoading) {
                this.btn.classList.add('loading');
                this.btnStatus.textContent = text || 'Fetching...';
            } else {
                this.btn.classList.remove('loading');
            }
        },

        sanitize(raw) {
            const cleaned = raw.replace(/[^\d+]/g, '');
            const digits = cleaned.replace(/\D/g, '');
            return cleaned.startsWith('+') ? `+${digits}` : digits;
        },

        async handleSubmit(e) {
            e.preventDefault();

            const number = this.sanitize(this.num.value.trim());
            const digitsOnly = number.replace(/\D/g, '');

            if (digitsOnly.length < 10) {
                this.setResponse('Enter a full number: 03XXXXXXXXX, 923XXXXXXXXX or +923XXXXXXXXX.', 'warning');
                return;
            }

            this.setLoading(true, 'Fetching...');
            this.setResponse(`📡 Querying NexGen SIM API for ${number} ...`, 'info');
            LookupCore.clear(this.result);

            try {
                const url = `${this.API}?number=${encodeURIComponent(number)}`;
                const data = await LookupCore.fetchJSON(url, 30000);

                LookupCore.render(this.result, data);

                if (LookupCore.isErrorPayload(data)) {
                    this.setResponse(`⚠️ ${data.message || data.error || 'No records returned.'}`, 'warning');
                } else {
                    this.setResponse(`✅ SIM data retrieved for ${number}.`, 'success');
                }
            } catch (error) {
                if (error.payload) LookupCore.render(this.result, error.payload);
                this.setResponse(`❌ Fetch failed: ${error.message}`, 'error');
            } finally {
                this.setLoading(false);
            }
        }
    };

    /* ============================================
       Particle Background
       ============================================ */

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

    document.addEventListener('DOMContentLoaded', () => {
        BomberApp.init();
        GatewayApp.init();
        TrueCallerApp.init();
        IndianSimApp.init();
        NexGenSimApp.init();
        ParticleBackground.init();
        console.log('[SALAR KING 👑] All systems online — 5 modules active.');
    });
})();
