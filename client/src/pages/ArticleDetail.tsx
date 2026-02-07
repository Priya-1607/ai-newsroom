import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Play,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink,
  Download,
  Zap,
  ChevronDown,
  ChevronUp,
  Info,
  AlertTriangle,
  Check,
  X,
  Eye,
  BookOpen,
  Shield,
  Share2,
} from "lucide-react";
import ShareModal from "../components/ShareModal";
import {
  useArticleStore,
  useProcessingStore,
  useBrandVoiceStore,
} from "../store";
import { format } from "date-fns";
import toast from "react-hot-toast";
import socketService from "../services/socket";
import type {
  PlatformType,
  ReformattedContent,
  FactCheckResult,
} from "../types";

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentArticle, fetchArticle, processArticle, isLoading } =
    useArticleStore();
  const { currentJob, agentStatuses, setCurrentJob, clearProcessing } =
    useProcessingStore();
  const { brandVoices, fetchBrandVoices, currentBrandVoice } =
    useBrandVoiceStore();
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>([
    "linkedin",
    "tiktok",
    "newsletter",
    "seo",
  ]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [reformattedContent, setReformattedContent] = useState<
    ReformattedContent[]
  >([]);
  const [activeTab, setActiveTab] = useState<"original" | PlatformType>(
    "original",
  );
  const [processing, setProcessing] = useState(false);
  const [expandedFactSections, setExpandedFactSections] = useState<{
    [key: string]: boolean;
  }>({});
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [contentToShare, setContentToShare] = useState<{
    contentId?: string;
    articleId?: string;
    content: string;
    title: string;
    platform: string;
  } | null>(null);

  useEffect(() => {
    if (id) {
      fetchArticle(id);
    }
    fetchBrandVoices();
  }, [id, fetchArticle, fetchBrandVoices]);

  useEffect(() => {
    if (currentArticle?.brandVoice?._id) {
      setSelectedVoice(currentArticle.brandVoice._id);
    }
  }, [currentArticle]);

  useEffect(() => {
    if (currentArticle?.reformattedContent) {
      setReformattedContent(currentArticle.reformattedContent);
    }
  }, [currentArticle]);

  useEffect(() => {
    const handleProcessUpdate = (job: any) => {
      setCurrentJob(job);
    };

    const handleProcessCompleted = (data: any) => {
      setProcessing(false);
      toast.success("Processing completed!");
      if (id) {
        fetchArticle(id);
      }
    };

    const handleProcessFailed = (data: any) => {
      setProcessing(false);
      toast.error(data.error || "Processing failed");
    };

    socketService.onProcessUpdate(handleProcessUpdate);
    socketService.onProcessCompleted(handleProcessCompleted);
    socketService.onProcessFailed(handleProcessFailed);

    return () => {
      socketService.offProcessUpdate(handleProcessUpdate);
      socketService.offProcessCompleted(handleProcessCompleted);
      socketService.offProcessFailed(handleProcessFailed);
    };
  }, [id, fetchArticle]);

  const handleProcess = async () => {
    if (!id) return;

    setProcessing(true);
    clearProcessing();

    try {
      await processArticle(id, selectedPlatforms);
    } catch (error) {
      setProcessing(false);
      toast.error("Failed to start processing");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getAgentStatus = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "running":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const toggleFactSection = (section: string) => {
    setExpandedFactSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getVerificationBadge = (status: string, score: number) => {
    if (status === "verified") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3" />
          Verified
        </span>
      );
    } else if (status === "needs_review") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertCircle className="h-3 w-3" />
          Needs Review
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <X className="h-3 w-3" />
          Failed
        </span>
      );
    }
  };

  const getStatusBadge = (status: string, score?: number) => {
    const badges: Record<string, { icon: any; className: string; label: string }> = {
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
        icon: AlertTriangle,
        className: "bg-orange-100 text-orange-800",
        label: "Likely Fake",
      },
      "verified-fake": {
        icon: X,
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
        {score !== undefined && ` (${score}%)`}
      </span>
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-50 border-red-200 text-red-800";
      case "medium":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "low":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getFactTypeIcon = (type: string) => {
    switch (type) {
      case "name":
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      case "date":
        return <Info className="h-4 w-4 text-purple-500" />;
      case "number":
        return <AlertCircle className="h-4 w-4 text-green-500" />;
      case "location":
        return <ExternalLink className="h-4 w-4 text-orange-500" />;
      case "claim":
        return <CheckCircle className="h-4 w-4 text-indigo-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const platforms: { id: PlatformType; name: string; maxLength: number }[] = [
    { id: "linkedin", name: "LinkedIn", maxLength: 3000 },
    { id: "tiktok", name: "TikTok", maxLength: 2200 },
    { id: "twitter", name: "Twitter/X", maxLength: 280 },
    { id: "newsletter", name: "Newsletter", maxLength: 10000 },
    { id: "seo", name: "SEO Article", maxLength: 10000 },
    { id: "press-release", name: "Press Release", maxLength: 8000 },
    { id: "instagram", name: "Instagram", maxLength: 2200 },
  ];

  const togglePlatform = (platform: PlatformType) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform],
    );
  };

  if (isLoading && !currentArticle) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!currentArticle) {
    return (
      <div className="text-center py-16">
        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Article not found
        </h2>
        <Link
          to="/articles"
          className="text-primary-600 hover:text-primary-700"
        >
          Back to articles
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/articles" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentArticle.title}
          </h1>
          <p className="text-sm text-gray-500">
            Uploaded{" "}
            {format(new Date(currentArticle.createdAt), "MMM d, yyyy h:mm a")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Original Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Content Tabs */}
          <div className="card">
            <div className="border-b">
              <nav className="flex gap-4 px-4">
                <button
                  onClick={() => setActiveTab("original")}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === "original"
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                  Original Content
                </button>
                {reformattedContent.map((content) => (
                  <button
                    key={content._id}
                    onClick={() =>
                      setActiveTab(content.platform as PlatformType)
                    }
                    className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === content.platform
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    {platforms.find((p) => p.id === content.platform)?.name}
                  </button>
                ))}
              </nav>
            </div>
            <div className="p-4">
              {activeTab === "original" ? (
                <div className="prose max-w-none">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {/* Real/Fake badge for whole article */}
                      {currentArticle.fakeNewsDetection &&
                        (currentArticle.fakeNewsDetection.authenticityStatus ===
                          "likely-fake" ||
                          currentArticle.fakeNewsDetection.authenticityStatus ===
                          "verified-fake" ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertCircle className="h-3 w-3" />
                            Fake
                          </span>
                        ) : currentArticle.fakeNewsDetection
                          .authenticityStatus === "authentic" ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3" />
                            Real
                          </span>
                        ) : null)}
                    </div>
                    <button
                      onClick={() => {
                        setContentToShare({
                          articleId: currentArticle._id,
                          content: currentArticle.content,
                          title: currentArticle.title,
                          platform: "linkedin"
                        });
                        setShareModalOpen(true);
                      }}
                      className="btn-primary text-sm flex items-center gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      Share Article
                    </button>
                  </div>
                  {/* Fake reason for whole article */}
                  {currentArticle.fakeNewsDetection &&
                    (currentArticle.fakeNewsDetection.authenticityStatus ===
                      "likely-fake" ||
                      currentArticle.fakeNewsDetection.authenticityStatus ===
                      "verified-fake") && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-800 font-semibold mb-1">
                          Reason:
                        </p>
                        <p className="text-xs text-red-700">
                          {currentArticle.fakeNewsDetection.overallAssessment ||
                            (currentArticle.fakeNewsDetection.redFlags &&
                              currentArticle.fakeNewsDetection.redFlags.length > 0
                              ? currentArticle.fakeNewsDetection.redFlags[0]
                                .description
                              : "No reason provided")}
                        </p>
                      </div>
                    )}
                  <div className="whitespace-pre-wrap">
                    {currentArticle.content}
                  </div>
                </div>
              ) : (
                (() => {
                  const content = reformattedContent.find(
                    (c) => c.platform === activeTab,
                  );
                  if (!content) return null;
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{content.title}</h3>
                        <div className="flex gap-2">
                          {/* Real/Fake badge for reformatted content */}
                          {content.fakeNewsDetection &&
                            (content.fakeNewsDetection.authenticityStatus ===
                              "likely-fake" ||
                              content.fakeNewsDetection.authenticityStatus ===
                              "verified-fake" ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <AlertCircle className="h-3 w-3" />
                                Fake
                              </span>
                            ) : content.fakeNewsDetection.authenticityStatus ===
                              "authentic" ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3" />
                                Real
                              </span>
                            ) : null)}
                          <button
                            onClick={() => copyToClipboard(content.content)}
                            className="btn-secondary text-sm"
                          >
                            <Copy className="h-4 w-4" />
                            Copy
                          </button>
                          <button
                            onClick={() => {
                              setContentToShare({
                                contentId: content._id,
                                content: content.content,
                                title: content.title,
                                platform: content.platform
                              });
                              setShareModalOpen(true);
                            }}
                            className="btn-primary text-sm flex items-center gap-2"
                          >
                            <Share2 className="h-4 w-4" />
                            Share
                          </button>
                        </div>
                      </div>
                      <div className="prose max-w-none">
                        <div className="whitespace-pre-wrap">
                          {content.content}
                        </div>
                      </div>
                      {content.excerpt && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-600">
                            {content.excerpt}
                          </p>
                        </div>
                      )}

                      {/* Fake reason if article is fake */}
                      {content.fakeNewsDetection &&
                        (content.fakeNewsDetection.authenticityStatus ===
                          "likely-fake" ||
                          content.fakeNewsDetection.authenticityStatus ===
                          "verified-fake") && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-red-800 font-semibold mb-1">
                              Reason:
                            </p>
                            <p className="text-xs text-red-700">
                              {content.fakeNewsDetection.overallAssessment ||
                                (content.fakeNewsDetection.redFlags &&
                                  content.fakeNewsDetection.redFlags.length > 0
                                  ? content.fakeNewsDetection.redFlags[0]
                                    .description
                                  : "No reason provided")}
                            </p>
                          </div>
                        )}
                      {/* Fact Check Results */}
                      {content.factCheck && (
                        <div className="border-t pt-4 mt-4">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary-600" />
                            Fact Check Results
                          </h4>

                          {/* Verification Status Badge */}
                          <div className="mb-4">
                            {getVerificationBadge(
                              content.factCheck.verificationStatus,
                              content.factCheck.verificationScore,
                            )}
                            <span className="ml-2 text-sm text-gray-600">
                              Score: {content.factCheck.verificationScore}%
                            </span>
                          </div>

                          {/* Overall Summary */}
                          {content.factCheck.overallSummary && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                              <p className="text-sm text-gray-700">
                                {content.factCheck.overallSummary}
                              </p>
                            </div>
                          )}

                          {/* Extracted Facts */}
                          {content.factCheck.extractedFacts &&
                            content.factCheck.extractedFacts.length > 0 && (
                              <div className="mb-4">
                                <button
                                  onClick={() =>
                                    toggleFactSection("extractedFacts")
                                  }
                                  className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <span className="font-medium text-sm">
                                    Extracted Facts (
                                    {content.factCheck.extractedFacts.length})
                                  </span>
                                  {expandedFactSections["extractedFacts"] ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </button>
                                {expandedFactSections["extractedFacts"] && (
                                  <div className="mt-2 space-y-2">
                                    {content.factCheck.extractedFacts.map(
                                      (fact) => (
                                        <div
                                          key={fact.id}
                                          className="p-3 bg-white border rounded-lg"
                                        >
                                          <div className="flex items-center gap-2 mb-2">
                                            {getFactTypeIcon(fact.type)}
                                            <span className="font-medium text-sm capitalize">
                                              {fact.type}
                                            </span>
                                            {fact.isVerified ? (
                                              <CheckCircle className="h-4 w-4 text-green-500" />
                                            ) : (
                                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                                            )}
                                          </div>
                                          <p className="text-sm font-medium">
                                            {fact.value}
                                          </p>
                                          <p className="text-xs text-gray-500 mt-1">
                                            {fact.context}
                                          </p>
                                          {fact.sourceReference && (
                                            <p className="text-xs text-blue-600 mt-1">
                                              Source: {fact.sourceReference}
                                            </p>
                                          )}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                          {/* Claims */}
                          {content.factCheck.claims &&
                            content.factCheck.claims.length > 0 && (
                              <div className="mb-4">
                                <button
                                  onClick={() => toggleFactSection("claims")}
                                  className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <span className="font-medium text-sm">
                                    Claims ({content.factCheck.claims.length})
                                  </span>
                                  {expandedFactSections["claims"] ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </button>
                                {expandedFactSections["claims"] && (
                                  <div className="mt-2 space-y-2">
                                    {content.factCheck.claims.map((claim) => (
                                      <div
                                        key={claim.id}
                                        className="p-3 bg-white border rounded-lg"
                                      >
                                        <div className="flex items-center gap-2 mb-2">
                                          {getVerificationBadge(
                                            claim.verificationStatus,
                                            claim.isVerified ? 100 : 50,
                                          )}
                                        </div>
                                        <p className="text-sm font-medium">
                                          {claim.claim}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          {claim.context}
                                        </p>
                                        {claim.supportingEvidence && (
                                          <p className="text-xs text-green-600 mt-2">
                                            ✓ {claim.supportingEvidence}
                                          </p>
                                        )}
                                        {claim.contradictingEvidence && (
                                          <p className="text-xs text-red-600 mt-1">
                                            ✗ {claim.contradictingEvidence}
                                          </p>
                                        )}
                                        {claim.sourceReferences &&
                                          claim.sourceReferences.length > 0 && (
                                            <p className="text-xs text-blue-600 mt-2">
                                              Sources:{" "}
                                              {claim.sourceReferences.join(
                                                ", ",
                                              )}
                                            </p>
                                          )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                          {/* Discrepancies */}
                          {content.factCheck.discrepancies &&
                            content.factCheck.discrepancies.length > 0 && (
                              <div className="mb-4">
                                <button
                                  onClick={() =>
                                    toggleFactSection("discrepancies")
                                  }
                                  className="flex items-center justify-between w-full p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                  <span className="font-medium text-sm text-red-800">
                                    Discrepancies (
                                    {content.factCheck.discrepancies.length})
                                  </span>
                                  {expandedFactSections["discrepancies"] ? (
                                    <ChevronUp className="h-4 w-4 text-red-800" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-red-800" />
                                  )}
                                </button>
                                {expandedFactSections["discrepancies"] && (
                                  <div className="mt-2 space-y-2">
                                    {content.factCheck.discrepancies.map(
                                      (discrepancy) => (
                                        <div
                                          key={discrepancy.id}
                                          className={`p-3 border rounded-lg ${getSeverityColor(
                                            discrepancy.severity,
                                          )}`}
                                        >
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className="font-medium text-xs uppercase">
                                              {discrepancy.severity} severity
                                            </span>
                                            <span className="text-xs capitalize">
                                              ({discrepancy.type})
                                            </span>
                                          </div>
                                          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                                            <div>
                                              <span className="font-medium">
                                                Original:
                                              </span>
                                              <p>{discrepancy.original}</p>
                                            </div>
                                            <div>
                                              <span className="font-medium">
                                                Reformatted:
                                              </span>
                                              <p>{discrepancy.reformatted}</p>
                                            </div>
                                          </div>
                                          <p className="text-xs">
                                            {discrepancy.explanation}
                                          </p>
                                          {discrepancy.suggestion && (
                                            <p className="text-xs mt-1 font-medium">
                                              Suggestion:{" "}
                                              {discrepancy.suggestion}
                                            </p>
                                          )}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                          {/* Missing Facts */}
                          {content.factCheck.missingFacts &&
                            content.factCheck.missingFacts.length > 0 && (
                              <div className="mb-4">
                                <button
                                  onClick={() =>
                                    toggleFactSection("missingFacts")
                                  }
                                  className="flex items-center justify-between w-full p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                                >
                                  <span className="font-medium text-sm text-yellow-800">
                                    Missing Facts (
                                    {content.factCheck.missingFacts.length})
                                  </span>
                                  {expandedFactSections["missingFacts"] ? (
                                    <ChevronUp className="h-4 w-4 text-yellow-800" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-yellow-800" />
                                  )}
                                </button>
                                {expandedFactSections["missingFacts"] && (
                                  <div className="mt-2 space-y-2">
                                    {content.factCheck.missingFacts.map(
                                      (missing, idx) => (
                                        <div
                                          key={idx}
                                          className="p-3 bg-white border border-yellow-200 rounded-lg"
                                        >
                                          <div className="flex items-center gap-2 mb-1">
                                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                            <span className="font-medium text-sm capitalize">
                                              {missing.type}
                                            </span>
                                            <span
                                              className={`text-xs px-2 py-0.5 rounded ${missing.importance === "high"
                                                ? "bg-red-100 text-red-800"
                                                : missing.importance ===
                                                  "medium"
                                                  ? "bg-yellow-100 text-yellow-800"
                                                  : "bg-blue-100 text-blue-800"
                                                }`}
                                            >
                                              {missing.importance} importance
                                            </span>
                                          </div>
                                          <p className="text-sm">
                                            {missing.fact}
                                          </p>
                                          <p className="text-xs text-gray-500 mt-1">
                                            {missing.context}
                                          </p>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      )}

                      {/* SEO Metadata */}
                      {content.seo && (
                        <div className="border-t pt-4 mt-4">
                          <h4 className="font-medium mb-2">SEO Metadata</h4>
                          <dl className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <dt className="text-gray-500">Meta Title</dt>
                              <dd>{content.seo.metaTitle}</dd>
                            </div>
                            <div>
                              <dt className="text-gray-500">
                                Meta Description
                              </dt>
                              <dd>{content.seo.metaDescription}</dd>
                            </div>
                            <div>
                              <dt className="text-gray-500">Keywords</dt>
                              <dd>{content.seo.keywords.join(", ")}</dd>
                            </div>
                          </dl>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Processing Panel */}
        <div className="space-y-4">
          {/* Processing Status */}
          {(processing || currentJob) && (
            <div className="card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary-600" />
                Processing Status
              </h3>
              <div className="space-y-4">
                {/* Agent Status */}
                <div className="space-y-2">
                  {Object.entries(agentStatuses).map(([agent, status]) => (
                    <div
                      key={agent}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm capitalize">{agent}</span>
                      {getAgentStatus(status)}
                    </div>
                  ))}
                </div>
                {currentJob && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">
                      {currentJob.currentStep}
                    </p>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${currentJob.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {currentJob.progress}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Process Article */}
          {currentArticle.status !== "completed" && (
            <div className="card">
              <h3 className="font-semibold mb-4">Process Article</h3>
              <div className="space-y-4">
                {/* Brand Voice Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand Voice
                  </label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select a brand voice</option>
                    {brandVoices.map((voice) => (
                      <option key={voice._id} value={voice._id}>
                        {voice.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Platform Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Platforms
                  </label>
                  <div className="space-y-2">
                    {platforms.map((platform) => (
                      <label
                        key={platform.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPlatforms.includes(platform.id)}
                          onChange={() => togglePlatform(platform.id)}
                          className="rounded border-gray-300 text-primary-600"
                        />
                        <span className="text-sm">{platform.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleProcess}
                  disabled={processing || selectedPlatforms.length === 0}
                  className="btn-primary w-full"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Processing
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Article Info */}
          <div className="card">
            <h3 className="font-semibold mb-4">Article Info</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <span
                    className={`badge ${currentArticle.status === "completed"
                      ? "badge-success"
                      : currentArticle.status === "processing"
                        ? "badge-warning"
                        : currentArticle.status === "failed"
                          ? "badge-danger"
                          : "badge-info"
                      }`}
                  >
                    {currentArticle.status}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Words</dt>
                <dd>{currentArticle.metadata.wordCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Reading Time</dt>
                <dd>{currentArticle.metadata.readingTime} min</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Language</dt>
                <dd className="capitalize">
                  {currentArticle.metadata.language}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Source</dt>
                <dd className="capitalize">{currentArticle.sourceType}</dd>
              </div>
              {currentArticle.metadata.topics &&
                currentArticle.metadata.topics.length > 0 && (
                  <div>
                    <dt className="text-gray-500 mb-1">Topics</dt>
                    <dd className="flex flex-wrap gap-1">
                      {currentArticle.metadata.topics.map((topic) => (
                        <span
                          key={topic}
                          className="text-xs bg-gray-100 px-2 py-0.5 rounded"
                        >
                          {topic}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
            </dl>
          </div>

          {/* Fake News Detection Results */}
          {currentArticle.fakeNewsDetection && (
            <div className="card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary-600" />
                Fake News Analysis
              </h3>
              <div className="space-y-4">
                {/* Authenticity Status */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">Authenticity Status</p>
                  {getStatusBadge(
                    currentArticle.fakeNewsDetection.authenticityStatus as any,
                    currentArticle.fakeNewsDetection.authenticityScore
                  )}
                  <p className="text-sm text-gray-600 mt-2">
                    Score: {currentArticle.fakeNewsDetection.authenticityScore}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Confidence: {currentArticle.fakeNewsDetection.confidenceLevel}
                  </p>
                </div>

                {/* Overall Assessment */}
                {currentArticle.fakeNewsDetection.overallAssessment && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      {currentArticle.fakeNewsDetection.overallAssessment}
                    </p>
                  </div>
                )}

                {/* Summary Stats */}
                {currentArticle.fakeNewsDetection.summary && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-green-50 p-2 rounded">
                      <p className="text-green-800 font-medium">
                        {currentArticle.fakeNewsDetection.summary.verifiedClaims}
                      </p>
                      <p className="text-green-600">Verified</p>
                    </div>
                    <div className="bg-yellow-50 p-2 rounded">
                      <p className="text-yellow-800 font-medium">
                        {currentArticle.fakeNewsDetection.summary.disputedClaims}
                      </p>
                      <p className="text-yellow-600">Disputed</p>
                    </div>
                    <div className="bg-red-50 p-2 rounded">
                      <p className="text-red-800 font-medium">
                        {currentArticle.fakeNewsDetection.summary.falseClaims}
                      </p>
                      <p className="text-red-600">False</p>
                    </div>
                    <div className="bg-orange-50 p-2 rounded">
                      <p className="text-orange-800 font-medium">
                        {currentArticle.fakeNewsDetection.summary.redFlagsCount}
                      </p>
                      <p className="text-orange-600">Red Flags</p>
                    </div>
                  </div>
                )}

                {/* Headline Analysis */}
                {currentArticle.fakeNewsDetection.detailedAnalysis?.headlineAnalysis && (
                  <div>
                    <button
                      onClick={() => toggleFactSection("headlineAnalysis")}
                      className="flex items-center justify-between w-full p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm font-medium">Headline Analysis</span>
                      {expandedFactSections["headlineAnalysis"] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    {expandedFactSections["headlineAnalysis"] && (
                      <div className="mt-2 p-3 bg-white border rounded-lg space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Clickbait:</span>
                          <span className={currentArticle.fakeNewsDetection.detailedAnalysis.headlineAnalysis.isClickbait ? "text-red-600" : "text-green-600"}>
                            {currentArticle.fakeNewsDetection.detailedAnalysis.headlineAnalysis.isClickbait ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Emotional Language:</span>
                          <span className={currentArticle.fakeNewsDetection.detailedAnalysis.headlineAnalysis.emotionalLanguageUsed ? "text-orange-600" : "text-green-600"}>
                            {currentArticle.fakeNewsDetection.detailedAnalysis.headlineAnalysis.emotionalLanguageUsed ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Exaggeration:</span>
                          <span className="capitalize">{currentArticle.fakeNewsDetection.detailedAnalysis.headlineAnalysis.exaggerationLevel}</span>
                        </div>
                        {currentArticle.fakeNewsDetection.detailedAnalysis.headlineAnalysis.findings.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-gray-500 mb-1">Findings:</p>
                            <ul className="text-xs space-y-1">
                              {currentArticle.fakeNewsDetection.detailedAnalysis.headlineAnalysis.findings.map((finding, idx) => (
                                <li key={idx} className="text-gray-700">• {finding}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Content Analysis */}
                {currentArticle.fakeNewsDetection.detailedAnalysis?.contentAnalysis && (
                  <div>
                    <button
                      onClick={() => toggleFactSection("contentAnalysis")}
                      className="flex items-center justify-between w-full p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm font-medium">Content Analysis</span>
                      {expandedFactSections["contentAnalysis"] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    {expandedFactSections["contentAnalysis"] && (
                      <div className="mt-2 p-3 bg-white border rounded-lg space-y-3 text-xs">
                        {currentArticle.fakeNewsDetection.detailedAnalysis.contentAnalysis.logicalFallacies.length > 0 && (
                          <div>
                            <p className="font-medium text-red-600 mb-1">Logical Fallacies:</p>
                            <ul className="space-y-1">
                              {currentArticle.fakeNewsDetection.detailedAnalysis.contentAnalysis.logicalFallacies.map((item, idx) => (
                                <li key={idx} className="text-gray-700">• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {currentArticle.fakeNewsDetection.detailedAnalysis.contentAnalysis.unsupportedClaims.length > 0 && (
                          <div>
                            <p className="font-medium text-orange-600 mb-1">Unsupported Claims:</p>
                            <ul className="space-y-1">
                              {currentArticle.fakeNewsDetection.detailedAnalysis.contentAnalysis.unsupportedClaims.map((item, idx) => (
                                <li key={idx} className="text-gray-700">• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {currentArticle.fakeNewsDetection.detailedAnalysis.contentAnalysis.exaggeratedStatements.length > 0 && (
                          <div>
                            <p className="font-medium text-yellow-600 mb-1">Exaggerated Statements:</p>
                            <ul className="space-y-1">
                              {currentArticle.fakeNewsDetection.detailedAnalysis.contentAnalysis.exaggeratedStatements.map((item, idx) => (
                                <li key={idx} className="text-gray-700">• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {currentArticle.fakeNewsDetection.detailedAnalysis.contentAnalysis.contradictions.length > 0 && (
                          <div>
                            <p className="font-medium text-red-600 mb-1">Contradictions:</p>
                            <ul className="space-y-1">
                              {currentArticle.fakeNewsDetection.detailedAnalysis.contentAnalysis.contradictions.map((item, idx) => (
                                <li key={idx} className="text-gray-700">• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Evidence Assessment */}
                {currentArticle.fakeNewsDetection.detailedAnalysis?.evidenceAssessment && (
                  <div>
                    <button
                      onClick={() => toggleFactSection("evidenceAssessment")}
                      className="flex items-center justify-between w-full p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm font-medium">Evidence Assessment</span>
                      {expandedFactSections["evidenceAssessment"] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    {expandedFactSections["evidenceAssessment"] && (
                      <div className="mt-2 p-3 bg-white border rounded-lg space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">External References:</span>
                          <span className={currentArticle.fakeNewsDetection.detailedAnalysis.evidenceAssessment.hasExternalReferences ? "text-green-600" : "text-red-600"}>
                            {currentArticle.fakeNewsDetection.detailedAnalysis.evidenceAssessment.hasExternalReferences ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Reference Quality:</span>
                          <span className="capitalize">{currentArticle.fakeNewsDetection.detailedAnalysis.evidenceAssessment.referenceQuality}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                          <div className="bg-green-50 p-2 rounded">
                            <p className="text-green-800 font-medium">
                              {currentArticle.fakeNewsDetection.detailedAnalysis.evidenceAssessment.verifiedStatistics}
                            </p>
                            <p className="text-green-600">Verified Stats</p>
                          </div>
                          <div className="bg-red-50 p-2 rounded">
                            <p className="text-red-800 font-medium">
                              {currentArticle.fakeNewsDetection.detailedAnalysis.evidenceAssessment.unverifiedStatistics}
                            </p>
                            <p className="text-red-600">Unverified Stats</p>
                          </div>
                          <div className="bg-green-50 p-2 rounded">
                            <p className="text-green-800 font-medium">
                              {currentArticle.fakeNewsDetection.detailedAnalysis.evidenceAssessment.verifiedQuotes}
                            </p>
                            <p className="text-green-600">Verified Quotes</p>
                          </div>
                          <div className="bg-red-50 p-2 rounded">
                            <p className="text-red-800 font-medium">
                              {currentArticle.fakeNewsDetection.detailedAnalysis.evidenceAssessment.unverifiedQuotes}
                            </p>
                            <p className="text-red-600">Unverified Quotes</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Source Credibility */}
                {currentArticle.fakeNewsDetection.sourceCredibility && (
                  <div>
                    <button
                      onClick={() => toggleFactSection("sourceCredibility")}
                      className="flex items-center justify-between w-full p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm font-medium">Source Credibility</span>
                      {expandedFactSections["sourceCredibility"] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    {expandedFactSections["sourceCredibility"] && (
                      <div className="mt-2 p-3 bg-white border rounded-lg space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Source:</span>
                          <p className="font-medium">{currentArticle.fakeNewsDetection.sourceCredibility.name}</p>
                          {currentArticle.fakeNewsDetection.sourceCredibility.url && (
                            <a href={currentArticle.fakeNewsDetection.sourceCredibility.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                              {currentArticle.fakeNewsDetection.sourceCredibility.url}
                            </a>
                          )}
                        </div>
                        <div>
                          <span className="text-gray-600">Credibility Score:</span>
                          <p className="font-medium">{currentArticle.fakeNewsDetection.sourceCredibility.credibilityScore}%</p>
                        </div>
                        {currentArticle.fakeNewsDetection.sourceCredibility.domainAge && (
                          <div>
                            <span className="text-gray-600">Domain Age:</span>
                            <p className="font-medium">{currentArticle.fakeNewsDetection.sourceCredibility.domainAge}</p>
                          </div>
                        )}
                        {currentArticle.fakeNewsDetection.sourceCredibility.ownershipInfo && (
                          <div>
                            <span className="text-gray-600">Ownership:</span>
                            <p className="font-medium">{currentArticle.fakeNewsDetection.sourceCredibility.ownershipInfo}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                          <div className="bg-green-50 p-2 rounded">
                            <p className="text-green-800 font-medium">
                              {currentArticle.fakeNewsDetection.sourceCredibility.factCheckRecord.verifiedClaims}
                            </p>
                            <p className="text-green-600">Verified</p>
                          </div>
                          <div className="bg-red-50 p-2 rounded">
                            <p className="text-red-800 font-medium">
                              {currentArticle.fakeNewsDetection.sourceCredibility.factCheckRecord.falseClaims}
                            </p>
                            <p className="text-red-600">False</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bias Indicators */}
                {currentArticle.fakeNewsDetection.biasIndicators && (
                  <div>
                    <button
                      onClick={() => toggleFactSection("biasIndicators")}
                      className="flex items-center justify-between w-full p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm font-medium">Bias Indicators</span>
                      {expandedFactSections["biasIndicators"] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    {expandedFactSections["biasIndicators"] && (
                      <div className="mt-2 p-3 bg-white border rounded-lg space-y-2 text-sm">
                        {currentArticle.fakeNewsDetection.biasIndicators.politicalLean && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Political Lean:</span>
                            <span className="capitalize font-medium">{currentArticle.fakeNewsDetection.biasIndicators.politicalLean}</span>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-600">Emotional Language:</span>
                            <span>{currentArticle.fakeNewsDetection.biasIndicators.emotionalLanguageScore}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${currentArticle.fakeNewsDetection.biasIndicators.emotionalLanguageScore}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-600">One-Sided Reporting:</span>
                            <span>{currentArticle.fakeNewsDetection.biasIndicators.oneSidedReportingScore}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${currentArticle.fakeNewsDetection.biasIndicators.oneSidedReportingScore}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-600">Cherry-Picking:</span>
                            <span>{currentArticle.fakeNewsDetection.biasIndicators.cherryPickingScore}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full" style={{ width: `${currentArticle.fakeNewsDetection.biasIndicators.cherryPickingScore}%` }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Recommendations */}
                {currentArticle.fakeNewsDetection.recommendations && currentArticle.fakeNewsDetection.recommendations.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleFactSection("recommendations")}
                      className="flex items-center justify-between w-full p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <span className="text-sm font-medium text-blue-800">Recommendations</span>
                      {expandedFactSections["recommendations"] ? (
                        <ChevronUp className="h-4 w-4 text-blue-800" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-blue-800" />
                      )}
                    </button>
                    {expandedFactSections["recommendations"] && (
                      <div className="mt-2 p-3 bg-white border border-blue-200 rounded-lg">
                        <ul className="text-xs space-y-2">
                          {currentArticle.fakeNewsDetection.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Info className="h-3 w-3 text-blue-600 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Share Modal */}
      {contentToShare && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          contentId={contentToShare.contentId}
          articleId={contentToShare.articleId}
          content={contentToShare.content}
          platform={contentToShare.platform}
        />
      )}
    </div>
  );
}
