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
  );
};

export default MapContainer;


// interface MapContainerProps {
//   name: string;
//   add: string;
//   lat: number;
//   lng: number;
// }

// const MapContainer: React.FC<MapContainerProps> = ({ name, add, lat, lng }) => {
//   const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

//   // Minimal, light map
//   const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x300&maptype=roadmap&markers=color:red|${lat},${lng}&key=${apiKey}`;

//   // Click redirects to Google Maps
//   const mapsLink = `https://www.google.com/maps?q=${encodeURIComponent(`${name}, ${add}`)}&z=15`;

//   return (
//     <div className="rounded-xl overflow-hidden cursor-pointer max-w-md mx-auto">
//       <a href={mapsLink} target="_blank" rel="noopener noreferrer">
//         <img
//           src={staticMapUrl}
//           alt={`${name} location`}
//           className="w-full h-auto object-cover rounded-xl"
//           loading="lazy"
//         />
//       </a>
//     </div>
//   );
// };

// export default MapContainer;