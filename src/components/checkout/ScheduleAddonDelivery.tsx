// src/components/checkout/ScheduleAddonDelivery.tsx
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient"; // Adjust path if needed
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import type {
  CustomerSubscriptionOrder,
  DeliveryScheduleEntry,
  // AddonCartItem // Not directly used in THIS component's props/state other than from useCart()
} from "../../types/addon.types"; // Adjust path to your addon types
import {
  format,
  parseISO,
  isValid,
  isWithinInterval,
  startOfDay,
  endOfDay,
  addMonths,
  isSameDay,
} from "date-fns";
import { useCart } from "../../context/CartContext"; // Adjust path to your CartContext
import { FiArrowRight } from "react-icons/fi";

// Helper function
const formatDateForSupabase = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

interface ScheduleAddonDeliveryContentProps {
  currentUser: any; // Replace 'any' with your actual Supabase User type
  // assignmentIdFromAstro?: string; // Not currently used in this component's logic
}

const ScheduleAddonDeliveryContent: React.FC<
  ScheduleAddonDeliveryContentProps
> = ({ currentUser }) => {
  const { cartItems, getCartTotalPrice } = useCart(); // Correctly use useCart here

  const [activeSubscriptions, setActiveSubscriptions] = useState<
    CustomerSubscriptionOrder[]
  >([]);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<
    string | null
  >(null);
  const [deliverySchedule, setDeliverySchedule] = useState<
    Record<string, DeliveryScheduleEntry>
  >({});
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState<Date | null>(
    null
  );

  const [isLoading, setIsLoading] = useState({
    subscriptions: true,
    schedule: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [isProceeding, setIsProceeding] = useState(false);

  const setLoading = (key: keyof typeof isLoading, value: boolean) => {
    setIsLoading((prev) => ({ ...prev, [key]: value }));
  };

  const fetchActiveSubscriptions = useCallback(async (userId: string) => {
    setLoading("subscriptions", true);
    setError(null);
    const today = formatDateForSupabase(startOfDay(new Date()));
    try {
      console.log("Content: Fetching active subscriptions for user:", userId);
      const { data, error: dbError } = await supabase
        .from("orders")
        .select("id, package_name, delivery_start_date, delivery_end_date")
        .eq("user_id", userId)
        .lte("delivery_start_date", today)
        .gte("delivery_end_date", today)
        .order("delivery_start_date", { ascending: true });

      if (dbError) throw dbError;
      setActiveSubscriptions((data as CustomerSubscriptionOrder[]) || []);
      console.log("Content: Active subscriptions fetched:", data);
    } catch (err: any) {
      console.error("Content: Error fetching active subscriptions:", err);
      setError(`Failed to load your subscriptions: ${err.message}`);
      setActiveSubscriptions([]);
    } finally {
      setLoading("subscriptions", false);
    }
  }, []);

  const fetchDeliverySchedule = useCallback(async () => {
    setLoading("schedule", true);
    setError(null);
    const today = startOfDay(new Date());
    const startDateRange = formatDateForSupabase(today);
    const endDateRange = formatDateForSupabase(addMonths(today, 2));
    try {
      console.log("Content: Fetching delivery schedule.");
      const { data, error: dbError } = await supabase
        .from("delivery_schedule")
        .select("event_date, is_delivery_enabled, notes")
        .gte("event_date", startDateRange)
        .lte("event_date", endDateRange);
      if (dbError) throw dbError;
      const scheduleMap: Record<string, DeliveryScheduleEntry> = {};
      (data || []).forEach((entry) => {
        scheduleMap[entry.event_date] = entry as DeliveryScheduleEntry;
      });
      setDeliverySchedule(scheduleMap);
      console.log("Content: Delivery schedule fetched:", scheduleMap);
    } catch (err: any) {
      console.error("Content: Error fetching delivery schedule:", err);
      setError(`Failed to load delivery schedule: ${err.message}`);
    } finally {
      setLoading("schedule", false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      console.log(
        "Content: CurrentUser available, fetching subscriptions and schedule."
      );
      fetchActiveSubscriptions(currentUser.id);
      fetchDeliverySchedule();
    } else {
      console.log("Content: CurrentUser not available yet for fetching data.");
    }
  }, [currentUser, fetchActiveSubscriptions, fetchDeliverySchedule]);

  const isDateDisabled = ({
    date,
    view,
  }: {
    date: Date;
    view: string;
  }): boolean => {
    if (view !== "month") return false;
    const dateNormalized = startOfDay(date);
    const todayNormalized = startOfDay(new Date());
    if (dateNormalized < todayNormalized) return true;
    const dateString = formatDateForSupabase(dateNormalized);
    const scheduleEntry = deliverySchedule[dateString];
    if (!scheduleEntry || !scheduleEntry.is_delivery_enabled) return true;
    if (!selectedSubscriptionId) return true;
    const sub = activeSubscriptions.find(
      (s) => s.id === selectedSubscriptionId
    );
    if (sub && sub.delivery_start_date && sub.delivery_end_date) {
      const subStartDate = startOfDay(parseISO(sub.delivery_start_date));
      const subEndDate = endOfDay(parseISO(sub.delivery_end_date));
      if (
        !isWithinInterval(dateNormalized, {
          start: subStartDate,
          end: subEndDate,
        })
      ) {
        return true;
      }
    } else {
      return true;
    }
    return false;
  };

  const tileClassName = ({
    date,
    view,
  }: {
    date: Date;
    view: string;
  }): string | null => {
    if (view === "month") {
      if (isDateDisabled({ date, view })) {
        // Check if it's disabled first
        return "date-disabled";
      }
      if (selectedDeliveryDate && isSameDay(date, selectedDeliveryDate)) {
        return "date-selected";
      }
    }
    return null;
  };

  const handleDateChange = (value: any) => {
    const newSelectedDate = Array.isArray(value) ? value[0] : value;
    if (newSelectedDate instanceof Date) {
      console.log("Calendar date selected by user:", newSelectedDate);
      setSelectedDeliveryDate(startOfDay(newSelectedDate));
    } else {
      console.log(
        "Calendar date selection cleared or invalid from user:",
        newSelectedDate
      );
      setSelectedDeliveryDate(null);
    }
  };

  const handleSubscriptionSelection = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newSubId = event.target.value;
    console.log("Content: Subscription selected:", newSubId);
    setSelectedSubscriptionId(newSubId);
    setSelectedDeliveryDate(null);
  };

  const handleProceedToSummary = () => {
    if (!selectedSubscriptionId) {
      alert("Please select a subscription package for your addons.");
      return;
    }
    if (!selectedDeliveryDate) {
      alert("Please select a delivery date for your addons.");
      return;
    }
    if (cartItems.length === 0) {
      alert("Your addon cart is empty. Please add some addons first.");
      return;
    }

    setIsProceeding(true);
    try {
      const summaryData = {
        selectedSubscriptionId,
        selectedSubscriptionName:
          activeSubscriptions.find((s) => s.id === selectedSubscriptionId)
            ?.package_name || "N/A",
        selectedDeliveryDate: formatDateForSupabase(selectedDeliveryDate),
      };
      localStorage.setItem("addonDeliverySummary", JSON.stringify(summaryData));
      console.log("Proceeding to summary with data:", summaryData);
      window.location.href = "/checkout-summary"; // Navigate to the new summary page
    } catch (e) {
      console.error("Error preparing for summary:", e);
      alert("Could not proceed to summary. Please try again.");
      setIsProceeding(false);
    }
    // setIsProceeding(false); // Not reached due to navigation
  };

  if (isLoading.subscriptions || isLoading.schedule) {
    return (
      <div className="loading-container">
        <p>Loading delivery options and schedule...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="error-container">
        <p>Error loading data: {error}</p>
      </div>
    );
  }

  return (
    <div className="schedule-addon-delivery-content-wrapper">
      <h2>Schedule Your Addon Delivery</h2>

      <div className="cart-summary-preview">
        <h4>Addons in Cart ({cartItems.length})</h4>
        {cartItems.length > 0 ? (
          <ul>
            {cartItems.map((item) => (
              <li key={item.id}>
                {item.name} (x{item.quantity}) - $
                {(item.price * item.quantity).toFixed(2)}
              </li>
            ))}
          </ul>
        ) : (
          <p>Your addon cart is empty. Add some addons to proceed!</p>
        )}
        {cartItems.length > 0 && (
          <p className="total-price">
            <strong>
              Total Addon Price: ${getCartTotalPrice().toFixed(2)} CAD
            </strong>
          </p>
        )}
      </div>

      {activeSubscriptions.length === 0 && !isLoading.subscriptions && (
        <p className="info-message">
          You don't have any active subscriptions to schedule addons for.
        </p>
      )}
      {activeSubscriptions.length > 0 && (
        <div className="subscription-selection">
          <h3>1. Attach Addons to Subscription:</h3>
          {activeSubscriptions.map((sub) => (
            <div key={sub.id} className="subscription-option">
              <input
                type="radio"
                id={`sub-${sub.id}`}
                name="subscriptionSelection"
                value={sub.id}
                checked={selectedSubscriptionId === sub.id}
                onChange={handleSubscriptionSelection}
              />
              <label htmlFor={`sub-${sub.id}`}>
                {sub.package_name}
                (Active:{" "}
                {sub.delivery_start_date
                  ? format(parseISO(sub.delivery_start_date), "MMM dd")
                  : ""}
                -{" "}
                {sub.delivery_end_date
                  ? format(parseISO(sub.delivery_end_date), "MMM dd, yyyy")
                  : ""}
                )
              </label>
            </div>
          ))}
        </div>
      )}

      {selectedSubscriptionId && (
        <div className="date-selection">
          <h3>2. Select Delivery Date for Addons:</h3>
          <div className="calendar-container">
            <Calendar
              onChange={handleDateChange}
              value={selectedDeliveryDate}
              minDate={startOfDay(new Date())}
              maxDate={addMonths(new Date(), 2)}
              tileDisabled={isDateDisabled}
              tileClassName={tileClassName}
              view="month"
            />
          </div>
          {selectedDeliveryDate && (
            <p className="selected-date-info">
              Selected for addons:{" "}
              <strong>{format(selectedDeliveryDate, "MMMM dd, yyyy")}</strong>
            </p>
          )}
        </div>
      )}

      {/* This button replaces the old handleConfirmAddonDelivery button for this screen's primary action */}
      {cartItems.length > 0 &&
        selectedSubscriptionId &&
        selectedDeliveryDate && (
          <button
            onClick={handleProceedToSummary}
            className="button-primary confirm-addon-button"
            disabled={
              isProceeding || isLoading.subscriptions || isLoading.schedule
            }
          >
            {isProceeding ? "Processing..." : "Proceed to Addon Summary"}
            {!isProceeding && <FiArrowRight style={{ marginLeft: "8px" }} />}
          </button>
        )}
    </div>
  );
};

// Wrapper Component - No changes needed to this from the last correct version
interface ScheduleAddonDeliveryWrapperProps {
  assignmentIdFromAstro?: string;
}
const ScheduleAddonDeliveryWrapper: React.FC<
  ScheduleAddonDeliveryWrapperProps
> = ({ assignmentIdFromAstro }) => {
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Wrapper: Component did mount, setting isClient to true.");
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) {
      console.log("Wrapper: User fetch deferred, isClient is false.");
      return;
    }
    console.log("Wrapper: isClient is true. Starting user fetch.");
    setAuthLoading(true);
    setAuthError(null);

    const fetchUser = async () => {
      try {
        const {
          data: { user },
          error: supabaseAuthError,
        } = await supabase.auth.getUser();
        console.log(
          "Wrapper: supabase.auth.getUser response - user:",
          user ? user.email : null,
          "error:",
          supabaseAuthError
        );
        if (supabaseAuthError) {
          setAuthError(
            supabaseAuthError.message || "Failed to fetch user session."
          );
        }
        setCurrentUser(user);
      } catch (e: any) {
        console.error("Exception in fetchUser:", e);
        setAuthError(
          "An unexpected error occurred while fetching user details."
        );
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
        console.log("Wrapper: fetchUser complete. authLoading set to false.");
      }
    };
    fetchUser();
  }, [isClient]);

  console.log(
    `Wrapper: Rendering. isClient: ${isClient}, authLoading: ${authLoading}, currentUser: ${!!currentUser}`
  );

  if (!isClient) {
    return (
      <div className="loading-container">
        <p>Wrapper: Initializing component...</p>
      </div>
    );
  }
  if (authLoading) {
    return (
      <div className="loading-container">
        <p>Wrapper: Loading User Information...</p>
      </div>
    );
  }
  if (authError) {
    return (
      <div className="error-container">
        <p>Authentication Error: {authError}</p>
        <p>
          <a href="/login">Please try logging in again.</a>
        </p>
      </div>
    );
  }
  if (!currentUser) {
    return (
      <div className="error-container">
        {" "}
        <p>You need to be logged in to schedule addon deliveries.</p>{" "}
        <p>
          <a href="/login">Click here to login.</a>
        </p>{" "}
      </div>
    );
  }

  console.log("Wrapper: Rendering ScheduleAddonDeliveryContent.");
  // Pass any necessary props from Astro via assignmentIdFromAstro if ScheduleAddonDeliveryContent needs them
  return <ScheduleAddonDeliveryContent currentUser={currentUser} />;
};

export default ScheduleAddonDeliveryWrapper;
