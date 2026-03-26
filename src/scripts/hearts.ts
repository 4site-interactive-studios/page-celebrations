import '../styles/hearts.css';
import { Celebration } from './celebration';
import type {
    CanvasElements,
    FontWeight,
    HeartVariant,
    HeartSprite,
    HeartsOptions,
    HeartsOptionsInput,
} from '../types/hearts-types';

declare global {
    interface Window {
        Hearts: typeof Hearts;
    }
}

const DEFAULT_OPTIONS: HeartsOptions = {
    colors: ['#ff7ab6', '#ff3b8d', '#d91567'],
    textColor: '#ffffff',
    fontFamily: 'Arial, sans-serif',
    fontSize: 18,
    fontWeight: 700,
    particleCount: 8,
    speed: 1,
    zIndex: 100,
    renderCanvasSelector: null,
};

export class Hearts extends Celebration {
    private readonly names: string[];
    private readonly optionsInput: HeartsOptionsInput;
    private options: HeartsOptions;
    private hearts: HeartSprite[] = [];
    private heartVariants: HeartVariant[] = [];
    private lastSpawnX: number | null = null;
    private lastSpawnTime = 0;
    private streamStartedAt = 0;
    private readonly fadeInDurationMs = 1800;
    private hiddenStartedAt = 0;
    private heartCanvas: HTMLCanvasElement | null = null;
    private animationCanvas: HTMLCanvasElement | null = null;
    private animationCtx: CanvasRenderingContext2D | null = null;
    private ownsAnimationCanvas = false;

    constructor(names: string[], options: HeartsOptionsInput = {}) {
        super();
        this.names = Array.isArray(names) && names.length ? names : ['Love'];
        this.optionsInput = options && typeof options === 'object' ? options : {};
        this.options = this.sanitizeOptions(this.optionsInput);
        this.log('Creating celebration instance with options:', '🟢', options);
    }

    public start(): Promise<void> {
        if (this.prefersReducedMotion()) {
            this.log('User prefers reduced motion, cancelling celebration', '⚠️');
            this.destroy();
            return Promise.resolve();
        }

        this.ensureEventListeners();

        const canvases = this.ensureCanvases();

        this.log("Starting celebration!", '🟢');

        this.heartCanvas = canvases.heartCanvas;
        this.animationCanvas = canvases.animationCanvas;
        this.animationCtx = canvases.animationCanvas.getContext('2d');

        if (!this.animationCtx) {
            return Promise.reject(new Error('Animation context is unavailable'));
        }

        this.resizeAnimationCanvas();
        this.options = this.sanitizeOptions(this.optionsInput);

        const nameList = this.names.length ? this.names : ['Love'];
        const heartImageUrls = nameList.map((name) => {
            const lines = String(name)
                .split('\n')
                .map(function (line) {
                    return line.trim();
                })
                .filter(Boolean);

            return this.drawHeartCanvas(lines.length ? lines : ['Love'], 120, this.options);
        });

        return Promise.all(heartImageUrls.map((url) => this.loadImageFromDataUrl(url))).then((heartImages) => {
            this.heartVariants = heartImageUrls.map(function (url, index) {
                return { url, image: heartImages[index] };
            });

            if (!this.isContinuous) {
                this.streamStartedAt = performance.now();
            }
            this.isContinuous = true;

            if (!this.isAnimating) {
                this.isAnimating = true;
                this.animateHearts();
            }

            const count = this.options.particleCount;
            for (let i = 0; i < count; i += 1) {
                this.spawnHeart(i / count);
            }
            this.lastSpawnTime = performance.now();
        });
    }

    public stop(): this {
        this.log('Stopping the celebration', '🔴');
        this.isContinuous = false;
        return this;
    }

