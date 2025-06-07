import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import Editor from '@monaco-editor/react';
import { io, Socket } from 'socket.io-client';
import { Html, Sky, OrbitControls, Stars, Cloud } from '@react-three/drei';
import * as THREE from 'three';
// import { OrbitControls } from '@react-three/drei';

// Utility for keyboard input
const useKeyboard = () => {
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const down = (e: KeyboardEvent) => setKeys((k) => ({ ...k, [e.key.toLowerCase()]: true }));
    const up = (e: KeyboardEvent) => setKeys((k) => ({ ...k, [e.key.toLowerCase()]: false }));
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);
  return keys;
};

// Avatar shapes
const AVATAR_SHAPES = [
  { label: 'Cube', value: 'cube' },
  { label: 'Sphere', value: 'sphere' },
  { label: 'Cylinder', value: 'cylinder' },
  { label: 'Cone', value: 'cone' },
  { label: 'Doge', value: 'doge' },
  { label: 'Duck', value: 'duck' },
  { label: 'Tux', value: 'tux' },
];
const AVATAR_COLORS = ['royalblue', 'crimson', 'orange', 'limegreen', 'purple', 'gold', 'teal', 'pink'];

// Neon style variables
const NEON_COLORS = {
  accent: '#39ff14',
  accent2: '#00eaff',
  bg: '#181a20',
  panel: 'rgba(24,26,32,0.92)',
  border: '#00eaff',
  text: '#fff',
  shadow: '0 0 16px #39ff14, 0 0 32px #00eaff',
};

// Avatar selection modal
function AvatarBuilderModal({ onSelect }: { onSelect: (config: { bodyShape: string, headShape: string, bodyColor: string, headColor: string, accessories: string[] }) => void }) {
  const [bodyShape, setBodyShape] = useState('cube');
  const [headShape, setHeadShape] = useState('sphere');
  const [bodyColor, setBodyColor] = useState('royalblue');
  const [headColor, setHeadColor] = useState('gold');
  const [accessories, setAccessories] = useState<string[]>([]);

  // For color pickers
  const COLORS = ['royalblue', 'crimson', 'orange', 'limegreen', 'purple', 'gold', 'teal', 'pink', 'white', 'black'];
  const BODY_SHAPES = [
    { label: 'Cube', value: 'cube' },
    { label: 'Cylinder', value: 'cylinder' },
    { label: 'Cone', value: 'cone' },
    { label: 'Sphere', value: 'sphere' },
  ];
  const HEAD_SHAPES = [
    { label: 'Sphere', value: 'sphere' },
    { label: 'Cube', value: 'cube' },
    { label: 'Cone', value: 'cone' },
  ];

  // Avatar preview component
  function AvatarPreview() {
    return (
      <Canvas camera={{ position: [0, 2, 5], fov: 40 }} style={{ width: 260, height: 320, background: '#222' }} shadows>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
        <AvatarMesh shape={bodyShape} color={bodyColor} headShape={headShape} headColor={headColor} accessories={accessories} position={[0, 0, 0]} />
        <OrbitControls enablePan={false} minDistance={3} maxDistance={8} />
      </Canvas>
    );
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'radial-gradient(ellipse at center, #232946 0%, #181a20 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: NEON_COLORS.panel, padding: 36, borderRadius: 18, minWidth: 540, boxShadow: NEON_COLORS.shadow, border: `2.5px solid ${NEON_COLORS.border}`, display: 'flex', flexDirection: 'row', gap: 32 }}>
        <div><AvatarPreview /></div>
        <div style={{ minWidth: 220 }}>
          <h2 style={{ color: NEON_COLORS.accent, fontFamily: 'Orbitron, sans-serif', fontSize: 28, marginBottom: 18, textShadow: NEON_COLORS.shadow }}>Build your avatar</h2>
          <div style={{ marginBottom: 18 }}>
            <b style={{ color: NEON_COLORS.accent2 }}>Body Shape:</b><br />
            {BODY_SHAPES.map(s => (
              <label key={s.value} style={{ marginRight: 12, fontFamily: 'Orbitron, sans-serif', color: NEON_COLORS.text, fontSize: 16 }}>
                <input type="radio" name="bodyShape" value={s.value} checked={bodyShape === s.value} onChange={() => setBodyShape(s.value)} /> {s.label}
              </label>
            ))}
          </div>
          <div style={{ marginBottom: 18 }}>
            <b style={{ color: NEON_COLORS.accent2 }}>Body Color:</b><br />
            {COLORS.map(c => (
              <button key={c} style={{ background: c, width: 28, height: 28, border: bodyColor === c ? `3px solid ${NEON_COLORS.accent}` : '1.5px solid #333', borderRadius: 8, marginRight: 6, boxShadow: bodyColor === c ? NEON_COLORS.shadow : 'none', cursor: 'pointer', outline: 'none', transition: 'box-shadow 0.2s' }} onClick={() => setBodyColor(c)} />
            ))}
          </div>
          <div style={{ marginBottom: 18 }}>
            <b style={{ color: NEON_COLORS.accent2 }}>Head Shape:</b><br />
            {HEAD_SHAPES.map(s => (
              <label key={s.value} style={{ marginRight: 12, fontFamily: 'Orbitron, sans-serif', color: NEON_COLORS.text, fontSize: 16 }}>
                <input type="radio" name="headShape" value={s.value} checked={headShape === s.value} onChange={() => setHeadShape(s.value)} /> {s.label}
              </label>
            ))}
          </div>
          <div style={{ marginBottom: 18 }}>
            <b style={{ color: NEON_COLORS.accent2 }}>Head Color:</b><br />
            {COLORS.map(c => (
              <button key={c} style={{ background: c, width: 28, height: 28, border: headColor === c ? `3px solid ${NEON_COLORS.accent}` : '1.5px solid #333', borderRadius: 8, marginRight: 6, boxShadow: headColor === c ? NEON_COLORS.shadow : 'none', cursor: 'pointer', outline: 'none', transition: 'box-shadow 0.2s' }} onClick={() => setHeadColor(c)} />
            ))}
          </div>
          <div style={{ marginBottom: 18 }}>
            <b style={{ color: NEON_COLORS.accent2 }}>Accessories:</b><br />
            <label style={{ marginRight: 12, color: NEON_COLORS.text, fontFamily: 'Orbitron, sans-serif', fontSize: 16 }}>
              <input type="checkbox" checked={accessories.includes('hat')} onChange={e => setAccessories(a => e.target.checked ? [...a, 'hat'] : a.filter(x => x !== 'hat'))} /> Hat
            </label>
            <label style={{ marginRight: 12, color: NEON_COLORS.text, fontFamily: 'Orbitron, sans-serif', fontSize: 16 }}>
              <input type="checkbox" checked={accessories.includes('glasses')} onChange={e => setAccessories(a => e.target.checked ? [...a, 'glasses'] : a.filter(x => x !== 'glasses'))} /> Glasses
            </label>
            <label style={{ color: NEON_COLORS.text, fontFamily: 'Orbitron, sans-serif', fontSize: 16 }}>
              <input type="checkbox" checked={accessories.includes('antenna')} onChange={e => setAccessories(a => e.target.checked ? [...a, 'antenna'] : a.filter(x => x !== 'antenna'))} /> Antenna
            </label>
          </div>
          <button onClick={() => onSelect({ bodyShape, headShape, bodyColor, headColor, accessories })} style={{ fontSize: 22, padding: '10px 36px', borderRadius: 10, background: NEON_COLORS.accent2, color: '#181a20', border: 'none', fontWeight: 700, boxShadow: NEON_COLORS.shadow, cursor: 'pointer', marginTop: 8, fontFamily: 'Orbitron, sans-serif', letterSpacing: 2 }}>Start</button>
        </div>
      </div>
    </div>
  );
}

