import { useState, useEffect } from "react";
import {
  Share2,
  Calendar,
  Clock,
  Check,
  ExternalLink,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Mail,
  Loader2,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { useDistributionStore } from "../store/distributionStore";

const platformIconMap: Record<string, any> = {
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  newsletter: Mail,
};

const platformColorMap: Record<string, string> = {
  linkedin: "bg-blue-600",
  twitter: "bg-black",
  facebook: "bg-blue-500",
  instagram: "bg-pink-600",
  newsletter: "bg-green-600",
};

export default function Distribution() {
  const {
    platforms,
    fetchPlatforms,
    isLoading,
    connectPlatform,
    disconnectPlatform,
    history,
    fetchHistory,
    scheduledPosts,
    fetchScheduledPosts,
    cancelScheduledPost
  } = useDistributionStore();

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [activeTab, setActiveTab] = useState<
    "draft" | "scheduled" | "published"
  >("draft");

  useEffect(() => {
    fetchPlatforms();
    fetchHistory();
    fetchScheduledPosts();
  }, [fetchPlatforms, fetchHistory, fetchScheduledPosts]);

  const togglePlatform = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    if (!platform?.connected) {
      toast.error(`Please connect to ${platform?.name || platformId} first`);
      return;
    }

    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId],
    );
  };

  const handleSchedule = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      toast.error("Please select date and time");
      return;
    }

    const scheduleTime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

    try {
      // For demonstration, we'd need a contentId.
      console.log("Scheduling distribution for:", scheduleTime);
      toast.error("Process an article first to distribute specific content.");
    } catch (error) {
      toast.error("Failed to schedule content");
    }
  };

  const handleConnectionToggle = async (platformId: string, isConnected: boolean) => {
    try {
      if (isConnected) {
        await disconnectPlatform(platformId);
        toast.success(`Disconnected from ${platformId}`);
      } else {
        const username = window.prompt(`Enter your ${platformId} username/handle (Simulation Mode):`, `@test_${platformId}`);
        if (username !== null) {
          await connectPlatform(platformId, username);
          toast.success(`Connected to ${platformId} as ${username}`);
        }
      }
    } catch (error) {
      toast.error(`Failed to ${isConnected ? 'disconnect' : 'connect'} ${platformId}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Distribution Hub</h1>
          <p className="text-gray-600">
            Publish and schedule content across platforms
          </p>
        </div>
        <button
          onClick={() => { fetchPlatforms(); fetchHistory(); fetchScheduledPosts(); }}
          className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
          title="Refresh statistics"
        >
          <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Platform Selection */}
      <div className="card">
        <h2 className="font-semibold mb-4 text-black">Target Platforms</h2>
        <div className="flex flex-wrap gap-3">
          {platforms.map((platform) => {
            const Icon = platformIconMap[platform.id] || Share2;
            const isSelected = selectedPlatforms.includes(platform.id);
            const isConnected = platform.connected;

            return (
              <button
                key={platform.id}
                onClick={() => togglePlatform(platform.id)}
                disabled={!isConnected}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${isSelected
                  ? `${platformColorMap[platform.id] || 'bg-primary-600'} text-black border-transparent shadow-lg scale-105`
                  : isConnected
                    ? "border-gray-200 bg-white hover:border-primary-400 text-black hover:bg-primary-50"
                    : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60"
                  }`}
              >
                <Icon className={`h-4 w-4 ${isSelected ? 'text-black' : isConnected ? 'text-primary-600' : 'text-gray-400'}`} />
                <span className="font-medium text-black">{platform.name}</span>
                {isSelected && <Check className="h-3 w-3 text-black" />}
                {!isConnected && <span className="text-[10px] ml-1 uppercase font-bold tracking-wider opacity-60">Offline</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule Section */}
      {selectedPlatforms.length > 0 && (
        <div className="card border-primary-100 bg-primary-50/30">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-black">
            <Calendar className="h-4 w-4 text-primary-600" />
            Schedule Distribution
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="input-field bg-white"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Time</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="input-field bg-white"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleSchedule}
                className="btn-primary flex-1 shadow-md"
              >
                <Clock className="h-4 w-4 mr-2" />
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {[
            { id: "draft", label: "Drafts", count: 0 },
            { id: "scheduled", label: "Scheduled", count: scheduledPosts.length },
            { id: "published", label: "History", count: history.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === tab.id
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              {tab.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
                }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content List */}
      <div className="space-y-4">
        {activeTab === "scheduled" && scheduledPosts.length > 0 &&
          scheduledPosts.map((item) => {
            const Icon = platformIconMap[item.platform] || Share2;
            return (
              <div key={item.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${platformColorMap[item.platform] || 'bg-gray-200'} text-black`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-black">{item.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Scheduled for {new Date(item.scheduledTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => cancelScheduledPost(item.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          })}

        {activeTab === "published" && history.length > 0 &&
          history.map((item) => {
            const Icon = platformIconMap[item.platform] || Share2;
            return (
              <div key={item.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${platformColorMap[item.platform] || 'bg-gray-200'} text-black`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-black">{item.contentTitle}</h3>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-500" />
                        Published {new Date(item.publishedAt).toLocaleDateString()}
                      </p>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 mt-2 font-medium"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Post
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Published
                  </div>
                </div>
              </div>
            );
          })}

        {(activeTab === "draft" || (activeTab === "scheduled" && scheduledPosts.length === 0) || (activeTab === "published" && history.length === 0)) && (
          <div className="card text-center py-16 bg-gray-50/50 border-dashed border-2 border-gray-200">
            <Share2 className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {activeTab === "draft" ? "No distribution ready" : "No activity found"}
            </h3>
            <p className="text-gray-500 max-w-xs mx-auto">
              {activeTab === "draft"
                ? "Process articles to create distribution content for your platforms."
                : "Your distribution activity will appear here once you start sharing content."}
            </p>
          </div>
        )}
      </div>

      {/* Connect Accounts */}
      <div className="card shadow-lg border-primary-50">
        <h2 className="font-bold text-lg mb-6 text-black flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-primary-600" />
          Connected Accounts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map((platform) => {
            const Icon = platformIconMap[platform.id] || Share2;
            const isConnected = platform.connected;

            return (
              <div
                key={platform.id}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${isConnected
                  ? "bg-white border-green-100 shadow-sm"
                  : "bg-gray-50 border-gray-100"
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${platformColorMap[platform.id] || 'bg-gray-200'} text-white shadow-sm`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-bold block text-black">{platform.name}</span>
                    <span className={`text-xs ${isConnected ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                      {isConnected ? (platform.username || 'Connected') : 'Not Connected'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleConnectionToggle(platform.id, isConnected)}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${isConnected
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-white text-primary-600 border border-primary-200 hover:bg-primary-50"
                    }`}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isConnected ? "Disconnect" : "Connect"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
