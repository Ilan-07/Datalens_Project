precision mediump float;

varying vec2 vTexCoord;

uniform sampler2D uTexture;
uniform float uTime;
uniform float uIntensity;      // 0.0 to 1.0 (driven by hover)

// ── Pseudo-random ────────────────────────────────────────────────────────────
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// ── Simplex Noise (Approximation) ──────────────────────────────────────────
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

void main() {
    vec2 uv = vTexCoord;
    
    // Smooth intensity curve
    float glitch = smoothstep(0.0, 1.0, uIntensity);
    
    // ── 1. Blocky Pixel Quantization ─────────────────────────────────────────
    float quantize = 50.0 + (1.0 - glitch) * 500.0;
    vec2 pixelUV = floor(uv * quantize) / quantize;
    
    // But we want to mix quantized UVs based on intensity
    vec2 finalUV = mix(uv, pixelUV, glitch * 0.4);

    // ── 2. Fluid Wave Distortion ─────────────────────────────────────────────
    float wave = noise(vec2(uv.y * 8.0, uTime * 3.0));
    float xOffset = (wave - 0.5) * 0.05 * glitch;
    
    // ── 3. Chromatic Aberration (RGB Split) ──────────────────────────────────
    float rOffset = xOffset + (0.01 * glitch);
    float bOffset = xOffset - (0.01 * glitch);
    
    // Sample texture with offsets
    vec4 texR = texture2D(uTexture, vec2(finalUV.x + rOffset, finalUV.y));
    vec4 texG = texture2D(uTexture, vec2(finalUV.x + xOffset, finalUV.y));
    vec4 texB = texture2D(uTexture, vec2(finalUV.x + bOffset, finalUV.y));
    
    // ── 4. Grain / Noise Overlay ─────────────────────────────────────────────
    float grain = random(uv * (uTime * 10.0)) * 0.15 * glitch;
    
    // ── 5. Scanlines ─────────────────────────────────────────────────────────
    float scanline = sin(uv.y * 800.0) * 0.05 * glitch;

    // Combine channels
    vec3 color = vec3(texR.r, texG.g, texB.b);
    float alpha = max(max(texR.a, texG.a), texB.a); // Max alpha to catch split edges
    
    // Apply grain
    color += grain;
    
    // Output
    gl_FragColor = vec4(color, alpha * (1.0 - scanline));
}
