import { Html, useProgress } from "@react-three/drei";
import React from "react";

const LoadingScreen = () => {
  const { active, progress } = useProgress();

  return (
    <Html center>
      {
        <>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div>{Math.round(progress)}% </div>
        </>
      }
    </Html>
  );
};

export default LoadingScreen;
