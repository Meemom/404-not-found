import * as THREE from "three";

export interface WarehouseLighting {
  strips: THREE.Mesh[];
  pointLights: THREE.PointLight[];
}

export function createWarehouseLighting(scene: THREE.Scene): WarehouseLighting {
  // Ambient light
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  // Hemisphere light
  scene.add(new THREE.HemisphereLight(0xffffff, 0x888888, 0.3));

  // Directional sunlight from upper corner
  const sun = new THREE.DirectionalLight(0xffffff, 0.6);
  sun.position.set(5, 8, 3);
  scene.add(sun);

  // 4 fluorescent strips at ceiling
  const strips: THREE.Mesh[] = [];
  const pointLights: THREE.PointLight[] = [];

  const stripGeo = new THREE.BoxGeometry(6, 0.08, 0.3);
  const stripMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.8,
  });

  const positions = [
    { x: -3, z: -2 },
    { x: 3, z: -2 },
    { x: 0, z: 0 },
    { x: 0, z: 3 },
  ];

  for (const pos of positions) {
    const strip = new THREE.Mesh(stripGeo, stripMat.clone());
    strip.position.set(pos.x, 4.8, pos.z);
    scene.add(strip);
    strips.push(strip);

    const pl = new THREE.PointLight(0xffffff, 0.5, 10);
    pl.position.set(pos.x, 4.7, pos.z);
    scene.add(pl);
    pointLights.push(pl);
  }

  return { strips, pointLights };
}

export function flickerShelfLights(
  strips: THREE.Mesh[],
  criticalCategories: Set<string>,
  elapsed: number
) {
  const flicker = Math.sin(elapsed * 4) > 0.3;

  // Map strip indices to approximate shelf positions
  const stripCategoryMap: Record<number, string> = {
    0: "Semiconductors",
    1: "Battery Components",
    3: "Sensors",
  };

  for (let i = 0; i < strips.length; i++) {
    const mat = strips[i].material as THREE.MeshStandardMaterial;
    const cat = stripCategoryMap[i];
    if (cat && criticalCategories.has(cat) && flicker) {
      mat.emissive.setHex(0xff0000);
      mat.emissiveIntensity = 1.0;
    } else {
      mat.emissive.setHex(0xffffff);
      mat.emissiveIntensity = 0.8;
    }
  }
}
