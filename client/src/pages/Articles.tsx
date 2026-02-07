import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Upload,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Wand2,
  FileDigit,
  Globe,
  Link as LinkIcon,
} from "lucide-react";
import { useArticleStore } from "../store";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function Articles() {
  const { articles, pagination, isLoading, fetchArticles, createArticle } =
    useArticleStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchArticles({
      page: 1,
      limit: 10,
      status: statusFilter !== "all" ? statusFilter : undefined,
      search: searchTerm || undefined,
    });
  }, [fetchArticles, statusFilter, searchTerm]);
  useEffect(() => {
    fetchArticles();
  }, []);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = [".txt", ".pdf", ".docx"];
      const fileExtension =
        "." + selectedFile.name.split(".").pop()?.toLowerCase();

      if (!validTypes.includes(fileExtension)) {
        toast.error(
          "Invalid file type. Please upload .txt, .pdf, or .docx files.",
        );
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB.");
        return;
      }

      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!content.trim() && !file) {
      toast.error("Please provide content or upload a file");
      return;
    }

    setUploading(true);
    try {
      await createArticle({
        title,
        content: content || undefined,
        file: file || undefined,
      });
      toast.success("Article uploaded successfully!");
      setShowUploadModal(false);
      setTitle("");
      setContent("");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "Failed to upload article",
      );
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "badge-success";
      case "processing":
        return "badge-warning";
      case "failed":
        return "badge-danger";
      default:
        return "badge-info";
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "generated":
        return <Wand2 className="h-5 w-5 text-primary-600" />;
      case "url":
        return <Globe className="h-5 w-5 text-blue-600" />;
      case "pdf":
      case "docx":
        return <FileDigit className="h-5 w-5 text-orange-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
          <p className="text-gray-600">Manage and process your news articles</p>
        </div>
        <div className="flex gap-3">
          <Link to="/generate" className="btn-secondary">
            <Wand2 className="h-4 w-4" />
            Generate
          </Link>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Upload
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-40"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Articles List */}
      {isLoading ? (
        <div className="card">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      ) : articles.length > 0 ? (
        <div className="space-y-3">
          {articles.map((article) => (
            <Link
              key={article._id}
              to={`/articles/${article._id}`}
              className="card-hover block"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getSourceIcon(article.sourceType)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {format(
                        new Date(article.createdAt),
                        "MMM d, yyyy h:mm a",
                      )}{" "}
                      • {article.metadata.wordCount || 0} words
                    </p>
                    {article.metadata.platforms &&
                      article.metadata.platforms.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {article.metadata.platforms
                            .slice(0, 3)
                            .map((platform) => (
                              <span
                                key={platform}
                                className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded"
                              >
                                {platform}
                              </span>
                            ))}
                          {article.metadata.platforms.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{article.metadata.platforms.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`badge ${getStatusBadgeClass(article.status)} flex items-center gap-1`}
                  >
                    {getStatusIcon(article.status)}
                    {article.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No articles found
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Get started by uploading your first article"}
          </p>
          {!searchTerm && statusFilter === "all" && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-primary"
            >
              <Upload className="h-4 w-4" />
              Upload Article
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {articles.length} of {pagination.total} articles
          </p>
          <div className="flex gap-2">
            <button
              disabled={pagination.page === 1}
              onClick={() => fetchArticles({ page: pagination.page - 1 })}
              className="btn-secondary disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={pagination.page === pagination.pages}
              onClick={() => fetchArticles({ page: pagination.page + 1 })}
              className="btn-secondary disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Upload Article</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                  placeholder="Enter article title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Or Upload File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.pdf,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm text-gray-600">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      Click to upload file
                    </button>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    .txt, .pdf, .docx (max 10MB)
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Or Paste Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="input-field min-h-[150px]"
                  placeholder="Paste your article content here..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn-primary flex-1"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    "Upload & Process"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
