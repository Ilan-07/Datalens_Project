/**
 * GlitchEngine
 * ==============
 * WebGL-based fluid distortion overlay.
 * Uses fragment shader for wave displacement, chromatic aberration, and noise ripple.
 * Falls back to CSS-only on devices without WebGL support.
 */

import { stateManager } from './MultiverseStateManager';

// ── Inline shader sources (avoids fetch/import issues with Next.js) ──────

const VERT_SRC = `
attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
    v_texCoord = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAG_SRC = `
precision mediump float;
varying vec2 v_texCoord;
uniform float u_time;
uniform float u_intensity;
uniform float u_noiseFactor;
uniform float u_chromaticOffset;
uniform vec2  u_resolution;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float val = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
        val += amp * noise(p);
        p *= 2.0;
        amp *= 0.5;
    }
    return val;
}

void main() {
    vec2 uv = v_texCoord;
    vec2 pixel = 1.0 / u_resolution;
    float t = u_time;
    float intensity = u_intensity;

    if (intensity < 0.001) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        return;
    }

    // Wave distortion
    float wave = sin(uv.y * 20.0 + t * 3.0) * 0.003 * intensity;
    wave += sin(uv.x * 15.0 + t * 2.0) * 0.002 * intensity;

    // Noise displacement
    float n = fbm(uv * 8.0 + t * 0.5) * u_noiseFactor * intensity;
    vec2 displacement = vec2(wave + n * 0.008, n * 0.005);

    // Chromatic aberration
    float chromatic = u_chromaticOffset * pixel.x * intensity;
    vec2 uvR = uv + displacement + vec2(chromatic, 0.0);
    vec2 uvB = uv + displacement - vec2(chromatic, 0.0);

    // Scanlines
    float scanline = sin(uv.y * u_resolution.y * 1.5) * 0.03 * intensity;

    // Random bands
    float band = step(0.99 - intensity * 0.15, hash(vec2(floor(t * 10.0), floor(uv.y * 20.0))));
    float bandShift = band * 0.02 * intensity;
    uvR.x += bandShift;
    uvB.x -= bandShift;

    // Encode displacement into colour channels
    float r = clamp(uvR.x - uv.x + 0.5, 0.0, 1.0);
    float g = clamp(displacement.y + 0.5, 0.0, 1.0);
    float b = clamp(uvB.x - uv.x + 0.5, 0.0, 1.0);

    float alpha = intensity * (0.15 + scanline + band * 0.4);
    gl_FragColor = vec4(r, g, b, alpha);
}
`;

export class GlitchEngine {
    private canvas: HTMLCanvasElement | null = null;
    private gl: WebGLRenderingContext | null = null;
    private program: WebGLProgram | null = null;
    private destroyed = false;
    private webglSupported = true;

    // Uniform locations
    private uTime = -1;
    private uIntensity = -1;
    private uNoiseFactor = -1;
    private uChromaticOffset = -1;
    private uResolution = -1;

    private boundResize: (() => void) | null = null;

    // ── Public check ──────────────────────────────────────────────────────
    isSupported(): boolean {
        return this.webglSupported;
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────
    init(container: HTMLElement) {
        this.canvas = document.createElement('canvas');
        this.canvas.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      z-index: 2;
      mix-blend-mode: screen;
    `;
        container.appendChild(this.canvas);

        // Try WebGL
        this.gl = this.canvas.getContext('webgl', {
            premultipliedAlpha: false,
            alpha: true,
            antialias: false,
        });

        if (!this.gl) {
            this.webglSupported = false;
            console.warn('[GlitchEngine] WebGL not available — using CSS fallback');
            this.canvas.remove();
            this.canvas = null;
            return;
        }

        this.resize();
        this.boundResize = () => this.resize();
        window.addEventListener('resize', this.boundResize);

        this.buildProgram();
        this.buildGeometry();
    }

    private resize() {
        if (!this.canvas || !this.gl) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.gl.viewport(0, 0, w * dpr, h * dpr);
    }

    private compileShader(type: number, source: string): WebGLShader | null {
        const gl = this.gl!;
        const shader = gl.createShader(type);
        if (!shader) return null;

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('[GlitchEngine] Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    private buildProgram() {
        const gl = this.gl!;
        const vertShader = this.compileShader(gl.VERTEX_SHADER, VERT_SRC);
        const fragShader = this.compileShader(gl.FRAGMENT_SHADER, FRAG_SRC);
        if (!vertShader || !fragShader) {
            this.webglSupported = false;
            return;
        }

        this.program = gl.createProgram();
        if (!this.program) return;

        gl.attachShader(this.program, vertShader);
        gl.attachShader(this.program, fragShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('[GlitchEngine] Program link error:', gl.getProgramInfoLog(this.program));
            this.webglSupported = false;
            return;
        }

        gl.useProgram(this.program);

        // Cache uniform locations
        this.uTime = gl.getUniformLocation(this.program, 'u_time') as number;
        this.uIntensity = gl.getUniformLocation(this.program, 'u_intensity') as number;
        this.uNoiseFactor = gl.getUniformLocation(this.program, 'u_noiseFactor') as number;
        this.uChromaticOffset = gl.getUniformLocation(this.program, 'u_chromaticOffset') as number;
        this.uResolution = gl.getUniformLocation(this.program, 'u_resolution') as number;
    }

    private buildGeometry() {
        const gl = this.gl!;
        if (!this.program) return;

        // Fullscreen quad
        const positions = new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1,
        ]);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        const aPosition = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
    }

    // ── Called every frame ────────────────────────────────────────────────
    render(time: number) {
        if (this.destroyed || !this.gl || !this.program || !this.webglSupported) return;

        const gl = this.gl;
        const visuals = stateManager.getVisuals();

        // Skip render if no effect needed
        if (visuals.glitchIntensity < 0.001) {
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            return;
        }

        gl.useProgram(this.program);

        // Update uniforms
        gl.uniform1f(this.uTime, time * 0.001);
        gl.uniform1f(this.uIntensity, visuals.glitchIntensity);
        gl.uniform1f(this.uNoiseFactor, visuals.noiseOpacity * 5);
        gl.uniform1f(this.uChromaticOffset, visuals.chromaticOffset);
        gl.uniform2f(this.uResolution, this.canvas!.width, this.canvas!.height);

        // Enable blending for transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    destroy() {
        this.destroyed = true;
        if (this.boundResize) window.removeEventListener('resize', this.boundResize);
        if (this.gl && this.program) {
            this.gl.deleteProgram(this.program);
        }
        this.canvas?.remove();
        this.canvas = null;
        this.gl = null;
    }
}
