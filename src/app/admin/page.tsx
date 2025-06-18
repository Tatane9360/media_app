"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ArticleList from "@/components/ArticleList";

interface Admin {
  id: string;
  email: string;
}

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("articles");
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.admin) {
          setAdmin(data.admin);
        } else {
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Welcome, {admin?.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("articles")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "articles"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-black"
              }`}
            >
              Articles
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "dashboard"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Dashboard
            </button>
          </nav>
        </div>

        {activeTab === "articles" && <ArticleList />}

        {activeTab === "dashboard" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Dashboard Overview</h2>
            <p className="text-gray-600">
              Dashboard statistics and overview will go here...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
