'use client';

import React, { useEffect, useRef } from 'react';

export default function LiquidOrbCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'high-performance' });
    if (!gl) {
      // Fallback 2D canvas if WebGL is not supported
      render2DFallback(canvas);
      return;
    }

    const vsSource = `
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Raymarching molten liquid gold/chrome metallic orb shader
    const fsSource = `
      precision highp float;
      varying vec2 vUv;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;

      // 3D Simplex-style hash noise
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
      }

      // Signed distance function for liquid molten metallic orb
      float map(vec3 p) {
        float t = u_time * 0.35;
        // Morphing noise undulations
        float noise1 = snoise(p * 1.35 + vec3(0.0, t * 0.8, t * 0.5));
        float noise2 = snoise(p * 2.8 - vec3(t * 0.4, 0.0, t * 0.6)) * 0.45;
        float displacement = (noise1 + noise2) * 0.16;
        
        // Sphere centered slightly below viewport center
        vec3 center = vec3(0.0, -0.45, 0.0);
        return length(p - center) - 1.15 + displacement;
      }

      vec3 calcNormal(vec3 p) {
        const vec2 eps = vec2(0.002, 0.0);
        return normalize(vec3(
          map(p + eps.xyy) - map(p - eps.xyy),
          map(p + eps.yxy) - map(p - eps.yxy),
          map(p + eps.yyx) - map(p - eps.yyx)
        ));
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

        vec3 ro = vec3(0.0, 0.0, 2.5);
        vec3 rd = normalize(vec3(uv, -1.35));

        // Background dark cosmic gradient
        vec3 col = vec3(0.024, 0.028, 0.038);

        // Volumetric ambient golden light from bottom
        float bottomGlow = smoothstep(0.4, -1.0, uv.y);
        vec3 goldLight = vec3(0.95, 0.72, 0.28);
        col += goldLight * bottomGlow * 0.18;

        float d = 0.0;
        float t = 0.0;
        vec3 p = ro;

        for (int i = 0; i < 70; i++) {
          p = ro + rd * t;
          d = map(p);
          if (d < 0.001 || t > 5.0) break;
          t += d * 0.7;
        }

        if (d < 0.02 && t <= 5.0) {
          vec3 n = calcNormal(p);
          vec3 viewDir = -rd;

          // Lighting directions
          vec3 lightDir1 = normalize(vec3(0.6, 1.2, 1.0));
          vec3 lightDirGold = normalize(vec3(-0.4, -1.0, 0.4)); // Bottom-up golden illumination

          // Diffuse
          float diff1 = max(dot(n, lightDir1), 0.0);
          float diffGold = max(dot(n, lightDirGold), 0.0);

          // Specular highlights
          vec3 half1 = normalize(lightDir1 + viewDir);
          float spec1 = pow(max(dot(n, half1), 0.0), 45.0);

          vec3 halfGold = normalize(lightGold + viewDir);
          float specGold = pow(max(dot(n, halfGold), 0.0), 30.0);

          // Fresnel edge reflection
          float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);

          // Molten gold base colors
          vec3 baseObsidian = vec3(0.05, 0.06, 0.08);
          vec3 moltenGold = vec3(0.98, 0.76, 0.24);
          vec3 amberDeep = vec3(0.85, 0.45, 0.08);
          vec3 chromeHighlight = vec3(1.0, 0.98, 0.92);

          // Color blend based on liquid normal & height
          vec3 surfaceColor = mix(baseObsidian, amberDeep, diffGold * 0.9);
          surfaceColor = mix(surfaceColor, moltenGold, pow(diffGold, 2.0) * 1.2);
          surfaceColor += chromeHighlight * spec1 * 0.9;
          surfaceColor += moltenGold * specGold * 1.5;
          surfaceColor += mix(moltenGold, chromeHighlight, 0.5) * fresnel * 1.2;

          // Atmospheric depth & edge feathering
          col = surfaceColor;

          // Ambient occlusion at bottom
          float ao = clamp(p.y + 1.2, 0.0, 1.0);
          col *= (0.4 + 0.6 * ao);
        } else {
          // Volumetric halo around the molten orb
          float distToCenter = length(uv - vec2(0.0, -0.45));
          float halo = smoothstep(1.3, 0.6, distToCenter);
          col += goldLight * halo * 0.25;
          col += vec3(0.98, 0.82, 0.45) * pow(halo, 3.5) * 0.35;
        }

        // Soft vignetting
        col *= 1.0 - 0.25 * length(uv);

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    function createShader(glCtx: WebGLRenderingContext, type: number, source: string) {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        console.warn('Shader compile failed:', glCtx.getShaderInfoLog(shader));
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) {
      render2DFallback(canvas);
      return;
    }

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('Program link failed:', gl.getProgramInfoLog(program));
      render2DFallback(canvas);
      return;
    }

    gl.useProgram(program);

    // Quad geometry
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posAttr = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');

    let animId: number;
    let startTime = performance.now();
    let mouse = { x: 0.5, y: 0.5 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = 1.0 - e.clientY / window.innerHeight;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const now = performance.now();
      const time = (now - startTime) * 0.001;

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uMouse, mouse.x, mouse.y);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  function render2DFallback(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = (canvas.width = canvas.clientWidth);
    const h = (canvas.height = canvas.clientHeight);

    ctx.fillStyle = '#07090E';
    ctx.fillRect(0, 0, w, h);

    // Draw ambient gold liquid sphere
    const cx = w / 2;
    const cy = h * 0.75;
    const radius = Math.min(w, h) * 0.45;

    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
    grad.addColorStop(0, '#F59E0B');
    grad.addColorStop(0.4, '#D97706');
    grad.addColorStop(0.7, '#78350F');
    grad.addColorStop(1, '#07090E');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      style={{ opacity: 0.95 }}
    />
  );
}
