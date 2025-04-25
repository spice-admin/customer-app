// src/components/layout/BottomNavbar.tsx
import React, { useState, useEffect } from "react";

// Import react-icons (Using Heroicons v2 outline as example)
import {
  HiOutlineHome,
  HiOutlineHeart,
  HiOutlineShoppingCart,
  HiOutlineBell,
  HiOutlineUserCircle,
  HiHome, // Filled icons for active state
  HiHeart,
  HiBell,
  HiUserCircle,
} from "react-icons/hi2";

// Helper component for individual nav items
const NavItem = ({
  href,
  icon: IconOutline,
  iconFilled: IconFilled,
  isActive,
  label,
}: {
  href: string;
  icon: React.ElementType;
  iconFilled: React.ElementType; // Add filled version
  isActive: boolean;
  label?: string;
}) => (
  // Apply 'active' class to the li element based on state
  <li className={`list ${isActive ? "active" : ""}`}>
    <a href={href} aria-label={label || href}>
      {" "}
      {/* Add aria-label */}
      <i className="icon">
        {/* Conditionally render filled or outline icon */}
        {isActive ? <IconFilled /> : <IconOutline />}
      </i>
      {/* The empty span was likely for an animation/dot, can be removed if not used */}
      {/* <span className="text"></span> */}
    </a>
  </li>
);

