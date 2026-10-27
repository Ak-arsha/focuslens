import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ThreeHeadVisualizer = ({ pose, state, isFaceTracked }) => {
  const mountRef = useRef(null);
  const targetRotation = useRef({ yaw: 0, pitch: 0, roll: 0 });

  // Update target rotations in radians
  useEffect(() => {
    if (isFaceTracked) {
      targetRotation.current = {
        yaw: (pose.yaw * Math.PI) / 180,
        pitch: (pose.pitch * Math.PI) / 180,
        roll: (-pose.roll * Math.PI) / 180
      };
    } else {
      // gentle idle rotation when no face is tracked
      targetRotation.current = { yaw: 0, pitch: 0, roll: 0 };
    }
  }, [pose, isFaceTracked]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 240;
    const height = container.clientHeight || 200;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 3.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Dynamic Color Mapping
    const getColor = (s) => {
      switch (s) {
        case 'focused': return new THREE.Color(0x10B981);
        case 'distracted': return new THREE.Color(0xF59E0B);
        case 'drowsy': return new THREE.Color(0xF43F5E);
        default: return new THREE.Color(0x64748B);
      }
    };

    // Head Parent Pivot Group
    const headGroup = new THREE.Group();
    scene.add(headGroup);

    // 1. Procedural Low-Poly Cybernetic Head Mesh
    const headGeo = new THREE.IcosahedronGeometry(1.2, 2);
    // Deform vertices slightly to resemble an anatomical skull/face
    const pos = headGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      // Elongate skull vertically and taper jaw
      if (y < -0.2) {
        x *= 0.78; // jaw taper
        z *= 0.85;
      }
      if (z > 0.4 && y > -0.2 && y < 0.3) {
        z *= 1.15; // nose bridge / forehead projection
      }
      pos.setXYZ(i, x, y, z);
    }
    headGeo.computeVertexNormals();

    const wireframeMat = new THREE.MeshBasicMaterial({
      color: getColor(state),
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    const headMesh = new THREE.Mesh(headGeo, wireframeMat);
    headGroup.add(headMesh);

    // 2. Glowing Nodes at Vertices
    const pointsMat = new THREE.PointsMaterial({
      color: 0x06B6D4,
      size: 0.045,
      transparent: true,
      opacity: 0.9
    });
    const pointsMesh = new THREE.Points(headGeo, pointsMat);
    headGroup.add(pointsMesh);

    // 3. Eye Sockets Reticles
    const eyeRingGeo = new THREE.RingGeometry(0.12, 0.16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({
      color: 0x10B981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });

    const leftEye = new THREE.Mesh(eyeRingGeo, eyeMat);
    leftEye.position.set(-0.38, 0.18, 0.98);
    headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeRingGeo, eyeMat);
    rightEye.position.set(0.38, 0.18, 0.98);
    headGroup.add(rightEye);

    // 4. Directional Forward Aim Pointer Ray
    const pointerGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 1.1),
      new THREE.Vector3(0, 0, 1.9)
    ]);
    const pointerMat = new THREE.LineBasicMaterial({
      color: 0x06B6D4,
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });
    const pointerLine = new THREE.Line(pointerGeo, pointerMat);
    headGroup.add(pointerLine);

    // 5. Stationary Horizon Reference Ring (Alignment baseline)
    const gyroGroup = new THREE.Group();
    scene.add(gyroGroup);

    const ringGeo = new THREE.TorusGeometry(1.65, 0.012, 8, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06B6D4,
      transparent: true,
      opacity: 0.35
    });
    const horizonRing = new THREE.Mesh(ringGeo, ringMat);
    horizonRing.rotation.x = Math.PI / 2;
    gyroGroup.add(horizonRing);

    // Animation Loop with smooth interpolation (lerp)
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Smoothly interpolate rotations
      headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, targetRotation.current.yaw, delta * 9);
      headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, targetRotation.current.pitch, delta * 9);
      headGroup.rotation.z = THREE.MathUtils.lerp(headGroup.rotation.z, targetRotation.current.roll, delta * 9);

      // Subtle float oscillation if idle
      if (!isFaceTracked) {
        headGroup.rotation.y = Math.sin(clock.getElapsedTime() * 0.8) * 0.15;
      }

      // Update color matching active state
      wireframeMat.color.lerp(getColor(state), delta * 5);

      renderer.render(scene, camera);
    };

    animate();

    // Handle container resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 240;
      const h = container.clientHeight || 200;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      headGeo.dispose();
      wireframeMat.dispose();
      pointsMat.dispose();
      renderer.dispose();
    };
  }, [state]);

  return (
    <div className="theme-panel relative w-full h-full flex flex-col items-center justify-center rounded-xl p-2 overflow-hidden">
      <div className="absolute top-2 left-3 flex items-center gap-1.5 z-10 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-[10px] font-mono uppercase tracking-wider theme-text-muted font-semibold">
          3D Posture Hologram
        </span>
      </div>
      <div ref={mountRef} className="w-full h-44 cursor-grab active:cursor-grabbing" />
      <div className="absolute bottom-2 inset-x-3 flex justify-between items-center text-[10px] font-mono theme-text-muted pointer-events-none">
        <span>Yaw: {Math.round(pose.yaw)}&deg;</span>
        <span>Pitch: {Math.round(pose.pitch)}&deg;</span>
        <span>Roll: {Math.round(pose.roll)}&deg;</span>
      </div>
    </div>
  );
};
