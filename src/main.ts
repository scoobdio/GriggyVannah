import { Engine } from '@babylonjs/core/Engines/engine';
import { createSavannahScene } from './scene';
import { worldConfig } from './config';
import './style.css';

const canvas = document.querySelector<HTMLCanvasElement>('#world');
const error = document.querySelector<HTMLParagraphElement>('#error');
if (!canvas || !error) throw new Error('Required application elements are missing.');

let engine: Engine | undefined;
try {
  engine = new Engine(canvas, true, { stencil: false });
  const renderer = engine;
  const resize = () => {
    renderer.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, worldConfig.render.maxDevicePixelRatio));
    renderer.resize();
  };
  resize();
  const scene = createSavannahScene(renderer);
  renderer.runRenderLoop(() => scene.render());
  window.addEventListener('resize', resize);

  // Vite module replacement must not accumulate engines or event listeners.
  import.meta.hot?.dispose(() => {
    window.removeEventListener('resize', resize);
    scene.dispose();
    renderer.dispose();
  });
} catch (cause) {
  engine?.dispose();
  error.hidden = false;
  error.textContent = 'The savannah could not start. Please use a browser with WebGL enabled, then reload the page.';
  console.error('Unable to start GriggyVannah:', cause);
}
