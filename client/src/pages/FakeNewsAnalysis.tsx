import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Shield,
    AlertTriangle,
    CheckCircle,
    XCircle,
    TrendingUp,
    BarChart3,
    Filter,
    Search,
    Eye,
    AlertCircle,
} from "lucide-react";
import { useArticleStore } from "../store";
import { format } from "date-fns";
import type { Article, AuthenticityStatus } from "../types";

export default function FakeNewsAnalysis() {
    const { articles, fetchArticles, isLoading } = useArticleStore();
    const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
    const [statusFilter, setStatusFilter] = useState<AuthenticityStatus | "all">("all");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchArticles();
    }, [fetchArticles]);

    useEffect(() => {
        let filtered = articles.filter(
            (article) => article.fakeNewsDetection !== undefined
        );

        if (statusFilter !== "all") {
            filtered = filtered.filter(
                (article) =>
                    article.fakeNewsDetection?.authenticityStatus === statusFilter
            );
        }

        if (searchQuery) {
            filtered = filtered.filter(
                (article) =>
                    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    article.content.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredArticles(filtered);
    }, [articles, statusFilter, searchQuery]);

    const getStatusStats = () => {
        const stats = {
            authentic: 0,
            mixed: 0,
            suspicious: 0,
            "likely-fake": 0,
            "verified-fake": 0,
            total: 0,
        };

        articles.forEach((article) => {
            if (article.fakeNewsDetection) {
                stats.total++;
                const status = article.fakeNewsDetection.authenticityStatus;
                if (status in stats) {
                    stats[status as keyof typeof stats]++;
                }
            }
        });

        return stats;
    };

    const getRedFlagStats = () => {
        const flagTypes: Record<string, number> = {};
        let totalFlags = 0;

        articles.forEach((article) => {
            if (article.fakeNewsDetection?.redFlags) {
                article.fakeNewsDetection.redFlags.forEach((flag) => {
                    flagTypes[flag.type] = (flagTypes[flag.type] || 0) + 1;
                    totalFlags++;
                });
            }
        });

        return { flagTypes, totalFlags };
    };

    const getAverageScore = () => {
        const articlesWithScores = articles.filter(
            (a) => a.fakeNewsDetection?.authenticityScore !== undefined
        );
        if (articlesWithScores.length === 0) return 0;

        const sum = articlesWithScores.reduce(
            (acc, a) => acc + (a.fakeNewsDetection?.authenticityScore || 0),
            0
        );
        return Math.round(sum / articlesWithScores.length);
    };

    const getStatusBadge = (status: AuthenticityStatus) => {
        const badges = {
            authentic: {
                icon: CheckCircle,
                className: "bg-green-100 text-green-800",
                label: "Authentic",
            },
            mixed: {
                icon: AlertCircle,
                className: "bg-blue-100 text-blue-800",
                label: "Mixed",
            },
            suspicious: {
                icon: AlertTriangle,
                className: "bg-yellow-100 text-yellow-800",
                label: "Suspicious",
            },
            "likely-fake": {
                icon: XCircle,
                className: "bg-orange-100 text-orange-800",
                label: "Likely Fake",
            },
            "verified-fake": {
                icon: XCircle,
                className: "bg-red-100 text-red-800",
                label: "Verified Fake",
            },
        };

        const badge = badges[status] || badges.suspicious;
        const Icon = badge.icon;

        return (
            <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}
            >
                <Icon className="h-3 w-3" />
                {badge.label}
            </span>
        );
    };

    const stats = getStatusStats();
    const { flagTypes, totalFlags } = getRedFlagStats();
    const avgScore = getAverageScore();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="h-6 w-6 text-primary-600" />
                        Fake News Analysis
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Comprehensive authenticity analysis across all articles
                    </p>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Analyzed</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                        <div className="p-3 bg-primary-100 rounded-lg">
                            <BarChart3 className="h-6 w-6 text-primary-600" />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Authentic</p>
                            <p className="text-2xl font-bold text-green-600">
                                {stats.authentic}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Suspicious/Fake</p>
                            <p className="text-2xl font-bold text-red-600">
                                {stats.suspicious + stats["likely-fake"] + stats["verified-fake"]}
                            </p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-lg">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Avg. Score</p>
                            <p className="text-2xl font-bold text-gray-900">{avgScore}%</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Distribution */}
            <div className="card">
                <h3 className="font-semibold mb-4">Authenticity Status Distribution</h3>
                <div className="space-y-3">
                    {Object.entries(stats)
                        .filter(([key]) => key !== "total")
                        .map(([status, count]) => {
                            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                            return (
                                <div key={status}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm capitalize">
                                            {status.replace("-", " ")}
                                        </span>
                                        <span className="text-sm font-medium">
                                            {count} ({Math.round(percentage)}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${status === "authentic"
                                                    ? "bg-green-500"
                                                    : status === "mixed"
                                                        ? "bg-blue-500"
                                                        : status === "suspicious"
                                                            ? "bg-yellow-500"
                                                            : "bg-red-500"
                                                }`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>

            {/* Red Flags Summary */}
            <div className="card">
                <h3 className="font-semibold mb-4">Red Flags Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{totalFlags}</p>
                        <p className="text-xs text-gray-500 mt-1">Total Flags</p>
                    </div>
                    {Object.entries(flagTypes)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 3)
                        .map(([type, count]) => (
                            <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                                <p className="text-2xl font-bold text-gray-900">{count}</p>
                                <p className="text-xs text-gray-500 mt-1 capitalize">
                                    {type.replace("-", " ")}
                                </p>
                            </div>
                        ))}
                </div>
            </div>

            {/* Filters and Search */}
            <div className="card">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-field pl-10"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as AuthenticityStatus | "all")}
                            className="input-field"
                        >
                            <option value="all">All Status</option>
                            <option value="authentic">Authentic</option>
                            <option value="mixed">Mixed</option>
                            <option value="suspicious">Suspicious</option>
                            <option value="likely-fake">Likely Fake</option>
                            <option value="verified-fake">Verified Fake</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Articles List */}
            <div className="card">
                <h3 className="font-semibold mb-4">
                    Analyzed Articles ({filteredArticles.length})
                </h3>
                {isLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : filteredArticles.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No articles found matching your criteria
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredArticles.map((article) => (
                            <Link
                                key={article._id}
                                to={`/articles/${article._id}`}
                                className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-medium text-gray-900">
                                                {article.title}
                                            </h4>
                                            {article.fakeNewsDetection && (
                                                getStatusBadge(
                                                    article.fakeNewsDetection.authenticityStatus as AuthenticityStatus
                                                )
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            {article.fakeNewsDetection?.overallAssessment ||
                                                article.content.substring(0, 150) + "..."}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                            <span>
                                                Score:{" "}
                                                {article.fakeNewsDetection?.authenticityScore || 0}%
                                            </span>
                                            <span>
                                                Red Flags:{" "}
                                                {article.fakeNewsDetection?.redFlags?.length || 0}
                                            </span>
                                            <span>
                                                {format(
                                                    new Date(article.createdAt),
                                                    "MMM d, yyyy"
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <Eye className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
