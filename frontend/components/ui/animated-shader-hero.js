'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

// Default shader source for WebGL
const defaultShaderSource = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
uniform vec2 move;
uniform vec2 touch;
uniform int pointerCount;
uniform vec2 pointers[10];
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
  
  // Add cursor interaction effect
  vec2 mousePos = touch / R;
  float cursorDist = length(FC - touch);
  float cursorEffect = exp(-cursorDist * 0.005) * 0.8;
  
  for (float i=1.; i<12.; i++) {
    uv+=.1*cos(i*vec2(.1+.01*i, .8)+i*i+T*.5+.1*uv.x + move * 0.02);
    vec2 p=uv;
    float d=length(p);
    col+=.00125/d*(cos(sin(i)*vec3(1,2,3))+1.);
    float b=noise(i+p+bg*1.731);
    col+=.002*b/length(max(p,vec2(b*p.x*.02,p.y)));
    col=mix(col,vec3(bg*.25,bg*.137,bg*.05),d);
  }
  
  // Add orange glow at cursor position
  col += vec3(0.98, 0.58, 0.20) * cursorEffect * 0.5;
  // Add subtle distortion around cursor
  col += vec3(0.98, 0.46, 0.08) * cursorEffect * 0.3;
  
  O=vec4(col,1);
}`;

// WebGL Renderer Class
class WebGLRenderer {
  constructor(canvas, scale) {
    this.canvas = canvas;
    this.scale = scale;
    this.gl = canvas.getContext('webgl2');
    this.gl.viewport(0, 0, canvas.width * scale, canvas.height * scale);
    this.shaderSource = defaultShaderSource;
    this.mouseMove = [0, 0];
    this.mouseCoords = [0, 0];
    this.pointerCoords = [0, 0];
    this.nbrOfPointers = 0;

    this.vertexSrc = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;

    this.vertices = [-1, 1, -1, -1, 1, 1, 1, -1];
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
  constructor(element, scale) {
    this.scale = scale;
    this.active = false;
    this.pointers = new Map();
    this.lastCoords = [0, 0];
    this.moves = [0, 0];
    this.lastMousePos = [0, 0];

    const map = (element, scale, x, y) => [x * scale, element.height - y * scale];

    element.addEventListener('pointerdown', (e) => {
      this.active = true;
      this.pointers.set(e.pointerId, map(element, this.getScale(), e.clientX, e.clientY));
    });

    element.addEventListener('pointerup', (e) => {
      if (this.count === 1) {
        this.lastCoords = this.first;
      }
      this.pointers.delete(e.pointerId);
      this.active = this.pointers.size > 0;
    });

    element.addEventListener('pointerleave', (e) => {
      if (this.count === 1) {
        this.lastCoords = this.first;
      }
      this.pointers.delete(e.pointerId);
      this.active = this.pointers.size > 0;
    });

    element.addEventListener('pointermove', (e) => {
      if (!this.active) return;
      this.lastCoords = [e.clientX, e.clientY];
      this.pointers.set(e.pointerId, map(element, this.getScale(), e.clientX, e.clientY));
      this.moves = [this.moves[0] + e.movementX, this.moves[1] + e.movementY];
    });

    // Add mousemove listener for regular cursor tracking with movement
    element.addEventListener('mousemove', (e) => {
      const mappedPos = map(element, this.getScale(), e.clientX, e.clientY);
      this.lastCoords = mappedPos;
      
      // Calculate and accumulate movement delta for shader effect
      const deltaX = mappedPos[0] - this.lastMousePos[0];
      const deltaY = mappedPos[1] - this.lastMousePos[1];
      this.moves = [this.moves[0] + deltaX * 0.1, this.moves[1] + deltaY * 0.1];
      this.lastMousePos = mappedPos;
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
    return this.pointers.size > 0 ? Array.from(this.pointers.values()).flat() : [0, 0];
  }

  get first() {
    return this.pointers.values().next().value || this.lastCoords;
  }
}

// Hook for shader background
const useShaderBackground = () => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef();
  const rendererRef = useRef(null);
  const pointersRef = useRef(null);

  const resize = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const dpr = Math.max(1, 0.5 * window.devicePixelRatio);

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    if (rendererRef.current) {
      rendererRef.current.updateScale(dpr);
    }
  };

  const loop = (now) => {
    if (!rendererRef.current || !pointersRef.current) return;

    rendererRef.current.updateMouse(pointersRef.current.first);
    rendererRef.current.updatePointerCount(pointersRef.current.count);
    rendererRef.current.updatePointerCoords(pointersRef.current.coords);
    rendererRef.current.updateMove(pointersRef.current.move);
    rendererRef.current.render(now);
    animationFrameRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
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

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.reset();
      }
    };
  }, []);

  return canvasRef;
};

// Main Hero Component
const Hero = ({ trustBadge, headline, subtitle, buttons }) => {
  const canvasRef = useShaderBackground();

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: 'black' }}>
      <style jsx>{`
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out forwards;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }

        .animation-delay-600 {
          animation-delay: 0.6s;
        }

        .animation-delay-800 {
          animation-delay: 0.8s;
        }
      `}</style>

      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          touchAction: 'none',
          background: 'black',
        }}
      />

      {/* Hero Content Overlay */}
      <div
        style={{
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
          pointerEvents: 'auto',
        }}
      >
        {/* Trust Badge */}
        {trustBadge && (
          <div className="animate-fade-in-down" style={{ marginBottom: '2rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                paddingLeft: '1.5rem',
                paddingRight: '1.5rem',
                paddingTop: '0.75rem',
                paddingBottom: '0.75rem',
                background: 'rgba(249, 115, 22, 0.1)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(251, 146, 60, 0.3)',
                borderRadius: '9999px',
                fontSize: '0.875rem',
              }}
            >
              {trustBadge.icons && (
                <div style={{ display: 'flex' }}>
                  {trustBadge.icons.map((icon, index) => (
                    <span key={index} style={{ marginRight: '0.25rem' }}>
                      {icon}
                    </span>
                  ))}
                </div>
              )}
              <span style={{ color: 'rgba(254, 243, 199, 1)' }}>{trustBadge.text}</span>
            </div>
          </div>
        )}

        <div
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            maxWidth: '56rem',
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: '1rem',
            paddingRight: '1rem',
          }}
        >
          {/* Main Heading */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <motion.h1
              initial={{ filter: 'blur(10px)', opacity: 0 }}
              animate={{ filter: 'blur(0px)', opacity: 1 }}
              transition={{ duration: 0.8 }}
              style={{
                fontSize: 'clamp(2rem, 8vw, 4.5rem)',
                fontWeight: 700,
                background: 'linear-gradient(to right, rgb(249, 115, 22), rgb(251, 146, 60), rgb(250, 204, 21))',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {headline.line1}
            </motion.h1>
            <motion.h1
              initial={{ filter: 'blur(10px)', opacity: 0 }}
              animate={{ filter: 'blur(0px)', opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{
                fontSize: 'clamp(2rem, 8vw, 4.5rem)',
                fontWeight: 700,
                background: 'linear-gradient(to right, rgb(250, 204, 21), rgb(239, 68, 68), rgb(220, 38, 38))',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {headline.line2}
            </motion.h1>
          </div>

          {/* Subtitle */}
            <motion.div
              initial={{ filter: 'blur(10px)', opacity: 0 }}
              animate={{ filter: 'blur(0px)', opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              style={{
                maxWidth: '48rem',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              <p
                style={{
                  fontSize: 'clamp(1rem, 3vw, 1.5rem)',
                  color: 'rgba(254, 243, 199, 0.9)',
                  fontWeight: 300,
                  lineHeight: 1.5,
                }}
              >
                {subtitle}
              </p>
            </motion.div>

          {/* CTA Buttons */}
          {buttons && (
            <div
              className="animate-fade-in-up animation-delay-800"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                justifyContent: 'center',
                marginTop: '2.5rem',
                flexWrap: 'wrap',
              }}
            >
              {buttons.primary && (
                <button
                  onClick={buttons.primary.onClick}
                  style={{
                    paddingLeft: '2rem',
                    paddingRight: '2rem',
                    paddingTop: '1rem',
                    paddingBottom: '1rem',
                    background: 'linear-gradient(to right, rgb(249, 115, 22), rgb(234, 179, 8))',
                    color: 'black',
                    borderRadius: '9999px',
                    fontWeight: 600,
                    fontSize: '1.125rem',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-out',
                    boxShadow: '0 20px 25px rgba(249, 115, 22, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 25px 30px rgba(249, 115, 22, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 20px 25px rgba(249, 115, 22, 0.3)';
                  }}
                >
                  {buttons.primary.text}
                </button>
              )}
              {buttons.secondary && (
                <button
                  onClick={buttons.secondary.onClick}
                  style={{
                    paddingLeft: '2rem',
                    paddingRight: '2rem',
                    paddingTop: '1rem',
                    paddingBottom: '1rem',
                    background: 'rgba(249, 115, 22, 0.1)',
                    border: '1px solid rgba(251, 146, 60, 0.3)',
                    color: 'rgba(254, 243, 199, 1)',
                    borderRadius: '9999px',
                    fontWeight: 600,
                    fontSize: '1.125rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-out',
                    backdropFilter: 'blur(4px)',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.background = 'rgba(249, 115, 22, 0.2)';
                    e.target.style.borderColor = 'rgba(251, 146, 60, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.background = 'rgba(249, 115, 22, 0.1)';
                    e.target.style.borderColor = 'rgba(251, 146, 60, 0.3)';
                  }}
                >
                  {buttons.secondary.text}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Hero;