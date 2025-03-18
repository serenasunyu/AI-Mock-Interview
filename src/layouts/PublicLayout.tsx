
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import AuthHandler from "@/handlers/AuthHandler";
import { Outlet } from "react-router-dom";

const PublicLayout = () => {
  return (
    <div className="w-full bg-gray-50">
        {/* handler to store the user data*/}
        <AuthHandler />
        
        <Header />

        <Outlet />

        <Footer />

    </div>
  )
}

export default PublicLayout;