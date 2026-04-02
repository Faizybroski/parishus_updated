export function LoaderText({ text }: { text: string }) {
  return (
     <div className="flex items-center justify-center bg-background">
      <span className="relative inline-block">
        {/* Outline Layer */}
        <span className="absolute inset-0 text-7xl font-script font-extrabold text-transparent stroke-foreground">
          {text}
        </span>
        {/* Animated Fill Layer */}
        <span className="loader-fill text-7xl font-script font-extrabold">
          {text}
        </span>
      </span>
    </div>
  );
}