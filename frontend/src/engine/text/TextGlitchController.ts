import { VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE } from "./TextGlitchShaders";

/**
 * TextGlitchController
 * ====================
 * Orchestra: Single global overlay canvas.
 * Tech: WebGL + 2D Offscreen Canvas for texture generation.
 * Logic: Renders only active targets with intensity > 0.
 */

interface GlitchTarget {
    id: string;
    element: HTMLElement;
    texture: WebGLTexture | null;
    textureWidth: number;
    textureHeight: number;
    intensity: number;
    targetIntensity: number;
    text: string;
    font: string;
    color: string;
    bounds: DOMRect;
    needsUpdate: boolean;
}

export class TextGlitchController {
    private static instance: TextGlitchController;
    private canvas: HTMLCanvasElement;
    private gl: WebGLRenderingContext | null = null;
    private program: WebGLProgram | null = null;

    // Offscreen 2D canvas for rasterizing text
    private textCanvas: HTMLCanvasElement;
    private textCtx: CanvasRenderingContext2D | null = null;

    private targets: Map<string, GlitchTarget> = new Map();
    private isRunning: boolean = false;
    private startTime: number = 0;
    private dpr: number = 1;

    // WebGL Buffers
    private positionBuffer: WebGLBuffer | null = null;
    private texCoordBuffer: WebGLBuffer | null = null;

    // Locations
    private attribs: { position: number; texCoord: number } | null = null;
    private uniforms: { texture: WebGLUniformLocation | null; time: WebGLUniformLocation | null; intensity: WebGLUniformLocation | null } | null = null;

    private constructor() {
        // Check SSR
        if (typeof window === "undefined") {
            this.canvas = null!; // Safe cast for SSR check
            this.textCanvas = null!;
            return;
        }

        this.dpr = Math.min(window.devicePixelRatio || 1, 2);

        // Create main overlay canvas
        this.canvas = document.createElement("canvas");
        this.canvas.id = "text-glitch-overlay";
        Object.assign(this.canvas.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: "9999", // Topmost
        });
        document.body.appendChild(this.canvas);

        // Create offscreen text canvas
        this.textCanvas = document.createElement("canvas");
        this.textCtx = this.textCanvas.getContext("2d", { willReadFrequently: true });

        this.initWebGL();
        this.resize();

        window.addEventListener("resize", () => this.resize());

        // Auto-bind mutation observer
        this.initMutationObserver();

