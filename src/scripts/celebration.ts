export abstract class Celebration {
    private static nextInstanceId = 1;

    protected readonly debugMode = window.location.search.includes('debug');
    protected readonly instanceId: number;
    protected animationId: number | null = null;
    protected isAnimating = false;
    protected isContinuous = false;
    private listenersAttached = false;

    private readonly resizeHandler = (): void => {
        this.handleResize();
    };

    private readonly visibilityHandler = (): void => {
        if (document.hidden) {
            this.handleDocumentHidden();
            return;
        }

        this.handleDocumentVisible();
    };

    protected constructor() {
        this.instanceId = Celebration.nextInstanceId;
        Celebration.nextInstanceId += 1;
    }

    protected prefersReducedMotion(): boolean {
        return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    protected ensureEventListeners(): void {
        if (this.listenersAttached) {
            return;
        }

        window.addEventListener('resize', this.resizeHandler);
        document.addEventListener('visibilitychange', this.visibilityHandler);
        this.listenersAttached = true;
    }

    protected removeEventListeners(): void {
        if (!this.listenersAttached) {
            return;
        }

        window.removeEventListener('resize', this.resizeHandler);
        document.removeEventListener('visibilitychange', this.visibilityHandler);
        this.listenersAttached = false;
    }

    protected cancelAnimationLoop(): void {
        if (this.animationId === null) {
            return;
        }

        cancelAnimationFrame(this.animationId);
        this.animationId = null;
    }

    protected log(message: string, emoji: string = '🟢', data: unknown = null): void {
        if (!this.debugMode) {
            return;
        }

        let color = 'black';
        let bgColor = '#f0f0f0';

        switch (emoji) {
            case '🟢':
                color = 'green';
                bgColor = '#d4edda';
                break;
            case '🔴':
                color = 'red';
                bgColor = '#f8d7da';
                break;
            case '⚠️':
                color = 'orange';
                bgColor = '#fff3cd';
                break;
            case '🎉':
                color = 'purple';
                bgColor = '#e2d1f3';
                break;
            case '🖼️':
                color = '#0c5460';
                bgColor = '#d1ecf1';
                break;
            case '📐':
                color = '#383d41';
                bgColor = '#e2e3e5';
                break;
            default:
                color = 'black';
                bgColor = '#f0f0f0';
        }

        const style = `color: ${color}; background-color: ${bgColor}; font-weight: bold; font-family: monospace; font-size: 14px; padding: 4px 8px; border-radius: 4px;`;
        const formattedMessage = `%c${emoji} [${this.getLogLabel()}] ${message}`;

        if (data !== null) {
            console.log(formattedMessage, style, data);
            return;
        }

        console.log(formattedMessage, style);
    }

    protected abstract getLogLabel(): string;

    protected abstract handleResize(): void;

    protected abstract handleDocumentHidden(): void;

    protected abstract handleDocumentVisible(): void;
}
