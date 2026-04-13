/**
 * ThreeBackground.tsx — Three.js Animated 3D Background
 *
 * Renders an animated canvas on the landing page hero section.
 * Creates a particle/geometry system using Three.js that:
 *  - Floats and rotates continuously
 *  - Responds subtly to mouse movement
 *
 * Cleans up the Three.js renderer and animation loop on unmount
 * to prevent memory leaks.
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
export function ThreeBackground() {
  const mountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mountRef.current) return;
    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x091413, 0.02);
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 30;
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    // Colors based on brand palette
    const colors = [0x285a48, 0x408a71, 0xb0e4cc];
    // Create floating task cards (rounded rectangles)
    const cards: THREE.Mesh[] = [];
    const cardGeometry = new THREE.BoxGeometry(4, 6, 0.2);
    for (let i = 0; i < 15; i++) {
      const material = new THREE.MeshPhysicalMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        transparent: true,
        opacity: 0.6,
        roughness: 0.2,
        metalness: 0.1,
        clearcoat: 1.0
      });
      const card = new THREE.Mesh(cardGeometry, material);
      // Random positions
      card.position.x = (Math.random() - 0.5) * 60;
      card.position.y = (Math.random() - 0.5) * 40;
      card.position.z = (Math.random() - 0.5) * 40 - 10;
      // Random rotations
      card.rotation.x = Math.random() * Math.PI;
      card.rotation.y = Math.random() * Math.PI;
      // Store custom animation data
      card.userData = {
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.01,
          y: (Math.random() - 0.5) * 0.01
        },
        floatSpeed: Math.random() * 0.02 + 0.01,
        floatOffset: Math.random() * Math.PI * 2,
        initialY: card.position.y
      };
      scene.add(card);
      cards.push(card);
    }
    // Create network nodes (spheres and lines)
    const nodesGroup = new THREE.Group();
    const nodeGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const nodeMaterial = new THREE.MeshBasicMaterial({
      color: 0xb0e4cc
    });
    const nodes: THREE.Mesh[] = [];
    for (let i = 0; i < 20; i++) {
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      node.position.x = (Math.random() - 0.5) * 50;
      node.position.y = (Math.random() - 0.5) * 30;
      node.position.z = (Math.random() - 0.5) * 30 - 5;
      nodesGroup.add(node);
      nodes.push(node);
    }
    // Connect some nodes with lines
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x408a71,
      transparent: true,
      opacity: 0.3
    });
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].position.distanceTo(nodes[j].position) < 15) {
          const points = [nodes[i].position, nodes[j].position];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const line = new THREE.Line(geometry, lineMaterial);
          nodesGroup.add(line);
        }
      }
    }
    scene.add(nodesGroup);
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight1 = new THREE.PointLight(0xb0e4cc, 1, 100);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);
    const pointLight2 = new THREE.PointLight(0x285a48, 1, 100);
    pointLight2.position.set(-10, -10, 10);
    scene.add(pointLight2);
    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (event: MouseEvent) => {
      mouseX = event.clientX / window.innerWidth * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    // Animation loop
    let time = 0;
    let animationFrameId: number;
    const animate = () => {
      time += 0.01;
      // Animate cards
      cards.forEach((card) => {
        card.rotation.x += card.userData.rotationSpeed.x;
        card.rotation.y += card.userData.rotationSpeed.y;
        card.position.y =
        card.userData.initialY +
        Math.sin(
          time * card.userData.floatSpeed + card.userData.floatOffset
        ) *
        2;
      });
      // Animate nodes group slowly
      nodesGroup.rotation.y = time * 0.05;
      // Parallax effect with mouse
      camera.position.x += (mouseX * 5 - camera.position.x) * 0.05;
      camera.position.y += (mouseY * 5 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);
  return (
    <div ref={mountRef} className="absolute inset-0 z-0 pointer-events-none" />);

}