// Avatar mesh
const AvatarMesh = ({ shape, color, headShape, headColor, accessories = [], position }: { shape: string, color: string, headShape: string, headColor: string, accessories?: string[], position: [number, number, number] }) => {
  // Always place the group at y=0 so the feet are on the ground
  const [x, , z] = position;
  return (
    <group position={[x, 0, z]}>
      {/* Body (centered so bottom is at y=0) */}
      {shape === 'cube' && <mesh position={[0, 0.7, 0]} castShadow><boxGeometry args={[1, 1.4, 0.7]} /><meshStandardMaterial color={color} /></mesh>}
      {shape === 'cylinder' && <mesh position={[0, 0.7, 0]} castShadow><cylinderGeometry args={[0.5, 0.5, 1.4, 16]} /><meshStandardMaterial color={color} /></mesh>}
      {shape === 'cone' && <mesh position={[0, 0.7, 0]} castShadow><coneGeometry args={[0.7, 1.4, 16]} /><meshStandardMaterial color={color} /></mesh>}
      {shape === 'sphere' && <mesh position={[0, 0.7, 0]} castShadow><sphereGeometry args={[0.7, 24, 24]} /><meshStandardMaterial color={color} /></mesh>}
      {/* Head (relative to body) */}
      {headShape === 'sphere' && <mesh position={[0, 1.7, 0]} castShadow><sphereGeometry args={[0.5, 24, 24]} /><meshStandardMaterial color={headColor} /></mesh>}
      {headShape === 'cube' && <mesh position={[0, 1.7, 0]} castShadow><boxGeometry args={[0.7, 0.7, 0.7]} /><meshStandardMaterial color={headColor} /></mesh>}
      {headShape === 'cone' && <mesh position={[0, 2, 0]} castShadow><coneGeometry args={[0.5, 0.8, 16]} /><meshStandardMaterial color={headColor} /></mesh>}
      {/* Accessories (relative to head) */}
      {accessories.includes('hat') && (
        <mesh position={[0, 2.3, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.38, 0.22, 16]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      )}
      {accessories.includes('glasses') && (
        <group position={[0, 1.7, 0.45]}>
          <mesh position={[-0.22, 0, 0]}><torusGeometry args={[0.14, 0.04, 8, 16]} /><meshStandardMaterial color="#00eaff" /></mesh>
          <mesh position={[0.22, 0, 0]}><torusGeometry args={[0.14, 0.04, 8, 16]} /><meshStandardMaterial color="#00eaff" /></mesh>
          <mesh position={[0, 0, 0]}><boxGeometry args={[0.18, 0.04, 0.04]} /><meshStandardMaterial color="#00eaff" /></mesh>
        </group>
      )}
      {accessories.includes('antenna') && (
        <group position={[0, 2.5, 0]}>
          <mesh><cylinderGeometry args={[0.04, 0.04, 0.5, 8]} /><meshStandardMaterial color="#ff69b4" /></mesh>
          <mesh position={[0, 0.28, 0]}><sphereGeometry args={[0.09, 8, 8]} /><meshStandardMaterial color="#ff69b4" /></mesh>
        </group>
      )}
    </group>
  );
};

// Add missing obstacle mesh components
const Barrel = ({ position }: { position: [number, number, number] }) => (
  <mesh position={position} castShadow>
    <cylinderGeometry args={[0.4, 0.4, 1, 16]} />
    <meshStandardMaterial color="#b87333" />
  </mesh>
);
const Crate = ({ position }: { position: [number, number, number] }) => (
  <mesh position={position} castShadow>
    <boxGeometry args={[0.8, 0.8, 0.8]} />
    <meshStandardMaterial color="#a0522d" />
  </mesh>
);
const Fence = ({ position }: { position: [number, number, number] }) => (
  <mesh position={position} castShadow>
    <boxGeometry args={[1.2, 0.3, 0.1]} />
    <meshStandardMaterial color="#888" />
  </mesh>
);
const Building = ({ position }: { position: [number, number, number] }) => (
  <mesh position={position} castShadow>
    <boxGeometry args={[4, 2, 4]} />
    <meshStandardMaterial color="#444" />
  </mesh>
);

// Move isColliding above Player
const isColliding = (x: number, z: number) => {
  for (const obs of OBSTACLES) {
    const dx = x - obs.pos[0];
    const dz = z - obs.pos[2];
    if (Math.sqrt(dx*dx + dz*dz) < (obs.r + 0.7)) return true;
  }
  return false;
};

// Update Player to use avatar shape/color
const Player = ({ position, setPosition, shape, color, headShape, headColor, accessories = [] }: { position: [number, number, number], setPosition: (pos: [number, number, number]) => void, shape: string, color: string, headShape: string, headColor: string, accessories?: string[] }) => {
  const keys = useKeyboard();
  const { camera } = useThree();
  const [x, , z] = position;
  useFrame(() => {
    let [x, y, z] = position;
    const speed = 0.1;
    // Get camera direction (XZ plane)
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
    let nx = x, nz = z;
    if (keys['w']) {
      nx += dir.x * speed;
      nz += dir.z * speed;
    }
    if (keys['s']) {
      nx -= dir.x * speed;
      nz -= dir.z * speed;
    }
    if (keys['a']) {
      nx -= right.x * speed;
      nz -= right.z * speed;
    }
    if (keys['d']) {
      nx += right.x * speed;
      nz += right.z * speed;
    }
    // Borders
    const border = MAP_SIZE / 2 - 2;
    nx = Math.max(-border, Math.min(border, nx));
    nz = Math.max(-border, Math.min(border, nz));
    // Collision check
    if (!isColliding(nx, nz)) {
      if (nx !== x || nz !== z) {
        setPosition([nx, y, nz]);
      }
    }
  });
  return <AvatarMesh shape={shape} color={color} headShape={headShape} headColor={headColor} accessories={accessories} position={[x, 0, z]} />;
};

// Add landscape elements
const Tree = ({ position }: { position: [number, number, number] }) => (
  <group position={position}>
    <mesh position={[0, 1, 0]}>
      <cylinderGeometry args={[0.2, 0.2, 2, 8]} />
      <meshStandardMaterial color="#8B5A2B" />
    </mesh>
    <mesh position={[0, 2.2, 0]}>
      <sphereGeometry args={[0.8, 16, 16]} />
      <meshStandardMaterial color="#228B22" />
    </mesh>
  </group>
);

const Rock = ({ position }: { position: [number, number, number] }) => (
  <mesh position={position}>
    <sphereGeometry args={[0.4, 8, 8]} />
    <meshStandardMaterial color="#888" />
  </mesh>
);

// 1. Expand map size
const MAP_SIZE = 80;

// 1. Generate mountain positions
const MOUNTAIN_POSITIONS: [number, number, number][] = Array.from({ length: 32 }, (_, i) => {
  const angle = (i / 32) * 2 * Math.PI;
  const r = MAP_SIZE / 2 - 2;
  const x = Math.cos(angle) * r;
  const y = 2;
  const z = Math.sin(angle) * r;
  return [x, y, z];
});

// 2. Add mountains to OBSTACLES
const OBSTACLES = [
  // Trees (spread throughout map)
  { pos: [-6, 0, 6], r: 1 }, { pos: [7, 0, -7], r: 1 }, { pos: [10, 0, 2], r: 1 }, { pos: [-12, 0, 10], r: 1 }, { pos: [12, 0, -12], r: 1 },
  { pos: [-30, 0, 20], r: 1 }, { pos: [30, 0, -20], r: 1 }, { pos: [20, 0, 30], r: 1 }, { pos: [-20, 0, -30], r: 1 },
  { pos: [0, 0, 0], r: 1 }, { pos: [15, 0, 15], r: 1 }, { pos: [-15, 0, -15], r: 1 }, { pos: [25, 0, -10], r: 1 }, { pos: [-25, 0, 10], r: 1 },
  { pos: [10, 0, -25], r: 1 }, { pos: [-10, 0, 25], r: 1 }, { pos: [0, 0, 25], r: 1 }, { pos: [25, 0, 0], r: 1 },
  { pos: [-25, 0, 0], r: 1 }, { pos: [0, 0, -25], r: 1 },
  // More trees in the center/interior
  { pos: [8, 0, 8], r: 1 }, { pos: [-8, 0, -8], r: 1 }, { pos: [8, 0, -8], r: 1 }, { pos: [-8, 0, 8], r: 1 },
  { pos: [0, 0, 12], r: 1 }, { pos: [12, 0, 0], r: 1 }, { pos: [-12, 0, 0], r: 1 }, { pos: [0, 0, -12], r: 1 },
  // Rocks (more, spread out)
  { pos: [-3, 0, -8], r: 0.6 }, { pos: [5, 0, 8], r: 0.6 }, { pos: [-8, 0, 0], r: 0.6 }, { pos: [0, 0, 12], r: 0.6 },
  { pos: [25, 0, 25], r: 0.6 }, { pos: [-25, 0, -25], r: 0.6 }, { pos: [18, 0, -18], r: 0.6 }, { pos: [-18, 0, 18], r: 0.6 },
  { pos: [0, 0, 18], r: 0.6 }, { pos: [18, 0, 0], r: 0.6 }, { pos: [-18, 0, 0], r: 0.6 }, { pos: [0, 0, -18], r: 0.6 },
  // More rocks in the center/interior
  { pos: [6, 0, 0], r: 0.6 }, { pos: [-6, 0, 0], r: 0.6 }, { pos: [0, 0, 6], r: 0.6 }, { pos: [0, 0, -6], r: 0.6 },
  // Barrels, crates, building, fence (industrial area, more spread)
  { pos: [35, 0, 35], r: 0.7, type: 'barrel' }, { pos: [36, 0, 35], r: 0.7, type: 'barrel' }, { pos: [35, 0, 36], r: 0.7, type: 'barrel' },
  { pos: [37, 0, 35], r: 0.7, type: 'crate' }, { pos: [37, 0, 36], r: 0.7, type: 'crate' },
  { pos: [36, 0, 38], r: 2.5, type: 'building' },
  { pos: [34, 0, 37], r: 0.7, type: 'fence' }, { pos: [38, 0, 37], r: 0.7, type: 'fence' },
  // More obstacles for variety
  { pos: [-35, 0, -35], r: 0.7, type: 'barrel' }, { pos: [-36, 0, -35], r: 0.7, type: 'crate' },
  { pos: [-36, 0, -38], r: 2.5, type: 'building' },
  { pos: [-34, 0, -37], r: 0.7, type: 'fence' }, { pos: [-38, 0, -37], r: 0.7, type: 'fence' },
  // Mountains as obstacles
  ...MOUNTAIN_POSITIONS.map(pos => ({ pos: [pos[0], 0, pos[2]], r: 3.5, type: 'mountain' })),
];

// 4. Add more tasks
const challenges = [
  {
    id: 1,
    position: [3, 0.5, 3] as [number, number, number],
    description: 'Write a function that returns the sum of two numbers.',
    starterCode: '// Write your function here\nfunction sum(a, b) {\n  return a + b;\n}',
    test: (fn: any) => typeof fn === 'function' && fn(2, 3) === 5 && fn(-1, 1) === 0,
    exp: 10,
  },
  {
    id: 2,
    position: [-4, 0.5, 2] as [number, number, number],
    description: 'Write a function that returns the factorial of a number.',
    starterCode: '// Write your function here\nfunction factorial(n) {\n  // ...\n}',
    test: (fn: any) => typeof fn === 'function' && fn(5) === 120 && fn(0) === 1,
    exp: 15,
  },
  {
    id: 3,
    position: [0, 0.5, -5] as [number, number, number],
    description: 'Write a function that reverses a string.',
    starterCode: '// Write your function here\nfunction reverse(str) {\n  // ...\n}',
    test: (fn: any) => typeof fn === 'function' && fn('abc') === 'cba' && fn('') === '',
    exp: 12,
  },
  // Frontend task
  {
    id: 4,
    position: [8, 0.5, -3] as [number, number, number],
    description: 'Write a function that returns a React element: <button>Click me!</button>.',
    starterCode: '// Write your function here\nfunction makeButton() {\n  // ...\n}',
    test: (fn: any) => {
      const el = fn && fn();
      return el && el.type === 'button' && el.props.children === 'Click me!';
    },
    exp: 18,
  },
  // Backend task
  {
    id: 5,
    position: [-7, 0.5, -7] as [number, number, number],
    description: 'Write a function that returns a JSON object with keys name and age.',
    starterCode: '// Write your function here\nfunction getUser() {\n  // ...\n}',
    test: (fn: any) => {
      const obj = fn && fn();
      return obj && typeof obj === 'object' && obj.name && typeof obj.age === 'number';
    },
    exp: 16,
  },
  // Database task
  {
    id: 6,
    position: [6, 0.5, 8] as [number, number, number],
    description: 'Write a SQL SELECT query string to get all users from a table named users.',
    starterCode: "// Return a SQL query as a string\nfunction getQuery() {\n  // ...\n}",
    test: (fn: any) => {
      const q = fn && fn();
      return typeof q === 'string' && /select\s+\*\s+from\s+users/i.test(q);
    },
    exp: 14,
  },
  // Classic: Fibonacci
  {
    id: 7,
    position: [-10, 0.5, 5] as [number, number, number],
    description: 'Write a function that returns the nth Fibonacci number.',
    starterCode: '// Write your function here\nfunction fib(n) {\n  // ...\n}',
    test: (fn: any) => typeof fn === 'function' && fn(7) === 13 && fn(0) === 0,
    exp: 17,
  },
  // Classic: Palindrome
  {
    id: 8,
    position: [12, 0.5, -10] as [number, number, number],
    description: 'Write a function that checks if a string is a palindrome.',
    starterCode: '// Write your function here\nfunction isPalindrome(str) {\n  // ...\n}',
    test: (fn: any) => typeof fn === 'function' && fn('aba') === true && fn('abc') === false,
    exp: 13,
  },
  // Classic: Array sum
  {
    id: 9,
    position: [-12, 0.5, -12] as [number, number, number],
    description: 'Write a function that returns the sum of all numbers in an array.',
    starterCode: '// Write your function here\nfunction arraySum(arr) {\n  // ...\n}',
    test: (fn: any) => typeof fn === 'function' && fn([1,2,3]) === 6 && fn([]) === 0,
    exp: 11,
  },
  // Classic: Find max
  {
    id: 10,
    position: [15, 0.5, 10] as [number, number, number],
    description: 'Write a function that returns the maximum number in an array.',
    starterCode: '// Write your function here\nfunction findMax(arr) {\n  // ...\n}',
    test: (fn: any) => typeof fn === 'function' && fn([1,5,2]) === 5 && fn([-1,-2]) === -1,
    exp: 12,
  },
];

const TaskSpot = ({ position, active }: { position: [number, number, number], active: boolean }) => (
  <group position={position}>
    <mesh castShadow>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color={active ? 'gold' : 'gray'} emissive={active ? 'yellow' : 'black'} emissiveIntensity={active ? 0.7 : 0} />
    </mesh>
    {active && (
      <Html position={[0, 1.2, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{ fontSize: 36, color: '#ffe600', textShadow: '0 0 12px #ffe600, 0 0 24px #fff', fontWeight: 900 }}>!</div>
      </Html>
    )}
  </group>
);

// Update multiplayer hook to send avatar info
function useMultiplayer(playerPos: [number, number, number], name: string, avatar: { bodyShape: string, headShape: string, bodyColor: string, headColor: string, accessories: string[] }) {
  const [others, setOthers] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // Connect socket only once
  useEffect(() => {
    const socket: Socket = io('https://kodziarze.onrender.com');
    socketRef.current = socket;
    socket.emit('join', { x: playerPos[0], y: playerPos[1], z: playerPos[2], name, shape: avatar.bodyShape, color: avatar.bodyColor, headShape: avatar.headShape, headColor: avatar.headColor, accessories: avatar.accessories });
    socket.on('players', (players) => {
      setOthers(players.filter((p: any) => p.name !== name));
    });
    return () => { socket.disconnect(); };
  }, [name, avatar.bodyShape, avatar.bodyColor, avatar.headShape, avatar.headColor, avatar.accessories]);

  // Emit move events when position changes
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.emit('move', { x: playerPos[0], y: playerPos[1], z: playerPos[2] });
    }
  }, [playerPos]);

  return others;
}

