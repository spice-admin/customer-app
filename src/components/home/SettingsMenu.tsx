// src/components/settings/SettingsMenu.tsx
import React from "react";

// Import desired react-icons
import {
  HiOutlineHome,
  HiOutlineInformationCircle,
  HiOutlineUserCircle,
  HiOutlineQuestionMarkCircle,
  HiOutlineShieldCheck,
  HiOutlineChatBubbleLeftRight, // Or HiOutlineEnvelope
  HiOutlineArrowLeftOnRectangle,
  HiOutlineChevronRight, // For the angle icon
} from "react-icons/hi2";

// Define the structure for a menu item
interface MenuItem {
  href: string;
  label: string;
  icon: React.ElementType; // Type for React component
  action?: (e: React.MouseEvent) => void; // Optional action for items like Logout
}

// Key for auth token (ensure consistency)
const AUTH_TOKEN_KEY =
  "7f57e24a0181b526fb106b2bad45d9f6c0717b88ea01d2dd0afae3594a69b8c0";

const SettingsMenu: React.FC = () => {
  // Logout handler
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default link behavior
    console.log("Logging out...");
    if (typeof window !== "undefined") {
      // Ensure runs client-side
      localStorage.removeItem(AUTH_TOKEN_KEY); // Remove token
      window.location.href = "/"; // Redirect to login
    }
  };

  // Define the menu items
  const menuItems: MenuItem[] = [
    { href: "/home", label: "Home", icon: HiOutlineHome },
    { href: "/profile", label: "Profile", icon: HiOutlineUserCircle }, // Link to profile page
    { href: "/about", label: "About", icon: HiOutlineInformationCircle }, // Create /about page later
    { href: "/faq", label: "FAQs", icon: HiOutlineQuestionMarkCircle }, // Create /faq page later
    {
      href: "/privacyp",
      label: "Privacy Policy",
      icon: HiOutlineShieldCheck,
    }, // Create /privacy-policy page later
    {
      href: "/contact-us",
      label: "Contact Us",
      icon: HiOutlineChatBubbleLeftRight,
    }, // Create /contact-us page later
    {
      href: "#logout",
      label: "Logout",
      icon: HiOutlineArrowLeftOnRectangle,
      action: handleLogout,
    }, // Special item for logout
  ];

  return (
    <div>
      {menuItems.map((item) => (
        <a
          href={item.href}
          key={item.label}
          onClick={item.action} // Attach logout handler if present
          className="setting-opestion-main setting-opestion-space" // Use template classes
        >
          <div className="setting-opestion-main-sub">
            {" "}
            {/* Use template class */}
            <div className="side-menu-icons">
              {" "}
              {/* Use template class */}
              {/* Render the icon component */}
              <item.icon />
            </div>
            <h2 className="smith new-chat">{item.label}</h2>{" "}
            {/* Use template classes */}
          </div>
          {/* Use react-icon for the angle right */}
          <HiOutlineChevronRight className="setting-arrow-icon" />
          {/* Or use Font Awesome if preferred and loaded: */}
          {/* <i className="fa-solid fa-angle-right"></i> */}
        </a>
      ))}

      {/* Add styles needed for react-icons if not covered by template */}
      <style>{`
                /* Ensure template CSS defines styles for: */
                /* .setting-opestion-main, .setting-opestion-space, .setting-opestion-main-sub, */
                /* .side-menu-icons, .smith, .new-chat */

                /* Style react-icons within the side menu */
                .side-menu-icons svg {
                    width: 24px; /* Match original SVG size */
                    height: 24px;
                    color: var(--icon-color, #55E6A5); /* Use CSS variable or specific color */
                    stroke-width: 1.5; /* Adjust stroke for outline icons */
                }

                /* Style the angle right icon */
                .setting-arrow-icon {
                     width: 16px;
                     height: 16px;
                     color: #adb5bd; /* Example: Bootstrap secondary color */
                     margin-left: auto; /* Push to the right */
                }

                /* Ensure the container uses flexbox for alignment */
                 .setting-opestion-main {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    text-decoration: none; /* Remove underline from links */
                    color: inherit; /* Inherit text color */
                 }
                 .setting-opestion-main-sub {
                    display: flex;
                    align-items: center;
                    gap: 1rem; /* Space between icon and text */
                 }

            `}</style>
    </div>
  );
};

export default SettingsMenu;
