import { useState } from "react";
import { User, Bell, Shield, Key, Palette, Save } from "lucide-react";
import { useAuthStore } from "../store";
import toast from "react-hot-toast";

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<
    "profile" | "notifications" | "security" | "appearance"
  >("profile");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    company: user?.company || "",
    notifications: {
      email: true,
      push: true,
      processingComplete: true,
      distributionComplete: true,
      weeklyDigest: false,
    },
  });

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    toast.success("Settings saved!");
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    // { id: "notifications", label: "Notifications", icon: Bell },
    // { id: "security", label: "Security", icon: Shield },
    // { id: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors ${activeTab === tab.id
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          <div className="card">
            {activeTab === "profile" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Profile Settings</h2>

                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-600">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <button className="btn-secondary">Change Avatar</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="input-field"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) =>
                        setFormData({ ...formData, company: e.target.value })
                      }
                      className="input-field"
                      placeholder="Your company name"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">
                  Notification Preferences
                </h2>

                <div className="space-y-4">
                  {[
                    {
                      key: "email",
                      label: "Email Notifications",
                      description: "Receive notifications via email",
                    },
                    {
                      key: "push",
                      label: "Push Notifications",
                      description: "Browser push notifications",
                    },
                    {
                      key: "processingComplete",
                      label: "Processing Complete",
                      description: "When article processing finishes",
                    },
                    {
                      key: "distributionComplete",
                      label: "Distribution Complete",
                      description: "When scheduled posts are published",
                    },
                    {
                      key: "weeklyDigest",
                      label: "Weekly Digest",
                      description: "Weekly summary of activity",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-black">{item.label}</p>
                        <p className="text-sm text-gray-500">
                          {item.description}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            formData.notifications[
                            item.key as keyof typeof formData.notifications
                            ]
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              notifications: {
                                ...formData.notifications,
                                [item.key]: e.target.checked,
                              },
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Security Settings</h2>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Key className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-black">Password</p>
                          <p className="text-sm text-gray-500">
                            Last changed 30 days ago
                          </p>
                        </div>
                      </div>
                      <button className="btn-secondary text-sm">
                        Change Password
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-black">
                            Two-Factor Authentication
                          </p>
                          <p className="text-sm text-gray-500">
                            Add an extra layer of security
                          </p>
                        </div>
                      </div>
                      <button className="btn-primary text-sm">
                        Enable 2FA
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Appearance</h2>

                <div>
                  <p className="font-medium mb-3 text-black">Theme</p>
                  <div className="grid grid-cols-3 gap-3">
                    {["light", "dark", "system"].map((theme) => (
                      <button
                        key={theme}
                        className={`p-4 border-2 rounded-lg capitalize ${theme === "light"
                          ? "border-primary-600 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                          }`}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-6 pt-6 border-t flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-black"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
