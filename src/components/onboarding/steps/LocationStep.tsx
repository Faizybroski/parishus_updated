import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface LocationStepProps {
  data: any;
  updateData: (field: string, value: any) => void;
}

declare global {
  interface Window {
    google: any;
    initGooglePlacesCallback?: () => void;
  }
}

export const LocationStep: React.FC<LocationStepProps> = ({ data, updateData }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [locating, setLocating] = useState(false);
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
    script.onerror = () => {
      toast({
        title: "Google Places failed to load",
        description: "City autocomplete won't work",
        variant: "destructive",
      });
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isApiLoaded || !inputRef.current || autocompleteRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["(cities)"],
      fields: ["address_components", "geometry", "name"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      const city = place.name || "";
      const lat = place.geometry?.location?.lat();
      const lng = place.geometry?.location?.lng();

      if (!lat || !lng) {
        toast({
          title: "Couldn't fetch location",
          description: "Please try another city",
          variant: "destructive",
        });
        return;
      }

      updateData("location_city", city);
      updateData("location_lat", lat);
      updateData("location_lng", lng);

      toast({
        title: "City selected",
        description: `Location set to ${city}`,
      });
    });

    autocompleteRef.current = autocomplete;
  }, [isApiLoaded]);

  const getCurrentLocation = async () => {
    setLocating(true);

    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
      });
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const locationData = await response.json();

          const city =
            locationData.city || locationData.locality || locationData.countryName;

          updateData("location_city", city);
          updateData("location_lat", latitude);
          updateData("location_lng", longitude);

          toast({
            title: "Location found!",
            description: `Set your location to ${city}`,
          });
        } catch (error) {
          updateData("location_lat", latitude);
          updateData("location_lng", longitude);
          updateData("location_city", `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

          toast({
            title: "Location captured",
            description: "We'll use your coordinates to find nearby events",
          });
        }

        setLocating(false);
      },
      (error) => {
        toast({
          title: "Location access denied",
          description: "Please enter your location manually",
          variant: "destructive",
        });
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Where are you located?</h2>
        <p className="text-muted-foreground">
          This helps us show you events in your area
        </p>
      </div>

      <div className="space-y-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <Button
              onClick={getCurrentLocation}
              disabled={locating}
              className="w-full bg-peach-gold hover:bg-peach-gold/90"
            >
              <Navigation className={`h-4 w-4 mr-2 ${locating ? "animate-spin" : ""}`} />
              {locating ? "Getting your location..." : "Use Current Location"}
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-center space-x-4">
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-sm text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Enter your city manually</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              id="location"
              placeholder="e.g., New York, NY"
              value={data.location_city || ""}
              onChange={(e) => updateData("location_city", e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
