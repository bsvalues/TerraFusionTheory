import * as THREE from 'three';

export const fibonacciSpiral = (data) => {
  const points = [];
  const geometry = new THREE.BufferGeometry();
  
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const angle = 2 * Math.PI * (1 - 1 / goldenRatio);
  
  data.forEach((point, i) => {
    const radius = Math.sqrt(i) * 0.5;
    const theta = i * angle;
    
    const x = radius * Math.cos(theta);
    const y = radius * Math.sin(theta);
    const z = point.value * 0.1;
    
    points.push(new THREE.Vector3(x, y, z));
  });
  
  const curve = new THREE.CatmullRomCurve3(points);
  const tubeGeometry = new THREE.TubeGeometry(curve, 100, 0.1, 8, false);
  
  return tubeGeometry;
};

export const voronoiTessellation = (data) => {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  
  data.forEach((point, i) => {
    const x = point.x;
    const y = point.y;
    const z = point.value * 0.1;
    
    vertices.push(x, y, z);
    
    if (i > 0 && i < data.length - 1) {
      indices.push(i - 1, i, i + 1);
    }
  });
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  return geometry;
};

export const calculateMarketEnergy = (data) => {
  const energyMap = new Map();
  
  data.forEach(point => {
    const { x, y, value } = point;
    const key = `${x},${y}`;
    
    if (!energyMap.has(key)) {
      energyMap.set(key, {
        value: 0,
        count: 0,
        neighbors: []
      });
    }
    
    const cell = energyMap.get(key);
    cell.value += value;
    cell.count++;
    
    // Find neighbors
    data.forEach(other => {
      if (other !== point) {
        const distance = Math.sqrt(
          Math.pow(other.x - x, 2) + Math.pow(other.y - y, 2)
        );
        if (distance < 1) {
          cell.neighbors.push(other);
        }
      }
    });
  });
  
  return Array.from(energyMap.entries()).map(([key, cell]) => ({
    position: key.split(',').map(Number),
    value: cell.value / cell.count,
    neighbors: cell.neighbors
  }));
};

export const generateHarmonicPattern = (data) => {
  const pattern = [];
  const baseFrequency = 1;
  
  data.forEach((point, i) => {
    const frequency = baseFrequency * (i + 1);
    const amplitude = point.value * 0.1;
    const phase = i * Math.PI / 4;
    
    pattern.push({
      frequency,
      amplitude,
      phase,
      position: [point.x, point.y, point.value]
    });
  });
  
  return pattern;
}; 