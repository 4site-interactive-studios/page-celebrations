export type FontWeight = number | string;

export interface HeartsOptionsInput {
    colors?: string[];
    color?: string;
    textColor?: string;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: FontWeight;
    particleCount?: number;
    speed?: number;
    zIndex?: number;
    renderCanvasSelector?: string;
}

export interface HeartsOptions {
    colors: string[];
    textColor: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: FontWeight;
    particleCount: number;
    speed: number;
    zIndex: number;
    renderCanvasSelector: string | null;
}

export interface CanvasElements {
    heartCanvas: HTMLCanvasElement;
    animationCanvas: HTMLCanvasElement;
}

export interface HeartVariant {
    url: string;
    image: HTMLImageElement;
}

export interface HeartSprite {
    x: number;
    y: number;
    startX: number;
    startY: number;
    endY: number;
    driftOffset: number;
    driftAmplitude: number;
    driftFrequency: number;
    driftPhase: number;
    tiltCenter: number;
    tiltAmplitude: number;
    renderSize: number;
    image: HTMLImageElement | null;
    opacity: number;
    age: number;
    maxAge: number;
    invMaxAge: number;
    fadeInEndAge: number;
    fadeStartAge: number;
    rotation?: number;
}
