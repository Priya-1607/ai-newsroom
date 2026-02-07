import { useState, useEffect } from 'react';
import {
    X,
    Share2,
    Calendar,
    Clock,
    Check,
    AlertCircle,
    Loader2,
    Linkedin,
    Twitter,
    Facebook,
    Instagram,
    Mail
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDistributionStore } from '../store/distributionStore';
import { format } from 'date-fns';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    contentId?: string;
    articleId?: string;
    content: string;
    platform: string;
}

const platformIconMap: Record<string, any> = {
    linkedin: Linkedin,
    twitter: Twitter,
    facebook: Facebook,
    instagram: Instagram,
    newsletter: Mail,
    email: Mail,
};

const platformColorMap: Record<string, string> = {
    linkedin: "text-blue-600",
    twitter: "text-black",
    facebook: "text-blue-500",
    instagram: "text-pink-600",
    newsletter: "text-green-600",
    email: "text-gray-600",
};

export default function ShareModal({ isOpen, onClose, contentId, articleId, content, platform }: ShareModalProps) {
    const {
        platforms,
        fetchPlatforms,
        distributeContent,
        isLoading
    } = useDistributionStore();

    const [selectedPlatform, setSelectedPlatform] = useState<string>(platform);
    const [shareMode, setShareMode] = useState<'now' | 'schedule'>('now');
    const [scheduledDate, setScheduledDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [scheduledTime, setScheduledTime] = useState(format(new Date(), 'HH:mm'));

    useEffect(() => {
        if (isOpen) {
            fetchPlatforms();
            setSelectedPlatform(platform);
        }
    }, [isOpen, fetchPlatforms, platform]);

    if (!isOpen) return null;

    const handleShare = async () => {
        try {
            let scheduleTime;
            if (shareMode === 'schedule') {
                scheduleTime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
            }

            await distributeContent({
                contentId: contentId || undefined,
                articleId: articleId || undefined,
                platform: selectedPlatform,
                scheduleTime
            });

            toast.success(shareMode === 'now'
                ? `Successfully shared to ${selectedPlatform}!`
                : `Scheduled for ${selectedPlatform} at ${scheduledDate} ${scheduledTime}`
            );
            onClose();
        } catch (error) {
            toast.error('Failed to share content. Please try again.');
        }
    };

    const currentPlatform = platforms.find(p => p.id === selectedPlatform);
    const isConnected = currentPlatform?.connected;
    const PlatformIcon = platformIconMap[selectedPlatform] || Share2;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-primary-600" />
                        <h2 className="text-xl font-bold text-gray-900">Share Content</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Platform Info */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-white shadow-sm ${platformColorMap[selectedPlatform]}`}>
                                <PlatformIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 capitalize">{selectedPlatform}</p>
                                <p className="text-xs text-gray-500">
                                    {isConnected ? `Connected as ${currentPlatform.username}` : 'Not connected'}
                                </p>
                            </div>
                        </div>
                        {!isConnected && (
                            <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-medium">
                                <AlertCircle className="h-3 w-3" />
                                Required
                            </div>
                        )}
                    </div>

                    {/* Share Preview */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Preview</label>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600 line-clamp-4 whitespace-pre-wrap">
                            {content}
                        </div>
                    </div>

                    {/* Share Mode */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">When to share?</label>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShareMode('now')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border-2 transition-all ${shareMode === 'now'
                                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                                    : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                                    }`}
                            >
                                <Check className={`h-4 w-4 ${shareMode === 'now' ? 'opacity-100' : 'opacity-0'}`} />
                                Share Now
                            </button>
                            <button
                                onClick={() => setShareMode('schedule')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border-2 transition-all ${shareMode === 'schedule'
                                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                                    : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                                    }`}
                            >
                                <Clock className="h-4 w-4" />
                                Schedule
                            </button>
                        </div>
                    </div>

                    {/* Scheduling Options */}
                    {shareMode === 'schedule' && (
                        <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> Date
                                </label>
                                <input
                                    type="date"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> Time
                                </label>
                                <input
                                    type="time"
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleShare}
                        disabled={isLoading || !isConnected}
                        className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Sharing...
                            </>
                        ) : (
                            <>
                                {shareMode === 'now' ? 'Share Now' : 'Schedule Share'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
