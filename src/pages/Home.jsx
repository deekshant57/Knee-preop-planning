import { Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, { Suspense, useContext, useState } from "react";
import Model from "./Model";
import PointsLocationContext from "../components/PointsLocationProvider";
import LoadingScreen from "../components/LoadingScreen";

const Home = () => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [valgusDegree, setValgusDegree] = useState(3);
  const [flexionDegree, setFlexionDegree] = useState(3);

  const { pointsLocation, dispatch } = useContext(PointsLocationContext);

  const options = [
    "Femur Center",
    "Hip Center",
    "Femur Proximal Canal",
    "Femur Distal Canal",
    "Medial Epicondyle",
    "Lateral Epicondyle",
    "Distal Medial Pt",
    "Distal Lateral Pt",
    "Posterior Medial Pt",
    "Posterior Lateral Pt",
  ];

  const handleOptionChange = (event) => {
    const selectedOption = event.target.value;
    setSelectedOption(selectedOption);
    dispatch({ type: "SET_SELECTED_OPTION", payload: selectedOption });
    if (selectedOption) {
      window.document.body.style.cursor = "crosshair";
    } else {
      window.document.body.style.cursor = "grab";
    }
  };

  const handleUpdateClick = () => {
    // if (pointsLocation["Femur Center"] && pointsLocation["Hip Center"]) {
    // setShowLines(true);
    dispatch({ type: "SET_SHOW_LINES", payload: true });
    dispatch({ type: "SET_SELECTED_OPTION", payload: null });
    setSelectedOption(null);
    // }
  };

  const handleValgusPlaneRotationPositive = () => {
    setValgusDegree((prev) => prev + 3);
  };
  const handleValgusPlaneRotationNegative = () => {
    setValgusDegree((prev) => prev - 3);
  };
  const handleFlexionPlaneRotationPositive = () => {
    setFlexionDegree((prev) => prev + 3);
  };
  const handleFlexionPlaneRotationNegative = () => {
    setFlexionDegree((prev) => prev - 3);
  };
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", height: "100vh" }}>
        <Canvas shadows gl={{ antialias: true }}>
          <ambientLight intensity={0.8}></ambientLight>
          {/* <OrbitControls></OrbitControls> */}
          <Suspense fallback={<LoadingScreen></LoadingScreen>}>
            <Model
              valgusDegree={valgusDegree}
              flexionDegree={flexionDegree}
            ></Model>
          </Suspense>
          {/* stats can be added to doc.body to take over the render loop */}
          <Stats></Stats>
        </Canvas>
        <div style={{ position: "absolute", left: "1rem" }}>
          {options.map((option, index) => (
            <div key={index} style={{ marginTop: "0.5rem" }}>
              <input
                type="radio"
                id={option}
                name="options"
                value={option}
                checked={selectedOption === option}
                onChange={handleOptionChange}
              />
              <label htmlFor={option}>{option}</label>
            </div>
          ))}
          <button onClick={handleUpdateClick} style={{ marginTop: "0.5rem" }}>
            Update
          </button>
          <div
            style={{
              marginTop: "0.9rem",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <button onClick={handleValgusPlaneRotationPositive}>+</button>
            <span>Valgus Plane</span>
            <button onClick={handleValgusPlaneRotationNegative}>-</button>
          </div>
          <div
            style={{
              marginTop: "0.9rem",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <button onClick={handleFlexionPlaneRotationPositive}>+</button>
            <span>Flexion Plane</span>
            <button onClick={handleFlexionPlaneRotationNegative}>-</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
