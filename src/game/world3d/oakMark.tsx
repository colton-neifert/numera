/** Oakstead's mark: a short trunk and three leaves. Same shape on the shield, the square, and the castle. */
export function OakMark({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[0.07, 0.2, 0.04]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
      <mesh position={[0, 0.12, 0.02]} scale={[0.62, 1, 0.28]}>
        <sphereGeometry args={[0.15, 6, 5]} />
        <meshLambertMaterial color="#2f6a32" />
      </mesh>
      <mesh position={[-0.13, 0.02, 0.02]} rotation={[0, 0, 0.65]} scale={[0.5, 0.85, 0.24]}>
        <sphereGeometry args={[0.12, 6, 5]} />
        <meshLambertMaterial color="#3d7a3a" />
      </mesh>
      <mesh position={[0.13, 0.02, 0.02]} rotation={[0, 0, -0.65]} scale={[0.5, 0.85, 0.24]}>
        <sphereGeometry args={[0.12, 6, 5]} />
        <meshLambertMaterial color="#245828" />
      </mesh>
    </group>
  );
}
