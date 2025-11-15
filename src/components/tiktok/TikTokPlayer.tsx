import { Card, CardHeader, CardContent } from "@/components/ui/card";
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
<Card className="bg-transparent shadow-none border-none w-full max-w-lg mx-auto overflow-hidden">
  <CardContent className="px-0 py-0">
    <div className="relative w-full" style={{ paddingTop: "177.78%" }}>
      <div
        className="absolute inset-0 w-full h-full tiktok-video-player"
        dangerouslySetInnerHTML={{ __html: embedHtml }}
      />
    </div>
  </CardContent>

  <style jsx>{`
    /* Force iframe and blockquote to fill container */
    .tiktok-video-player iframe,
    .tiktok-video-player blockquote {
      width: 100% !important;
      height: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      border: none !important;
      overflow: hidden !important; /* Prevent scrolling */
    }

    /* Hide captions and author info */
    .tiktok-video-player .tiktok-embed-caption,
    .tiktok-video-player .tiktok-embed__author {
      display: none !important;
    }

    /* Hide any white background */
    .tiktok-video-player iframe {
      background: transparent !important;
    }

    /* Ensure the wrapper itself cannot scroll */
    .tiktok-video-player {
      overflow: hidden !important;
      max-width: 100%;
      max-height: 100%;
      touch-action: none; /* disables swipe scroll */
    }
  `}</style>
</Card>
  );
}
