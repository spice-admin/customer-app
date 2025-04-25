// src/components/packages/PackageTabs.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  getAllCategories,
  getAllPackages,
} from "../../services/package.service";
import type { ICategoryFE, IPackageFE } from "../../types";
import PackageCard from "./PackageCard";

const ALL_CATEGORY_ID = "all";

const PackageTabs: React.FC = () => {
  const [categories, setCategories] = useState<ICategoryFE[]>([]);
  const [packages, setPackages] = useState<IPackageFE[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>(ALL_CATEGORY_ID);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // console.log('[PackageTabs] Mounting and fetching data...'); // Keep logs if needed
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [fetchedCategories, fetchedPackages] = await Promise.all([
          getAllCategories(),
          getAllPackages(),
        ]);
        // console.log('[PackageTabs] Data fetched:', { fetchedCategories, fetchedPackages });
        setCategories(fetchedCategories);
        setPackages(fetchedPackages);
      } catch (err) {
        console.error("[PackageTabs] Failed to fetch data:", err);
        setError(
          (err as Error).message ||
            "Could not load packages. Please try again later."
        );
      } finally {
        // console.log('[PackageTabs] Setting isLoading to false.');
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredPackages = useMemo(() => {
    if (activeTabId === ALL_CATEGORY_ID) return packages;
    const filtered = packages.filter(
      (pkg) => pkg.category?._id === activeTabId
    );
    // console.log(`[PackageTabs] Filtering for tab ${activeTabId}, found ${filtered.length} packages.`);
    return filtered;
  }, [activeTabId, packages]);

  const handleTabClick = (categoryId: string) => {
    // console.log('[PackageTabs] Tab clicked:', categoryId);
    setActiveTabId(categoryId);
  };

  // --- Render Logic ---
  // console.log('[PackageTabs] Rendering component. State:', { isLoading, error, activeTabId, categoriesCount: categories.length, packagesCount: packages.length, filteredPackagesCount: filteredPackages.length });

  if (isLoading) {
    // console.log('[PackageTabs] Rendering Loader.');
    // --- Use a simple loader to avoid hydration issues for now ---
    return (
      <div className="loading-placeholder text-center p-10 text-gray-500">
        Loading Packages...
        {/* You can add a simple CSS spinner here later if needed, defined in global CSS */}
      </div>
    );
    // --- Original template loader (commented out due to hydration issue) ---
    /*
         return (
             <div className="loader-wrapper loader">
                 <div className="icon-loader">
                     <img src="/assets/images/pan.gif" alt="Loading..." />
                 </div>
             </div>
         );
        */
  }

  if (error) {
    // console.log('[PackageTabs] Rendering Error:', error);
    // Use a consistent error message style (ensure .form-message.error is defined globally)
    return <div className="form-message error text-center p-10">{error}</div>;
  }

  // Handle case where data is loaded but empty
  if (categories.length === 0 && packages.length === 0) {
    // console.log('[PackageTabs] Rendering No Data message.');
    return (
      <div className="text-center p-10 text-gray-500">
        No categories or packages available at the moment.
      </div>
    );
  }

  return (
    // Use the main container class from the template
    <div className="tabs-section1" id="suggest-food-items">
      {/* Tab Navigation */}
      <nav>
        <button
          type="button"
          onClick={() => handleTabClick(ALL_CATEGORY_ID)}
          className={activeTabId === ALL_CATEGORY_ID ? "active" : ""} // Apply 'active' class conditionally
        >
          💥 All
        </button>
        {categories.map((category) => (
          <button
            key={category._id}
            type="button"
            onClick={() => handleTabClick(category._id)}
            className={activeTabId === category._id ? "active" : ""}
          >
            {category.name}
          </button>
        ))}
        {/* <div className="clear"></div> */} {/* Include if needed by CSS */}
      </nav>

      {/* Tab Content Area */}
      <div className="tabContainer">
        {/* Ensure .Tabcondent CSS doesn't hide this by default */}
        <div className="Tabcondent active">
          {filteredPackages.length > 0 ? (
            <div className="packages-grid">
              {" "}
              {/* Ensure this class provides layout */}
              {filteredPackages.map((pkg) => (
                <PackageCard key={pkg._id} pkg={pkg} />
              ))}
            </div>
          ) : (
            <p className="no-packages-message">
              {" "}
              {/* Ensure this class provides styling */}
              No packages found in the "
              {categories.find((c) => c._id === activeTabId)?.name ||
                "selected"}
              " category yet.
            </p>
          )}
        </div>
      </div>

      {/* --- REMOVED <style jsx global> block --- */}
    </div>
  );
};

export default PackageTabs;
