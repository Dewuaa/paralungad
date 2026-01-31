"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import maplibregl from "maplibre-gl";
import { useMap } from "@/components/ui/map";

interface Map3DModelProps {
  id: string;
  modelUrl: string;
  position: [number, number]; // [longitude, latitude]
  altitude?: number;
  scale?: number;
  rotation?: [number, number, number]; // [x, y, z] in degrees
}

export function Map3DModel({
  id,
  modelUrl,
  position,
  altitude = 0,
  scale = 1,
  rotation = [0, 0, 0],
}: Map3DModelProps) {
  const { map, isLoaded } = useMap();
  const layerId = `3d-model-${id}`;

  useEffect(() => {
    if (!map || !isLoaded) return;

    // cleanup previous layer if needed (though React usually handles unmount first)
    if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
    }

    const modelOrigin = position;
    const modelAltitude = altitude;
    const modelRotate = [
      THREE.MathUtils.degToRad(rotation[0]),
      THREE.MathUtils.degToRad(rotation[1]),
      THREE.MathUtils.degToRad(rotation[2]),
    ];

    const modelAsMercatorCoordinate = maplibregl.MercatorCoordinate.fromLngLat(
      modelOrigin,
      modelAltitude
    );

    const modelTransform = {
      translateX: modelAsMercatorCoordinate.x,
      translateY: modelAsMercatorCoordinate.y,
      translateZ: modelAsMercatorCoordinate.z,
      rotateX: modelRotate[0],
      rotateY: modelRotate[1],
      rotateZ: modelRotate[2],
      scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * scale,
    };

    // Extend CustomLayerInterface to include the properties we add
    interface ThreeJSCustomLayer extends maplibregl.CustomLayerInterface {
        camera?: THREE.Camera;
        scene?: THREE.Scene;
        map?: maplibregl.Map;
        renderer?: THREE.WebGLRenderer;
    }

    const customLayer: ThreeJSCustomLayer = {
      id: layerId,
      type: "custom",
      renderingMode: "3d",
      onAdd: function (map, gl) {
        this.camera = new THREE.Camera();
        this.scene = new THREE.Scene();

        // Create two lights to illuminate the model
        const directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(0, -70, 100).normalize();
        this.scene.add(directionalLight);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff);
        directionalLight2.position.set(0, 70, 100).normalize();
        this.scene.add(directionalLight2);
        
        // Add ambient light for better visibility
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const loader = new GLTFLoader();
        loader.load(
          modelUrl,
          (gltf) => {
            if (this.scene) {
                this.scene.add(gltf.scene);
            }
          },
          undefined, // onProgress
          (error) => {
            console.error("An error happened loading the 3D model:", error);
          }
        );
        
        this.map = map;

        // Use the MapLibre GL JS map canvas for three.js
        this.renderer = new THREE.WebGLRenderer({
          canvas: map.getCanvas(),
          context: gl,
          antialias: true,
        });

        this.renderer.autoClear = false;
      },
      render: function (gl, matrix) {
        if (!this.map || !this.scene || !this.camera || !this.renderer) return;

        const rotationX = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(1, 0, 0),
          modelTransform.rotateX
        );
        const rotationY = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(0, 1, 0),
          modelTransform.rotateY
        );
        const rotationZ = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(0, 0, 1),
          modelTransform.rotateZ
        );

        const m = new THREE.Matrix4().fromArray(matrix as unknown as number[]); // Fix matrix type
        const l = new THREE.Matrix4()
          .makeTranslation(
            modelTransform.translateX,
            modelTransform.translateY,
            modelTransform.translateZ
          )
          .scale(
            new THREE.Vector3(
              modelTransform.scale,
              -modelTransform.scale,
              modelTransform.scale
            )
          )
          .multiply(rotationX)
          .multiply(rotationY)
          .multiply(rotationZ);

        this.camera.projectionMatrix = m.multiply(l);
        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
        this.map.triggerRepaint();
      },
    };

    map.addLayer(customLayer);

    return () => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      // Note: We don't remove the renderer as it uses the map canvas which we don't own
      // But we should dispose of THREE resources if possible, 
      // however, the custom layer interface doesn't make it easy to fully cleanup logic *inside* the custom layer object from here.
      // Usually removing the layer is enough for visual cleanup.
    };
  }, [map, isLoaded, layerId, modelUrl, position, altitude, scale, rotation]);

  return null;
}
