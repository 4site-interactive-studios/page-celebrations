# Page Celebrations

Lightweight TypeScript canvas animations for celebratory UI moments.

The bundle exposes two globals:

- `window.Hearts`
- `window.Confetti`

Both classes support the same lifecycle methods:

- `start(): Promise<void>`
- `stop(): this`
- `destroy(): this`

## Features

- Floating heart animations with optional text inside each heart
- Side-spray confetti animation (left and right edges)
- Per-effect custom canvas support via selector
- Automatic pause/resume handling when tab visibility changes
- Respects `prefers-reduced-motion`

## Project Structure

- `src/scripts/hearts.ts`: Hearts animation class
- `src/scripts/confetti.ts`: Confetti animation class
- `src/scripts/celebration.ts`: Shared base class
- `src/types/hearts-types.ts`: Hearts types/options
- `src/types/confetti-types.ts`: Confetti types/options
- `src/styles/`: Animation styles
- `dist/celebration.min.js`: Build output

## Build

Install dependencies:

```bash
npm install
```

Build the bundle:

```bash
npm run build
```

Output file:

- `dist/celebration.min.js`

## Browser Usage

Include the compiled bundle:

```html
<script src="./dist/celebration.min.js"></script>
```

Then create and control animations with the global classes.

## Debug

To view debug logs, put `debug` in your URL query params:

```
example.com/confettitest.html?debug
```

## Hearts API

Constructor:

```ts
new Hearts(names: string[], options?: HeartsOptionsInput)
```

Lifecycle:

- `start()`: Creates/attaches canvases and begins animation
- `stop()`: Stops spawning new hearts, existing hearts animate out
- `destroy()`: Stops, clears, removes owned canvases, and detaches listeners

### Hearts Settings

`HeartsOptionsInput`

- `colors?: string[]`
	- Gradient colors for each heart fill.
- `color?: string`
	- Convenience single-color fallback (used when `colors` is not provided).
- `textColor?: string`
	- Color of text rendered inside the heart.
- `fontFamily?: string`
	- Font family for heart text.
- `fontSize?: number`
	- Base text size inside each heart.
- `fontWeight?: number | string`
	- Font weight for heart text.
- `particleCount?: number`
	- Number of hearts to keep active/spawning.
- `speed?: number`
	- Animation speed multiplier.
- `zIndex?: number`
	- The stacking order of the hearts canvas.
	- Higher values place the animation above more page content.
- `renderCanvasSelector?: string`
	- CSS selector for an existing `canvas` to render hearts into.
	- If omitted, Hearts creates its own fullscreen canvas.

## Confetti API

Constructor:

```ts
new Confetti(options?: ConfettiOptionsInput)
```

Lifecycle:

- `start()`: Creates/attaches canvas and fires an initial burst
- `stop()`: Stops continuous spawning; existing particles animate out
- `destroy()`: Stops, clears, removes owned canvas, and detaches listeners

Methods:
- `burst()`: Emits a single burst of confetti particles from both sides
  - Can be called multiple times for repeated bursts while running

### Confetti Settings

`ConfettiOptionsInput`

- `colors?: string[]`
	- Particle colors as hex values (example: `#ff5e7e`).
- `particleCount?: number`
	- Number of particles emitted per burst.
- `angle?: number`
	- Base launch angle in degrees.
	- Right-side spray uses a mirrored angle (`180 - angle`) for inward symmetry.
- `spread?: number`
	- Random fan width around the launch angle.
- `startVelocity?: number`
	- Initial particle speed.
- `decay?: number`
	- Velocity falloff per frame.
- `gravity?: number`
	- Downward acceleration strength.
- `drift?: number`
	- Constant horizontal push each frame.
- `ticks?: number`
	- Particle lifespan in frames.
- `zIndex?: number`
	- Render canvas stack order.
- `scalar?: number`
	- Particle size multiplier.
- `renderCanvasSelector?: string`
	- CSS selector for an existing `canvas` to render confetti into.
	- If omitted, Confetti creates its own fullscreen canvas.

## Example: Hearts + Confetti Together

```html
<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>Celebrations Demo</title>
</head>
<body>
	<button id="start">Start Celebration</button>
	<button id="stop">Stop</button>
	<button id="destroy">Destroy</button>

	<script src="./dist/celebration.min.js"></script>
	<script>
		const hearts = new window.Hearts(['Name', 'Congrats'], {
			colors: ['#ff7ab6', '#ff3b8d', '#d91567'],
			textColor: '#ffffff',
			particleCount: 10,
			speed: 1.1,
		});

		const confetti = new window.Confetti({
			colors: ['#26ccff', '#ff5e7e', '#fcff42'],
			particleCount: 65,
			angle: 20,
			spread: 35,
			startVelocity: 40,
			gravity: 1,
			scalar: 1,
		});

		document.getElementById('start').addEventListener('click', async () => {
			await hearts.start();
			await confetti.start();
		});

		document.getElementById('stop').addEventListener('click', () => {
			hearts.stop();
			confetti.stop();
		});

		document.getElementById('destroy').addEventListener('click', () => {
			hearts.destroy();
			confetti.destroy();
		});
	</script>
</body>
</html>
```

## Notes

- Both animations no-op when the user has reduced-motion enabled.
- `destroy()` should be called when leaving a page or tearing down a view.
- The two effects use separate canvases and can run independently.
- Multiple instances of each effect can be created with different settings and canvases.
