import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Volume2, Check, X, Settings } from "lucide-react";
import { useBrandVoiceStore } from "../store";
import toast from "react-hot-toast";

export default function BrandVoices() {
  const {
    brandVoices,
    isLoading,
    fetchBrandVoices,
    createBrandVoice,
    updateBrandVoice,
    deleteBrandVoice,
  } = useBrandVoiceStore();
  const [showModal, setShowModal] = useState(false);
  const [editingVoice, setEditingVoice] = useState<
    (typeof brandVoices)[0] | null
  >(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    systemPrompt: "",
    tone: {
      formality: "semi-formal" as "formal" | "semi-formal" | "casual",
      sentiment: "neutral" as "positive" | "neutral" | "negative",
      energy: "medium" as "high" | "medium" | "low",
    },
    style: {
      sentenceLength: "medium" as "short" | "medium" | "long",
      vocabulary: "moderate" as "simple" | "moderate" | "complex",
      useEmojis: false,
      useHashtags: true,
    },
    keywords: "",
    phrasesToUse: "",
    phrasesToAvoid: "",
  });

  useEffect(() => {
    fetchBrandVoices();
  }, [fetchBrandVoices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name: formData.name,
      description: formData.description,
      systemPrompt: formData.systemPrompt,
      tone: formData.tone,
      style: formData.style,
      keywords: formData.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      phrasesToUse: formData.phrasesToUse
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
      phrasesToAvoid: formData.phrasesToAvoid
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
    };

    try {
      if (editingVoice) {
        await updateBrandVoice(editingVoice._id, data);
        toast.success("Brand voice updated!");
      } else {
        await createBrandVoice(data);
        toast.success("Brand voice created!");
      }
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "Failed to save brand voice",
      );
    }
  };

  const handleEdit = (voice: (typeof brandVoices)[0]) => {
    setEditingVoice(voice);
    setFormData({
      name: voice.name,
      description: voice.description || "",
      systemPrompt: voice.systemPrompt,
      tone: voice.tone,
      style: voice.style,
      keywords: voice.keywords.join(", "),
      phrasesToUse: voice.phrasesToUse.join(", "),
      phrasesToAvoid: voice.phrasesToAvoid.join(", "),
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this brand voice?")) {
      try {
        await deleteBrandVoice(id);
        toast.success("Brand voice deleted");
      } catch (error: any) {
        toast.error(error.response?.data?.error?.message || "Failed to delete");
      }
    }
  };

  const resetForm = () => {
    setEditingVoice(null);
    setFormData({
      name: "",
      description: "",
      systemPrompt: "",
      tone: {
        formality: "semi-formal",
        sentiment: "neutral",
        energy: "medium",
      },
      style: {
        sentenceLength: "medium",
        vocabulary: "moderate",
        useEmojis: false,
        useHashtags: true,
      },
      keywords: "",
      phrasesToUse: "",
      phrasesToAvoid: "",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brand Voices</h1>
          <p className="text-gray-600">
            Configure your brand voice for consistent content generation
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          Add Brand Voice
        </button>
      </div>

      {/* Brand Voices Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : brandVoices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brandVoices.map((voice) => (
            <div key={voice._id} className="card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Volume2 className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{voice.name}</h3>
                    {voice.isDefault && (
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(voice)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(voice._id)}
                    className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {voice.description && (
                <p className="text-sm text-gray-600 mb-4">
                  {voice.description}
                </p>
              )}

              {/* Tone indicators */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="badge badge-info">{voice.tone.formality}</span>
                <span className="badge badge-info">{voice.tone.sentiment}</span>
                <span className="badge badge-info">
                  {voice.tone.energy} energy
                </span>
              </div>

              {/* Style indicators */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {voice.style.vocabulary} vocabulary
                </span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {voice.style.useEmojis ? "Emojis" : "No emojis"}
                </span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {voice.style.useHashtags ? "Hashtags" : "No hashtags"}
                </span>
              </div>

              {/* Keywords preview */}
              {voice.keywords.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Keywords</p>
                  <div className="flex flex-wrap gap-1">
                    {voice.keywords.slice(0, 5).map((keyword) => (
                      <span
                        key={keyword}
                        className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                    {voice.keywords.length > 5 && (
                      <span className="text-xs text-gray-500">
                        +{voice.keywords.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <Volume2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No brand voices yet
          </h3>
          <p className="text-gray-500 mb-6">
            Create your first brand voice to start generating consistent content
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Add Brand Voice
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">
                {editingVoice ? "Edit Brand Voice" : "Create Brand Voice"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="input-field"
                    placeholder="e.g., Professional News"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="input-field"
                    placeholder="Brief description"
                  />
                </div>
              </div>

              {/* Tone Settings */}
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Tone Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Formality
                    </label>
                    <select
                      value={formData.tone.formality}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tone: {
                            ...formData.tone,
                            formality: e.target.value as any,
                          },
                        })
                      }
                      className="input-field"
                    >
                      <option value="formal">Formal</option>
                      <option value="semi-formal">Semi-formal</option>
                      <option value="casual">Casual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Sentiment
                    </label>
                    <select
                      value={formData.tone.sentiment}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tone: {
                            ...formData.tone,
                            sentiment: e.target.value as any,
                          },
                        })
                      }
                      className="input-field"
                    >
                      <option value="positive">Positive</option>
                      <option value="neutral">Neutral</option>
                      <option value="negative">Negative</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Energy
                    </label>
                    <select
                      value={formData.tone.energy}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tone: {
                            ...formData.tone,
                            energy: e.target.value as any,
                          },
                        })
                      }
                      className="input-field"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Style Settings */}
              <div>
                <h3 className="font-medium mb-3">Style Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Sentence Length
                    </label>
                    <select
                      value={formData.style.sentenceLength}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          style: {
                            ...formData.style,
                            sentenceLength: e.target.value as any,
                          },
                        })
                      }
                      className="input-field"
                    >
                      <option value="short">Short</option>
                      <option value="medium">Medium</option>
                      <option value="long">Long</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Vocabulary
                    </label>
                    <select
                      value={formData.style.vocabulary}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          style: {
                            ...formData.style,
                            vocabulary: e.target.value as any,
                          },
                        })
                      }
                      className="input-field"
                    >
                      <option value="simple">Simple</option>
                      <option value="moderate">Moderate</option>
                      <option value="complex">Complex</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.style.useEmojis}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            style: {
                              ...formData.style,
                              useEmojis: e.target.checked,
                            },
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Use Emojis</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.style.useHashtags}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            style: {
                              ...formData.style,
                              useHashtags: e.target.checked,
                            },
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Use Hashtags</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Keywords and Phrases */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keywords (comma separated)
                  </label>
                  <textarea
                    value={formData.keywords}
                    onChange={(e) =>
                      setFormData({ ...formData, keywords: e.target.value })
                    }
                    className="input-field min-h-[80px]"
                    placeholder="news, updates, analysis"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phrases to Use
                  </label>
                  <textarea
                    value={formData.phrasesToUse}
                    onChange={(e) =>
                      setFormData({ ...formData, phrasesToUse: e.target.value })
                    }
                    className="input-field min-h-[80px]"
                    placeholder="According to experts, In other news"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phrases to Avoid
                  </label>
                  <textarea
                    value={formData.phrasesToAvoid}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phrasesToAvoid: e.target.value,
                      })
                    }
                    className="input-field min-h-[80px]"
                    placeholder="Breaking news, clickbait"
                  />
                </div>
              </div>

              {/* System Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  System Prompt
                </label>
                <textarea
                  value={formData.systemPrompt}
                  onChange={(e) =>
                    setFormData({ ...formData, systemPrompt: e.target.value })
                  }
                  className="input-field min-h-[150px]"
                  placeholder="You are a professional news writer for a major news outlet..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This prompt will be used by AI agents when generating content
                  in this brand voice
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingVoice ? "Update" : "Create"} Brand Voice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