    public destroy(): this {
        this.log('Destroying celebration instance', '🔴');
        this.isContinuous = false;
        this.hearts.length = 0;
        this.heartVariants.length = 0;
        this.lastSpawnX = null;
        this.lastSpawnTime = 0;
        this.streamStartedAt = 0;
        this.hiddenStartedAt = 0;

        this.cancelAnimationLoop();

        this.isAnimating = false;

        if (this.animationCtx && this.animationCanvas) {
            this.animationCtx.clearRect(0, 0, this.animationCanvas.width, this.animationCanvas.height);
        }

        this.removeEventListeners();

        if (this.heartCanvas) {
            this.heartCanvas.remove();
            this.heartCanvas = null;
        }

        if (this.ownsAnimationCanvas && this.animationCanvas) {
            this.animationCanvas.remove();
        }

        this.animationCanvas = null;
        this.animationCtx = null;
        this.ownsAnimationCanvas = false;
        return this;
    }

    protected getLogLabel(): string {
        return 'Celebration Hearts';
    }

    protected handleResize(): void {
        this.resizeAnimationCanvas();
    }

    protected handleDocumentHidden(): void {
        this.hiddenStartedAt = performance.now();
        this.cancelAnimationLoop();
        this.log('Hidden, pausing animation', '⚠️');
    }

    protected handleDocumentVisible(): void {
        if (this.hiddenStartedAt > 0) {
            const hiddenDuration = performance.now() - this.hiddenStartedAt;

            if (this.streamStartedAt > 0) {
                this.streamStartedAt += hiddenDuration;
            }

            if (this.lastSpawnTime > 0) {
                this.lastSpawnTime += hiddenDuration;
            }

            this.hiddenStartedAt = 0;
        }

        if (this.isAnimating && this.animationId === null) {
            this.animateHearts();
        }
    }

    private ensureCanvases(): CanvasElements {
        let heartCanvas = this.heartCanvas;
        if (!heartCanvas || !heartCanvas.isConnected) {
            heartCanvas = document.createElement('canvas');
            heartCanvas.id = 'hearts__heartCanvas-' + this.instanceId;
            heartCanvas.className = 'hearts__heartCanvas';
            heartCanvas.setAttribute('aria-hidden', 'true');
            document.body.appendChild(heartCanvas);
            this.heartCanvas = heartCanvas;
        }

        const requestedSelector = this.options.renderCanvasSelector;
        if (requestedSelector) {
            const selectedCanvas = document.querySelector(requestedSelector);
            if (!(selectedCanvas instanceof HTMLCanvasElement)) {
                throw new Error('renderCanvasSelector must match a canvas element');
            }

            selectedCanvas.style.zIndex = String(this.options.zIndex);
            this.ownsAnimationCanvas = false;
            return { heartCanvas, animationCanvas: selectedCanvas };
        }

        let nextAnimationCanvas = this.animationCanvas;
        if (!nextAnimationCanvas || !nextAnimationCanvas.isConnected || !this.ownsAnimationCanvas) {
            nextAnimationCanvas = document.createElement('canvas');
            nextAnimationCanvas.id = 'hearts__renderCanvas-' + this.instanceId;
            nextAnimationCanvas.className = 'hearts__renderCanvas';
            nextAnimationCanvas.style.zIndex = String(this.options.zIndex);
            document.body.appendChild(nextAnimationCanvas);
            this.animationCanvas = nextAnimationCanvas;
            this.ownsAnimationCanvas = true;
        } else {
            nextAnimationCanvas.style.zIndex = String(this.options.zIndex);
        }
        this.log('Using animation canvas:', '🖼️', nextAnimationCanvas);
        return { heartCanvas, animationCanvas: nextAnimationCanvas };
    }

    private getHeartCanvas(): HTMLCanvasElement {
        const heartCanvas = this.heartCanvas;
        if (!heartCanvas) {
            throw new Error('Heart canvas is not initialized');
        }
        return heartCanvas;
    }

    private getAnimationContext2D(): CanvasRenderingContext2D {
        if (!this.animationCtx) {
            throw new Error('Animation context is not initialized');
        }
        return this.animationCtx;
    }

