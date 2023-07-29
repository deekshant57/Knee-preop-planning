import Home from "./pages/Home";
import { PointsLocationProvider } from "./components/PointsLocationProvider";

function App() {
  return (
    <PointsLocationProvider>
      <div className="App">
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          Knee Preop Planning
        </div>
        <div style={{ height: "100vh" }}>
          <Home></Home>
        </div>
      </div>
    </PointsLocationProvider>
  );
}

export default App;
