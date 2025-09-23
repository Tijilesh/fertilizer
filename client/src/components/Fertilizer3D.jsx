import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage } from '@react-three/drei'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

function FertilizerBag() {
  const ref = useRef()
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.01
      ref.current.rotation.x = 0.2
    }
  })
  return (
    <mesh ref={ref} castShadow receiveShadow>
      {/* Bag body */}
      <boxGeometry args={[1, 1.4, 0.4]} />
      <meshStandardMaterial color="#22c55e" />
      {/* Bag label */}
      <mesh position={[0, 0.2, 0.22]}>
        <planeGeometry args={[0.7, 0.4]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      {/* Bag top */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[1, 0.1, 0.4]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
    </mesh>
  )
}

const Fertilizer3D = () => (
  <div style={{ width: '100%', height: 220 }}>
    <Canvas shadows camera={{ position: [2, 2, 3], fov: 40 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={0.7} castShadow />
      <Stage environment={null} intensity={0.5}>
        <FertilizerBag />
      </Stage>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.7} />
    </Canvas>
  </div>
)

export default Fertilizer3D 