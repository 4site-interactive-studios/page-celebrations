import '../styles/confetti.css';
import { Celebration } from './celebration';
import type {
    CanvasSize,
    ConfettiOptions,
    ConfettiOptionsInput,
    Particle,
    RgbColor,
} from '../types/confetti-types';

declare global {
    interface Window {
        Confetti: typeof Confetti;
    }
}

const DEFAULT_OPTIONS: ConfettiOptions = {
    colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'],
    particleCount: 50,
    angle: 90,
    spread: 45,
    startVelocity: 45,
    decay: 0.9,
    gravity: 1,
    drift: 0,
    ticks: 200,
    zIndex: 100,
    scalar: 1,
    renderCanvasSelector: null,
};

export class Confetti extends Celebration {
    private readonly optionsInput: ConfettiOptionsInput;
    private options: ConfettiOptions;
    private particles: Particle[] = [];
    private renderCanvas: HTMLCanvasElement | null = null;
    private renderCtx: CanvasRenderingContext2D | null = null;
    private ownsRenderCanvas = false;
    private canvasSize: CanvasSize = { width: 0, height: 0 };

    constructor(options: ConfettiOptionsInput = {}) {
        super();
        this.optionsInput = options && typeof options === 'object' ? options : {};
        this.options = this.sanitizeOptions(this.optionsInput);
        this.log('Creating confetti instance with options:', '🟢', options);
    }

    public start(): Promise<void> {
        if (this.prefersReducedMotion()) {
            this.log('User prefers reduced motion, cancelling confetti', '⚠️');
            this.destroy();
            return Promise.resolve();
        }

        this.ensureEventListeners();
        this.ensureRenderCanvas();

        if (!this.renderCanvas) {
            return Promise.reject(new Error('Render canvas is unavailable'));
        }

        this.renderCtx = this.renderCanvas.getContext('2d');

        if (!this.renderCtx) {
            return Promise.reject(new Error('Render context is unavailable'));
        }

        this.resizeRenderCanvas();
        this.log('Starting confetti!', '🟢');

        if (!this.isAnimating) {
            this.isAnimating = true;
            this.animateConfetti();
        }
        this.burst();
        return Promise.resolve();
    }

    public stop(): this {
        this.log('Stopping confetti', '🔴');
        this.particles.length = 0;
        this.cancelAnimationLoop();
        this.isAnimating = false;

        if (this.renderCtx && this.renderCanvas) {
            this.renderCtx.clearRect(0, 0, this.renderCanvas.width, this.renderCanvas.height);
        }

        return this;
    }

    public destroy(): this {
        this.log('Destroying confetti instance', '🔴');
        this.particles.length = 0;

        this.cancelAnimationLoop();

        this.isAnimating = false;

        if (this.renderCtx && this.renderCanvas) {
            this.renderCtx.clearRect(0, 0, this.renderCanvas.width, this.renderCanvas.height);
        }

        this.removeEventListeners();

        if (this.ownsRenderCanvas && this.renderCanvas) {
            this.renderCanvas.remove();
        }

        this.renderCanvas = null;
        this.renderCtx = null;
        this.ownsRenderCanvas = false;

        return this;
    }

    protected getLogLabel(): string {
        return 'Celebration Confetti';
    }

    protected handleResize(): void {
        this.resizeRenderCanvas();
    }

    protected handleDocumentHidden(): void {
        this.log('Hidden, pausing confetti', '⚠️');
        this.cancelAnimationLoop();
    }

    protected handleDocumentVisible(): void {
        if (this.isAnimating && this.animationId === null) {
            this.animateConfetti();
        }
    }

    private ensureRenderCanvas(): void {
        if (this.renderCanvas && this.renderCanvas.isConnected) {
            this.renderCanvas.style.zIndex = String(this.options.zIndex);
            return;
        }

        const selector = this.options.renderCanvasSelector;

        if (selector) {
            const element = document.querySelector(selector);
            if (element && element instanceof HTMLCanvasElement) {
                this.renderCanvas = element;
                this.ownsRenderCanvas = false;
                this.log(`Attached to canvas: ${selector}`, '🟢');
                return;
            }
        }

        // Create new canvas
        const canvas = document.createElement('canvas');
        canvas.id = `confetti__renderCanvas-${this.instanceId}`;
        canvas.className = 'confetti__renderCanvas';
        canvas.setAttribute('aria-hidden', 'true');
        canvas.style.zIndex = String(this.options.zIndex);
        document.body.appendChild(canvas);
        this.renderCanvas = canvas;
        this.ownsRenderCanvas = true;
        this.log('Created new render canvas', '🟢');
    }

    private resizeRenderCanvas(): void {
        if (!this.renderCanvas) return;

        const w = document.documentElement.clientWidth;
        const h = document.documentElement.clientHeight;

        if (this.renderCanvas.width !== w || this.renderCanvas.height !== h) {
            this.renderCanvas.width = w;
            this.renderCanvas.height = h;
            this.canvasSize = { width: w, height: h };
            this.log(`Canvas resized to ${w}x${h}`, '🟢');
        }
    }

