import React from "react";

export const metadata = {
  title: "Marketplace",
};

export default function MarketplacePage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 pt-10">
      <h1 className="text-3xl font-bold mb-8">Marketplace</h1>
      <div className="p-8 bg-base-200 rounded-xl shadow-lg w-full max-w-md flex flex-col items-center">
        <p className="mb-2 text-base-content">This is the Marketplace page. Add your marketplace features or components here.</p>
      </div>
    </main>
  );
}
