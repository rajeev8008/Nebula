(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/ui/animated-shader-hero.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/styled-jsx/style.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
// Default shader source for WebGL
const defaultShaderSource = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)

float rnd(vec2 p) {
  p=fract(p*vec2(12.9898,78.233));
  p+=dot(p,p+34.56);
  return fract(p.x*p.y);
}

float noise(in vec2 p) {
  vec2 i=floor(p), f=fract(p), u=f*f*(3.-2.*f);
  float a=rnd(i), b=rnd(i+vec2(1,0)), c=rnd(i+vec2(0,1)), d=rnd(i+1.);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}

float fbm(vec2 p) {
  float t=.0, a=1.; mat2 m=mat2(1.,-.5,.2,1.2);
  for (int i=0; i<5; i++) {
    t+=a*noise(p);
    p*=2.*m;
    a*=.5;
  }
  return t;
}

float clouds(vec2 p) {
  float d=1., t=.0;
  for (float i=.0; i<3.; i++) {
    float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p);
    t=mix(t,d,a);
    d=a;
    p*=2./(i+1.);
  }
  return t;
}

void main(void) {
  vec2 uv=(FC-.5*R)/MN,st=uv*vec2(2,1);
  vec3 col=vec3(0);
  float bg=clouds(vec2(st.x+T*.5,-st.y));
  uv*=1.-.3*(sin(T*.2)*.5+.5);
  for (float i=1.; i<12.; i++) {
    uv+=.1*cos(i*vec2(.1+.01*i, .8)+i*i+T*.5+.1*uv.x);
    vec2 p=uv;
    float d=length(p);
    col+=.00125/d*(cos(sin(i)*vec3(1,2,3))+1.);
    float b=noise(i+p+bg*1.731);
    col+=.002*b/length(max(p,vec2(b*p.x*.02,p.y)));
    col=mix(col,vec3(bg*.25,bg*.137,bg*.05),d);
  }
  O=vec4(col,1);
}`;
// WebGL Renderer Class
class WebGLRenderer {
    constructor(canvas, scale){
        this.canvas = canvas;
        this.scale = scale;
        this.gl = canvas.getContext('webgl2');
        this.gl.viewport(0, 0, canvas.width * scale, canvas.height * scale);
        this.shaderSource = defaultShaderSource;
        this.mouseMove = [
            0,
            0
        ];
        this.mouseCoords = [
            0,
            0
        ];
        this.pointerCoords = [
            0,
            0
        ];
        this.nbrOfPointers = 0;
        this.vertexSrc = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;
        this.vertices = [
            -1,
            1,
            -1,
            -1,
            1,
            1,
            1,
            -1
        ];
    }
    updateShader(source) {
        this.reset();
        this.shaderSource = source;
        this.setup();
        this.init();
    }
    updateMove(deltas) {
        this.mouseMove = deltas;
    }
    updateMouse(coords) {
        this.mouseCoords = coords;
    }
    updatePointerCoords(coords) {
        this.pointerCoords = coords;
    }
    updatePointerCount(nbr) {
        this.nbrOfPointers = nbr;
    }
    updateScale(scale) {
        this.scale = scale;
        this.gl.viewport(0, 0, this.canvas.width * scale, this.canvas.height * scale);
    }
    compile(shader, source) {
        const gl = this.gl;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(shader);
            console.error('Shader compilation error:', error);
        }
    }
    test(source) {
        let result = null;
        const gl = this.gl;
        const shader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            result = gl.getShaderInfoLog(shader);
        }
        gl.deleteShader(shader);
        return result;
    }
    reset() {
        const gl = this.gl;
        if (this.program && !gl.getProgramParameter(this.program, gl.DELETE_STATUS)) {
            if (this.vs) {
                gl.detachShader(this.program, this.vs);
                gl.deleteShader(this.vs);
            }
            if (this.fs) {
                gl.detachShader(this.program, this.fs);
                gl.deleteShader(this.fs);
            }
            gl.deleteProgram(this.program);
        }
    }
    setup() {
        const gl = this.gl;
        this.vs = gl.createShader(gl.VERTEX_SHADER);
        this.fs = gl.createShader(gl.FRAGMENT_SHADER);
        this.compile(this.vs, this.vertexSrc);
        this.compile(this.fs, this.shaderSource);
        this.program = gl.createProgram();
        gl.attachShader(this.program, this.vs);
        gl.attachShader(this.program, this.fs);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(this.program));
        }
    }
    init() {
        const gl = this.gl;
        const program = this.program;
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
        const position = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        program.resolution = gl.getUniformLocation(program, 'resolution');
        program.time = gl.getUniformLocation(program, 'time');
        program.move = gl.getUniformLocation(program, 'move');
        program.touch = gl.getUniformLocation(program, 'touch');
        program.pointerCount = gl.getUniformLocation(program, 'pointerCount');
        program.pointers = gl.getUniformLocation(program, 'pointers');
    }
    render(now = 0) {
        const gl = this.gl;
        const program = this.program;
        if (!program || gl.getProgramParameter(program, gl.DELETE_STATUS)) return;
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.uniform2f(program.resolution, this.canvas.width, this.canvas.height);
        gl.uniform1f(program.time, now * 1e-3);
        gl.uniform2f(program.move, ...this.mouseMove);
        gl.uniform2f(program.touch, ...this.mouseCoords);
        gl.uniform1i(program.pointerCount, this.nbrOfPointers);
        gl.uniform2fv(program.pointers, this.pointerCoords);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}
// Pointer Handler Class
class PointerHandler {
    constructor(element, scale){
        this.scale = scale;
        this.active = false;
        this.pointers = new Map();
        this.lastCoords = [
            0,
            0
        ];
        this.moves = [
            0,
            0
        ];
        const map = (element, scale, x, y)=>[
                x * scale,
                element.height - y * scale
            ];
        element.addEventListener('pointerdown', (e)=>{
            this.active = true;
            this.pointers.set(e.pointerId, map(element, this.getScale(), e.clientX, e.clientY));
        });
        element.addEventListener('pointerup', (e)=>{
            if (this.count === 1) {
                this.lastCoords = this.first;
            }
            this.pointers.delete(e.pointerId);
            this.active = this.pointers.size > 0;
        });
        element.addEventListener('pointerleave', (e)=>{
            if (this.count === 1) {
                this.lastCoords = this.first;
            }
            this.pointers.delete(e.pointerId);
            this.active = this.pointers.size > 0;
        });
        element.addEventListener('pointermove', (e)=>{
            if (!this.active) return;
            this.lastCoords = [
                e.clientX,
                e.clientY
            ];
            this.pointers.set(e.pointerId, map(element, this.getScale(), e.clientX, e.clientY));
            this.moves = [
                this.moves[0] + e.movementX,
                this.moves[1] + e.movementY
            ];
        });
    }
    getScale() {
        return this.scale;
    }
    updateScale(scale) {
        this.scale = scale;
    }
    get count() {
        return this.pointers.size;
    }
    get move() {
        return this.moves;
    }
    get coords() {
        return this.pointers.size > 0 ? Array.from(this.pointers.values()).flat() : [
            0,
            0
        ];
    }
    get first() {
        return this.pointers.values().next().value || this.lastCoords;
    }
}
// Hook for shader background
const useShaderBackground = ()=>{
    _s();
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const animationFrameRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])();
    const rendererRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const pointersRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const resize = ()=>{
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const dpr = Math.max(1, 0.5 * window.devicePixelRatio);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        if (rendererRef.current) {
            rendererRef.current.updateScale(dpr);
        }
    };
    const loop = (now)=>{
        if (!rendererRef.current || !pointersRef.current) return;
        rendererRef.current.updateMouse(pointersRef.current.first);
        rendererRef.current.updatePointerCount(pointersRef.current.count);
        rendererRef.current.updatePointerCoords(pointersRef.current.coords);
        rendererRef.current.updateMove(pointersRef.current.move);
        rendererRef.current.render(now);
        animationFrameRef.current = requestAnimationFrame(loop);
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useShaderBackground.useEffect": ()=>{
            if (!canvasRef.current) return;
            const canvas = canvasRef.current;
            const dpr = Math.max(1, 0.5 * window.devicePixelRatio);
            rendererRef.current = new WebGLRenderer(canvas, dpr);
            pointersRef.current = new PointerHandler(canvas, dpr);
            rendererRef.current.setup();
            rendererRef.current.init();
            resize();
            if (rendererRef.current.test(defaultShaderSource) === null) {
                rendererRef.current.updateShader(defaultShaderSource);
            }
            loop(0);
            window.addEventListener('resize', resize);
            return ({
                "useShaderBackground.useEffect": ()=>{
                    window.removeEventListener('resize', resize);
                    if (animationFrameRef.current) {
                        cancelAnimationFrame(animationFrameRef.current);
                    }
                    if (rendererRef.current) {
                        rendererRef.current.reset();
                    }
                }
            })["useShaderBackground.useEffect"];
        }
    }["useShaderBackground.useEffect"], []);
    return canvasRef;
};
_s(useShaderBackground, "SXJQAfR4qAT1hecdyVzb2+gTFwk=");
// Main Hero Component
const Hero = ({ trustBadge, headline, subtitle, buttons })=>{
    _s1();
    const canvasRef = useShaderBackground();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            position: 'relative',
            width: '100%',
            height: '100vh',
            overflow: 'hidden',
            background: 'black'
        },
        className: "jsx-582dd5fa6725fb3f",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                id: "582dd5fa6725fb3f",
                children: "@keyframes fade-in-down{0%{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}@keyframes fade-in-up{0%{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}.animate-fade-in-down.jsx-582dd5fa6725fb3f{animation:.8s ease-out forwards fade-in-down}.animate-fade-in-up.jsx-582dd5fa6725fb3f{opacity:0;animation:.8s ease-out forwards fade-in-up}.animation-delay-200.jsx-582dd5fa6725fb3f{animation-delay:.2s}.animation-delay-400.jsx-582dd5fa6725fb3f{animation-delay:.4s}.animation-delay-600.jsx-582dd5fa6725fb3f{animation-delay:.6s}.animation-delay-800.jsx-582dd5fa6725fb3f{animation-delay:.8s}"
            }, void 0, false, void 0, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                ref: canvasRef,
                style: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    touchAction: 'none',
                    background: 'black'
                },
                className: "jsx-582dd5fa6725fb3f"
            }, void 0, false, {
                fileName: "[project]/components/ui/animated-shader-hero.js",
                lineNumber: 400,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    pointerEvents: 'auto'
                },
                className: "jsx-582dd5fa6725fb3f",
                children: [
                    trustBadge && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginBottom: '2rem'
                        },
                        className: "jsx-582dd5fa6725fb3f" + " " + "animate-fade-in-down",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                paddingLeft: '1.5rem',
                                paddingRight: '1.5rem',
                                paddingTop: '0.75rem',
                                paddingBottom: '0.75rem',
                                background: 'rgba(6, 182, 212, 0.1)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(34, 211, 238, 0.3)',
                                borderRadius: '9999px',
                                fontSize: '0.875rem'
                            },
                            className: "jsx-582dd5fa6725fb3f",
                            children: [
                                trustBadge.icons && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        display: 'flex'
                                    },
                                    className: "jsx-582dd5fa6725fb3f",
                                    children: trustBadge.icons.map((icon, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            style: {
                                                marginRight: '0.25rem'
                                            },
                                            className: "jsx-582dd5fa6725fb3f",
                                            children: icon
                                        }, index, false, {
                                            fileName: "[project]/components/ui/animated-shader-hero.js",
                                            lineNumber: 453,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0)))
                                }, void 0, false, {
                                    fileName: "[project]/components/ui/animated-shader-hero.js",
                                    lineNumber: 451,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    style: {
                                        color: 'rgba(165, 243, 252, 1)'
                                    },
                                    className: "jsx-582dd5fa6725fb3f",
                                    children: trustBadge.text
                                }, void 0, false, {
                                    fileName: "[project]/components/ui/animated-shader-hero.js",
                                    lineNumber: 459,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/ui/animated-shader-hero.js",
                            lineNumber: 434,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/components/ui/animated-shader-hero.js",
                        lineNumber: 433,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.5rem',
                            maxWidth: '56rem',
                            marginLeft: 'auto',
                            marginRight: 'auto',
                            paddingLeft: '1rem',
                            paddingRight: '1rem'
                        },
                        className: "jsx-582dd5fa6725fb3f",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem'
                                },
                                className: "jsx-582dd5fa6725fb3f",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        style: {
                                            fontSize: 'clamp(2rem, 8vw, 4.5rem)',
                                            fontWeight: 700,
                                            background: 'linear-gradient(to right, rgb(6, 182, 212), rgb(14, 165, 233), rgb(59, 130, 246))',
                                            backgroundClip: 'text',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent'
                                        },
                                        className: "jsx-582dd5fa6725fb3f" + " " + "animate-fade-in-up animation-delay-200",
                                        children: headline.line1
                                    }, void 0, false, {
                                        fileName: "[project]/components/ui/animated-shader-hero.js",
                                        lineNumber: 479,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        style: {
                                            fontSize: 'clamp(2rem, 8vw, 4.5rem)',
                                            fontWeight: 700,
                                            background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(139, 92, 246), rgb(168, 85, 247))',
                                            backgroundClip: 'text',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent'
                                        },
                                        className: "jsx-582dd5fa6725fb3f" + " " + "animate-fade-in-up animation-delay-400",
                                        children: headline.line2
                                    }, void 0, false, {
                                        fileName: "[project]/components/ui/animated-shader-hero.js",
                                        lineNumber: 492,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ui/animated-shader-hero.js",
                                lineNumber: 478,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    maxWidth: '48rem',
                                    marginLeft: 'auto',
                                    marginRight: 'auto'
                                },
                                className: "jsx-582dd5fa6725fb3f" + " " + "animate-fade-in-up animation-delay-600",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    style: {
                                        fontSize: 'clamp(1rem, 3vw, 1.5rem)',
                                        color: 'rgba(209, 250, 229, 0.9)',
                                        fontWeight: 300,
                                        lineHeight: 1.5
                                    },
                                    className: "jsx-582dd5fa6725fb3f",
                                    children: subtitle
                                }, void 0, false, {
                                    fileName: "[project]/components/ui/animated-shader-hero.js",
                                    lineNumber: 516,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/components/ui/animated-shader-hero.js",
                                lineNumber: 508,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            buttons && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem',
                                    justifyContent: 'center',
                                    marginTop: '2.5rem',
                                    flexWrap: 'wrap'
                                },
                                className: "jsx-582dd5fa6725fb3f" + " " + "animate-fade-in-up animation-delay-800",
                                children: [
                                    buttons.primary && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: buttons.primary.onClick,
                                        style: {
                                            paddingLeft: '2rem',
                                            paddingRight: '2rem',
                                            paddingTop: '1rem',
                                            paddingBottom: '1rem',
                                            background: 'linear-gradient(to right, rgb(6, 182, 212), rgb(59, 130, 246))',
                                            color: 'white',
                                            borderRadius: '9999px',
                                            fontWeight: 600,
                                            fontSize: '1.125rem',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease-out',
                                            boxShadow: '0 20px 25px rgba(6, 182, 212, 0.3)'
                                        },
                                        onMouseEnter: (e)=>{
                                            e.target.style.transform = 'scale(1.05)';
                                            e.target.style.boxShadow = '0 25px 30px rgba(6, 182, 212, 0.4)';
                                        },
                                        onMouseLeave: (e)=>{
                                            e.target.style.transform = 'scale(1)';
                                            e.target.style.boxShadow = '0 20px 25px rgba(6, 182, 212, 0.3)';
                                        },
                                        className: "jsx-582dd5fa6725fb3f",
                                        children: buttons.primary.text
                                    }, void 0, false, {
                                        fileName: "[project]/components/ui/animated-shader-hero.js",
                                        lineNumber: 542,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    buttons.secondary && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: buttons.secondary.onClick,
                                        style: {
                                            paddingLeft: '2rem',
                                            paddingRight: '2rem',
                                            paddingTop: '1rem',
                                            paddingBottom: '1rem',
                                            background: 'rgba(6, 182, 212, 0.1)',
                                            border: '1px solid rgba(34, 211, 238, 0.3)',
                                            color: 'rgba(165, 243, 252, 1)',
                                            borderRadius: '9999px',
                                            fontWeight: 600,
                                            fontSize: '1.125rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease-out',
                                            backdropFilter: 'blur(4px)'
                                        },
                                        onMouseEnter: (e)=>{
                                            e.target.style.transform = 'scale(1.05)';
                                            e.target.style.background = 'rgba(6, 182, 212, 0.2)';
                                            e.target.style.borderColor = 'rgba(34, 211, 238, 0.5)';
                                        },
                                        onMouseLeave: (e)=>{
                                            e.target.style.transform = 'scale(1)';
                                            e.target.style.background = 'rgba(6, 182, 212, 0.1)';
                                            e.target.style.borderColor = 'rgba(34, 211, 238, 0.3)';
                                        },
                                        className: "jsx-582dd5fa6725fb3f",
                                        children: buttons.secondary.text
                                    }, void 0, false, {
                                        fileName: "[project]/components/ui/animated-shader-hero.js",
                                        lineNumber: 572,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ui/animated-shader-hero.js",
                                lineNumber: 530,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ui/animated-shader-hero.js",
                        lineNumber: 464,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/components/ui/animated-shader-hero.js",
                lineNumber: 415,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/components/ui/animated-shader-hero.js",
        lineNumber: 350,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s1(Hero, "w8jELxzMMrerqWHj6ljEU3qE0HA=", false, function() {
    return [
        useShaderBackground
    ];
});
_c = Hero;
const __TURBOPACK__default__export__ = Hero;
var _c;
__turbopack_context__.k.register(_c, "Hero");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/NebulaGraph.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>NebulaGraph
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/shared/lib/app-dynamic.js [app-client] (ecmascript)");
;
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
const ForceGraph3D = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/node_modules/react-force-graph-3d/dist/react-force-graph-3d.mjs [app-client] (ecmascript, next/dynamic entry, async loader)"), {
    loadableGenerated: {
        modules: [
            "[project]/node_modules/react-force-graph-3d/dist/react-force-graph-3d.mjs [app-client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false
});
_c = ForceGraph3D;
function NebulaGraph({ nodes, onNodeClick }) {
    _s();
    const graphRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full h-screen bg-black",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ForceGraph3D, {
            ref: graphRef,
            graphData: {
                nodes,
                links: []
            },
            nodeLabel: "title",
            nodeColor: ()=>"#00f3ff",
            nodeVal: 5,
            nodeResolution: 16,
            backgroundColor: "#000000",
            onNodeClick: (node)=>{
                const distance = 40;
                const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
                graphRef.current.cameraPosition({
                    x: node.x * distRatio,
                    y: node.y * distRatio,
                    z: node.z * distRatio
                }, node, 3000);
                onNodeClick(node);
            }
        }, void 0, false, {
            fileName: "[project]/components/NebulaGraph.js",
            lineNumber: 11,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/NebulaGraph.js",
        lineNumber: 10,
        columnNumber: 5
    }, this);
}
_s(NebulaGraph, "cOuBbu9QEojP0u3BzmmzD9z7oyk=");
_c1 = NebulaGraph;
var _c, _c1;
__turbopack_context__.k.register(_c, "ForceGraph3D");
__turbopack_context__.k.register(_c1, "NebulaGraph");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/page.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$animated$2d$shader$2d$hero$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/animated-shader-hero.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$NebulaGraph$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/NebulaGraph.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
function Home() {
    _s();
    const [view, setView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('LANDING');
    const [nodes, setNodes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [selectedMovie, setSelectedMovie] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [searchQuery, setSearchQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const launchGraph = async ()=>{
        setLoading(true);
        setError(null);
        try {
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get('http://127.0.0.1:8000/graph');
            setNodes(res.data.nodes || []);
            setView('GRAPH');
        } catch (e) {
            setError("Backend offline. Make sure uvicorn is running.");
            console.error(e);
        }
        setLoading(false);
    };
    const handleSearch = async (e)=>{
        e.preventDefault();
        if (!searchQuery.trim()) return;
        try {
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].post('http://127.0.0.1:8000/search', {
                query: searchQuery,
                top_k: 20
            });
            const newNodes = res.data.map((m)=>({
                    ...m,
                    val: 5,
                    id: m.id || m.title
                }));
            setNodes(newNodes);
        } catch (e) {
            setError("Search failed");
            console.error(e);
        }
    };
    // GRAPH VIEW
    if (view === 'GRAPH') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative w-full h-screen bg-gradient-to-br from-slate-950 via-black to-slate-900",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute top-6 left-6 z-20",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setView('LANDING'),
                        className: "group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-full transition-all duration-300 shadow-lg shadow-cyan-500/50 hover:shadow-cyan-400/75",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "group-hover:-translate-x-1 transition-transform",
                                children: "←"
                            }, void 0, false, {
                                fileName: "[project]/app/page.js",
                                lineNumber: 61,
                                columnNumber: 13
                            }, this),
                            "Home"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/page.js",
                        lineNumber: 57,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/page.js",
                    lineNumber: 56,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute top-6 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-lg px-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                            onSubmit: handleSearch,
                            className: "flex gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    value: searchQuery,
                                    onChange: (e)=>setSearchQuery(e.target.value),
                                    placeholder: "Search by vibe (e.g., 'sad robots in space')...",
                                    className: "flex-1 px-6 py-3 rounded-full bg-black/40 backdrop-blur-xl text-white border border-cyan-500/30 focus:border-cyan-400 focus:outline-none transition-all placeholder-gray-400"
                                }, void 0, false, {
                                    fileName: "[project]/app/page.js",
                                    lineNumber: 69,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "submit",
                                    className: "px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-full font-semibold transition-all shadow-lg shadow-cyan-500/50 hover:shadow-cyan-400/75",
                                    children: "🔍"
                                }, void 0, false, {
                                    fileName: "[project]/app/page.js",
                                    lineNumber: 76,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/page.js",
                            lineNumber: 68,
                            columnNumber: 11
                        }, this),
                        error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-red-400 text-xs mt-2",
                            children: error
                        }, void 0, false, {
                            fileName: "[project]/app/page.js",
                            lineNumber: 83,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/page.js",
                    lineNumber: 67,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$NebulaGraph$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    nodes: nodes,
                    onNodeClick: setSelectedMovie
                }, void 0, false, {
                    fileName: "[project]/app/page.js",
                    lineNumber: 87,
                    columnNumber: 9
                }, this),
                selectedMovie && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute bottom-8 left-8 z-30 w-96 bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl p-6 shadow-2xl shadow-cyan-500/20 animate-in slide-in-from-bottom-4 duration-300",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setSelectedMovie(null),
                            className: "absolute top-4 right-4 text-gray-400 hover:text-cyan-400 transition text-xl",
                            children: "✕"
                        }, void 0, false, {
                            fileName: "[project]/app/page.js",
                            lineNumber: 92,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 mb-3",
                            children: selectedMovie.title
                        }, void 0, false, {
                            fileName: "[project]/app/page.js",
                            lineNumber: 98,
                            columnNumber: 13
                        }, this),
                        selectedMovie.poster && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                            src: `https://image.tmdb.org/t/p/w500${selectedMovie.poster}`,
                            alt: selectedMovie.title,
                            className: "w-full h-48 object-cover rounded-xl mb-4 border border-cyan-500/20"
                        }, void 0, false, {
                            fileName: "[project]/app/page.js",
                            lineNumber: 102,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-gray-300 line-clamp-4",
                                    children: selectedMovie.overview
                                }, void 0, false, {
                                    fileName: "[project]/app/page.js",
                                    lineNumber: 109,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2 text-cyan-400 text-sm font-semibold mt-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-lg",
                                            children: "⭐"
                                        }, void 0, false, {
                                            fileName: "[project]/app/page.js",
                                            lineNumber: 111,
                                            columnNumber: 17
                                        }, this),
                                        "Similarity: ",
                                        (selectedMovie.score * 100).toFixed(0),
                                        "%"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/page.js",
                                    lineNumber: 110,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/page.js",
                            lineNumber: 108,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/page.js",
                    lineNumber: 91,
                    columnNumber: 11
                }, this),
                loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-4"
                            }, void 0, false, {
                                fileName: "[project]/app/page.js",
                                lineNumber: 122,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-cyan-300 font-semibold",
                                children: "Building your galaxy..."
                            }, void 0, false, {
                                fileName: "[project]/app/page.js",
                                lineNumber: 123,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/page.js",
                        lineNumber: 121,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/page.js",
                    lineNumber: 120,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/page.js",
            lineNumber: 54,
            columnNumber: 7
        }, this);
    }
    // LANDING VIEW
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$animated$2d$shader$2d$hero$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        trustBadge: {
            text: "Powered by AI & Vector Embeddings",
            icons: [
                "🚀",
                "🤖"
            ]
        },
        headline: {
            line1: "Project",
            line2: "Nebula"
        },
        subtitle: "The Semantic Search Engine for Cinema. Search by vibe, emotion, and plot using our 3D Constellation Engine.",
        buttons: {
            primary: {
                text: loading ? "⏳ Launching..." : "🚀 Launch Engine",
                onClick: launchGraph
            },
            secondary: {
                text: "📖 Learn More",
                onClick: ()=>window.open('https://github.com/rajeev8008/nebula', '_blank')
            }
        }
    }, void 0, false, {
        fileName: "[project]/app/page.js",
        lineNumber: 133,
        columnNumber: 5
    }, this);
}
_s(Home, "dfZZKLBeYWoWEjCe5ndDFQqqhek=");
_c = Home;
var _c;
__turbopack_context__.k.register(_c, "Home");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_a8b452a2._.js.map