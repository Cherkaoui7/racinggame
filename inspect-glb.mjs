import { Document, NodeIO } from '@gltf-transform/core';

async function inspect() {
  const io = new NodeIO();
  const doc = await io.read('public/Mini cooper.glb');
  const root = doc.getRoot();

  console.log('--- MESHES ---');
  root.listMeshes().forEach((mesh, index) => {
    console.log(`Mesh ${index}: ${mesh.getName()}`);
  });

  console.log('\n--- MATERIALS ---');
  root.listMaterials().forEach((material, index) => {
    console.log(`Material ${index}: ${material.getName()}`);
  });

  console.log('\n--- NODES ---');
  const traverse = (node, depth) => {
    const mesh = node.getMesh();
    console.log(`${'  '.repeat(depth)}- ${node.getName()} ${mesh ? `(Mesh: ${mesh.getName()})` : ''}`);
    node.listChildren().forEach((child) => traverse(child, depth + 1));
  };
  root.listScenes()[0].listChildren().forEach((child) => traverse(child, 0));
}

inspect().catch(console.error);
