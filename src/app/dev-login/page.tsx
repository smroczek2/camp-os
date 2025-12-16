"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tent, Users, Activity, Shield, Heart } from "lucide-react";

const DEV_USERS = [
  {
    id: "admin-1",
    name: "Admin User",
    email: "admin@camposarai.co",
    role: "admin",
    icon: Shield,
    color: "purple",
    description: "Full system access, manage camps & sessions",
  },
  {
    id: "staff-1",
    name: "Sarah Johnson",
    email: "sarah.johnson@camposarai.co",
    role: "staff",
    icon: Activity,
    color: "green",
    description: "View assigned groups, check-in children",
  },
  {
    id: "staff-2",
    name: "Mike Chen",
    email: "mike.chen@camposarai.co",
    role: "staff",
    icon: Activity,
    color: "green",
    description: "View assigned groups, check-in children",
  },
  {
    id: "nurse-1",
    name: "Dr. Emily Martinez",
    email: "emily.martinez@camposarai.co",
    role: "nurse",
    icon: Heart,
    color: "red",
    description: "Medical access, medication logs",
  },
  {
    id: "parent-1",
    name: "Jennifer Smith",
    email: "jennifer.smith@example.com",
    role: "parent",
    icon: Users,
    color: "blue",
    description: "View children & registrations (2 children)",
  },
  {
    id: "parent-2",
    name: "David Williams",
    email: "david.williams@example.com",
    role: "parent",
    icon: Users,
    color: "blue",
    description: "View children & registrations (2 children)",
  },
  {
    id: "parent-3",
    name: "Maria Garcia",
    email: "maria.garcia@example.com",
    role: "parent",
    icon: Users,
    color: "blue",
    description: "View children & registrations (2 children)",
  },
];

export default function DevLoginPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleDevLogin = async (userId: string) => {
    setLoading(userId);
    try {
      const response = await fetch("/api/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        window.location.href = "/dashboard";
      } else {
        alert("Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-green-500/20 border-2 border-blue-500/30 shadow-lg">
              <Tent className="h-11 w-11 text-blue-600" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Camp OS
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-2">Development Login</p>
          <p className="text-sm text-muted-foreground">
            Select a user to test different role-based dashboards
          </p>
        </div>

        {/* User Cards */}
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEV_USERS.map((user) => {
              const Icon = user.icon;
              const colorClasses = {
                purple: "from-purple-500/10 to-purple-600/10 border-purple-500/20 text-purple-600",
                green: "from-green-500/10 to-green-600/10 border-green-500/20 text-green-600",
                red: "from-red-500/10 to-red-600/10 border-red-500/20 text-red-600",
                blue: "from-blue-500/10 to-blue-600/10 border-blue-500/20 text-blue-600",
              }[user.color];

              return (
                <Card
                  key={user.id}
                  className="border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  onClick={() => handleDevLogin(user.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses} border`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="px-3 py-1 rounded-full bg-muted text-xs font-medium capitalize">
                        {user.role}
                      </div>
                    </div>
                    <CardTitle className="text-xl mb-1">{user.name}</CardTitle>
                    <CardDescription className="text-xs mb-3">
                      {user.email}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {user.description}
                    </p>
                    <Button
                      className="w-full"
                      disabled={loading === user.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDevLogin(user.id);
                      }}
                    >
                      {loading === user.id ? "Logging in..." : "Login as " + user.name.split(" ")[0]}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Warning */}
        <div className="max-w-2xl mx-auto mt-12 p-6 border-2 border-orange-500/20 rounded-xl bg-orange-500/5">
          <p className="text-sm text-center text-muted-foreground">
            ⚠️ <strong>Development Mode Only</strong> - This login bypasses authentication for testing purposes.
            Do not use in production.
          </p>
        </div>
      </div>
    </div>
  );
}
