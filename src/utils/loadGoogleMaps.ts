let isScriptLoading = false;

export function loadGoogleMapsScript(callback: () => void) {
  if (window.google?.maps?.places) {
    callback();
    return;
  }

  if (!isScriptLoading) {
    isScriptLoading = true;
    const script = document.createElement("script");
    script.src =
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyDMyPeHRZWHMc89UEzXgHPqk0mjTmwCrMY&libraries=places";
    script.async = true;
    script.defer = true;
    script.onload = callback;
    document.body.appendChild(script);
  } else {
    const interval = setInterval(() => {
      if (window.google?.maps?.places) {
        clearInterval(interval);
        callback();
      }
    }, 300);
  }
}
