import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import React, {
  Suspense,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import * as THREE from "three";
import {
  Edges,
  Line,
  OrbitControls,
  Plane,
  Sphere,
  TransformControls,
  useTexture,
} from "@react-three/drei";
import Axis from "../components/Axis";
import PointsLocationContext from "../components/PointsLocationProvider";
import { Vector3 } from "three";
import LoadingScreen from "../components/LoadingScreen";

const Model = ({ valgusDegree, flexionDegree }) => {
  const femur = useLoader(STLLoader, "./Femur.stl");
  const tibia = useLoader(STLLoader, "./Tibia.stl");
  const texture = useTexture("./texture.jpg");

  const { state, dispatch } = useContext(PointsLocationContext);
  const sphereRef = useRef();
  const femurCenterRef = useRef();
  const hipCenterRef = useRef();
  const valgusPlaneRef = useRef();
  const flexionPlaneRef = useRef();
  const planeGroupRef = useRef();
  const lineGroupRef = useRef();
  const prevValgusDegree = useRef(valgusDegree);
  const prevFlexionDegree = useRef(valgusDegree);
  const planeRef = useRef();

  const pointsLocation = state.pointsLocation;
  const selectedOption = state.selectedOption;
  const showLines = state.showLines;

  const [cameraTarget, setCameraTarget] = useState({ x: 0, y: 0, z: 0 });
  const [showPlanes, setShowPlanes] = useState(false);

  const kneeRef = useRef();
  const mechanicalAxisRef = useRef();

  const { camera, mouse, scene } = useThree();
  const raycaster = new THREE.Raycaster();

  // identify the center of the group to set the target
  const getObjectCenter = () => {
    if (kneeRef.current) {
      const boundingBox = new THREE.Box3().setFromObject(kneeRef.current);
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);
      return center;
    }
    return null;
  };

  const handleClick = (event) => {
    // Check for intersections with the 3D object
    const intersects = raycaster.intersectObject(kneeRef.current, true);

    if (intersects.length > 0) {
      // Get the position of the clicked point on the 3D object
      const clickedPosition = intersects[0].object.localToWorld(
        intersects[0].point.clone()
      );
      if (selectedOption) {
        const currentPoint = pointsLocation[selectedOption];
        // console.log(currentPoint);
        if (
          currentPoint.location === null &&
          currentPoint.isVisited === false
        ) {
          dispatch({
            type: "SET_POINTS_LOCATION",
            payload: { location: clickedPosition, isVisited: true },
          });
        }
      }
    }
  };

  useEffect(() => {
    // Output the object's center to the console when the component mounts
    const target = getObjectCenter();
    setCameraTarget({ x: target.x, y: target.y, z: target.z });

    camera.position.set(64, 1105, 690);
    // camera.rotation.set(-Math.PI / 2, 0, Math.PI);
    camera.lookAt(target.x, target.y, target.z);
    // camera.aspect = 2.6;
    camera.far = 10000;
    camera.focus = 10;
    camera.fov = 50;
    camera.updateProjectionMatrix();
    camera.updateMatrix();
  }, [kneeRef.current]);

  useFrame(() => {
    raycaster.setFromCamera(mouse, camera);
    // camera.lookAt(cameraTarget.x, cameraTarget.y, cameraTarget.z);
  });

  // useeffeect to track the progress of the changed position of sphere
  useEffect(() => {
    if (sphereRef.current) {
      const newPosition = sphereRef.current.position;
      const { point } = state.selectedOption;

      if (newPosition !== point) {
        dispatch({
          type: "SET_POINTS_LOCATION",
          payload: { location: newPosition, isVisited: true },
        });
      }
    }
  }, [sphereRef.current?.position, state.selectedOption]);

  useEffect(() => {
    // Create a perpendicular Plane to Mechanical Axis -- step 4.1
    if (
      pointsLocation["Femur Center"].location &&
      pointsLocation["Hip Center"].location &&
      showLines
    ) {
      // Define the start and end points of the line
      const startPoint = pointsLocation["Hip Center"].location;
      const endPoint = pointsLocation["Femur Center"].location;

      // Calculate the direction vector of the line
      const direction = new THREE.Vector3()
        .subVectors(endPoint, startPoint)
        .normalize();

      // Define an arbitrary vector (not parallel to the direction vector)
      const arbitraryVector = new THREE.Vector3(1, 0, 0);
      if (direction.equals(arbitraryVector)) {
        arbitraryVector.set(0, 1, 0);
      }

      // Calculate the normal vector of the line
      const normal = new THREE.Vector3().crossVectors(
        direction,
        arbitraryVector
      );

      // Set the plane's position to the midpoint of the line
      const midPoint = new THREE.Vector3()
        .addVectors(startPoint, endPoint)
        .multiplyScalar(0.5);
      planeRef.current.position.copy(endPoint);

      // Orient the plane to be perpendicular to the line
      planeRef.current.lookAt(normal.add(midPoint));
    }
  }, [
    planeRef.current?.position,
    pointsLocation["Femur Center"].location,
    pointsLocation["Hip Center"].location,
    state,
  ]);

  useEffect(() => {
    if (
      pointsLocation["Medial Epicondyle"].location &&
      pointsLocation["Lateral Epicondyle"].location &&
      planeRef.current &&
      femurCenterRef.current
    ) {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        pointsLocation["Medial Epicondyle"].location,
        pointsLocation["Lateral Epicondyle"].location,
      ]);
      const material = new THREE.MeshBasicMaterial({ color: "black" });
      const lineloop = new THREE.LineLoop(geometry, material);

      lineloop.updateMatrixWorld();
      scene.add(lineloop);

      // step 4.2 - TEA Axis Projection
      const positionTEAAxis = lineloop.geometry.attributes.position.array;
      const planeNormal = planeRef.current.geometry.attributes.normal.array; // normal of Plane
      const planePosition = planeRef.current.position;
      const projectedVertices = [];

      // Loop through all the vertices of the TEA axis
      for (let i = 0; i < positionTEAAxis.length; i += 3) {
        // Get the current vertex of the "TEA" line
        const vertexTEAAxis = new Vector3(
          positionTEAAxis[i],
          positionTEAAxis[i + 1],
          positionTEAAxis[i + 2]
        );

        const vectorToVertex = vertexTEAAxis.clone().sub(planePosition); // vector from plane to vertex

        const projection = vectorToVertex
          .clone()
          .sub(
            new Vector3()
              .fromArray(planeNormal)
              .multiplyScalar(
                vectorToVertex.dot(new Vector3().fromArray(planeNormal))
              )
          ); // projection of the vector onto the plane using subtraction

        //   // Calculate the projected point by adding the projection to the plane position
        const pointToProject = planePosition.clone().add(projection);

        projectedVertices.push(
          pointToProject.x,
          pointToProject.y,
          pointToProject.z
        );
      }

      const geometryProjectedTEA = new THREE.BufferGeometry();
      geometryProjectedTEA.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(projectedVertices, 3)
      );

      const projectedTEAMaterial = new THREE.LineBasicMaterial({
        // color: 0xef9f44,
        color: 0x0000ff,
        linewidth: 1, // doesn't work due to limitations of the OpenGL specification with WebGL
      });

      const projectedTEAAxis = new THREE.LineLoop(
        geometryProjectedTEA,
        projectedTEAMaterial
      ); // projection line

      scene.add(projectedTEAAxis);
      projectedTEAAxis.updateMatrixWorld();

      // ****************************//
      // line from the projectedTEAAxis to the Plane

      const projectedTEAVertices =
        projectedTEAAxis.geometry.attributes.position.array;
      const projectedTEADirection = new Vector3(
        projectedTEAVertices[3] - projectedTEAVertices[0],
        projectedTEAVertices[4] - projectedTEAVertices[1],
        projectedTEAVertices[5] - projectedTEAVertices[2]
      ).normalize();

      const perpendicularDirection = new Vector3()
        .crossVectors(
          new Vector3().fromArray(planeNormal),
          projectedTEADirection
        )
        .normalize(); // perpendicular direction to the projected TEA axis

      const distanceToExtend = 10; // set distance
      const startPosition = femurCenterRef.current?.getWorldPosition(
        new Vector3()
      );
      const imaginedPositionDot = startPosition
        .clone()
        .add(perpendicularDirection.clone().multiplyScalar(distanceToExtend));
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
          [
            startPosition.x,
            startPosition.y,
            startPosition.z,
            imaginedPositionDot.x,
            imaginedPositionDot.y,
            imaginedPositionDot.z,
          ],
          3
        )
      );

      const anteriorLineMaterial = new THREE.LineBasicMaterial({
        color: 0x0000ff,
      });

      const anteriorLine = new THREE.LineLoop(
        lineGeometry,
        anteriorLineMaterial
      );
      anteriorLine.position.clone(planeRef.current?.position);
      anteriorLine.name = "anterior line";
      anteriorLine.updateMatrixWorld();
      scene.add(anteriorLine);
      setShowPlanes(true);

      const valgusPlane =
        planeGroupRef.current?.getObjectByName("valgus plane");
      // checking and updating the valgus plane position if there is any change in points.
      if (valgusPlane && planeRef.current?.position) {
        valgusPlane.position.set(
          planeRef.current?.position.x,
          planeRef.current?.position.y,
          planeRef.current?.position.z
        );
      }

      // checking and updating the flexion plane position if there is any change in points.

      const flexionPlane =
        planeGroupRef.current?.getObjectByName("flexion plane");
      if (flexionPlane && valgusPlane.position) {
        flexionPlane.position.set(
          planeRef.current?.position.x,
          planeRef.current?.position.y,
          planeRef.current?.position.z
        );
      }

      // step 4.3 - Project the anterior line on the valgus plane and it should be perpendicular to the anterior line, should start from the femur center & end at 10mm on the lateral side.
      if (valgusPlaneRef.current && femurCenterRef.current && anteriorLine) {
        const projectedAnteriorLineVertices =
          anteriorLine.geometry.attributes.position.array;
        const projectedAnteriorLineDirection = new Vector3(
          projectedAnteriorLineVertices[3] - projectedAnteriorLineVertices[0],
          projectedAnteriorLineVertices[4] - projectedAnteriorLineVertices[1],
          projectedAnteriorLineVertices[5] - projectedAnteriorLineVertices[2]
        ).normalize();

        const valgusPlaneNormal =
          valgusPlaneRef.current?.geometry.attributes.normal.array; // nomrmal of valgus plane

        const perpendicularDirectiontoTEAAxis = new Vector3()
          .crossVectors(
            new Vector3().fromArray(valgusPlaneNormal),
            projectedAnteriorLineDirection
          )
          .normalize(); // perpendicular direction to projected TEAAxis

        const distanceToExtend = 10; // set distance
        const startPositionLateral = femurCenterRef.current.getWorldPosition(
          new Vector3()
        );
        const imaginedPositionDotLateral = startPositionLateral
          .clone()
          .add(
            perpendicularDirectiontoTEAAxis
              .clone()
              .multiplyScalar(distanceToExtend)
          );
        const lateralLineGeometry = new THREE.BufferGeometry();
        lateralLineGeometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(
            [
              startPositionLateral.x,
              startPositionLateral.y,
              startPositionLateral.z,
              imaginedPositionDotLateral.x,
              imaginedPositionDotLateral.y,
              imaginedPositionDotLateral.z,
            ],
            3
          )
        );

        const lateralLineMaterial = new THREE.LineBasicMaterial({
          color: 0x0000ff,
        });
        // newLineMaterial.color.set(0xffa500);
        const lateralLine = new THREE.LineLoop(
          lateralLineGeometry,
          lateralLineMaterial
        );

        lateralLine.name = "lateral line";
        lateralLine.position.clone(valgusPlaneRef.current?.position);
        lateralLine.updateMatrixWorld();
        scene.add(lateralLine);
      }
      const lateralLine = scene.getObjectByName("lateral line");
      // cleanup function
      return () => {
        lineloop.removeFromParent();
        projectedTEAAxis.removeFromParent();
        anteriorLine.removeFromParent();
        if (lateralLine) {
          lateralLine.removeFromParent();
        }
      };
    }
  }, [
    // pointsLocation["Medial Epicondyle"].location,
    // pointsLocation["Lateral Epicondyle"].location,
    planeRef.current?.position,
    state,
    showPlanes,
  ]);

  // useeffect for handling rotation of planes

  useEffect(() => {
    // handling valgus plane rotation
    const valgusPlane = planeGroupRef.current.getObjectByName("valgus plane");
    const anteriorAxisLine = scene.getObjectByName("anterior line");

    if (valgusPlane && anteriorAxisLine) {
      const angleInRadians = THREE.MathUtils.degToRad(
        valgusDegree - prevValgusDegree.current
      ); // Example: Rotate by 45 degrees (π/4 radians) - conversioin to degrees

      const anterionLinePosition =
        anteriorAxisLine.geometry.attributes.position.array; //
      // Find out the point on the line
      const pointX = new Vector3(
        anterionLinePosition[0],
        anterionLinePosition[1],
        anterionLinePosition[2]
      );
      const pointY = new Vector3(
        anterionLinePosition[3],
        anterionLinePosition[4],
        anterionLinePosition[5]
      );
      const anteriorLineDirection = new THREE.Vector3()
        .subVectors(pointY, pointX)
        .normalize(); // Normalized direction vector
      valgusPlane.rotateOnWorldAxis(anteriorLineDirection, angleInRadians);
      valgusPlane.updateMatrixWorld();
      prevValgusDegree.current = valgusDegree;
    }
  }, [valgusDegree]);

  useEffect(() => {
    // handling valgus plane rotation
    const flexionPlane = planeGroupRef.current.getObjectByName("flexion plane");
    const lateralAxisLine = scene.getObjectByName("lateral line");

    if (flexionPlane && lateralAxisLine) {
      const angleInRadians = THREE.MathUtils.degToRad(
        flexionDegree - prevFlexionDegree.current
      ); // Example: Rotate by 45 degrees (π/4 radians) - conversioin to degrees

      const lateralLinePosition =
        lateralAxisLine.geometry.attributes.position.array;
      // Find out the point on the line
      const pointX = new Vector3(
        lateralLinePosition[0],
        lateralLinePosition[1],
        lateralLinePosition[2]
      );
      const pointY = new Vector3(
        lateralLinePosition[3],
        lateralLinePosition[4],
        lateralLinePosition[5]
      );
      const lateralLineDirection = new THREE.Vector3()
        .subVectors(pointY, pointX)
        .normalize(); // Normalized direction vector
      flexionPlane.rotateOnWorldAxis(lateralLineDirection, angleInRadians);
      flexionPlane.updateMatrixWorld();
      prevFlexionDegree.current = flexionDegree;
    }
  }, [flexionDegree]);

  return (
    <>
      <Suspense fallback={null}>
        <OrbitControls
          target={[cameraTarget.x, cameraTarget.y, cameraTarget.z]}
          enableDamping={false}
          enableRotate={true}
          enableZoom={true}
          enabled={true}
          makeDefault
        ></OrbitControls>

        <group ref={kneeRef} onClick={handleClick}>
          <mesh geometry={femur}>
            <meshStandardMaterial
              map={texture}
              side={THREE.DoubleSide}
              opacity={0.4}
              transparent
              color="offwhite"
              roughness={1}
            ></meshStandardMaterial>
          </mesh>
          <mesh geometry={tibia}>
            <meshStandardMaterial
              map={texture}
              side={THREE.DoubleSide}
              opacity={0.4}
              transparent
              color="offwhite"
              roughness={1}
            ></meshStandardMaterial>
          </mesh>
        </group>
        {/* <axesHelper
          args={[500, 500, 500]}
          position={[cameraTarget.x, cameraTarget.y, cameraTarget.z]}
        ></axesHelper> */}
      </Suspense>
      <group>
        {Object.keys(pointsLocation).map((item, index) => {
          return pointsLocation[item].location ? (
            selectedOption === item ? (
              <>
                <TransformControls key={index} object={sphereRef}>
                  <Sphere
                    ref={sphereRef}
                    position={[
                      pointsLocation[item].location.x,
                      pointsLocation[item].location.y,
                      pointsLocation[item].location.z,
                    ]}
                  ></Sphere>
                </TransformControls>
              </>
            ) : (
              <Sphere
                args={[2, 16, 8]}
                position={[
                  pointsLocation[item].location.x,
                  pointsLocation[item].location.y,
                  pointsLocation[item].location.z,
                ]}
                ref={
                  item === "Femur Center"
                    ? femurCenterRef
                    : item === "Hip Center"
                    ? hipCenterRef
                    : null
                }
              >
                <meshBasicMaterial color="red"></meshBasicMaterial>
              </Sphere>
            )
          ) : null;
        })}
      </group>
      <group ref={lineGroupRef}>
        {showLines && (
          <>
            {/* Mechanical Axis */}
            <Line
              points={[
                pointsLocation["Femur Center"].location,
                pointsLocation["Hip Center"].location,
              ]} // Array of points,
              color="black" // Default
              lineWidth={1} // In pixels (default)
              segments // If true, renders a THREE.LineSegments2. Otherwise, renders a THREE.Line2
              dashed={false} // Default
              ref={mechanicalAxisRef}
            ></Line>
            {/* Anatomical Axis */}
            <Axis
              startPoint={pointsLocation["Femur Proximal Canal"].location}
              endPoint={pointsLocation["Femur Distal Canal"].location}
            ></Axis>
            {/* PCA- Posterior Condyle Axis */}
            <Axis
              startPoint={pointsLocation["Posterior Medial Pt"].location}
              endPoint={pointsLocation["Posterior Lateral Pt"].location}
            ></Axis>
          </>
        )}
      </group>
      <group ref={planeGroupRef}>
        {showLines && (
          <>
            <Plane args={[105, 105]} ref={planeRef}>
              <meshBasicMaterial
                color="gray"
                side={THREE.DoubleSide}
                transparent
                opacity={0.5}
              />
              <Edges
                color="orange"
                scale={1.04}
                threshold={15} // Display edges only when the angle between two faces exceeds this value (default=15 degrees)
              ></Edges>
            </Plane>
          </>
        )}
        {planeRef.current?.position && (
          <>
            <Plane
              name="valgus plane"
              args={[105, 105]}
              ref={valgusPlaneRef}
              position={planeRef.current?.position}
            >
              <meshBasicMaterial
                color="gray"
                side={THREE.DoubleSide}
                transparent
                opacity={0.5}
              />
              <Edges
                color="red"
                scale={1}
                threshold={15} // Display edges only when the angle between two faces exceeds this value (default=15 degrees)
              ></Edges>
            </Plane>
          </>
        )}
        {valgusPlaneRef.current?.position && (
          <Plane
            name="flexion plane"
            args={[105, 105]}
            ref={flexionPlaneRef}
            position={valgusPlaneRef.current?.position}
            // rotation={[THREE.MathUtils.degToRad(flexionDegree), 0, 0]}
          >
            <meshBasicMaterial
              color="gray"
              side={THREE.DoubleSide}
              transparent
              opacity={0.5}
            />
            <Edges
              color="red"
              scale={1}
              threshold={15} // Display edges only when the angle between two faces exceeds this value (default=15 degrees)
            ></Edges>
          </Plane>
        )}
      </group>
    </>
  );
};

export default Model;
