import { useEffect, useState } from "react";

export function TikTokPlayer({ url }: { url: string }) {
  const [embedHtml, setEmbedHtml] = useState("");

  useEffect(() => {
    async function fetchEmbed() {
      try {
        const res = await fetch(
          `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
        );
        const data = await res.json();
        setEmbedHtml(data.html);
      } catch (err) {
        console.error("TikTok embed failed:", err);
      }
    }

    fetchEmbed();
  }, [url]);

  useEffect(() => {
    // ✅ Re-inject the embed script after HTML is inserted
    if (!embedHtml) return;

    const script = document.createElement("script");
    script.src = "https://www.tiktok.com/embed.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [embedHtml]);

  return (
    <div
      className="tiktok-video-player"
      dangerouslySetInnerHTML={{ __html: embedHtml }}
    />
  );
}
