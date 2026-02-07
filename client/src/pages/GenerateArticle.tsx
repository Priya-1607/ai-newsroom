import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Wand2,
    Sparkles,
    Type,
    Info,
    Volume2,
    Loader2,
    CheckCircle,
    ArrowRight,
    RefreshCw,
    FileText
} from "lucide-react";
import { useArticleStore, useBrandVoiceStore } from "../store";
import toast from "react-hot-toast";

export default function GenerateArticle() {
    const navigate = useNavigate();
    const { generateArticle, isLoading } = useArticleStore();
    const { brandVoices, fetchBrandVoices } = useBrandVoiceStore();

    const [title, setTitle] = useState("");
    const [info, setInfo] = useState("");
    const [selectedBrandVoice, setSelectedBrandVoice] = useState("");
    const [generatedArticle, setGeneratedArticle] = useState<any>(null);

    useEffect(() => {
        fetchBrandVoices();
    }, [fetchBrandVoices]);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error("Please enter a title for your article");
            return;
        }

        if (!info.trim()) {
            toast.error("Please provide some information or notes to generate the article from");
            return;
        }

        try {
            await generateArticle({
                title,
                info,
                brandVoiceId: selectedBrandVoice || undefined,
            });

            // The store updates with the new article. We'll find the latest one.
            toast.success("Article generated successfully!");
            // For now, we'll navigate to the articles list. 
            // In a real scenario, we might want to stay on a preview page.
            navigate("/articles");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to generate article");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Wand2 className="h-8 w-8 text-primary-600" />
                        AI Article Generator
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Transform your notes, facts, and ideas into professional news articles.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card">
                        <form onSubmit={handleGenerate} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <Type className="h-4 w-4 text-primary-500" />
                                    Article Title
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="input-field text-lg"
                                    placeholder="e.g., The Future of Sustainable Urban Transport"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <Info className="h-4 w-4 text-primary-500" />
                                    Source Information / Notes
                                </label>
                                <textarea
                                    value={info}
                                    onChange={(e) => setInfo(e.target.value)}
                                    className="input-field min-h-[300px] font-mono text-sm"
                                    placeholder="Paste your research, bullet points, or raw data here..."
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    The more detail you provide, the better the generated article will be.
                                </p>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn-primary w-full py-4 text-lg shadow-lg shadow-primary-200"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                            Weaving your story...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-5 w-5 mr-2" />
                                            Generate News Article
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Settings Sidebar */}
                <div className="space-y-6">
                    <div className="card">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Volume2 className="h-4 w-4 text-primary-600" />
                            Brand Voice
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Select the tone and style for your article.
                        </p>

                        <div className="space-y-2">
                            <div
                                onClick={() => setSelectedBrandVoice("")}
                                className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedBrandVoice === ""
                                        ? "border-primary-500 bg-primary-50"
                                        : "border-gray-100 hover:border-gray-200"
                                    }`}
                            >
                                <div className="font-semibold text-sm">Default Professional</div>
                                <div className="text-xs text-gray-500">Standard journalistic tone</div>
                            </div>

                            {brandVoices.map((voice) => (
                                <div
                                    key={voice._id}
                                    onClick={() => setSelectedBrandVoice(voice._id)}
                                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedBrandVoice === voice._id
                                            ? "border-primary-500 bg-primary-50"
                                            : "border-gray-100 hover:border-gray-200"
                                        }`}
                                >
                                    <div className="font-semibold text-sm">{voice.name}</div>
                                    <div className="text-xs text-gray-500">{voice.description || "Custom style"}</div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Tips</h4>
                            <ul className="text-xs text-gray-500 space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5" />
                                    Include quotes for more authenticity.
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5" />
                                    List key statistics clearly in your notes.
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5" />
                                    Mention specific dates and locations.
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-xl shadow-primary-200">
                        <h3 className="font-bold mb-2 flex items-center gap-2">
                            <ArrowRight className="h-4 w-4" />
                            What's Next?
                        </h3>
                        <p className="text-sm text-primary-100 mb-4">
                            After generation, your article will be automatically analyzed for authenticity and prepared for multi-platform distribution.
                        </p>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-xs">
                                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">1</div>
                                Fact-Check & Analysis
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">2</div>
                                LinkedIn/Twitter/Newsletter formatting
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">3</div>
                                One-click Distribution
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