        this.startTime = performance.now();
        this.loop();
    }

    public static getInstance(): TextGlitchController {
        if (!TextGlitchController.instance) {
            TextGlitchController.instance = new TextGlitchController();
        }
        return TextGlitchController.instance;
    }

    private initWebGL() {
        this.gl = this.canvas.getContext("webgl", { alpha: true, depth: false, antialias: false });
        if (!this.gl) return;

        this.program = this.createProgram(VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);
        if (!this.program) return;

        this.gl.useProgram(this.program);

        // Attributes
        this.attribs = {
            position: this.gl.getAttribLocation(this.program, "aPosition"),
            texCoord: this.gl.getAttribLocation(this.program, "aTexCoord"),
        };

        // Uniforms
        this.uniforms = {
            texture: this.gl.getUniformLocation(this.program, "uTexture"),
            time: this.gl.getUniformLocation(this.program, "uTime"),
            intensity: this.gl.getUniformLocation(this.program, "uIntensity"),
        };

        // Buffers (Quad)
        this.positionBuffer = this.gl.createBuffer();
        this.texCoordBuffer = this.gl.createBuffer();

        // Standard quad vertices (will be updated per target)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1,
        ]), this.gl.STATIC_DRAW);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
            0, 1,
            1, 1,
            0, 0,
            0, 0,
            1, 1,
            1, 0,
        ]), this.gl.STATIC_DRAW);
    }

    private createProgram(vert: string, frag: string): WebGLProgram | null {
        if (!this.gl) return null;
        const program = this.gl.createProgram();
        if (!program) return null;

        const vs = this.createShader(this.gl.VERTEX_SHADER, vert);
        const fs = this.createShader(this.gl.FRAGMENT_SHADER, frag);

        if (!vs || !fs) return null;

        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, fs);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error(this.gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }

    private createShader(type: number, source: string): WebGLShader | null {
        if (!this.gl) return null;
        const shader = this.gl.createShader(type);
        if (!shader) return null;
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error(this.gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }

    private resize() {
        if (!this.canvas || !this.gl) return;
        this.canvas.width = window.innerWidth * this.dpr;
        this.canvas.height = window.innerHeight * this.dpr;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    // ── Public API ─────────────────────────────────────────────────────────────

    public register(element: HTMLElement, options: { intensity?: "low" | "medium" | "high" } = {}) {
        const id = element.id || Math.random().toString(36).substr(2, 9);
        if (this.targets.has(id)) return;

        // Initial capture
        const computed = window.getComputedStyle(element);

        // Map intensity string to numeric multiplier
        let intensityMult = 1.0;
        if (options.intensity === "low") intensityMult = 0.5;
        if (options.intensity === "high") intensityMult = 1.5;
        if (options.intensity === "medium") intensityMult = 1.0; // Restored default

        this.targets.set(id, {
            id,
            element,
            texture: null,
            textureWidth: 0,
            textureHeight: 0,
            intensity: 0,
            targetIntensity: 0,
            text: element.innerText,
            font: `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`,
            color: computed.color,
            bounds: element.getBoundingClientRect(),
            needsUpdate: true,
            // @ts-ignore - attaching config to target for reference
            config: { intensityMult }
        });
    }

    public unregister(element: HTMLElement) {
        for (const [id, target] of this.targets.entries()) {
            if (target.element === element) {
                // Cleanup texture
                if (target.texture && this.gl) {
                    this.gl.deleteTexture(target.texture);
                }
                this.targets.delete(id);
                break;
            }
        }
    }

    public setHover(element: HTMLElement, isHovering: boolean) {
        // Find target
        for (const target of this.targets.values()) {
            if (target.element === element) {
                // @ts-ignore
                const mult = target.config?.intensityMult || 1.0;

                // Spike effect: On hover enter, jump higher then start decaying/settling
                target.targetIntensity = isHovering ? 1.0 : 0.0;

                if (isHovering) {
                    target.bounds = element.getBoundingClientRect();
                    target.needsUpdate = true;
                    // Initial spike
                    target.intensity = 1.0 * mult;
                }
                break;
            }
        }
        // Start loop if not running
        if (!this.isRunning) {
            this.isRunning = true;
            this.loop();
        }
    }

    // ── Render Logic ───────────────────────────────────────────────────────────

    private updateTexture(target: GlitchTarget) {
        if (!this.gl || !this.textCtx || !this.textCanvas) return;

        // Measure text
        this.textCtx.font = target.font;
        const metrics = this.textCtx.measureText(target.text);
        const width = Math.ceil(target.bounds.width * this.dpr);
        const height = Math.ceil(target.bounds.height * this.dpr);

        // Resize safely (power of 2 not strictly required for WebGL2/modern WebGL1 extensions but good practice)
        // We just use NPOT here with LINEAR filtering
        this.textCanvas.width = width;
        this.textCanvas.height = height;

        this.textCtx.clearRect(0, 0, width, height);
        this.textCtx.font = target.font;
        this.textCtx.fillStyle = target.color;
        this.textCtx.textBaseline = "middle";
        this.textCtx.textAlign = "center";

        // Draw centered
        this.textCtx.fillText(target.text, width / 2, height / 2);

        // Upload to GL
        if (!target.texture) {
            target.texture = this.gl.createTexture();
        }

        this.gl.bindTexture(this.gl.TEXTURE_2D, target.texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.textCanvas);

        // Set parameters
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        target.needsUpdate = false;
        target.textureWidth = width;
        target.textureHeight = height;
    }

    private loop() {
        if (!this.gl || !this.canvas || !this.attribs || !this.uniforms || !this.program) return;

        const now = (performance.now() - this.startTime) / 1000.0;

        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Enable blending for transparent text
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        let activeCount = 0;

        const gl = this.gl;
        const attribs = this.attribs;
        const uniforms = this.uniforms;
        const program = this.program;

        const toRemove: string[] = [];

        this.targets.forEach((target, id) => {
            // Memory safety: Prune detached elements
            if (!document.body.contains(target.element)) {
                toRemove.push(id);
                return;
            }

            // LERP intensity
            // If hovering: settle to lower sustained value
            // If not hovering: decay to 0
            // @ts-ignore
            const mult = target.config?.intensityMult || 1.0;
            const dest = target.targetIntensity > 0 ? (0.6 * mult) : 0.0;

            target.intensity += (dest - target.intensity) * 0.1;

            if (Math.abs(target.intensity) < 0.01 && target.targetIntensity === 0) {
                target.intensity = 0;
                return; // Skip rendering
            }

            activeCount++;

            // Render texture if stale
            if (target.needsUpdate) {
                this.updateTexture(target);
            }

            if (!target.texture) return;

            // Calculate normalized device coordinates
            const rect = target.bounds;
            // Convert screen px to clip space (-1 to 1)
            // Y is inverted in WebGL
            const x1 = (rect.left / window.innerWidth) * 2 - 1;
            const y1 = 1 - (rect.bottom / window.innerHeight) * 2;
            const x2 = (rect.right / window.innerWidth) * 2 - 1;
            const y2 = 1 - (rect.top / window.innerHeight) * 2;

            // Update Position Buffer for this quad
            gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                x1, y1,
                x2, y1,
                x1, y2,
                x1, y2,
                x2, y1,
                x2, y2,
            ]), gl.DYNAMIC_DRAW);

            gl.useProgram(program);

            // Bind Texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, target.texture);
            gl.uniform1i(uniforms!.texture, 0);

            // Update Uniforms
            gl.uniform1f(uniforms!.time, now);
            gl.uniform1f(uniforms!.intensity, target.intensity);

            // Draw
            if (attribs) {
                gl.enableVertexAttribArray(attribs.position);
                gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
                gl.vertexAttribPointer(attribs.position, 2, gl.FLOAT, false, 0, 0);

                gl.enableVertexAttribArray(attribs.texCoord);
                gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
                gl.vertexAttribPointer(attribs.texCoord, 2, gl.FLOAT, false, 0, 0);
            }

            gl.drawArrays(gl.TRIANGLES, 0, 6);
        });

        // Cleanup detached
        toRemove.forEach(id => {
            const t = this.targets.get(id);
            if (t && t.texture) this.gl?.deleteTexture(t.texture);
            this.targets.delete(id);
        });

        if (activeCount > 0) {
            requestAnimationFrame(() => this.loop());
        } else {
            this.isRunning = false;
            gl.clear(gl.COLOR_BUFFER_BIT); // Clear last frame
        }
    }

    // ── Auto-Bind ──────────────────────────────────────────────────────────────
    private initMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === "childList") {
                    mutation.addedNodes.forEach((node) => {
                        if (node instanceof HTMLElement) {
                            this.scanNode(node);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
        this.scanNode(document.body);
    }

    private scanNode(node: HTMLElement) {
        if (node.dataset?.glitchable === "true") {
            this.register(node);
            // Bind hover events automatically
            node.addEventListener("mouseenter", () => this.setHover(node, true));
            node.addEventListener("mouseleave", () => this.setHover(node, false));
        }
        // Deep scan? Might be expensive. 
        // Better: Rely on React hook for explicit components, and dataset for static HTML.
        // Query selector is faster.
        const children = node.querySelectorAll('[data-glitchable="true"]');
        children.forEach((el) => {
            if (el instanceof HTMLElement) {
                this.register(el);
                el.addEventListener("mouseenter", () => this.setHover(el, true));
                el.addEventListener("mouseleave", () => this.setHover(el, false));
            }
        });
    }
}
