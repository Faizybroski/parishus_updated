import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface RestaurantData {
  name: string;
  full_address: string;
  city: string;
  state_province: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface GooglePlacesRestaurantFormProps {
  onSubmit: (data: RestaurantData) => void;
  onCancel?: () => void;
  initialData?: Partial<RestaurantData>;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
    initGoogleMaps: () => void;
  }
}

const GooglePlacesRestaurantForm: React.FC<GooglePlacesRestaurantFormProps> = ({
  onSubmit,
  onCancel,
  initialData = {},
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [formData, setFormData] = useState<RestaurantData>({
    name: initialData.name || "",
    full_address: initialData.full_address || "",
    city: initialData.city || "",
    state_province: initialData.state_province || "",
    country: initialData.country || "",
    latitude: initialData.latitude || 0,
    longitude: initialData.longitude || 0,
  });

  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      console.log("🔄 Starting Google Maps API load...");

      if (window.google && window.google.maps && window.google.maps.places) {
        console.log("✅ Google Maps API already loaded");
        setIsApiLoaded(true);
        return;
      }

      console.log("📦 Loading Google Maps API script...");
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDMyPeHRZWHMc89UEzXgHPqk0mjTmwCrMY&libraries=places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;

      // Create a global callback function
      window.initGoogleMaps = () => {
        console.log("✅ Google Maps API loaded successfully");
        setIsApiLoaded(true);
      };

      script.onerror = (error) => {
        console.error("❌ Failed to load Google Maps API:", error);
        toast.error("Failed to load Google Maps API");
      };

      document.head.appendChild(script);
    };

    loadGoogleMapsAPI();
  }, []);

  useEffect(() => {
    console.log(
      `🔍 Checking autocomplete initialization. API loaded: ${isApiLoaded}, Input ref: ${!!inputRef.current}, Existing autocomplete: ${!!autocompleteRef.current}`
    );

    if (isApiLoaded && inputRef.current && !autocompleteRef.current) {
      console.log("🚀 Initializing Google Places Autocomplete...");

      try {
        // Add a visual indicator to the input
        inputRef.current.style.border = "2px solid green";
        inputRef.current.placeholder = "Google Places loaded! Start typing...";

        const autocomplete = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ["establishment"],
            fields: [
              "name",
              "formatted_address",
              "address_components",
              "geometry",
              "place_id",
            ],
          }
        );

        console.log("✅ Autocomplete created successfully");

        // Add multiple event listeners for debugging
        autocomplete.addListener("place_changed", () => {
          console.log("🎯 PLACE CHANGED EVENT FIRED!");

          const place = autocomplete.getPlace();
          console.log("📍 Full place object:", place);

          // Change input border to indicate event fired
          if (inputRef.current) {
            inputRef.current.style.border = "2px solid blue";
          }

          if (!place) {
            console.warn("⚠️ No place object returned");
            return;
          }

          if (!place.geometry) {
            console.warn("⚠️ No geometry in place object");
            toast.error("Please select a valid place from the dropdown");
            return;
          }

          if (!place.address_components) {
            console.warn("⚠️ No address components in place object");
            return;
          }

          console.log("📋 Address components:", place.address_components);

          const addressComponents = place.address_components;
          let city = "";
          let state_province = "";
          let country = "";

          addressComponents.forEach((component: any) => {
            const types = component.types;
            console.log(
              `📋 Component: ${component.long_name}, Types: ${types.join(", ")}`
            );

            if (types.includes("locality") || types.includes("sublocality")) {
              city = component.long_name;
            } else if (types.includes("administrative_area_level_1")) {
              state_province = component.long_name;
            } else if (types.includes("country")) {
              country = component.long_name;
            }

            if (!city && types.includes("administrative_area_level_2")) {
              city = component.long_name;
            }
          });

          const newFormData = {
            name: place.name.trim() || place.formatted_address?.split(",")[0] || "",
            full_address: place.formatted_address.trim() || "",
            city: city.trim() || "",
            state_province: state_province.trim() || "",
            country: country.trim() || "",
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
          };

          console.log("📝 Setting new form data:", newFormData);
          setFormData(newFormData);

          // Visual confirmation
          if (inputRef.current) {
            inputRef.current.style.border = "2px solid purple";
            inputRef.current.value = newFormData.name;
          }

          toast.success(`Selected: ${newFormData.name}`);
        });

        autocompleteRef.current = autocomplete;
        console.log("✅ Event listener attached successfully");
      } catch (error) {
        console.error("❌ Error initializing autocomplete:", error);
        toast.error("Failed to initialize Google Places autocomplete");
      }
    }
  }, [isApiLoaded]);

  const handleInputChange = (
    field: keyof RestaurantData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("Restaurant name is required");
      return false;
    }
    if (!formData.full_address.trim()) {
      toast.error("Address is required");
      return false;
    }
    if (!formData.city.trim()) {
      toast.error("City is required");
      return false;
    }
    if (!formData.state_province.trim()) {
      toast.error("State/Province is required");
      return false;
    }
    if (!formData.country.trim()) {
      toast.error("Country is required");
      return false;
    }
    if (!formData.latitude || !formData.longitude) {
      toast.error("Please select a place from the autocomplete suggestions");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSubmit(formData);
      toast.success("Restaurant saved successfully");
    } catch (error) {
      toast.error("Failed to save restaurant");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isApiLoaded) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto"></div>
            <p className="text-sm text-muted-foreground">
              Loading Google Places...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add Restaurant</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="place-search">Search Restaurant</Label>
            <Input
              ref={inputRef}
              id="place-search"
              type="text"
              placeholder="Start typing restaurant name or address..."
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Select a restaurant from the dropdown to auto-fill details
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Restaurant Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Restaurant name"
                required
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="full_address">Full Address</Label>
              <Input
                id="full_address"
                value={formData.full_address}
                onChange={(e) =>
                  handleInputChange("full_address", e.target.value)
                }
                placeholder="Complete address"
                required
                readOnly
                className="bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="City"
                required
                readOnly
                className="bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                value={formData.state_province}
                onChange={(e) => handleInputChange("state_province", e.target.value)}
                placeholder="State or Province"
                required
                readOnly
                className="bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                placeholder="Country"
                required
                readOnly
                className="bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="coordinates">Coordinates</Label>
              <Input
                id="coordinates"
                value={
                  formData.latitude && formData.longitude
                    ? `${formData.latitude.toFixed(
                        6
                      )}, ${formData.longitude.toFixed(6)}`
                    : ""
                }
                placeholder="Latitude, Longitude"
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading || !formData.name || !formData.latitude}
            >
              {isLoading ? "Saving..." : "Save Restaurant"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default GooglePlacesRestaurantForm;
