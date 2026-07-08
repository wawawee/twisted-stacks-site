import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type LayerId = "rf" | "wifi" | "thermal" | "emf" | "ac" | "presence";

interface LayerSpec {
  id: LayerId;
  label: string;
  color: number;
  cssColor: string;
  source: string;
  output: string;
}

const LAYERS: LayerSpec[] = [
  {
    id: "rf",
    label: "RF",
    color: 0x54d8ff,
    cssColor: "#54d8ff",
    source: "ESP32 + NRF24 / CC1101",
    output: "frequency orbs",
  },
  {
    id: "wifi",
    label: "WiFi",
    color: 0x7cf58a,
    cssColor: "#7cf58a",
    source: "Alfa + Raspberry Pi",
    output: "RSSI towers",
  },
  {
    id: "thermal",
    label: "Thermal",
    color: 0xff7348,
    cssColor: "#ff7348",
    source: "MLX90640",
    output: "heat fields",
  },
  {
    id: "emf",
    label: "EMF",
    color: 0xf3d45b,
    cssColor: "#f3d45b",
    source: "HMC5883L + coil",
    output: "field vectors",
  },
  {
    id: "ac",
    label: "AC",
    color: 0xff4d6d,
    cssColor: "#ff4d6d",
    source: "50 Hz wall probes",
    output: "live-wire hints",
  },
  {
    id: "presence",
    label: "Presence",
    color: 0xc9a5ff,
    cssColor: "#c9a5ff",
    source: "ESP-CSI mesh",
    output: "confidence ghost",
  },
];

const ALL_LAYER_IDS = LAYERS.map((layer) => layer.id);

function makeMat(color: number, opacity = 1) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1,
  });
}

function makeLineMat(color: number, opacity = 1) {
  return new THREE.LineBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
  });
}

function addLabelPlane(group: THREE.Group, color: number, x: number, y: number, z: number, w: number, h: number) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), makeMat(color, 0.11));
  mesh.position.set(x, y, z);
  mesh.rotation.x = -Math.PI / 2;
  group.add(mesh);
  return mesh;
}

