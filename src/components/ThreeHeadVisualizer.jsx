import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ThreeHeadVisualizer = ({ pose = { yaw: 0, pitch: 0, roll: 0 }, state = 'idle', isFaceTracked = false }) => {
  const mountRef = useRef(null);
  const targetRotation = useRef({ yaw: 0, pitch: 0, roll: 0 });

  // Update target rotations in radians
  useEffect(() => {
    if (isFaceTracked && pose) {
      targetRotation.current = {
        yaw: ((pose.yaw ?? 0) * Math.PI) / 180,
        pitch: ((pose.pitch ?? 0) * Math.PI) / 180,
        roll: (-(pose.roll ?? 0) * Math.PI) / 180
      };
    } else {
      targetRotation.current = { yaw: 0, pitch: 0, roll: 0 };
    }
  }, [pose, isFaceTracked]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 280;
    const height = container.clientHeight || 190;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 3.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Dynamic Color Mapping based on cognitive flow state
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
    const pos = headGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

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
    leftEye.position.set(-0.38, 0.18, 1.05);
    headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeRingGeo, eyeMat);
    rightEye.position.set(0.38, 0.18, 1.05);
    headGroup.add(rightEye);

    // 4. Stable Horizon Reference Gimbal Ring
    const horizonGeo = new THREE.RingGeometry(1.65, 1.68, 48);
    const horizonMat = new THREE.MeshBasicMaterial({
      color: 0x334155,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45
    });
    const horizonRing = new THREE.Mesh(horizonGeo, horizonMat);
    horizonRing.rotation.x = Math.PI / 2;
    scene.add(horizonRing);

    // Subtle Ambient Light
    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambLight);

    // Animation Render Loop with SLERP-like easing
    let animationFrameId;
    const currentRot = { yaw: 0, pitch: 0, roll: 0 };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth interpolation toward target rotation
      const ease = 0.12;
      currentRot.yaw += (targetRotation.current.yaw - currentRot.yaw) * ease;
      currentRot.pitch += (targetRotation.current.pitch - currentRot.pitch) * ease;
      currentRot.roll += (targetRotation.current.roll - currentRot.roll) * ease;

      headGroup.rotation.y = currentRot.yaw;
      headGroup.rotation.x = currentRot.pitch;
      headGroup.rotation.z = currentRot.roll;

      // Color pulse based on tracking
      wireframeMat.color = getColor(state);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
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
      eyeRingGeo.dispose();
      eyeMat.dispose();
      horizonGeo.dispose();
      horizonMat.dispose();
      renderer.dispose();
    };
  }, [state]);

  const safeYaw = Math.round(pose?.yaw ?? 0);
  const safePitch = Math.round(pose?.pitch ?? 0);
  const safeRoll = Math.round(pose?.roll ?? 0);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden select-none">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div className="absolute bottom-2 inset-x-3 flex justify-between items-center text-[10px] font-mono linear-text-muted pointer-events-none bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/5">
        <span>Yaw: <strong className={Math.abs(safeYaw) > 14 ? 'text-amber-400' : 'text-emerald-400'}>{safeYaw}&deg;</strong></span>
        <span>Pitch: <strong className={Math.abs(safePitch) > 12 ? 'text-amber-400' : 'text-emerald-400'}>{safePitch}&deg;</strong></span>
        <span>Roll: <strong className={Math.abs(safeRoll) > 10 ? 'text-amber-400' : 'text-emerald-400'}>{safeRoll}&deg;</strong></span>
      </div>
    </div>
  );
};