// Update OtherPlayer to use avatar shape/color
const OtherPlayer = ({ position, name, shape, color, headShape, headColor, accessories = [], rotation = 0 }: { position: [number, number, number], name: string, shape: string, color: string, headShape?: string, headColor?: string, accessories?: string[], rotation?: number }) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <AvatarMesh shape={shape} color={color} headShape={headShape || 'sphere'} headColor={headColor || 'gold'} accessories={accessories} position={[0, 0, 0]} />
    <Html position={[0, 2.7, 0]} center style={{ pointerEvents: 'none' }}>
      <div style={{ background: 'rgba(24,26,32,0.92)', color: '#fff', fontFamily: 'Orbitron, sans-serif', fontSize: 16, padding: '2px 12px', borderRadius: 8, border: '2px solid #00eaff', boxShadow: '0 0 8px #00eaff', textAlign: 'center' }}>{name}</div>
    </Html>
  </group>
);

// ControlsSync: keeps OrbitControls' target synced to the player
const ControlsSync = ({ controlsRef, target }: { controlsRef: any, target: [number, number, number] }) => {
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(target[0], target[1], target[2]);
      controlsRef.current.update();
    }
  });
  return null;
};

// 3. Update Mountain component for random form/size/color
const MOUNTAIN_COLORS = ['#888', '#a9a9a9', '#6e6e6e', '#b0b0b0', '#7c6f57'];
const MOUNTAIN_FORMS = ['cone', 'cylinder', 'sphere'];
function Mountain({ position, seed }: { position: [number, number, number], seed: number }) {
  // Use seed to pick form/size/color deterministically
  const form = MOUNTAIN_FORMS[seed % MOUNTAIN_FORMS.length];
  const color = MOUNTAIN_COLORS[seed % MOUNTAIN_COLORS.length];
  const base = 2.5 + (seed % 3) * 0.7;
  const height = 4.5 + (seed % 4) * 1.2;
  switch (form) {
    case 'cylinder':
      return (
        <mesh position={position} castShadow>
          <cylinderGeometry args={[base, base * 0.7, height, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case 'sphere':
      return (
        <mesh position={[position[0], position[1] + height / 4, position[2]]} castShadow>
          <sphereGeometry args={[base, 16, 16]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    default:
      return (
        <mesh position={position} castShadow>
          <coneGeometry args={[base, height, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
  }
}

// 6. Update Ground to use MAP_SIZE
const Ground = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
    <planeGeometry args={[MAP_SIZE, MAP_SIZE]} />
    <meshStandardMaterial color="#6ecb8f" />
  </mesh>
);

// 7. PvP challenge logic (scaffold)
// In Game3DScene, detect if two players are close. If so, allow challenge.
// In App, add PvP modal state, question selection, and answer logic. Use Socket.io to sync challenge/response/points.
// (UI and hooks, backend logic to be added next)

// Add this component above Game3DScene:
function StreetLight({ position, color }: { position: [number, number, number], color: string }) {
  const lightRef = useRef<any>(null);
  useEffect(() => {
    if (lightRef.current) {
      lightRef.current.target.position.set(position[0], 0, position[2]);
    }
  }, [position]);
  return (
    <group>
      <spotLight
        ref={lightRef}
        position={position}
        angle={1.1}
        penumbra={0.5}
        intensity={1.1}
        color={color}
        distance={30}
        castShadow
      />
      {/* Glowing lamp mesh */}
      <mesh position={position}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial emissive={color} emissiveIntensity={1.8} color="#fff" />
      </mesh>
      {/* Light cone mesh for visual effect */}
      <mesh position={[position[0], position[1] - 2.5, position[2]]} rotation={[-Math.PI/2, 0, 0]}>
        <coneGeometry args={[2.8, 5, 32, 1, true]} />
        <meshStandardMaterial color={color} transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

const Game3DScene = ({ onTaskTrigger, solved, name, avatar, modalOpen, exp, onPvPChallenge, pvpState, pvpOpponent, others }: { onTaskTrigger: (challengeId: number) => void, solved: Set<number>, name: string, avatar: { bodyShape: string, headShape: string, bodyColor: string, headColor: string, accessories: string[] }, modalOpen: boolean, exp: number, onPvPChallenge: (opponent: any) => void, pvpState: string, pvpOpponent: any, others: any[] }) => {
  const [playerPos, setPlayerPos] = useState<[number, number, number]>([0, 0.5, 15]);
  const [nearTask, setNearTask] = useState<number | null>(null);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const controlsRef = useRef<any>(null);
  const keys = useKeyboard();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // PvP: detect if near another player
  const [nearPlayer, setNearPlayer] = useState<any>(null);
  useEffect(() => {
    let found: any = null;
    for (const p of others) {
      const dx = playerPos[0] - p.x;
      const dz = playerPos[2] - p.z;
      if (Math.sqrt(dx*dx + dz*dz) < 2.2) {
        found = p;
        break;
      }
    }
    setNearPlayer(found);
    if (found) {
      console.log('Near player:', found, 'Self name:', name, 'Others:', others); // DEBUG
    }
  }, [playerPos, others]);

  // --- FIX: PvP E key handling ---
  // useEffect(() => {
  //   if (!nearPlayer || pvpState !== 'idle' || modalOpen) return;
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if (e.key.toLowerCase() === 'e') {
  //       console.log('E key pressed for PvP challenge', nearPlayer); // DEBUG
  //       onPvPChallenge(nearPlayer);
  //     }
  //   };
  //   window.addEventListener('keydown', handleKeyDown);
  //   return () => {
  //     window.removeEventListener('keydown', handleKeyDown);
  //   };
  // }, [nearPlayer, onPvPChallenge, pvpState, modalOpen]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.focus();
    }
  }, []);

  // Check proximity to tasks
  useEffect(() => {
    let found: number | null = null;
    for (const ch of challenges) {
      if (!solved.has(ch.id)) {
        const dx = playerPos[0] - ch.position[0];
        const dz = playerPos[2] - ch.position[2];
        if (Math.sqrt(dx*dx + dz*dz) < 1.5) {
          found = ch.id;
          break;
        }
      }
    }
    setNearTask(found);
  }, [playerPos, solved]);

  // Listen for 'E' key to trigger task
  useEffect(() => {
    if (nearTask !== null && keys['e']) {
      onTaskTrigger(nearTask);
    }
  }, [nearTask, keys, onTaskTrigger]);

  return (
    <>
      {/* DEBUG PANEL */}
      <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: 10, borderRadius: 8, zIndex: 1000, fontSize: 13, fontFamily: 'monospace', maxWidth: 340 }}>
        <div><b>DEBUG</b></div>
        <div>Self: <b>{name}</b></div>
        <div>Position: [{playerPos.map(n => n.toFixed(2)).join(', ')}]</div>
        <div>Others ({others.length}):
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {others.map((p, i) => (
              <li key={p.id || i}>{p.name} [{(p.x||0).toFixed(2)}, {(p.y||0).toFixed(2)}, {(p.z||0).toFixed(2)}]</li>
            ))}
          </ul>
        </div>
        <div>nearPlayer: {nearPlayer ? `${nearPlayer.name} [${nearPlayer.x?.toFixed(2)}, ${nearPlayer.y?.toFixed(2)}, ${nearPlayer.z?.toFixed(2)}]` : 'null'}</div>
      </div>
      <Canvas
        ref={canvasRef}
        tabIndex={0}
        shadows
        camera={{ position: [0, 5, 10], fov: 60 }}
        style={{ width: '100vw', height: '100vh', background: '#7ecbff' }}
        onCreated={({ scene }) => {
          scene.fog = new THREE.Fog('#1a2d34', 10, 38);
        }}
      >
        <Stars radius={100} depth={40} count={400} factor={4} saturation={0.5} fade speed={1} />
        <Sky sunPosition={[20, 40, 20]} turbidity={6} rayleigh={8} mieCoefficient={0.003} mieDirectionalG={0.8} inclination={0.45} azimuth={0.25} />
        <ambientLight intensity={0.45} color="#2b6e6e" />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <pointLight position={[-20, 8, 20]} intensity={1.2} color="#ffb347" castShadow distance={30} />
        <pointLight position={[20, 8, -20]} intensity={1.2} color="#ffd580" castShadow distance={30} />
        <Player position={playerPos} setPosition={setPlayerPos} shape={avatar.bodyShape} color={avatar.bodyColor} headShape={avatar.headShape} headColor={avatar.headColor} accessories={avatar.accessories} />
        {others.map((p, i) => (
          <OtherPlayer key={p.id || i} position={[p.x, p.y, p.z]} name={p.name} shape={p.shape || 'cube'} color={p.color || 'royalblue'} headShape={p.headShape || 'sphere'} headColor={p.headColor || 'gold'} accessories={p.accessories || []} rotation={0} />
        ))}
        <Ground />
        {/* Trees and rocks for landscape */}
        <Tree position={[-6, 0, 6]} />
        <Tree position={[7, 0, -7]} />
        <Tree position={[10, 0, 2]} />
        <Tree position={[-12, 0, 10]} />
        <Tree position={[12, 0, -12]} />
        <Rock position={[-3, 0, -8]} />
        <Rock position={[5, 0, 8]} />
        <Rock position={[-8, 0, 0]} />
        <Rock position={[0, 0, 12]} />
        {/* Industrial area */}
        <Barrel position={[15, 0, 15]} />
        <Barrel position={[16, 0, 15]} />
        <Barrel position={[15, 0, 16]} />
        <Crate position={[17, 0, 15]} />
        <Crate position={[17, 0, 16]} />
        <Building position={[16, 1, 18]} />
        <Fence position={[14, 0, 17]} />
        <Fence position={[18, 0, 17]} />
        {challenges.map(ch => (
          <TaskSpot key={ch.id} position={ch.position} active={!solved.has(ch.id)} />
        ))}
        {/* Hybrid RPG camera: mouse look-around, always follows player */}
        <OrbitControls ref={controlsRef} enablePan={false} maxPolarAngle={Math.PI/2.1} minDistance={5} maxDistance={30} />
        <ControlsSync controlsRef={controlsRef} target={playerPos} />
        {MOUNTAIN_POSITIONS.map((pos, i) => (
          <Mountain key={i} position={pos} seed={i} />
        ))}
        {/* Show prompt if near a task */}
        {nearTask !== null && !modalOpen && (
          <Html position={[0, 2.5, 0]} center style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(24,26,32,0.92)',
              color: '#fff',
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 24,
              padding: '12px 32px',
              borderRadius: 16,
              border: '2px solid #00eaff',
              boxShadow: '0 0 16px #00eaff',
              marginTop: 24,
              textAlign: 'center',
            }}>
              Press <span style={{ color: '#39ff14', fontWeight: 700 }}>E</span> to start task
            </div>
          </Html>
        )}
        {/* Show PvP prompt if near another player and not in PvP modal */}
        {/*nearPlayer && pvpState === 'idle' && !modalOpen && (
          <Html position={[0, 2.5, 0]} center style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(24,26,32,0.92)',
              color: '#fff',
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 24,
              padding: '12px 32px',
              borderRadius: 16,
              border: '2px solid #00eaff',
              boxShadow: '0 0 16px #00eaff',
              marginTop: 24,
              textAlign: 'center',
            }}>
              Press <span style={{ color: '#39ff14', fontWeight: 700 }}>E</span> to challenge <span style={{ color: '#00eaff', fontWeight: 700 }}>{nearPlayer.name}</span>
            </div>
          </Html>
        )*/}
        {[...Array(10)].map((_, i) => (
          <StylizedRock key={i} position={[-8 + i * 2, 0, 8 + (i % 2) * 2]} seed={i} />
        ))}
        {[...Array(4)].map((_, i) => (
          <StylizedBuilding key={i} position={[-24 + i * 16, 0, -28]} seed={i} />
        ))}
        {/* Clouds */}
        <Cloud position={[-20, 18, -10]} speed={0.2} opacity={0.7} bounds={[18, 5, 8]} segments={20} />
        <Cloud position={[10, 20, 10]} speed={0.15} opacity={0.6} bounds={[14, 6, 7]} segments={18} />
        <Cloud position={[0, 22, -20]} speed={0.18} opacity={0.5} bounds={[20, 7, 10]} segments={22} />
        {/* Storm cloud and lightning */}
        <StormEffect />
      </Canvas>
      <MultiplayerPanel others={others} self={name} />
      {/* Leaderboard toggle button */}
      <button
        onClick={() => setLeaderboardOpen(o => !o)}
        style={{
          position: 'absolute',
          bottom: leaderboardOpen ? 220 : 32,
          right: 48,
          zIndex: 40,
          background: NEON_COLORS.panel,
          border: `2.5px solid ${NEON_COLORS.accent2}`,
          borderRadius: 12,
          boxShadow: NEON_COLORS.shadow,
          color: NEON_COLORS.accent2,
          fontSize: 32,
          width: 56,
          height: 56,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Orbitron, sans-serif',
          transition: 'background 0.2s',
        }}
        title="Show leaderboard"
      >
        🏆
      </button>
      {leaderboardOpen && (
        <LeaderboardPanel solved={solved} exp={exp} name={name} others={others} />
      )}
    </>
  );
};

const MultiplayerPanel = ({ others, self }: { others: any[], self: string }) => (
  <div style={{ position: 'absolute', top: 16, right: 16, background: NEON_COLORS.panel, padding: 14, borderRadius: 14, minWidth: 200, border: `2px solid ${NEON_COLORS.accent2}`, boxShadow: NEON_COLORS.shadow, color: NEON_COLORS.text, fontFamily: 'Orbitron, sans-serif', fontSize: 18, letterSpacing: 1 }}>
    <b style={{ color: NEON_COLORS.accent2 }}>Online Players ({others.length + 1}):</b>
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginTop: 8 }}>
      <li key="self" style={{ color: NEON_COLORS.accent, fontWeight: 'bold', textShadow: NEON_COLORS.shadow }}>{self} (You)</li>
      {others.map((p, i) => (
        <li key={p.id || i} style={{ color: NEON_COLORS.text }}>{p.name}</li>
      ))}
    </ul>
  </div>
);

const CodeEditorModal = ({ open, onClose, onSuccess, challenge }: { open: boolean, onClose: () => void, onSuccess: () => void, challenge: typeof challenges[0] | null }) => {
  const [code, setCode] = useState(challenge?.starterCode || '');
  const [feedback, setFeedback] = useState<string | null>(null);
  useEffect(() => {
    setCode(challenge?.starterCode || '');
    setFeedback(null);
  }, [challenge]);
  const handleSubmit = () => {
    setFeedback(null);
    try {
      // eslint-disable-next-line no-eval
      const fn = eval(`(${code})`);
      if (challenge && challenge.test(fn)) {
        setFeedback('✅ Correct!');
        onSuccess();
      } else {
        setFeedback('❌ Incorrect result. Try again!');
      }
    } catch (e) {
      setFeedback('❌ Error in code.');
    }
  };
  return open && challenge ? (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000a', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
      <div style={{ background: '#fff', padding: 32, borderRadius: 16, minWidth: 600, minHeight: 400 }}>
        <h2>Coding Challenge</h2>
        <p>{challenge.description}</p>
        <div style={{ height: 250, marginBottom: 16 }}>
          <Editor
            height="100%"
            defaultLanguage="javascript"
            value={code}
            onChange={v => setCode(v || '')}
            options={{ minimap: { enabled: false }, fontSize: 16 }}
          />
        </div>
        <button onClick={handleSubmit} style={{ marginRight: 8 }}>Submit</button>
        <button onClick={onClose}>Close</button>
        {feedback && <div style={{ marginTop: 16 }}>{feedback}</div>}
      </div>
    </div>
  ) : null;
};

const LeaderboardPanel = ({ solved, exp, name, others }: { solved: Set<number>, exp: number, name: string, others: any[] }) => {
  // Fake leaderboard: sort by exp, show self and others
  const players = [
    { name, exp, solved: solved.size, self: true },
    ...others.map(p => ({ name: p.name, exp: p.exp || 0, solved: p.solved || 0, self: false }))
  ].sort((a, b) => b.exp - a.exp);
  return (
    <div style={{
      position: 'absolute',
      bottom: 32,
      right: 32,
      background: NEON_COLORS.panel,
      border: `2.5px solid ${NEON_COLORS.accent2}`,
      borderRadius: 18,
      boxShadow: NEON_COLORS.shadow,
      color: NEON_COLORS.text,
      fontFamily: 'Orbitron, sans-serif',
      fontSize: 20,
      minWidth: 320,
      zIndex: 30,
      padding: 24,
      maxHeight: '40vh',
      overflowY: 'auto',
    }}>
      <div style={{ fontSize: 28, color: NEON_COLORS.accent2, marginBottom: 16, textAlign: 'center', textShadow: NEON_COLORS.shadow }}>🏆 Leaderboard</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', color: NEON_COLORS.text }}>
        <thead>
          <tr style={{ color: NEON_COLORS.accent }}>
            <th style={{ textAlign: 'left', paddingBottom: 8 }}>Player</th>
            <th style={{ textAlign: 'center', paddingBottom: 8 }}>EXP</th>
            <th style={{ textAlign: 'center', paddingBottom: 8 }}>Solved</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <tr key={p.name} style={{ fontWeight: p.self ? 700 : 400, color: p.self ? NEON_COLORS.accent : NEON_COLORS.text, background: p.self ? 'rgba(57,255,20,0.08)' : 'none' }}>
              <td style={{ padding: '4px 0' }}>{i + 1}. {p.name} {p.self && <span style={{ color: NEON_COLORS.accent2 }}>(You)</span>}</td>
              <td style={{ textAlign: 'center' }}>{p.exp}</td>
              <td style={{ textAlign: 'center' }}>{p.solved}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// 1. Irregular, clustered rocks
function StylizedRock({ position, seed }: { position: [number, number, number], seed: number }) {
  // Randomize size, rotation, and shape
  const scale = 1.2 + (seed % 3) * 0.7;
  const width = 1.2 + (seed % 2) * 0.8;
  const height = 1.1 + (seed % 2) * 0.6;
  const depth = 1.3 + (seed % 2) * 0.5;
  const rotY = (seed % 4) * Math.PI / 6;
  return (
    <mesh position={position} rotation={[0, rotY, 0]} castShadow>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial color={['#3a5a6b', '#4b6b7a', '#2e4856'][seed % 3]} />
    </mesh>
  );
}

// 2. Stylized buildings
function StylizedBuilding({ position, seed }: { position: [number, number, number], seed: number }) {
  // Randomize size and color
  const width = 4 + (seed % 2) * 2;
  const height = 3 + (seed % 2) * 1.2;
  const color = ['#2e2e38', '#3c2e2e', '#2e3832'][seed % 3];
  const roofColor = ['#6b8e23', '#4b5320', '#7c6f57'][seed % 3];
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[width, height, width * 0.7]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, height + 0.7, 0]} castShadow>
        <cylinderGeometry args={[width * 0.45, width * 0.45, 1.2, 24, 1, true, 0, Math.PI]} />
        <meshStandardMaterial color={roofColor} />
      </mesh>
    </group>
  );
}