const BottomNavbar: React.FC = () => {
  // Determine active tab based on current path (client-side)
  const [activePath, setActivePath] = useState("");

  useEffect(() => {
    // Set initial path and handle potential updates if routing changes client-side
    // (For simple MPA-style navigation, this might only run once)
    setActivePath(window.location.pathname);

    // Optional: Add listener for Astro's client-side navigation events if needed
    // document.addEventListener('astro:after-swap', () => {
    //     setActivePath(window.location.pathname);
    // });
  }, []);

  // Placeholder cart count - Replace with actual state/context later
  const cartItemCount = 2;

  // Helper function to check active state, handling '/' vs '/home' etc.
  const isNavItemActive = (navPath: string) => {
    if (navPath === "/") {
      // Handle '/' and potentially '/home' as the home path
      return activePath === "/" || activePath.startsWith("/home");
    }
    // Check if the current path starts with the nav item's path
    // This handles nested routes like /profile/settings
    return activePath.startsWith(navPath);
  };

  return (
    <>
      {/* Curved background and center button structure */}
      <div className="bottom-menu-svg-main">
        <div className="bottom-menu-svg">
          {/* Center Cart Button */}
          {/* Apply active class directly if cart page is active */}
          <div
            className={`gol3 ${isNavItemActive("/cart") ? "active" : ""}`}
            id="gol3"
          >
            <div className="add-to-cart-icon">
              <a href="/cart" aria-label="View Cart">
                {/* Use filled icon if cart is active? Optional */}
                <HiOutlineShoppingCart className="home-icon" />
                {cartItemCount > 0 && (
                  <span
                    className={`count ${
                      isNavItemActive("/cart") ? "active" : ""
                    }`}
                    id="count"
                  >
                    {cartItemCount}
                  </span>
                )}
              </a>
            </div>
          </div>
          {/* Background SVG */}
          <svg
            className="bottom-menu-svg-design"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 600 150" // Keep original viewBox
            fill="none"
            preserveAspectRatio="xMidYMax slice" // Important for scaling
          >
            <path
              className="bottom-menu-color" // Style fill via CSS
              d="M300.8 65.2006C329.077 65.2006 352 44.3699 352 18.674V18.674C352 9.74988 358.681 -0.0889598 367.578 0.602816L585.24 17.5264C593.571 18.1741 600 25.1227 600 33.4782V149.53H0V33.4844C0 25.1263 6.43312 18.1764 14.7663 17.532L234.009 0.576187C242.916 -0.11265 249.6 9.74056 249.6 18.674V18.674C249.6 44.3699 272.523 65.2006 300.8 65.2006Z"
            />
          </svg>
        </div>
      </div>

      {/* Navigation Links Container */}
      <div className="navigation">
        <ul className="listWrap">
          <NavItem
            href="/"
            icon={HiOutlineHome}
            iconFilled={HiHome} // Pass filled icon
            isActive={isNavItemActive("/")}
            label="Home"
          />
          <NavItem
            href="/wishlist"
            icon={HiOutlineHeart}
            iconFilled={HiHeart}
            isActive={isNavItemActive("/wishlist")}
            label="Wishlist"
          />
          {/* Spacer element to push items past the center curve */}
          <li className="list spacer"></li>
          <NavItem
            href="/notifications"
            icon={HiOutlineBell}
            iconFilled={HiBell}
            isActive={isNavItemActive("/notifications")}
            label="Notifications"
          />
          <NavItem
            // Link to profile or account page
            href="/profile"
            icon={HiOutlineUserCircle}
            iconFilled={HiUserCircle}
            isActive={
              isNavItemActive("/profile") || isNavItemActive("/account")
            }
            label="Profile"
          />
        </ul>
      </div>

      {/* Add styles needed for react-icons if not covered by template */}
      <style>{`
                /* --- Ensure template CSS defines base styles for: --- */
                /* .navigation, .listWrap, .list, .list a, .icon */
                /* .bottom-menu-svg-main, .bottom-menu-svg, .gol3, .add-to-cart-icon, .count */

                /* --- Suggested CSS Refinements (Add/Modify in Global CSS) --- */

                /* Ensure SVG background scales and fills width */
                .bottom-menu-svg {
                    position: fixed;
                    bottom: -40px; /* Adjust as needed based on SVG height/curve */
                    left: 0;
                    width: 100%;
                    max-width: 600px; /* Match max-width of .navigation if needed */
                    margin: 0 auto; /* Center if max-width is used */
                    right: 0;
                    z-index: 50;
                    pointer-events: none; /* Allow clicks to pass through SVG background */
                }
                .bottom-menu-svg-design {
                    display: block; /* Prevent extra space below SVG */
                    width: 100%;
                    height: auto; /* Let width control height via viewBox */
                }
                .bottom-menu-color {
                    fill: black; /* Or use var(--your-nav-bg-color, black) */
                    /* Add transition if color changes */
                }

                /* Center Button Styling */
                .gol3 {
                    /* Re-verify positioning based on final SVG size/position */
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                    bottom: 100px; /* Adjust this based on SVG curve */
                    width: 70px; /* Slightly smaller maybe? */
                    height: 70px;
                    background-color: black; /* Match SVG fill */
                    border-radius: 50%;
                    z-index: 1001; /* Above SVG, below nav items maybe? */
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0px -4px 10px rgba(0,0,0,0.1); /* Optional shadow */
                    pointer-events: all; /* Enable clicks on button */
                    transition: background-color 0.2s ease;
                }
                 .gol3.active { /* Style for active cart page */
                    background-color: #ffc107; /* Active color from template */
                 }
                 .gol3.active .add-to-cart-icon svg {
                    color: black; /* Icon color on active background */
                 }

                .add-to-cart-icon a {
                    display: flex; /* Ensure link fills the circle */
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    height: 100%;
                    position: relative; /* For count positioning */
                }
                .add-to-cart-icon svg { /* Styling for react-icon */
                     width: 28px;
                     height: 28px;
                     color: white;
                     stroke-width: 1.5;
                     transition: color 0.2s ease;
                }
                .count {
                    position: absolute;
                    top: 10px; /* Adjust positioning */
                    right: 10px;
                    background-color: #ffc107;
                    color: #000;
                    border-radius: 50%;
                    width: 18px;
                    height: 18px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-size: 10px;
                    font-weight: 600;
                    line-height: 10px; /* Adjust line-height */
                    border: 1px solid black; /* Optional border */
                     transition: background-color 0.2s ease, color 0.2s ease;
                }
                 .count.active { /* Style for count when cart is active */
                    background-color: black;
                    color: white;
                    border-color: #ffc107;
                 }


                /* Navigation Bar Styling */
                .navigation {
                    position: fixed;
                    bottom: 0px; /* Align with bottom */
                    left: 0;
                    right: 0;
                    width: 100%;
                    max-width: 600px; /* Consistent max-width */
                    margin: 0 auto; /* Center */
                    z-index: 100; /* Above SVG background */
                    padding: 0 15px 10px 15px; /* Adjust padding */
                    height: 65px; /* Example fixed height */
                    box-sizing: border-box;
                     pointer-events: none; /* Allow clicks only on list items */
                }
                .navigation .listWrap {
                    list-style: none;
                    display: flex;
                    justify-content: space-around; /* Distribute items */
                    align-items: center; /* Vertically align items */
                    padding: 0;
                    margin: 0;
                    height: 100%;
                }
                .navigation .listWrap li {
                    flex: 1; /* Allow items to take space */
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100%;
                     pointer-events: all; /* Enable clicks on list items */
                }
                 /* Add a spacer element style */
                 .navigation .listWrap li.spacer {
                    flex: 1.2; /* Make spacer slightly wider than others */
                    pointer-events: none; /* Not clickable */
                 }

                .navigation .listWrap li a {
                    display: flex;
                    flex-direction: column; /* Stack icon and text (if added) */
                    align-items: center;
                    justify-content: center;
                    color: #aaa; /* Default icon color (adjust) */
                    text-decoration: none;
                    padding: 5px; /* Clickable area */
                    transition: color 0.2s ease;
                    height: 100%;
                    position: relative; /* For potential indicators */
                }
                .navigation .listWrap li a .icon svg {
                    width: 26px; /* Consistent icon size */
                    height: 26px;
                    stroke-width: 1.5; /* Adjust stroke for outline icons */
                    margin-bottom: 2px; /* Space below icon if text is added */
                }

                /* Active State Styling - More direct */
                .navigation .listWrap li.active a {
                    color: #ffc107; /* Use active color directly */
                }

                /* Remove transform/filter from template CSS if they existed */
                /* Remove .text styles if the dot indicator is not used */

            `}</style>
    </>
  );
};

export default BottomNavbar;
