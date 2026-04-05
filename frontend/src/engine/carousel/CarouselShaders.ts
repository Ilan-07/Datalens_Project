export const vertexShader = `
  varying vec2 vUv;
  varying vec3 vViewPosition;

  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const fragmentShader = `
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uHoverState;      // 0.0 = idle, 1.0 = full hover
  uniform float uGlitchIntensity; // Multiplier for distortion
  uniform float uCornerRadius; 
  uniform float uBlurStrength; // 0.0 = sharp, 1.0 = blurry

  varying vec2 vUv;

  // Simple pseudo-random function
  float rand(vec2 co) {
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
  }

  // Noise function
  float noise(vec2 p) {
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);
    
    float res = mix(
      mix(rand(ip), rand(ip+vec2(1.0,0.0)), u.x),
      mix(rand(ip+vec2(0.0,1.0)), rand(ip+vec2(1.0,1.0)), u.x), u.y);
    return res*res;
  }


  void main() {
    vec2 uv = vUv;
    
    // ... glitch logic ...
    float glitchAmount = uHoverState * uGlitchIntensity;
    
    // Blur Logic (Simple 5-tap Gaussian-ish)
    // We only blur if uBlurStrength > 0.01
    vec4 color = vec4(0.0);
    if (uBlurStrength > 0.01) {
        float off = uBlurStrength * 0.02; // Blur radius
        color += texture2D(uTexture, uv) * 0.4;
        color += texture2D(uTexture, uv + vec2(off, 0.0)) * 0.15;
        color += texture2D(uTexture, uv - vec2(off, 0.0)) * 0.15;
        color += texture2D(uTexture, uv + vec2(0.0, off)) * 0.15;
        color += texture2D(uTexture, uv - vec2(0.0, off)) * 0.15;
    } else {
         // Standard Glitch sampling
         // 1. Horizontal Slicing
        float sliceY = floor(uv.y * 10.0 + uTime * 2.0);
        float sliceNoise = noise(vec2(sliceY, uTime)) * 2.0 - 1.0;
        float sliceOffset = sliceNoise * 0.05 * glitchAmount;
        
        // 2. RGB Shift
        float rOffset = sliceOffset + (0.02 * glitchAmount * noise(vec2(uTime * 10.0, uv.y)));
        float gOffset = sliceOffset;
        float bOffset = sliceOffset - (0.02 * glitchAmount * noise(vec2(uTime * 15.0, uv.y)));
        
        // 3. Wave Distortion
        float wave = sin(uv.y * 20.0 + uTime * 5.0) * 0.01 * glitchAmount;
        
        vec4 r = texture2D(uTexture, vec2(uv.x + rOffset + wave, uv.y));
        vec4 g = texture2D(uTexture, vec2(uv.x + gOffset + wave, uv.y));
        vec4 b = texture2D(uTexture, vec2(uv.x + bOffset + wave, uv.y));
        
        float alpha = max(max(r.a, g.a), b.a);
        color = vec4(r.r, g.g, b.b, alpha);
    }
    
    // Scanline
    float scanline = sin(uv.y * 800.0) * 0.1 * uHoverState;
    gl_FragColor = vec4(color.rgb, color.a - scanline);
  }

`;
