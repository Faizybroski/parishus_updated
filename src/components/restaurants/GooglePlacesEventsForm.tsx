import React, { useRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

interface FormData {
  location_name: string;
  location_address: string;
  location_lat: string;
  location_lng: string;
}

declare global {
  interface Window {
    google: any;
    initGooglePlacesCallback?: () => void;
  }
}

interface Props {
  formData: FormData;
  onChange: (field: keyof FormData, value: string) => void;
}

const GooglePlacesEventsForm: React.FC<Props> = ({ formData, onChange }) => {
  const { profile, loading } = useProfile();
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);

  useEffect(() => {
    if (window.google?.maps?.places) {
      setIsApiLoaded(true);
      return;
    }

    const existingScript = document.querySelector(
      "script[src*='maps.googleapis.com/maps/api/js']"
    );
    if (existingScript) return;

    window.initGooglePlacesCallback = () => setIsApiLoaded(true);

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDMyPeHRZWHMc89UEzXgHPqk0mjTmwCrMY&libraries=places&callback=initGooglePlacesCallback`;
    script.async = true;
    script.defer = true;
    script.onerror = () => toast.error("Failed to load Google Maps API");
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (
      !isApiLoaded ||
      !inputRef.current ||
      autocompleteRef.current ||
      !profile
    )
      return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ["establishment"],
        fields: ["name", "formatted_address", "geometry", "address_components"],
      }
    );

    autocomplete.addListener("place_changed", async () => {
      const place = autocomplete.getPlace();

      if (!place.geometry) {
        toast.error("Invalid place selected");
        return;
      }

      const lat = place.geometry.location.lat().toFixed(6);
      const lng = place.geometry.location.lng().toFixed(6);

      onChange("location_name", place.name || "");
      onChange("location_address", place.formatted_address || "");
      onChange("location_lat", lat);
      onChange("location_lng", lng);

      const components: any = {};
      place.address_components?.forEach((component: any) => {
        const types = component.types;
        if (types.includes("country")) components.country = component.long_name;
        if (types.includes("administrative_area_level_1"))
          components.state = component.long_name;
        if (types.includes("locality")) components.city = component.long_name;
      });

      const restaurantData = {
        name: place.name.trim() || "",
        country: components.country.trim() || "",
        state_province: components.state.trim() || "",
        city: components.city.trim() || "",
        full_address: place.formatted_address.trim() || "",
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        creator_id: profile.id,
      };

      const { data: existingRestaurant, error: fetchError } = await supabase
        .from("restaurants")
        .select("id")
        .eq("name", restaurantData.name)
        .maybeSingle();

      if (fetchError) {
        toast.error("Error checking existing restaurant");
        return;
      }

      if (existingRestaurant) {
        toast.success(`Saved: ${place.name}`);
      } else {
        const { error: insertError } = await supabase
          .from("restaurants")
          .insert(restaurantData);
        if (insertError) {
          toast.error("Failed to save restaurant");
        } else {
          toast.success(`Saved: ${place.name}`);
        }
      }
    });

    autocompleteRef.current = autocomplete;
  }, [isApiLoaded, profile]);
  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <Label htmlFor="location_name">Venue Name *</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="location_name"
            ref={inputRef}
            className="pl-10"
            placeholder="e.g., The Garden Cafe"
            value={formData.location_name}
            onChange={(e) => onChange("location_name", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location_address">Address</Label>
        <Input
          id="location_address"
          placeholder="Enter Your Address"
          value={formData.location_address}
          readOnly
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location_lat">Latitude</Label>
          <Input
            id="location_lat"
            placeholder="Enter Latitude"
            value={formData.location_lat}
            readOnly
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location_lng">Longitude</Label>
          <Input
            id="location_lng"
            placeholder="Enter Longitude"
            value={formData.location_lng}
            readOnly
          />
        </div>
      </div>
    </div>
  );
};

export default GooglePlacesEventsForm;
