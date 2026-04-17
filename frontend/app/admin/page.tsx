"use client";

export default function AdminPage() {

  if (process.env.NODE_ENV !== "development") {
    return <div className="p-8">Admin tools disabled.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Tools</h1>

      <a
        href="/dashboard"
        className="bg-blue-600 px-4 py-2 rounded text-white"
      >
        View Dashboard
      </a>
    </div>
  );
}