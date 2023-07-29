import React, { createContext, useReducer } from "react";

const initialPointsLocation = {
  "Femur Center": { location: null, isVisited: false },
  "Hip Center": { location: null, isVisited: false },
  "Femur Proximal Canal": { location: null, isVisited: false },
  "Femur Distal Canal": { location: null, isVisited: false },
  "Medial Epicondyle": { location: null, isVisited: false },
  "Lateral Epicondyle": { location: null, isVisited: false },
  "Distal Medial Pt": { location: null, isVisited: false },
  "Distal Lateral Pt": { location: null, isVisited: false },
  "Posterior Medial Pt": { location: null, isVisited: false },
  "Posterior Lateral Pt": { location: null, isVisited: false },
};

const initialState = {
  pointsLocation: initialPointsLocation,
  showLines: false,
  selectedOption: null,
  valgusDegree: 3,
};

const PointsLocationContext = createContext();

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_POINTS_LOCATION":
      return {
        ...state,
        pointsLocation: {
          ...state.pointsLocation,
          [state.selectedOption]: {
            location: action.payload.location,
            isVisited: true,
          },
        },
      };
    case "SET_SHOW_LINES":
      return {
        ...state,
        showLines: action.payload,
      };
    case "SET_SELECTED_OPTION":
      return {
        ...state,
        selectedOption: action.payload,
      };

    case "SET_DEGREE_POSITIVE":
      return {
        ...state,
        valgusDegree: action.payload,
      };
    case "SET_DEGREE_NEGATIVE":
      return {
        ...state,
        valgusDegree: action.payload,
      };
    default:
      return state;
  }
};

export const PointsLocationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    showLines: false,
    selectedOption: null,
  });

  return (
    <PointsLocationContext.Provider value={{ state, dispatch }}>
      {children}
    </PointsLocationContext.Provider>
  );
};

export default PointsLocationContext;
