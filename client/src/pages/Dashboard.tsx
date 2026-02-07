import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  Activity,
  Zap,
  Shield,
} from "lucide-react";
import { useArticleStore, useAuthStore } from "../store";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuthStore();
  const { articles, pagination, fetchArticles, isLoading } = useArticleStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetchArticles({ limit: 5 });
    setMounted(true);
  }, [fetchArticles]);

  const stats = [
    {
      name: "Total Articles",
      value: pagination.total,
      icon: FileText,
      color: "bg-blue-500",
    },
    {
      name: "Completed",
      value: articles.filter((a) => a.status === "completed").length,
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      name: "Processing",
      value: articles.filter((a) => a.status === "processing").length,
      icon: Clock,
      color: "bg-yellow-500",
    },
    {
      name: "This Week",
      value: Math.floor(Math.random() * 10) + 2, // Mock data
      icon: TrendingUp,
      color: "bg-purple-500",
    },
  ];

  const features = [
    {
      icon: Zap,
      title: "AI-Powered Reformatting",
      description:
        "Automatically transform content for LinkedIn, TikTok, Newsletter, and more.",
    },
    {
      icon: Shield,
      title: "Fact Verification",
      description:
        "Cross-reference all reformatted content against the original source.",
    },
    {
      icon: Activity,
      title: "Real-time Processing",
      description: "Watch agents work in real-time with live progress updates.",
    },
  ];

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-black">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.name?.split(" ")[0]}! 👋
        </h1>
        <p className="text-primary-100 text-lg">
          Transform your news content for every platform with AI-powered agents.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            to="/articles"
            className="btn-primary bg-white text-primary-600 hover:bg-gray-100"
          >
            <Plus className="h-4 w-4" />
            Upload Article
          </Link>
          <Link
            to="/brand-voices"
            className="btn-secondary bg-white/20 text-black border-white/30 hover:bg-white/30"
          >
            Configure Brand Voice
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card-hover">
            <div className="flex items-center">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-black" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Features section */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="card">
              <div className="p-3 bg-primary-100 rounded-xl w-fit mb-4">
                <feature.icon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent articles */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Articles</h2>
          <Link
            to="/articles"
            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
          >
            View all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="card">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        ) : articles.length > 0 ? (
          <div className="space-y-3">
            {articles.map((article) => (
              <Link
                key={article._id}
                to={`/articles/${article._id}`}
                className="card-hover flex items-center justify-between group"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {format(new Date(article.createdAt), "MMM d, yyyy")} •{" "}
                      {article.metadata.wordCount} words
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`badge ${
                      article.status === "completed"
                        ? "badge-success"
                        : article.status === "processing"
                          ? "badge-warning"
                          : article.status === "failed"
                            ? "badge-danger"
                            : "badge-info"
                    }`}
                  >
                    {article.status}
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No articles yet
            </h3>
            <p className="text-gray-500 mb-4">
              Get started by uploading your first article
            </p>
            <Link to="/articles" className="btn-primary inline-flex">
              <Plus className="h-4 w-4 mr-2" />
              Upload Article
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
