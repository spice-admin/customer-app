// src/components/packages/PackageTabs.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import type {
  Category,
  Package,
  ICustomerProfile,
  PackageType,
} from "../../types"; // Ensure these are exported correctly
import PackageCard from "./PackageCard";

const ALL_CATEGORY_ID = "all";

const PackageTabs: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>(ALL_CATEGORY_ID);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<Pick<
    ICustomerProfile,
    "address" | "city"
  > | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setUserProfile(null);

    try {
      const [categoriesResult, packagesResult, authUserResponse] =
        await Promise.all([
          supabase.from("categories").select("*").order("name"),
          supabase
            .from("packages")
            .select(
              `
            *, 
            categories (id, name) 
          `
            )
            .eq("is_active", true)
            .order("name"),
          supabase.auth.getUser(),
        ]);

      if (categoriesResult.error) throw categoriesResult.error;
      setCategories((categoriesResult.data as Category[]) || []);

      if (packagesResult.error) throw packagesResult.error;

      console.log(
        "[PackageTabs] Raw Packages Data from Supabase:",
        packagesResult.data
      );

      setPackages((packagesResult.data as Package[]) || []);

      const {
        data: { user },
      } = authUserResponse;
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("address, city")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          console.warn(
            "[PackageTabs] Error fetching user profile for address check:",
            profileError.message
          );
        }
        if (profileData) {
          setUserProfile(profileData);
        }
      }
    } catch (err) {
      console.error("[PackageTabs] Error during data fetch:", err);
      setError(
        (err as Error).message || "Could not load data. Please try again later."
      );
      setCategories([]);
      setPackages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredPackages = useMemo(() => {
    if (activeTabId === ALL_CATEGORY_ID) {
      return packages;
    }
    // MODIFIED: Access the first element of the 'categories' array
    return packages.filter((pkg) => pkg.categories?.id === activeTabId);
  }, [activeTabId, packages]);

  const handleTabClick = (categoryId: string) => {
    setActiveTabId(categoryId);
  };

  // ... (isLoading, error rendering remains the same) ...

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

  return (
    <div className="tabs-section1" id="suggest-food-items">
      <nav>
        <button
          type="button"
          onClick={() => handleTabClick(ALL_CATEGORY_ID)}
          className={activeTabId === ALL_CATEGORY_ID ? "active" : ""}
        >
          💥 All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => handleTabClick(category.id)}
            className={activeTabId === category.id ? "active" : ""}
          >
            {category.name}
          </button>
        ))}
      </nav>

      <div className="tabContainer">
        <div className="Tabcondent active">
          {filteredPackages.length > 0 ? (
            <div className="packages-grid">
              {filteredPackages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  hasAddressInfo={!!(userProfile?.address && userProfile?.city)}
                />
              ))}
            </div>
          ) : (
            <p className="no-packages-message text-center p-5 text-gray-500">
              {packages.length > 0
                ? `No packages found in the "${
                    // MODIFIED: Access category name from the first element of the array
                    categories.find((c) => c.id === activeTabId)?.name ||
                    "selected"
                  }" category.`
                : "No packages available at the moment."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackageTabs;
