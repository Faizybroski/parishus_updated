// import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

// const MapContainer = ({ lat, lng }) => {
//   const center = { lat: Number(lat), lng: Number(lng) };

//   return (
//     <LoadScript googleMapsApiKey={"https://maps.googleapis.com/maps/api/js?key=AIzaSyDMyPeHRZWHMc89UEzXgHPqk0mjTmwCrMY&libraries=places&callback=initGoogleMaps"}>
//       <GoogleMap
//         mapContainerStyle={{
//           height: "300px",
//           width: "100%",
//           borderRadius: "12px",
//         }}
//         center={center}
//         zoom={15}
//       >
//         <Marker position={center} />
//       </GoogleMap>
//     </LoadScript>
//   );
// };

// export default MapContainer;

const MapContainer = ({ name, add, lat, lng }) => {
  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=16&size=600x300&maptype=roadmap&markers=color:orange%7C${lat},${lng}&style=feature:poi|visibility:off&style=feature:road|element:geometry|lightness:100&style=feature:road|element:labels.icon|visibility:off&key=${
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  }`;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    `${name}, ${add}`
  )}&z=15&output=embed`;

  return (
    <div className="rounded-xl overflow-hidden">
      <iframe
        title="Google Map"
        src={mapSrc}
        width="100%"
        height="300"
        style={{ border: 0, backgroundImage: `url('${staticMapUrl}')` }}
        allowFullScreen
        loading="lazy"
      />
    </div>
    // <a
    //   href={mapSrc}
    //   target="_blank"
    //   rel="noopener noreferrer"
    //   className="block rounded-xl overflow-hidden border border-border hover:shadow-lg transition-shadow duration-200"
    // >
    //   {/* 🗺️ Map Image */}
    //   <div
    //     style={{
    //       width: "100%",
    //       height: "300px",
    //       backgroundImage: `url('${staticMapUrl}')`,
    //       backgroundSize: "cover",
    //       backgroundPosition: "center",
    //       filter: "grayscale(20%) contrast(110%) brightness(105%)",
    //     }}
    //   />

    //   {/* 📍 Overlay Info */}
    //   <div className="bg-gradient-to-t from-black/70 to-transparent text-white p-3">
    //     <p className="font-semibold">{name}</p>
    //     <p className="text-sm opacity-90">{add}</p>
    //   </div>
    // </a>
  );
};

export default MapContainer;

// import React from "react";
// import {
//   GoogleMap,
//   Marker,
//   useJsApiLoader,
// } from "@react-google-maps/api";

// interface MapViewProps {
//   lat: number;
//   lng: number;
//   locationName: string;
//   locationAddress: string;
// }

// const containerStyle = {
//   width: "100%",
//   height: "400px",
//   borderRadius: "12px",
// };

// const MapContainer: React.FC<MapViewProps> = ({
//   lat,
//   lng,
//   locationName,
//   locationAddress,
// }) => {
//   const { isLoaded, loadError } = useJsApiLoader({
//     googleMapsApiKey: 'AIzaSyDMyPeHRZWHMc89UEzXgHPqk0mjTmwCrMY', // store your key in .env
//     libraries: ["places"],
//   });

//   if (loadError) return <p>❌ Error loading maps</p>;
//   if (!isLoaded) return <p>Loading map...</p>;

//   const center = { lat, lng };

//   return (
//     <div className="space-y-2">
//       <div className="flex flex-col">
//         <a
//           href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
//             locationName + " " + locationAddress
//           )}`}
//           target="_blank"
//           rel="noopener noreferrer"
//           className="text-primary hover:underline font-medium"
//         >
//           {locationName}
//         </a>
//         <p className="text-sm text-muted-foreground">{locationAddress}</p>
//       </div>

//       <GoogleMap
//         mapContainerStyle={containerStyle}
//         center={center}
//         zoom={15}
//       >
//         <Marker position={center} title={locationName} />
//       </GoogleMap>
//     </div>
//   );
// };

// export default React.memo(MapContainer);

// import React, { useEffect, useRef } from "react";