export default function VRSuperPowers() {
  const mountRef = useRef<HTMLDivElement>(null);
  const activeLayersRef = useRef(new Set<LayerId>(ALL_LAYER_IDS));
  const [activeLayers, setActiveLayers] = useState<Set<LayerId>>(() => new Set(ALL_LAYER_IDS));
  const [packetCount, setPacketCount] = useState(14820);
  const [focusLayer, setFocusLayer] = useState<LayerId>("rf");

  const focusSpec = useMemo(
    () => LAYERS.find((layer) => layer.id === focusLayer) || LAYERS[0],
    [focusLayer],
  );

  useEffect(() => {
    activeLayersRef.current = activeLayers;
  }, [activeLayers]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPacketCount((count) => count + 18 + Math.floor(Math.random() * 12));
    }, 900);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x061014, 0.075);

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.set(0, 4.9, 8.6);
    camera.lookAt(0, 0.6, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x061014, 1);
    mount.appendChild(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);

    const rotationState = {
      dragging: false,
      lastX: 0,
      lastY: 0,
      yaw: 0,
      pitch: 0,
      targetYaw: 0,
      targetPitch: 0,
    };

    const onPointerDown = (event: PointerEvent) => {
      rotationState.dragging = true;
      rotationState.lastX = event.clientX;
      rotationState.lastY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.classList.add("is-dragging");
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!rotationState.dragging) return;
      const dx = event.clientX - rotationState.lastX;
      const dy = event.clientY - rotationState.lastY;
      rotationState.lastX = event.clientX;
      rotationState.lastY = event.clientY;
      rotationState.targetYaw += dx * 0.006;
      rotationState.targetPitch = THREE.MathUtils.clamp(
        rotationState.targetPitch + dy * 0.004,
        -0.38,
        0.34,
      );
    };

    const stopPointerDrag = (event: PointerEvent) => {
      rotationState.dragging = false;
      renderer.domElement.releasePointerCapture(event.pointerId);
      renderer.domElement.classList.remove("is-dragging");
    };

    const onDoubleClick = () => {
      rotationState.targetYaw = 0;
      rotationState.targetPitch = 0;
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", stopPointerDrag);
    renderer.domElement.addEventListener("pointercancel", stopPointerDrag);
    renderer.domElement.addEventListener("dblclick", onDoubleClick);

    const room = new THREE.Group();
    root.add(room);

    const floor = new THREE.GridHelper(8, 24, 0x2a6f72, 0x163b3e);
    floor.position.y = -0.02;
    room.add(floor);

    const wallMat = makeMat(0x163034, 0.35);
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(8, 3.4), wallMat);
    backWall.position.set(0, 1.7, -3.05);
    room.add(backWall);

    const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(6.1, 3.4), wallMat.clone());
    sideWall.position.set(-4, 1.7, 0);
    sideWall.rotation.y = Math.PI / 2;
    room.add(sideWall);

    const headset = new THREE.Group();
    const visor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.42, 0.28), makeMat(0xe9fbff, 0.92));
    const strap = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 0.2), makeMat(0x54d8ff, 0.36));
    visor.position.set(0, 1.55, 0.15);
    strap.position.set(0, 1.55, 0);
    headset.add(strap, visor);
    root.add(headset);

    const layerGroups = new Map<LayerId, THREE.Group>();
    LAYERS.forEach((layer) => {
      const group = new THREE.Group();
      group.userData.layer = layer.id;
      root.add(group);
      layerGroups.set(layer.id, group);
    });

    const rfGroup = layerGroups.get("rf")!;
    const rfGeometry = new THREE.SphereGeometry(0.13, 24, 16);
    const rfSignals = Array.from({ length: 13 }, (_, index) => {
      const profile = {
        x: Math.sin(index * 1.75) * (1.2 + (index % 3) * 0.42),
        y: 0.75 + (index % 5) * 0.27,
        z: Math.cos(index * 1.25) * (1.05 + (index % 4) * 0.28),
        phase: index * 0.64,
      };
      const mesh = new THREE.Mesh(rfGeometry, makeMat(0x54d8ff, 0.82));
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.24, 0.008, 8, 38),
        makeMat(0x54d8ff, 0.38),
      );
      ring.rotation.x = Math.PI / 2;
      mesh.add(ring);
      rfGroup.add(mesh);
      return { mesh, ring, ...profile };
    });

    const wifiGroup = layerGroups.get("wifi")!;
    const wifiProfiles = [
      { x: -2.8, z: -1.8, h: 1.65, phase: 0.3 },
      { x: 2.4, z: -2.0, h: 1.25, phase: 1.1 },
      { x: -0.7, z: 2.1, h: 0.92, phase: 1.9 },
      { x: 2.7, z: 1.1, h: 1.08, phase: 2.7 },
    ].map((profile) => {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.16, 1, 16), makeMat(0x7cf58a, 0.56));
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.18, 1, 28, 1, true), makeMat(0x7cf58a, 0.1));
      wifiGroup.add(tower, beam);
      return { tower, beam, ...profile };
    });

    const thermalGroup = layerGroups.get("thermal")!;
    const thermalProfiles = [
      { x: -1.7, z: 1.25, r: 0.95, phase: 0.2 },
      { x: 0.35, z: 0.7, r: 1.12, phase: 1.6 },
      { x: 1.8, z: -0.55, r: 0.74, phase: 2.3 },
    ].map((profile) => {
      const hot = addLabelPlane(thermalGroup, 0xff7348, profile.x, 0.045, profile.z, profile.r, profile.r);
      return { hot, ...profile };
    });

    const emfGroup = layerGroups.get("emf")!;
    const emfVectors = Array.from({ length: 8 }, (_, index) => {
      const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.62, 0)];
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), makeLineMat(0xf3d45b, 0.72));
      line.position.set(-3 + index * 0.86, 0.14, Math.sin(index * 1.2) * 1.75);
      emfGroup.add(line);
      return { line, phase: index * 0.8 };
    });

    const acGroup = layerGroups.get("ac")!;
    const acLines = [
      { x: -3.74, y: 1.15, z: -1.55, sx: 0.04, sy: 1.55, sz: 0.04, phase: 0 },
      { x: 2.45, y: 0.08, z: -2.92, sx: 2.55, sy: 0.05, sz: 0.04, phase: 1.2 },
    ].map((profile) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), makeMat(0xff4d6d, 0.62));
      mesh.scale.set(profile.sx, profile.sy, profile.sz);
      mesh.position.set(profile.x, profile.y, profile.z);
      acGroup.add(mesh);
      return { mesh, ...profile };
    });

    const presenceGroup = layerGroups.get("presence")!;
    const presenceCore = new THREE.Mesh(new THREE.SphereGeometry(0.36, 32, 18), makeMat(0xc9a5ff, 0.22));
    const presenceHalo = new THREE.Mesh(new THREE.SphereGeometry(0.72, 32, 18), makeMat(0xc9a5ff, 0.08));
    const presenceWire = new THREE.Mesh(
      new THREE.SphereGeometry(0.92, 16, 10),
      new THREE.MeshBasicMaterial({ color: 0xc9a5ff, wireframe: true, transparent: true, opacity: 0.26 }),
    );
    presenceGroup.add(presenceCore, presenceHalo, presenceWire);

    function resize() {
      const rect = mount.getBoundingClientRect();
      const width = Math.max(320, rect.width);
      const height = Math.max(360, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    let frame = 0;
    function animate() {
      frame = window.requestAnimationFrame(animate);
      const t = performance.now() * 0.001;
      rotationState.yaw += (rotationState.targetYaw - rotationState.yaw) * 0.12;
      rotationState.pitch += (rotationState.targetPitch - rotationState.pitch) * 0.12;
      root.rotation.y = Math.sin(t * 0.13) * 0.08 + rotationState.yaw;
      root.rotation.x = rotationState.pitch;
      headset.rotation.y = Math.sin(t * 0.7) * 0.08;
      headset.position.y = Math.sin(t * 1.3) * 0.035;

      layerGroups.forEach((group, id) => {
        group.visible = activeLayersRef.current.has(id);
      });

      rfSignals.forEach((signal, index) => {
        const pulse = 0.58 + Math.sin(t * 1.5 + signal.phase) * 0.34;
        signal.mesh.position.set(
          signal.x + Math.sin(t * 0.35 + signal.phase) * 0.08,
          signal.y + Math.sin(t * 0.55 + signal.phase) * 0.07,
          signal.z + Math.cos(t * 0.32 + signal.phase) * 0.08,
        );
        signal.mesh.scale.setScalar(0.82 + pulse * 1.9);
        signal.ring.scale.setScalar(1.1 + pulse * 1.4 + (index % 3) * 0.08);
      });

      wifiProfiles.forEach((tower) => {
        const strength = 0.62 + Math.sin(t * 0.9 + tower.phase) * 0.2;
        tower.tower.scale.set(1, tower.h * strength, 1);
        tower.tower.position.set(tower.x, (tower.h * strength) / 2, tower.z);
        tower.beam.scale.setScalar(0.72 + strength * 0.5);
        tower.beam.scale.y = tower.h * 1.6;
        tower.beam.position.set(tower.x, tower.h * 0.72, tower.z);
      });

      thermalProfiles.forEach((hot) => {
        const scale = 1 + Math.sin(t * 0.8 + hot.phase) * 0.08;
        hot.hot.scale.set(scale, scale, 1);
      });

      emfVectors.forEach((vector, index) => {
        vector.line.rotation.z = Math.sin(t * 0.9 + vector.phase) * 0.75;
        vector.line.rotation.y = t * 0.28 + index * 0.12;
        vector.line.scale.y = 0.72 + Math.sin(t * 0.7 + vector.phase) * 0.26;
      });

      acLines.forEach((line) => {
        const pulse = 0.58 + Math.sin(t * 4.4 + line.phase) * 0.34;
        line.mesh.scale.x = line.sx * (1 + pulse * 0.08);
        line.mesh.scale.y = line.sy * (1 + pulse * 0.08);
      });

      const px = Math.sin(t * 0.42) * 1.05;
      const pz = Math.cos(t * 0.36) * 1.28;
      presenceGroup.position.set(px, 0.92 + Math.sin(t * 0.9) * 0.1, pz);
      presenceHalo.scale.setScalar(1.1 + Math.sin(t * 1.2) * 0.08);
      presenceWire.rotation.y += 0.008;

      renderer.render(scene, camera);
    }

    resize();
    animate();
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", stopPointerDrag);
      renderer.domElement.removeEventListener("pointercancel", stopPointerDrag);
      renderer.domElement.removeEventListener("dblclick", onDoubleClick);
      renderer.dispose();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Line)) return;
        object.geometry?.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      mount.removeChild(renderer.domElement);
    };
  }, []);

  const toggleLayer = (id: LayerId) => {
    setActiveLayers((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        setFocusLayer(id);
      }
      if (next.size === 0) next.add(id);
      return next;
    });
  };

  return (
    <main className="vr-page">
      <div className="vr-canvas" ref={mountRef} />

      <header className="vr-topbar">
        <a className="vr-back-link" href="/" aria-label="Back to TwistedStacks">
          TS
        </a>
        <div className="vr-title-block">
          <span>TwistedStacks hardware lab</span>
          <h1>VR SUPARAYS</h1>
        </div>
        <a className="vr-github-link" href="https://github.com/wawawee/VR-SuperPowers" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </header>

      <section className="vr-layer-dock" aria-label="Visualization layers">
        {LAYERS.map((layer) => (
          <button
            key={layer.id}
            className={`vr-layer-button ${activeLayers.has(layer.id) ? "is-active" : ""}`}
            type="button"
            style={{ "--layer-color": layer.cssColor } as React.CSSProperties}
            onClick={() => toggleLayer(layer.id)}
            onMouseEnter={() => setFocusLayer(layer.id)}
          >
            <span className="vr-layer-dot" />
            <span>{layer.label}</span>
          </button>
        ))}
      </section>

      <aside className="vr-status-panel">
        <div className="vr-panel-heading">
          <span>Quest overlay</span>
          <strong>{focusSpec.label}</strong>
        </div>
        <div className="vr-metric-grid">
          <div>
            <span>Packets</span>
            <strong>{packetCount.toLocaleString("sv-SE")}</strong>
          </div>
          <div>
            <span>Layers</span>
            <strong>{activeLayers.size}/6</strong>
          </div>
          <div>
            <span>Rate</span>
            <strong>10-30 Hz</strong>
          </div>
          <div>
            <span>Mode</span>
            <strong>Passive</strong>
          </div>
        </div>
        <dl className="vr-focus-list">
          <div>
            <dt>Sensor</dt>
            <dd>{focusSpec.source}</dd>
          </div>
          <div>
            <dt>VR output</dt>
            <dd>{focusSpec.output}</dd>
          </div>
          <div>
            <dt>Hub</dt>
            <dd>Python WebSocket aggregator</dd>
          </div>
        </dl>
      </aside>

      <section className="vr-pipeline">
        <div>
          <span>Nodes</span>
          <strong>ESP32 mesh, Flipper bridge, Alfa WiFi</strong>
        </div>
        <div>
          <span>Hub</span>
          <strong>fusion, SQLite log, WebSocket stream</strong>
        </div>
        <div>
          <span>Headset</span>
          <strong>Unity / Meta Quest passthrough</strong>
        </div>
      </section>
    </main>
  );
}
