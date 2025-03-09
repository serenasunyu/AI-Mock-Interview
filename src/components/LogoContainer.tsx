import { Link } from "react-router-dom";

const LogoContainer = () => {
  return (
    <Link to="/">
      <img
        src="/src/assets/img/logo.png"
        alt="logo"
        className="h-14 object-contain"
      />
    </Link>
  );
};

export default LogoContainer;
