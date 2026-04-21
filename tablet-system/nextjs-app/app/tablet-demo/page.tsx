"use client";

import PrestigeTabletFull from "@/components/PrestigeTabletFull";

export default function TabletDemoPage() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
    }}>
      <div style={{ width: "100%", maxWidth: 768 }}>
        <PrestigeTabletFull forceShowDevControls={true} />
      </div>
    </main>
  );
}