function StormEffect() {
  const lightRef = useRef<any>(null);
  const [flash, setFlash] = useState(false);
  useFrame(() => {
    // Randomly flash lightning
    if (Math.random() < 0.008) setFlash(true);
    if (flash && Math.random() < 0.3) setFlash(false);
    if (lightRef.current) lightRef.current.intensity = flash ? 7 : 0;
  });
  return (
    <>
      {/* Dark storm cloud */}
      <Cloud position={[0, 25, 0]} speed={0.12} opacity={0.85} bounds={[22, 10, 12]} color="#222" segments={24} />
      {/* Lightning flash */}
      <pointLight ref={lightRef} position={[0, 24, 0]} color="#fff" intensity={0} distance={60} />
    </>
  );
}

// Add this above Game3DScene:
const Bush = ({ position }: { position: [number, number, number] }) => (
  <mesh position={position} castShadow>
    <sphereGeometry args={[0.5, 16, 16]} />
    <meshStandardMaterial color="#2e8b57" />
  </mesh>
);

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [exp, setExp] = useState(0);
  const [solved, setSolved] = useState<Set<number>>(new Set());
  const [currentChallengeId, setCurrentChallengeId] = useState<number | null>(null);
  const [name, setName] = useState<string>('');
  const [nameConfirmed, setNameConfirmed] = useState(false);
  const [avatar, setAvatar] = useState<{ bodyShape: string, headShape: string, bodyColor: string, headColor: string, accessories: string[] } | null>(null);
  const [players, setPlayers] = useState<any[]>([]); // for leaderboard
  // PvP state
  const [pvpState, setPvpState] = useState<'idle'|'requesting'|'waiting'|'selecting'|'answering'|'result'>('idle');
  const [pvpOpponent, setPvpOpponent] = useState<any>(null); // {name, id, ...}
  const [pvpQuestion, setPvpQuestion] = useState<any>(null);
  const [pvpResult, setPvpResult] = useState<any>(null);
  const [isChallenger, setIsChallenger] = useState(false);
  const [multiplayerSocket, setMultiplayerSocket] = useState<Socket | null>(null);
  const [others, setOthers] = useState<any[]>([]);
  const pvpSocketRef = useRef<Socket | null>(null);
  const handleSuccess = () => {
    if (currentChallengeId !== null && !solved.has(currentChallengeId)) {
      const ch = challenges.find(c => c.id === currentChallengeId);
      if (ch) setExp(e => e + ch.exp);
      setSolved(prev => new Set([...Array.from(prev), currentChallengeId]));
    }
    setTimeout(() => setModalOpen(false), 1000);
  };
  const handleTaskTrigger = (challengeId: number) => {
    setCurrentChallengeId(challengeId);
    setModalOpen(true);
  };
  const currentChallenge = challenges.find(c => c.id === currentChallengeId) || null;
  const [chatMessages, setChatMessages] = useState<{name: string, text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatSocketRef = useRef<Socket | null>(null);
  useEffect(() => {
    const socket: Socket = io('https://kodziarze.onrender.com');
    chatSocketRef.current = socket;
    socket.on('chat_history', (msgs) => {
      setChatMessages(msgs);
    });
    socket.on('chat_message', (msg) => {
      setChatMessages(msgs => [...msgs.slice(-29), msg]);
    });
    return () => { socket.disconnect(); };
  }, []);
  const handleChatSend = () => {
    if (chatInput.trim() && nameConfirmed && chatSocketRef.current) {
      chatSocketRef.current.emit('chat_message', { name, text: chatInput });
      setChatInput('');
    }
  };
  // PvP Socket.io setup
  useEffect(() => {
    if (nameConfirmed && avatar) {
      const socket: Socket = io('https://kodziarze.onrender.com');
      setMultiplayerSocket(socket);
      socket.emit('join', {
        x: 0, y: 0.5, z: 15, // spawn position
        name,
        shape: avatar.bodyShape,
        color: avatar.bodyColor,
        headShape: avatar.headShape,
        headColor: avatar.headColor,
        accessories: avatar.accessories
      });
      socket.on('players', (players) => {
        setOthers(players.filter((p: any) => p.name !== name));
      });
      return () => { socket.disconnect(); };
    }
  }, [nameConfirmed, avatar, name]);
  // PvP UI handlers
  const handleChallengeRequest = (opponent: any) => {
    console.log('Challenging opponent:', opponent); // DEBUG
    setPvpOpponent(opponent);
    // Emit challenge request
    pvpSocketRef.current?.emit('challenge_request', { to: opponent.name });
    // Do NOT set pvpState or isChallenger here; wait for backend response
  };
  const handleChallengeAccept = () => {
    setPvpState('selecting');
    setIsChallenger(false);
    pvpSocketRef.current?.emit('challenge_response', { from: pvpOpponent.name, accepted: true });
  };
  const handleChallengeDecline = () => {
    setPvpState('idle');
    setPvpOpponent(null);
    setIsChallenger(false);
    pvpSocketRef.current?.emit('challenge_response', { from: pvpOpponent.name, accepted: false });
  };
  const handleChallengeWaiting = (opponent: any) => {
    setPvpOpponent(opponent);
    setPvpState('waiting');
    setIsChallenger(true);
  };
  const handleQuestionSelect = (q: any) => {
    setPvpQuestion(q);
    setPvpState('answering');
    setIsChallenger(true);
    pvpSocketRef.current?.emit('challenge_question', { to: pvpOpponent.name, question: q });
  };
  const handleAnswerSubmit = (correct: boolean) => {
    setPvpResult({ correct });
    setPvpState('result');
    setIsChallenger(false);
    pvpSocketRef.current?.emit('challenge_answer', { to: pvpOpponent.name, correct });
  };
  const handleResultClose = () => {
    setPvpState('idle');
    setPvpOpponent(null);
    setPvpQuestion(null);
    setPvpResult(null);
    setIsChallenger(false);
  };
  // PvP Modals (update for real multiplayer)
  const PvPModals = () => {
    if (pvpState === 'waiting' && isChallenger) {
      return (
        <div className="modal-bg"><div className="modal">Waiting for {pvpOpponent?.name} to accept...<br /><button onClick={handleResultClose}>Cancel</button></div></div>
      );
    }
    if (pvpState === 'waiting' && !isChallenger) {
      return (
        <div className="modal-bg"><div className="modal">You have been challenged by {pvpOpponent?.name}.<br /><button onClick={handleChallengeAccept}>Accept</button> <button onClick={handleChallengeDecline}>Decline</button></div></div>
      );
    }
    if (pvpState === 'requesting') {
      return (
        <div className="modal-bg"><div className="modal"><b>Challenge {pvpOpponent?.name}?</b><br /><button onClick={() => handleChallengeWaiting(pvpOpponent)}>Waiting...</button><button onClick={handleResultClose}>Cancel</button></div></div>
      );
    }
    if (pvpState === 'selecting') {
      return (
        <div className="modal-bg"><div className="modal"><b>Select a question for {pvpOpponent?.name}:</b><ul>{challenges.map(ch => <li key={ch.id}><button onClick={() => handleQuestionSelect(ch)}>{ch.description}</button></li>)}</ul></div></div>
      );
    }
    if (pvpState === 'answering') {
      return (
        <div className="modal-bg"><div className="modal"><b>Answer this question:</b><br />{pvpQuestion?.description}<br /><textarea style={{width: '100%', height: 80}} defaultValue={pvpQuestion?.starterCode} /><br /><button onClick={() => handleAnswerSubmit(true)}>Submit (Correct)</button><button onClick={() => handleAnswerSubmit(false)}>Submit (Wrong)</button></div></div>
      );
    }
    if (pvpState === 'result') {
      return (
        <div className="modal-bg"><div className="modal">{pvpResult?.correct ? 'Correct! +2 points' : 'Wrong! -1 point, challenger +1 point'}<br /><button onClick={handleResultClose}>Close</button></div></div>
      );
    }
    return null;
  };
  if (!nameConfirmed) {
    // Show login UI
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: `linear-gradient(rgba(24,26,32,0.82), rgba(24,26,32,0.92)), url('/kodziarze-login-bg.png') center/cover no-repeat`,
        color: NEON_COLORS.text
      }}>
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <span style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 72,
            color: '#fff',
            textShadow: '0 0 16px #e6007a, 0 0 48px #ff69b4, 0 0 4px #fff',
            letterSpacing: 6,
            fontWeight: 900,
            textTransform: 'uppercase',
            filter: 'drop-shadow(0 0 16px #e6007a) drop-shadow(0 0 32px #ff69b4)',
            background: 'linear-gradient(90deg, #e6007a 0%, #ff69b4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.1,
          }}>Kodziarze</span>
        </div>
        <div style={{ background: NEON_COLORS.panel, padding: 36, borderRadius: 18, minWidth: 340, boxShadow: NEON_COLORS.shadow, border: `2.5px solid ${NEON_COLORS.border}` }}>
          <h2 style={{ color: NEON_COLORS.accent, fontFamily: 'Orbitron, sans-serif', fontSize: 32, marginBottom: 18, textShadow: NEON_COLORS.shadow }}>Enter your player name</h2>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ fontSize: 24, padding: 10, borderRadius: 10, border: `2px solid ${NEON_COLORS.accent2}`, background: '#232946', color: NEON_COLORS.text, marginBottom: 12, width: '100%', outline: 'none', fontFamily: 'Orbitron, sans-serif', letterSpacing: 1 }}
            onKeyDown={e => {
              if (e.key === 'Enter' && name.trim().length > 0) setNameConfirmed(true);
            }}
            placeholder="Your name..."
          />
          <button
            style={{ marginTop: 12, fontSize: 22, padding: '10px 36px', borderRadius: 10, background: NEON_COLORS.accent2, color: '#181a20', border: 'none', fontWeight: 700, boxShadow: NEON_COLORS.shadow, cursor: 'pointer', fontFamily: 'Orbitron, sans-serif', letterSpacing: 2 }}
            disabled={name.trim().length === 0}
            onClick={() => setNameConfirmed(true)}
          >
            Start
          </button>
        </div>
      </div>
    );
  }
  if (!avatar) {
    // Show avatar builder
    return <AvatarBuilderModal onSelect={setAvatar} />;
  }
  return (
    <div className="App" style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 16, left: 16, background: NEON_COLORS.panel, padding: 14, borderRadius: 14, zIndex: 2, border: `2px solid ${NEON_COLORS.accent2}`, boxShadow: NEON_COLORS.shadow, color: NEON_COLORS.text, fontFamily: 'Orbitron, sans-serif', fontSize: 20, letterSpacing: 1 }}>
        <span style={{ color: NEON_COLORS.accent, marginRight: 8 }}>★</span>EXP: {exp} <br />
        <span style={{ color: NEON_COLORS.accent2, marginRight: 8 }}>✔</span>Solved: {solved.size} / {challenges.length}
      </div>
      <Game3DScene
        onTaskTrigger={handleTaskTrigger}
        solved={solved}
        name={name}
        avatar={avatar}
        modalOpen={modalOpen}
        exp={exp}
        onPvPChallenge={handleChallengeRequest}
        pvpState={pvpState}
        pvpOpponent={pvpOpponent}
        others={others}
      />
      <CodeEditorModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={handleSuccess} challenge={currentChallenge} />
      {/* Chat panel (left middle, not neon) */}
      <div style={{
        position: 'absolute',
        left: 32,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 320,
        background: 'rgba(32,34,40,0.72)',
        borderRadius: 16,
        boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
        fontSize: 17,
        zIndex: 25,
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto',
      }}>
        <div style={{ padding: '10px 16px 0 16px', fontWeight: 700, fontSize: 18, color: '#e0e0e0', letterSpacing: 1 }}>Chat</div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px', maxHeight: 220 }}>
          {chatMessages.length === 0 && <div style={{ color: '#aaa' }}>No messages yet.</div>}
          {chatMessages.map((msg, i) => (
            <div key={i} style={{ marginBottom: 4, wordBreak: 'break-word' }}>
              <span style={{ color: '#00eaff', fontWeight: 700 }}>[{msg.name}]</span>: {msg.text}
            </div>
          ))}
        </div>
        <form style={{ display: 'flex', borderTop: '1px solid #222', background: 'rgba(0,0,0,0.08)' }} onSubmit={e => { e.preventDefault(); handleChatSend(); }}>
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            style={{ flex: 1, fontSize: 16, padding: 8, border: 'none', borderRadius: '0 0 0 16px', background: 'rgba(0,0,0,0.08)', color: '#fff', outline: 'none' }}
            placeholder="Type a message..."
            disabled={!nameConfirmed}
          />
          <button type="submit" style={{ background: 'none', border: 'none', color: '#00eaff', fontSize: 20, padding: '0 16px', cursor: 'pointer' }} disabled={!nameConfirmed}>➤</button>
        </form>
      </div>
      {/* Scatter bushes */}
      <Bush position={[-5, 0, 5]} />
      <Bush position={[6, 0, -6]} />
      <Bush position={[8, 0, 3]} />
      <Bush position={[-10, 0, 9]} />
      <Bush position={[11, 0, -11]} />
      <Bush position={[-28, 0, 18]} />
      <Bush position={[28, 0, -18]} />
      <Bush position={[18, 0, 28]} />
      <Bush position={[-18, 0, -28]} />
      <Bush position={[0, 0, 8]} />
      <Bush position={[15, 0, 13]} />
      <Bush position={[-15, 0, -13]} />
      <Bush position={[25, 0, -8]} />
      <Bush position={[-25, 0, 8]} />
      <Bush position={[8, 0, -23]} />
      <Bush position={[-8, 0, 23]} />
      <Bush position={[0, 0, 23]} />
      <Bush position={[23, 0, 0]} />
      <Bush position={[-23, 0, 0]} />
      <Bush position={[0, 0, -23]} />
      {PvPModals()}
    </div>
  );
}

export default App;
