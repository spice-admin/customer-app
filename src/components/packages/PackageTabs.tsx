// src/components/packages/PackageTabs.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  getAllCategories,
  getAllPackages,
} from "../../services/package.service"; // Corrected import path
import type { ICategoryFE, IPackageFE } from "../../types";
import PackageCard from "./PackageCard";

const ALL_CATEGORY_ID = "all";
const apiUrlFromEnv = import.meta.env.PUBLIC_API_BASE_URL;

const PackageTabs: React.FC = () => {
  const [categories, setCategories] = useState<ICategoryFE[]>([]);
  const [packages, setPackages] = useState<IPackageFE[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>(ALL_CATEGORY_ID);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [fetchedCategories, fetchedPackages] = await Promise.all([
          getAllCategories(),
          getAllPackages(),
        ]);

        // Check if data looks valid before setting state
        if (!Array.isArray(fetchedCategories)) {
          throw new Error("Fetched categories is not an array.");
        }
        if (!Array.isArray(fetchedPackages)) {
          throw new Error("Fetched packages is not an array.");
        }
        // -----------------------------------------

        setCategories(fetchedCategories);
        setPackages(fetchedPackages);
      } catch (err) {
        setError(
          (err as Error).message ||
            "Could not load packages. Please try again later."
        );
        // Ensure state is empty on error
        setCategories([]);
        setPackages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array means run once on mount

  // Filter packages based on the active tab
  const filteredPackages = useMemo(() => {
    // Log *before* filtering

    if (activeTabId === ALL_CATEGORY_ID) {
      return packages; // Show all packages
    }
    const filtered = packages.filter((pkg) => {
      return pkg.category?._id === activeTabId;
    });

    return filtered;
  }, [activeTabId, packages]); // Recalculate when tab or packages change

  // Handler for changing tabs
  const handleTabClick = (categoryId: string) => {
    setActiveTabId(categoryId);
  };

  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="loading-placeholder text-center p-10 text-gray-500">
        Loading Packages...
      </div>
    );
  }

  if (error) {
    return <div className="form-message error text-center p-10">{error}</div>;
  }

  // Handle case where data is loaded but potentially empty
  // Note: We might have categories but no packages, or vice-versa
  // if (categories.length === 0 && packages.length === 0) {
  //     console.log('[PackageTabs] Render: Showing No Data message (both empty).');
  //     return <div className="text-center p-10 text-gray-500">No categories or packages available.</div>;
  // }

  return (
    <div className="tabs-section1" id="suggest-food-items">
      {/* Tab Navigation */}
      <nav>
        <button
          type="button"
          onClick={() => handleTabClick(ALL_CATEGORY_ID)}
          className={activeTabId === ALL_CATEGORY_ID ? "active" : ""}
        >
          💥 All
        </button>

        {categories.map((category) => {
          return (
            <button
              key={category._id}
              type="button"
              onClick={() => handleTabClick(category._id)}
              className={activeTabId === category._id ? "active" : ""}
            >
              {category.name}
            </button>
          );
        })}
      </nav>

      {/* Tab Content Area */}
      <div className="tabContainer">
        <div className="Tabcondent active">
          {filteredPackages.length > 0 ? (
            <div className="packages-grid">
              {filteredPackages.map((pkg) => {
                return <PackageCard key={pkg._id} pkg={pkg} />;
              })}
            </div>
          ) : (
            <p className="no-packages-message">
              {/* Check if original packages array had items */}
              {packages.length > 0
                ? `No packages found in the "${
                    categories.find((c) => c._id === activeTabId)?.name ||
                    "selected"
                  }" category.`
                : "No packages available at the moment."}
            </p>
          )}
        </div>
      </div>
      {/* Styles should be in global CSS */}
    </div>
  );
};

export default PackageTabs;
