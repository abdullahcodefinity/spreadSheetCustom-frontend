import Lottie from "lottie-react";
import LoaderAnimation from "./loader.json";

interface LoaderProps {
  visible: boolean;
}

const Loader: React.FC<LoaderProps> = ({ visible }) => {
  if (!visible) return null;
  return (
    <div
      className="w-100 h-100 d-flex justify-content-center align-items-center position-fixed opacity-75 bg-white "
      style={{ zIndex: 99999 }}
    >
      <div style={{ width: "200px", height: "200px" }}>
        <Lottie
          animationData={LoaderAnimation}
          loop={true}
          autoPlay={true}
          rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
          width={400}
          height={400}
        />
      </div>
    </div>
  );
};

export default Loader;
