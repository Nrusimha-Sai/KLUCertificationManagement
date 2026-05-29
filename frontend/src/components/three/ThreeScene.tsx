import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';

// ─── Floating Particles ────────────────────────────────────────────────────
function ParticleField({ count = 800 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 50;
      positions[i3 + 1] = (Math.random() - 0.5) * 50;
      positions[i3 + 2] = (Math.random() - 0.5) * 50;

      // Monochrome palette
      const brightness = 0.3 + Math.random() * 0.7;
      colors[i3] = brightness;
      colors[i3 + 1] = brightness;
      colors[i3 + 2] = brightness;
    }
    return [positions, colors];
  }, [count]);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    mesh.current.rotation.y = clock.getElapsedTime() * 0.03;
    mesh.current.rotation.x = clock.getElapsedTime() * 0.01;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  );
}

// ─── Glowing Orb ──────────────────────────────────────────────────────────
function GlowOrb({
  position,
  scale = 1,
  color = '#ffffff',
  speed = 1,
}: {
  position: [number, number, number];
  scale?: number;
  color?: string;
  speed?: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.getElapsedTime() * speed;
    mesh.current.position.y = position[1] + Math.sin(t * 0.7) * 0.5;
    mesh.current.scale.setScalar(scale + Math.sin(t) * 0.05);
  });

  return (
    <Float speed={speed} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={mesh} position={position}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.6}
        />
      </mesh>
    </Float>
  );
}

// ─── Floating Certification Card (3D) ─────────────────────────────────────
function CertCard({
  position,
  rotation,
  delay,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  delay: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.getElapsedTime() + delay;
    mesh.current.rotation.y = rotation[1] + Math.sin(t * 0.4) * 0.2;
    mesh.current.position.y = position[1] + Math.sin(t * 0.6) * 0.3;
  });

  return (
    <mesh ref={mesh} position={position} rotation={rotation}>
      <boxGeometry args={[1.8, 1.1, 0.05]} />
      <meshStandardMaterial
        color="#2B2B2B"
        emissive="#3a3a3a"
        emissiveIntensity={0.2}
        roughness={0.3}
        metalness={0.6}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

// ─── Mouse Reactive Camera ────────────────────────────────────────────────
function ResponsiveCamera({ mouse }: { mouse: React.MutableRefObject<[number, number]> }) {
  const { camera } = useThree();

  useFrame(() => {
    camera.position.x += (mouse.current[0] * 2 - camera.position.x) * 0.02;
    camera.position.y += (-mouse.current[1] * 2 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ─── Main Scene ────────────────────────────────────────────────────────────
function Scene({ mouse }: { mouse: React.MutableRefObject<[number, number]> }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={60} />
      <ResponsiveCamera mouse={mouse} />

      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.2} color="#B3B3B3" />

      <ParticleField count={800} />

      <GlowOrb position={[-4, 2, -2]} scale={1.5} color="#D4D4D4" speed={0.8} />
      <GlowOrb position={[4, -1, -3]} scale={1} color="#ffffff" speed={1.2} />
      <GlowOrb position={[0, 3, -5]} scale={2} color="#B3B3B3" speed={0.6} />
      <GlowOrb position={[-6, -2, -4]} scale={0.8} color="#ffffff" speed={1.5} />

      <CertCard position={[-3, 1, -1]} rotation={[0.1, 0.3, 0.05]} delay={0} />
      <CertCard position={[3, -0.5, -2]} rotation={[-0.1, -0.4, -0.05]} delay={1.5} />
      <CertCard position={[0, -2, -1.5]} rotation={[0.2, 0.1, 0.1]} delay={3} />
      <CertCard position={[-1.5, 2.5, -3]} rotation={[-0.15, 0.5, -0.08]} delay={4.5} />

      <Environment preset="city" />
    </>
  );
}

// ─── ThreeScene Export ─────────────────────────────────────────────────────
export default function ThreeScene() {
  const mouse = useRef<[number, number]>([0, 0]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    mouse.current = [x, y];
  };

  return (
    <div
      className="absolute inset-0 w-full h-full"
      onMouseMove={handleMouseMove}
    >
      <Canvas
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        <Scene mouse={mouse} />
      </Canvas>
    </div>
  );
}
