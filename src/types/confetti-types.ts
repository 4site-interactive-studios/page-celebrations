export interface ConfettiOptionsInput {
    /**
     * The particle colors used for the stream. Accepts hex strings such as '#ff5e7e'.
     * More colors increase visual variation across the burst.
     */
    colors?: string[];

    /**
     * How many particles are emitted in each burst.
     * Higher values make the effect denser and heavier to render.
     */
    particleCount?: number;

    /**
     * The launch direction in degrees.
     * `0` points to the right, `90` points downward, `180` points left, and so on.
     */
    angle?: number;

    /**
     * The directional randomness around the base angle, in degrees.
     * Higher values create a wider fan of particles.
     */
    spread?: number;

    /**
     * The initial speed of each particle.
     * Higher values throw particles farther across the screen.
     */
    startVelocity?: number;

    /**
     * How quickly particles slow down over time.
     * Values closer to `1` keep them moving longer; lower values make them lose speed faster.
     */
    decay?: number;

    /**
     * Constant downward pull applied every frame.
     * Higher values make the particles drop sooner.
     */
    gravity?: number;

    /**
     * Extra sideways movement applied each frame.
     * Useful for adding a wind-like push to the stream.
     */
    drift?: number;

    /**
     * The particle lifespan measured in animation frames.
     * Higher values keep particles visible longer before they fade out.
     */
    ticks?: number;

    /**
     * The stacking order of the confetti canvas.
     * Higher values place the animation above more page content.
     */
    zIndex?: number;

    /**
     * Multiplies the rendered particle size.
     * Higher values make the confetti pieces appear larger.
     */
    scalar?: number;

    /**
     * Optional CSS selector for an existing canvas to render into.
     * If omitted, the confetti instance creates and manages its own canvas.
     */
    renderCanvasSelector?: string;
}

export interface ConfettiOptions {
    colors: string[];
    particleCount: number;
    angle: number;
    spread: number;
    startVelocity: number;
    decay: number;
    gravity: number;
    drift: number;
    ticks: number;
    zIndex: number;
    scalar: number;
    renderCanvasSelector: string | null;
}

export interface RgbColor {
    r: number;
    g: number;
    b: number;
}

export interface Particle {
    x: number;
    y: number;
    wobble: number;
    velocity: number;
    angle2D: number;
    tiltAngle: number;
    color: RgbColor;
    tick: number;
    totalTicks: number;
    decay: number;
    drift: number;
    random: number;
    tiltSin: number;
    tiltCos: number;
    wobbleX: number;
    wobbleY: number;
    gravity: number;
    ovalScalar: number;
    scalar: number;
}

export interface CanvasSize {
    width: number;
    height: number;
}
