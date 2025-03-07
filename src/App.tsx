import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import Home from "./pages/Home";
import AuthLayout from "./layouts/AuthLayout";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import ProtectedRoutes from "./layouts/ProtectedRoutes";
import MainLayout from "./layouts/MainLayout";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* public routes */}
        <Route element={<PublicLayout /> }>
          <Route index element={<Home />} />
        </Route>

        {/* authentication layout */}
        <Route element={<AuthLayout /> }>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
        </Route>

        {/* protected routes */}
        <Route element={<ProtectedRoutes><MainLayout /></ProtectedRoutes>}></Route>

      </Routes>
    </BrowserRouter>
  );
};

export default App;
