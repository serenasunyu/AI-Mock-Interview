
import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="w-screen h-screen overflow-hidden flex items-center justify-center relative">
        <img src="/assets/img/bg.png" className="absolute w-full h-full object-center opacity-20" alt="background image"/>

    <Outlet />


</div>
  )
}

export default AuthLayout;