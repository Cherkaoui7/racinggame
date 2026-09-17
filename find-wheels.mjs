import { Document, NodeIO } from '@gltf-transform/core';

async function findWheels() {
  const io = new NodeIO();
  const doc = await io.read('public/Mini cooper.glb');
  const root = doc.getRoot();

  root.listNodes().forEach((node) => {
    const mesh = node.getMesh();
    if (mesh) {
      let isWheel = false;
      mesh.listPrimitives().forEach(prim => {
        const mat = prim.getMaterial();
        if (mat) {
          const name = mat.getName().toLowerCase();
          if (name.includes('wheel') || name.includes('tyre') || name.includes('tire')) {
            isWheel = true;
          }
        }
      });
      if (isWheel) {
        console.log(`Wheel Part: ${node.getName()} | Position:`, node.getTranslation());
      }
    }
  });
}

findWheels().catch(console.error);