    private resizeAnimationCanvas(): void {
        if (this.animationCanvas) {
            const rect = this.animationCanvas.getBoundingClientRect();
            const width = Math.max(1, Math.round(rect.width || window.innerWidth));
            const height = Math.max(1, Math.round(rect.height || window.innerHeight));

            this.animationCanvas.width = width;
            this.animationCanvas.height = height;
            this.log('Resized animation canvas to:', '📐', { width, height });
        }
    }

    private getAnimationWidth(): number {
        return this.animationCanvas ? this.animationCanvas.width : window.innerWidth;
    }

    private getAnimationHeight(): number {
        return this.animationCanvas ? this.animationCanvas.height : window.innerHeight;
    }

    private loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
        return new Promise(function (resolve, reject) {
            const image = new Image();
            image.onload = function () {
                resolve(image);
            };
            image.onerror = function () {
                reject(new Error('Failed to load heart image'));
            };
            image.src = dataUrl;
        });
    }

    private sanitizeOptions(options?: HeartsOptionsInput): HeartsOptions {
        const input = options && typeof options === 'object' ? options : {};

        const speedRaw = Number(input.speed);
        const speed = Number.isFinite(speedRaw) && speedRaw > 0 ? speedRaw : DEFAULT_OPTIONS.speed;

        const countRaw = Number(input.particleCount);
        const particleCount = Number.isFinite(countRaw)
            ? Math.max(1, Math.min(50, Math.floor(countRaw)))
            : DEFAULT_OPTIONS.particleCount;

        const zIndexRaw = Number(input.zIndex);
        const zIndex = Number.isFinite(zIndexRaw) ? zIndexRaw : DEFAULT_OPTIONS.zIndex;

        const fontSizeRaw = Number(input.fontSize);
        const fontSize = Number.isFinite(fontSizeRaw) && fontSizeRaw > 0
            ? fontSizeRaw
            : DEFAULT_OPTIONS.fontSize;

        let fontWeight: FontWeight = DEFAULT_OPTIONS.fontWeight;
        if (typeof input.fontWeight === 'number' && Number.isFinite(input.fontWeight)) {
            fontWeight = input.fontWeight;
        } else if (typeof input.fontWeight === 'string' && input.fontWeight.trim() !== '') {
            fontWeight = input.fontWeight;
        }

        let colors = DEFAULT_OPTIONS.colors;
        if (Array.isArray(input.colors)) {
            const parsed = input.colors.filter(function (value: string) {
                return typeof value === 'string' && value.trim() !== '';
            });
            if (parsed.length >= 2) {
                colors = parsed;
            } else if (parsed.length === 1) {
                colors = [parsed[0], parsed[0]];
            }
        } else if (typeof input.color === 'string' && input.color.trim() !== '') {
            colors = [input.color, input.color];
        }

        return {
            colors,
            textColor: typeof input.textColor === 'string' && input.textColor.trim() !== ''
                ? input.textColor
                : DEFAULT_OPTIONS.textColor,
            fontFamily: typeof input.fontFamily === 'string' && input.fontFamily.trim() !== ''
                ? input.fontFamily
                : DEFAULT_OPTIONS.fontFamily,
            fontSize,
            fontWeight,
            particleCount,
            speed,
            zIndex,
            renderCanvasSelector: typeof input.renderCanvasSelector === 'string' && input.renderCanvasSelector.trim() !== ''
                ? input.renderCanvasSelector
                : DEFAULT_OPTIONS.renderCanvasSelector,
        };
    }

    private drawHeartCanvas(lines: string[], size = 120, options: HeartsOptions = DEFAULT_OPTIONS): string {
        this.log('Drawing heart canvas with text:', '🖌️', lines);
        const canvas = this.getHeartCanvas();
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('Heart canvas context is unavailable');
        }

        const centerX = size / 2;
        const centerY = size / 2 + size * 0.06;
        const heartScale = size / 38;

        canvas.width = size;
        canvas.height = size;
        ctx.clearRect(0, 0, size, size);

        ctx.beginPath();
        for (let angle = 0; angle <= Math.PI * 2; angle += 0.02) {
            const heartX = 16 * Math.pow(Math.sin(angle), 3);
            const heartY =
                13 * Math.cos(angle) -
                5 * Math.cos(2 * angle) -
                2 * Math.cos(3 * angle) -
                Math.cos(4 * angle);
            const drawX = centerX + heartX * heartScale;
            const drawY = centerY - heartY * heartScale;
            if (angle === 0) {
                ctx.moveTo(drawX, drawY);
            } else {
                ctx.lineTo(drawX, drawY);
            }
        }
        ctx.closePath();

        const heartGradient = ctx.createLinearGradient(0, size * 0.15, 0, size * 0.9);
        for (let i = 0; i < options.colors.length; i += 1) {
            const stop = options.colors.length === 1 ? 0 : i / (options.colors.length - 1);
            heartGradient.addColorStop(stop, options.colors[i]);
        }
        ctx.fillStyle = heartGradient;
        ctx.fill();
        ctx.lineWidth = Math.max(2, size * 0.03);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.stroke();

        const maxTextWidth = size * 0.5;
        const baseFontSize = options.fontSize;
        const lineHeight = baseFontSize * 1.22;
        const totalTextHeight = lines.length * lineHeight;
        const textStartY = centerY + size * 0.02 - totalTextHeight / 2 + lineHeight / 2;

        ctx.fillStyle = options.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        lines.forEach(function (line, index) {
            const upper = (line || '').toUpperCase();
            let fontSize = baseFontSize;
            ctx.font = options.fontWeight + ' ' + fontSize + 'px ' + options.fontFamily;

            while (fontSize > size * 0.08 && ctx.measureText(upper).width > maxTextWidth) {
                fontSize -= 0.5;
                ctx.font = options.fontWeight + ' ' + fontSize + 'px ' + options.fontFamily;
            }

            const measuredWidth = ctx.measureText(upper).width;
            const lineY = textStartY + index * lineHeight;

            ctx.save();
            ctx.translate(centerX, lineY);
            if (measuredWidth > maxTextWidth) {
                ctx.scale(maxTextWidth / measuredWidth, 1);
            }
            ctx.fillText(upper, 0, 0);
            ctx.restore();
        });

        return canvas.toDataURL('image/png');
    }

    private createHeart(x: number, y: number): HeartSprite {
        const maxAge = 14000 + Math.random() * 2000;
        return {
            x,
            y,
            startX: x,
            startY: y,
            endY: -(60 + Math.random() * 40),
            driftOffset: (Math.random() - 0.5) * 48,
            driftAmplitude: 8 + Math.random() * 14,
            driftFrequency: 1.3 + Math.random() * 0.8,
            driftPhase: Math.random() * Math.PI * 2,
            tiltCenter: Math.random() * 16 - 8,
            tiltAmplitude: 4 + Math.random() * 6,
            renderSize: 104 + Math.random() * 18,
            image: null,
            opacity: 1,
            age: 0,
            maxAge,
            invMaxAge: 1 / maxAge,
            fadeInEndAge: maxAge * 0.08,
            fadeStartAge: maxAge * 0.88,
        };
    }

    private getSpawnX(): number {
        const minSpacing = 140;
        const animationWidth = this.getAnimationWidth();
        const sidePadding = animationWidth < 450 ? animationWidth / 10 : 90;
        const maxX = Math.max(sidePadding, animationWidth - sidePadding);
        let candidate = animationWidth / 2;

        for (let attempt = 0; attempt < 12; attempt += 1) {
            candidate = sidePadding + Math.random() * (maxX - sidePadding);

            const isFarFromBottomHearts = this.hearts.every((heart: HeartSprite) => {
                const heartIsNearBottom = heart.y > this.getAnimationHeight() * 0.68;
                return !heartIsNearBottom || Math.abs(heart.x - candidate) >= minSpacing;
            });

            const farFromLastSpawn =
                this.lastSpawnX === null ||
                Math.abs(this.lastSpawnX - candidate) >= minSpacing * 0.8;

            if (isFarFromBottomHearts && farFromLastSpawn) {
                this.lastSpawnX = candidate;
                return candidate;
            }
        }

        this.lastSpawnX = candidate;
        return candidate;
    }

    private spawnHeart(preAgeRatio = 0): void {
        if (!this.heartVariants.length || this.hearts.length >= this.options.particleCount) {
            return;
        }

        const variant = this.heartVariants[Math.floor(Math.random() * this.heartVariants.length)];
        const heart = this.createHeart(this.getSpawnX(), this.getAnimationHeight() + 40);
        heart.image = variant.image;

        if (preAgeRatio > 0) {
            heart.age = Math.floor(heart.maxAge * preAgeRatio);
        }

        this.hearts.push(heart);
    }

    private animateHearts(): void {
        const ctx = this.getAnimationContext2D();
        if (!this.animationCanvas) {
            this.log('Animation canvas is not available for drawing', '🔴');
            throw new Error('Animation canvas is not initialized');
        }

        const frameNow = performance.now();
        const streamOpacity = this.streamStartedAt
            ? Math.min(1, (frameNow - this.streamStartedAt) / this.fadeInDurationMs)
            : 1;

        ctx.clearRect(0, 0, this.animationCanvas.width, this.animationCanvas.height);

        let writeIndex = 0;
        for (let i = 0; i < this.hearts.length; i += 1) {
            const heart = this.hearts[i];
            heart.age += 16 * this.options.speed;
            const progress = Math.min(heart.age * heart.invMaxAge, 1);
            const riseProgress = 1 - Math.pow(1 - progress, 1.35);

            if (heart.age >= heart.maxAge) {
                continue;
            }

            heart.y = heart.startY + (heart.endY - heart.startY) * riseProgress;
            heart.x =
                heart.startX +
                heart.driftOffset * progress +
                Math.sin(progress * Math.PI * heart.driftFrequency + heart.driftPhase) * heart.driftAmplitude;

            heart.rotation = heart.tiltCenter + Math.sin(progress * Math.PI * 2 + heart.driftPhase) * heart.tiltAmplitude;

            if (heart.age <= heart.fadeInEndAge) {
                heart.opacity = heart.age / heart.fadeInEndAge;
            } else if (heart.age > heart.fadeStartAge) {
                heart.opacity = 1 - (heart.age - heart.fadeStartAge) / (heart.maxAge - heart.fadeStartAge);
            } else {
                heart.opacity = 1;
            }

            if (heart.image && heart.image.width) {
                ctx.save();
                ctx.globalAlpha = heart.opacity * streamOpacity;
                ctx.translate(heart.x, heart.y);
                ctx.rotate(((heart.rotation || 0) * Math.PI) / 180);
                ctx.drawImage(
                    heart.image,
                    -heart.renderSize / 2,
                    -heart.renderSize / 2,
                    heart.renderSize,
                    heart.renderSize,
                );
                ctx.restore();
            }

            this.hearts[writeIndex] = heart;
            writeIndex += 1;
        }
        this.hearts.length = writeIndex;

        if (this.isContinuous) {
            const minGap = 1800 / this.options.speed;
            if (this.hearts.length < this.options.particleCount && frameNow - this.lastSpawnTime >= minGap) {
                this.lastSpawnTime = frameNow;
                this.spawnHeart();
            }
        }

        if (this.hearts.length > 0 || this.isContinuous) {
            this.animationId = requestAnimationFrame(() => this.animateHearts());
        } else {
            this.isAnimating = false;
        }
    }

}

window.Hearts = Hearts;

export { };