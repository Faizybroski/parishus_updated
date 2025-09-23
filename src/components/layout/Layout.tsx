import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 p-4">
        {/* 👇 Child routes will render here */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
