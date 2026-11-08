import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const SLAB = 0.14;
const GAP = 0.72;

const STATUS_COLOR = {
  available: 0x5e7d5a,
  low: 0xc08a3e,
  empty: 0xa8a29c,
};

export default function Tower3D({ floors, selected, myFloor, onSelect }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = null;
    const width = mount.clientWidth;
    const height = mount.clientHeight || 460;
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 200);
    camera.position.set(7.5, 6.5, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.autoRotate = false;
    controls.minDistance = 8;
    controls.maxDistance = 26;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = Math.PI / 2.05;

    scene.add(new THREE.AmbientLight(0xffffff, 1.35));
    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(6, 12, 8);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(-8, 6, -6);
    scene.add(fill);

    const group = new THREE.Group();
    scene.add(group);

    const pickable = [];
    const meshesByCode = {};
    const levels = floors.map((f, i) => ({ ...f, y: i * GAP }));

    levels.forEach((f) => {
      const isProgramme = !!f.status;
      const slabColor = isProgramme ? STATUS_COLOR[f.status] : 0xd6d2cd;
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(5.2, SLAB, 3.6),
        new THREE.MeshStandardMaterial({
          color: slabColor,
          roughness: 0.72,
          metalness: 0.04,
          transparent: !isProgramme,
          opacity: isProgramme ? 1 : 0.55,
        })
      );
      slab.position.y = f.y;
      slab.userData = { code: f.code, name: f.name, status: f.status, stock: f.stock, tableLabel: f.tableLabel };
      group.add(slab);
      pickable.push(slab);
      meshesByCode[f.code] = { slab };

      const glass = new THREE.Mesh(
        new THREE.BoxGeometry(5.0, GAP - SLAB - 0.06, 3.4),
        new THREE.MeshPhysicalMaterial({
          color: 0xdfe3e0,
          transparent: true,
          opacity: isProgramme ? 0.16 : 0.1,
          roughness: 0.12,
          metalness: 0,
          transmission: 0.2,
        })
      );
      glass.position.y = f.y + (GAP - SLAB) / 2;
      group.add(glass);

      const pins = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 16, 16),
        new THREE.MeshStandardMaterial({ color: isProgramme ? 0x141414 : 0xb8b3ae })
      );
      pins.position.set(2.1, f.y + 0.14, 1.3);
      group.add(pins);

      if (f.code === myFloor) {
        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.BoxGeometry(5.3, SLAB + 0.02, 3.7)),
          new THREE.LineBasicMaterial({ color: 0xb9875a, linewidth: 2 })
        );
        edges.position.y = f.y;
        group.add(edges);
      }
      if (f.code === selected) {
        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.BoxGeometry(5.4, SLAB + 0.04, 3.8)),
          new THREE.LineBasicMaterial({ color: 0x141414 })
        );
        edges.position.y = f.y;
        group.add(edges);
      }
    });

    // core
    const core = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, levels.length * GAP, 0.9),
      new THREE.MeshStandardMaterial({ color: 0xc9c5c0, roughness: 0.9 })
    );
    core.position.set(-1.6, (levels.length - 1) * GAP * 0.5, 0);
    group.add(core);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hovered = null;
    let targetY = 3.4;

    const onMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(pickable)[0];
      if (hit && hit.object.userData.status) {
        if (hovered !== hit.object) {
          hovered = hit.object;
          setHover({ code: hit.object.userData.code, x: e.clientX - rect.left, y: e.clientY - rect.top });
        } else {
          setHover((h) => (h ? { ...h, x: e.clientX - rect.left, y: e.clientY - rect.top } : h));
        }
        renderer.domElement.style.cursor = "pointer";
      } else {
        if (hovered) {
          hovered = null;
          setHover(null);
        }
        renderer.domElement.style.cursor = "grab";
      }
    };

    const onClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(pickable)[0];
      if (hit && hit.object.userData.status) {
        onSelectRef.current?.(hit.object.userData.code);
      }
    };

    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("click", onClick);

    let raf;
    const animate = () => {
      const desired = selectedRef.current
        ? levels.find((l) => l.code === selectedRef.current)?.y ?? 3.4
        : 3.4;
      targetY += (desired - targetY) * 0.08;
      controls.target.set(0, targetY, 0);
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight || 460;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    stateRef.current = { renderer, scene, camera, levels };
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("click", onClick);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(floors.map((f) => [f.code, f.status])), myFloor]);

  const onSelectRef = useRef(onSelect);
  const selectedRef = useRef(selected);
  useEffect(() => {
    onSelectRef.current = onSelect;
    selectedRef.current = selected;
  }, [onSelect, selected]);

  const hoverFloor = hover ? floors.find((f) => f.code === hover.code) : null;

  return (
    <div ref={mountRef} className="relative h-[420px] w-full sm:h-[500px]">
      {hover && hoverFloor && (
        <div
          className="pointer-events-none absolute z-10 max-w-[240px] border border-rule bg-paper px-3 py-2 text-[11px] leading-relaxed text-ink shadow-[0_16px_40px_-24px_rgba(20,20,20,0.5)]"
          style={{ left: Math.min(hover.x + 14, 260), top: Math.max(8, hover.y - 20) }}
        >
          <span className="block text-[12px]">
            {hoverFloor.code} · {hoverFloor.name}
          </span>
          <span className="text-sub">
            {hoverFloor.stockLabel} · next ground drop {hoverFloor.nextLabel}
          </span>
        </div>
      )}
    </div>
  );
}