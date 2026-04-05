// Multiverse Glitch Fragment Shader
// Fluid distortion with wave displacement, chromatic aberration, and noise ripple

precision mediump float;

varying vec2 v_texCoord;

uniform float u_time;
uniform float u_intensity;      // 0.0 – 1.0
uniform float u_noiseFactor;    // 0.0 – 1.0
uniform float u_chromaticOffset;// px offset for RGB split
uniform vec2  u_resolution;

// ── Simplex-inspired hash ───────────────────────────────────────────────
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

// ── Fractal noise ───────────────────────────────────────────────────────
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
        // No effect — output transparent
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        return;
    }

    // ── 1. Wave distortion ──────────────────────────────────────────
    float wave = sin(uv.y * 20.0 + t * 3.0) * 0.003 * intensity;
    wave += sin(uv.x * 15.0 + t * 2.0) * 0.002 * intensity;

    // ── 2. Noise-based displacement ─────────────────────────────────
    float n = fbm(uv * 8.0 + t * 0.5) * u_noiseFactor * intensity;
    vec2 displacement = vec2(wave + n * 0.008, n * 0.005);

    // ── 3. Chromatic aberration (RGB channel split) ──────────────────
    float chromatic = u_chromaticOffset * pixel.x * intensity;
    
    vec2 uvR = uv + displacement + vec2(chromatic, 0.0);
    vec2 uvG = uv + displacement;
    vec2 uvB = uv + displacement - vec2(chromatic, 0.0);

    // ── 4. Scanline effect ──────────────────────────────────────────
    float scanline = sin(uv.y * u_resolution.y * 1.5) * 0.03 * intensity;

    // ── 5. Random glitch bands ──────────────────────────────────────
    float band = step(0.99 - intensity * 0.15, hash(vec2(floor(t * 10.0), floor(uv.y * 20.0))));
    float bandShift = band * 0.02 * intensity;

    uvR.x += bandShift;
    uvB.x -= bandShift;

    // ── Output ──────────────────────────────────────────────────────
    // We output the distortion as color-encoded displacement data
    // The React layer reads this to apply effects
    float r = clamp(uvR.x - uv.x + 0.5, 0.0, 1.0);
    float g = clamp(uvG.y - uv.y + 0.5, 0.0, 1.0);
    float b = clamp(uvB.x - uv.x + 0.5, 0.0, 1.0);

    float alpha = intensity * (0.3 + scanline + band * 0.5);

    gl_FragColor = vec4(r, g, b, alpha);
}