    private sanitizeOptions(input: ConfettiOptionsInput): ConfettiOptions {
        const colors = input.colors && Array.isArray(input.colors) && input.colors.length > 0
            ? input.colors
            : DEFAULT_OPTIONS.colors;

        return {
            colors: colors,
            particleCount: Math.max(1, Number(input.particleCount) || DEFAULT_OPTIONS.particleCount),
            angle: Number(input.angle) || DEFAULT_OPTIONS.angle,
            spread: Math.max(0, Number(input.spread) || DEFAULT_OPTIONS.spread),
            startVelocity: Math.max(0, Number(input.startVelocity) || DEFAULT_OPTIONS.startVelocity),
            decay: Math.max(0, Math.min(1, Number(input.decay) || DEFAULT_OPTIONS.decay)),
            gravity: Number(input.gravity) || DEFAULT_OPTIONS.gravity,
            drift: Number(input.drift) || DEFAULT_OPTIONS.drift,
            ticks: Math.max(1, Number(input.ticks) || DEFAULT_OPTIONS.ticks),
            zIndex: Number(input.zIndex) || DEFAULT_OPTIONS.zIndex,
            scalar: Math.max(0.1, Number(input.scalar) || DEFAULT_OPTIONS.scalar),
            renderCanvasSelector: input.renderCanvasSelector ? String(input.renderCanvasSelector) : null,
        };
    }

    private hexToRgb(str: string): RgbColor {
        let val = String(str).replace(/[^0-9a-f]/gi, '');
        if (val.length < 6) {
            val = val[0] + val[0] + val[1] + val[1] + val[2] + val[2];
        }
        return {
            r: parseInt(val.substring(0, 2), 16),
            g: parseInt(val.substring(2, 4), 16),
            b: parseInt(val.substring(4, 6), 16),
        };
    }

    private randomPhysics(color: RgbColor, originY: number): Particle {
        const radSpread = this.options.spread * (Math.PI / 180);

        // Random side (0 = left, 1 = right)
        const side = Math.random() < 0.5 ? 0 : 1;
        const x = side === 0 ? -10 : this.canvasSize.width + 10;
        const baseAngle = side === 0 ? this.options.angle : 180 - this.options.angle;
        const radAngle = baseAngle * (Math.PI / 180);

        return {
            x,
            y: originY,
            wobble: Math.random() * 10,
            velocity: this.options.startVelocity * 0.5 + Math.random() * this.options.startVelocity,
            angle2D: -radAngle + (0.5 * radSpread - Math.random() * radSpread),
            tiltAngle: Math.random() * Math.PI,
            color,
            tick: 0,
            totalTicks: this.options.ticks,
            decay: this.options.decay,
            drift: this.options.drift,
            random: Math.random() + 5,
            tiltSin: 0,
            tiltCos: 0,
            wobbleX: 0,
            wobbleY: 0,
            gravity: this.options.gravity * 3,
            ovalScalar: 0.6,
            scalar: this.options.scalar,
        };
    }

    private updateParticle(ctx: CanvasRenderingContext2D, p: Particle): boolean {
        p.x += Math.cos(p.angle2D) * p.velocity + p.drift;
        p.y += Math.sin(p.angle2D) * p.velocity + p.gravity;
        p.wobble += 0.1;
        p.velocity *= p.decay;
        p.tiltAngle += 0.1;
        p.tiltSin = Math.sin(p.tiltAngle);
        p.tiltCos = Math.cos(p.tiltAngle);
        p.random = Math.random() + 5;
        p.wobbleX = p.x + 10 * p.scalar * Math.cos(p.wobble);
        p.wobbleY = p.y + 10 * p.scalar * Math.sin(p.wobble);

        const progress = p.tick++ / p.totalTicks;
        const x1 = p.x + p.random * p.tiltCos;
        const y1 = p.y + p.random * p.tiltSin;
        const x2 = p.wobbleX + p.random * p.tiltCos;
        const y2 = p.wobbleY + p.random * p.tiltSin;

        ctx.fillStyle = `rgba(${p.color.r},${p.color.g},${p.color.b},${1 - progress})`;
        ctx.beginPath();

        if (ctx.ellipse) {
            ctx.ellipse(
                p.x,
                p.y,
                Math.abs(x2 - x1) * p.ovalScalar,
                Math.abs(y2 - y1) * p.ovalScalar,
                (Math.PI / 10) * p.wobble,
                0,
                2 * Math.PI,
            );
        } else {
            // Fallback for older browsers
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((Math.PI / 10) * p.wobble);
            ctx.scale(Math.abs(x2 - x1) * p.ovalScalar, Math.abs(y2 - y1) * p.ovalScalar);
            ctx.arc(0, 0, 1, 0, 2 * Math.PI);
            ctx.restore();
        }

        ctx.closePath();
        ctx.fill();

        return p.tick < p.totalTicks;
    }

    public burst(): void {
        if (!this.renderCanvas) {
            return;
        }

        const colors = this.options.colors.map((c) => this.hexToRgb(c));
        const particleCount = Math.max(0, Math.floor(this.options.particleCount));

        // Burst from random heights
        for (let i = 0; i < particleCount; i++) {
            const originY = Math.random() * this.canvasSize.height;
            const color = colors[i % colors.length];
            this.particles.push(this.randomPhysics(color, originY));
        }

        this.log(`Burst ${particleCount} particles`, '🎉');
    }

    private animateConfetti(): void {
        if (!this.renderCtx || !this.renderCanvas) {
            return;
        }

        this.renderCtx.clearRect(0, 0, this.renderCanvas.width, this.renderCanvas.height);

        let writeIndex = 0;
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            if (this.updateParticle(this.renderCtx, p)) {
                this.particles[writeIndex] = p;
                writeIndex++;
            }
        }
        this.particles.length = writeIndex;

        if (this.particles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.animateConfetti());
        } else {
            this.isAnimating = false;
            this.animationId = null;
        }
    }

}

window.Confetti = Confetti;

export {};
