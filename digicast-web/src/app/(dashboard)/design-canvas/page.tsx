'use client';

export default function DesignCanvasPage() {
  return (
    <div className="-m-6 lg:-m-8 h-[calc(100vh-0px)] flex flex-col bg-[#0B0E17]">
      <iframe
        src="/figma-canvas.html"
        className="w-full h-full border-none flex-1"
        title="Digicast Figma Design Canvas"
      />
    </div>
  );
}
