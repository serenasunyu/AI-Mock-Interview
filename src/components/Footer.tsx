import {SocialIcon} from "react-social-icons";
import Container from "./Container";
import MainRoutes from "./ui/helpers";
import { Link } from "react-router-dom";

interface FooterLinkProps {
  to:string;
  children: React.ReactNode;
};

const FooterLink: React.FC<FooterLinkProps> = ({to, children}) => {
  return (
    <li>
      <Link
        to={to}
        className="hover:underline hover:text-gray-500"
      >
        {children}
      </Link>
    </li>
  )
};


const Footer = () => {
  return (

      <div className="w-full bg-indigo-100 py-8">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* logo and social media */}
            <div>
            <Link to="/">
              <img
                src="/assets/img/logo.png"
                alt="logo"
                className="h-14 object-contain"
              />
            </Link>
              <div className="flex gap-4">
                <SocialIcon
                  url="https://facebook.com"
                  className="w-10 h-10"
                  style={{width:"36px", height:"36px"}}
                />
                <SocialIcon
                  url="https://twitter.com"
                  className="w-10 h-10"
                  style={{width:"36px", height:"36px"}}
                />
                <SocialIcon
                  url="https://instagram.com"
                  className="w-10 h-10"
                  style={{width:"36px", height:"36px"}}
                />
              </div>
              </div>

              {/* quick links */}
              <div>
                <h3 className="font-bold text-lg mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  {MainRoutes.map((route) => (
                    <FooterLink
                      key={route.href}
                      to={route.href}
                    >
                      {route.label}
                    </FooterLink>
                  ))}
                </ul>
            </div>

            {/* products */}
            <div>
            <h3 className="font-bold text-lg mb-4">Products</h3>
              <Link to="/question-list"><p className="hover:underline hover:text-gray-500 pb-2">AI Mock Interview</p></Link>
              <Link to="/questions"><p className="hover:underline hover:text-gray-500 pb-2">Interview Question Generator</p></Link>
            </div>

            {/* contact us */}
            <div>
            <h3 className="font-bold text-lg mb-4">Contact Us </h3>
              <p className="pb-2">123 Queen Street East, Toronto, ON, CA</p>
              <p className="pb-2"><strong>Support Email:</strong> <a href="mailto:support@mockmate.com" className="text-blue-500 hover:underline">
      support@mockmate.com
    </a></p>
            </div>

          </div>
        </Container>

      

      <p className="text-center py-2 mt-4">© {new Date().getFullYear()} MockMate. All rights reserved.</p>
      </div>
  )
}

export default Footer;