// interface MapViewProps {
//   lat: number;
//   lng: number;
//   locationName: string;
//   locationAddress: string;
// }

// const MapContainer: React.FC<MapViewProps> = ({
//   lat,
//   lng,
//   locationName,
//   locationAddress,
// }) => {
//   const mapRef = useRef<HTMLDivElement | null>(null);

//   // 🧠 Load the Google Maps script manually
//   useEffect(() => {
//     // Avoid multiple script loads
//     if (document.getElementById("google-maps-script")) {
//       initMap();
//       return;
//     }

//     const script = document.createElement("script");
//     script.id = "google-maps-script";
//     script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDMyPeHRZWHMc89UEzXgHPqk0mjTmwCrMY&libraries=places`;
//     script.async = true;
//     script.defer = true;
//     script.onload = initMap;
//     document.body.appendChild(script);
//   }, [lat, lng]);

//   // 🗺️ Initialize Map
//   const initMap = () => {
//     if (!mapRef.current || !window.google) return;

//     const map = new window.google.maps.Map(mapRef.current, {
//       center: { lat, lng },
//       zoom: 15,
//       mapTypeControl: false,
//       streetViewControl: false,
//       fullscreenControl: false,
//     });

//     new window.google.maps.Marker({
//       position: { lat, lng },
//       map,
//       title: locationName,
//     });
//   };

//   return (
//     <div className="space-y-2">
//       {/* Location info */}
//       <div className="flex flex-col">
//         <a
//           href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
//             `${locationName} ${locationAddress}`
//           )}`}
//           target="_blank"
//           rel="noopener noreferrer"
//           className="text-primary hover:underline font-medium"
//         >
//           {locationName}
//         </a>
//         <p className="text-sm text-muted-foreground">{locationAddress}</p>
//       </div>

//       {/* Map container */}
//       <div
//         ref={mapRef}
//         style={{
//           width: "100%",
//           height: "400px",
//           borderRadius: "12px",
//         }}
//       />
//     </div>
//   );
// };

// export default React.memo(MapContainer);

// import React from "react";

// interface MapPreviewProps {
//   lat: number;
//   lng: number;
//   address: string;
//   name: string;
// }

// const MapPreview: React.FC<MapPreviewProps> = ({ lat, lng, name, address }) => {
//   const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
//     `${name} ${name}`
//   )}`;

//   // 🎨 Custom 3D gray style (muted colors, visible building outlines, orange pin)
//   const mapStyle = [
//     "feature:all|element:labels.text.fill|color:0x444444",
//     "feature:administrative|element:geometry|color:0xdcdcdc",
//     "feature:landscape|element:geometry|color:0xf0f0f0",
//     "feature:poi|visibility:off",
//     "feature:road|element:geometry|color:0xe0e0e0",
//     "feature:road.highway|element:geometry.fill|color:0xd6d6d6",
//     "feature:road.highway|element:geometry.stroke|color:0xb0b0b0",
//     "feature:transit|visibility:off",
//     "feature:water|element:geometry|color:0xdadada",
//   ];

//   const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=17&size=800x400&maptype=roadmap&markers=color:orange%7C${lat},${lng}&style=${mapStyle.join(
//     "&style="
//   )}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;

//   return (
//     <a
//       href={googleMapsUrl}
//       target="_blank"
//       rel="noopener noreferrer"
//       className="block rounded-2xl overflow-hidden border border-border hover:shadow-lg hover:scale-[1.01] transition-transform duration-300"
//     >
//       {/* 🗺️ Map Background */}
//       <div
//         style={{
//           width: "100%",
//           height: "300px",
//           backgroundImage: `url('${staticMapUrl}')`,
//           backgroundSize: "cover",
//           backgroundPosition: "center",
//           filter: "grayscale(40%) contrast(110%) brightness(102%)",
//         }}
//       />

//       {/* 📍 Location Info Overlay */}
//       <div className="bg-gradient-to-t from-black/70 to-transparent text-white p-3">
//         <p className="font-semibold tracking-wide">{name}</p>
//         <p className="text-sm opacity-90">{address}</p>
//       </div>
//     </a>
//   );
// };

// export default MapPreview;
