
uniform float uTime;
uniform float uCompression;
uniform vec2 uResolution;

varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    
    // Calculate distance from center
    vec2 center = vec2(0.5);
    vec2 dir = uv - center;
    float dist = length(dir);
    
    // Apply subtle pinch/bulge based on compression
    // uCompression goes 0 -> 1 -> 0
    // Positive strength = pinch (pull inward)
    float strength = uCompression * 0.15; 
    
    // Smooth falloff
    float influence = smoothstep(0.0, 1.0, 1.0 - dist);
    
    // Distort UV
    uv -= dir * strength * influence;
    
    // Add subtle chromatic aberration at edges during compression
    float aberration = uCompression * 0.005 * dist;
    
    vec4 color;
    color.r = texture2D(tDiffuse, uv + vec2(aberration, 0.0)).r;
    color.g = texture2D(tDiffuse, uv).g;
    color.b = texture2D(tDiffuse, uv - vec2(aberration, 0.0)).b;
    color.a = 1.0;
    
    // Vignette pulse
    float vignette = 1.0 - (dist * uCompression * 0.5);
    color.rgb *= vignette;

    gl_FragColor = color;
}
