import { Line } from "@react-three/drei";
import React, { useEffect, useRef } from "react";

const Axis = ({ startPoint, endPoint, props }) => {
  return (
    <>
      <Line
        {...props}
        points={[startPoint, endPoint]} // Array of points,
        color="black" // Default
        lineWidth={1} // In pixels (default)
        segments // If true, renders a THREE.LineSegments2. Otherwise, renders a THREE.Line2
        dashed={false} // Default
      />
    </>
  );
};

export default Axis;
