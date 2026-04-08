import { useState, useMemo } from "react";
import {
  useListVideos,
  useCreateVideo,
  useUpdateVideo,
  useDeleteVideo,
} from "@workspace/api-client-react";
import type { Video } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const FOLDER_ICONS: Record<string, string> = {
  motivation: "bolt",
  business: "trending_up",
  mindset: "psychology",
  health: "favorite",
  general: "play_circle",
  finance: "attach_money",
  productivity: "rocket_launch",
  spiritual: "self_improvement",
};

const FOLDER_COLORS: Record<string, string> = {
  motivation: "#ffbd5c",
  business: "#94aaff",
  mindset: "#d084ff",
  health: "#5cfd80",
  general: "#ff6e84",
  finance: "#5cfde4",
  productivity: "#ffbd5c",
  spiritual: "#d084ff",
};

function getYouTubeThumbnail(url: string): string | null {
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/
  );
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  return null;
}

function getFolderColor(folder: string) {
  return FOLDER_COLORS[folder.toLowerCase()] || "#94aaff";
}

function getFolderIcon(folder: string) {
  return FOLDER_ICONS[folder.toLowerCase()] || "play_circle";
}

export default function VideoLibrary() {
  const { data: videos = [], isLoading } = useListVideos();
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Video | null>(null);

  const folders = useMemo(() => {
    const map = new Map<string, Video[]>();
    for (const v of videos) {
      const key = v.folder;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(v);
    }
    return map;
  }, [videos]);

  const folderNames = Array.from(folders.keys());
  const displayed = activeFolder
    ? folders.get(activeFolder) || []
    : videos;

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-[10px] font-['Inter'] uppercase tracking-[0.2em] text-[#adaaaa] font-bold">
          Growth OS / Wisdom
        </p>
        <div className="flex items-end justify-between">
          <h2 className="font-['Manrope'] font-extrabold text-4xl tracking-tighter leading-none">
            Video <span className="text-[#ffbd5c] italic">Library</span>
          </h2>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#ffbd5c] text-[#000] font-['Manrope'] font-extrabold text-sm rounded-xl active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
            Add Video
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-3">
        <div className="bg-[#131313] rounded-xl px-4 py-3 ds-ghost-border flex-1 text-center">
          <p className="text-lg font-['Manrope'] font-extrabold text-[#ffbd5c]">{videos.length}</p>
          <p className="text-[10px] text-[#adaaaa] uppercase tracking-wider font-bold">Videos</p>
        </div>
        <div className="bg-[#131313] rounded-xl px-4 py-3 ds-ghost-border flex-1 text-center">
          <p className="text-lg font-['Manrope'] font-extrabold text-[#94aaff]">{folderNames.length}</p>
          <p className="text-[10px] text-[#adaaaa] uppercase tracking-wider font-bold">Folders</p>
        </div>
      </div>

      {/* Folder tabs */}
      {folderNames.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveFolder(null)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
              activeFolder === null
                ? "bg-[#ffbd5c] text-[#000]"
                : "bg-[#1a1a1a] text-[#adaaaa] hover:text-white"
            }`}
          >
            All ({videos.length})
          </button>
          {folderNames.map((f) => {
            const color = getFolderColor(f);
            const isActive = activeFolder === f;
            return (
              <button
                key={f}
                onClick={() => setActiveFolder(isActive ? null : f)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all"
                style={{
                  backgroundColor: isActive ? color : "rgba(255,255,255,0.05)",
                  color: isActive ? "#000" : color,
                  border: `1px solid ${color}40`,
                }}
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {getFolderIcon(f)}
                </span>
                {f} ({folders.get(f)!.length})
              </button>
            );
          })}
        </div>
      )}

      {/* Video grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-[#131313] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-[rgba(255,189,92,0.1)] flex items-center justify-center">
            <span className="material-symbols-outlined text-[#ffbd5c] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>video_library</span>
          </div>
          <p className="font-['Manrope'] font-bold text-lg">No videos yet</p>
          <p className="text-[#adaaaa] text-sm">Save your favourite motivational videos here.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-2 px-5 py-2.5 bg-[#ffbd5c] text-[#000] font-bold rounded-xl text-sm active:scale-95 transition-transform"
          >
            Add Your First Video
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {displayed.map((v) => (
            <VideoCard
              key={v.id}
              video={v}
              onEdit={() => setEditing(v)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAdd && (
        <VideoFormModal
          mode="create"
          onClose={() => setShowAdd(false)}
          existingFolders={folderNames}
        />
      )}
      {editing && (
        <VideoFormModal
          mode="edit"
          video={editing}
          onClose={() => setEditing(null)}
          existingFolders={folderNames}
        />
      )}
    </div>
  );
}

function VideoCard({ video, onEdit }: { video: Video; onEdit: () => void }) {
  const deleteVideo = useDeleteVideo();
  const queryClient = useQueryClient();
  const color = getFolderColor(video.folder);
  const thumb = getYouTubeThumbnail(video.url);

  const handleDelete = () => {
    if (!confirm(`Delete "${video.title}"?`)) return;
    deleteVideo.mutate(
      { id: video.id },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/videos"] }) }
    );
  };

  return (
    <div
      className="group relative bg-[#131313] rounded-2xl overflow-hidden ds-ghost-border hover:border-opacity-60 transition-all"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      {/* Thumbnail */}
      <a href={video.url} target="_blank" rel="noopener noreferrer" className="block relative">
        {thumb ? (
          <img src={thumb} alt={video.title} className="w-full h-44 object-cover" />
        ) : (
          <div className="w-full h-44 flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
            <span className="material-symbols-outlined text-5xl" style={{ color, fontVariationSettings: "'FILL' 1" }}>smart_display</span>
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-[#000]/40">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#000] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
          </div>
        </div>
      </a>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-['Manrope'] font-bold text-sm text-white leading-tight line-clamp-2">{video.title}</p>
            {video.notes && (
              <p className="text-[11px] text-[#adaaaa] mt-1 line-clamp-2">{video.notes}</p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg text-[#adaaaa] hover:text-[#94aaff] hover:bg-[rgba(148,170,255,0.1)] transition-all"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-[#adaaaa] hover:text-[#ff6e84] hover:bg-[rgba(255,110,132,0.1)] transition-all"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>

        {/* Folder badge */}
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className="material-symbols-outlined text-sm"
            style={{ color, fontVariationSettings: "'FILL' 1" }}
          >
            {getFolderIcon(video.folder)}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
            {video.folder}
          </span>
        </div>
      </div>
    </div>
  );
}

function VideoFormModal({
  mode,
  video,
  onClose,
  existingFolders,
}: {
  mode: "create" | "edit";
  video?: Video;
  onClose: () => void;
  existingFolders: string[];
}) {
  const createVideo = useCreateVideo();
  const updateVideo = useUpdateVideo();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(video?.title || "");
  const [url, setUrl] = useState(video?.url || "");
  const [folder, setFolder] = useState(video?.folder || "General");
  const [notes, setNotes] = useState(video?.notes || "");
  const [customFolder, setCustomFolder] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const isPending = createVideo.isPending || updateVideo.isPending;
  const finalFolder = useCustom ? customFolder.trim() : folder;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalFolder) return;
    const data = { title, url, folder: finalFolder, notes: notes || null };
    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      onClose();
    };
    if (mode === "create") {
      createVideo.mutate({ data }, { onSuccess });
    } else {
      updateVideo.mutate({ id: video!.id, data }, { onSuccess });
    }
  };

  const presetFolders = Array.from(new Set(["General", "Motivation", "Business", "Mindset", "Health", "Finance", "Productivity", "Spiritual", ...existingFolders]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000]/70 backdrop-blur-sm p-4">
      <div className="bg-[#131313] w-full max-w-md rounded-3xl p-6 space-y-5 ds-ghost-border max-h-[90dvh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h3 className="font-['Manrope'] font-bold text-xl">
            {mode === "create" ? "Add Video" : "Edit Video"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full text-[#adaaaa] hover:bg-[#2c2c2c]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-[10px] font-['Inter'] uppercase tracking-widest text-[#adaaaa] font-bold">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="w-full bg-[#262626] border-none rounded-xl py-3 px-4 text-white placeholder:text-[#767575] focus:outline-none focus:ring-1 focus:ring-[#ffbd5c]"
              placeholder="e.g. Can't Hurt Me — David Goggins"
            />
          </div>

          {/* URL */}
          <div className="space-y-2">
            <label className="text-[10px] font-['Inter'] uppercase tracking-widest text-[#adaaaa] font-bold">Video URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full bg-[#262626] border-none rounded-xl py-3 px-4 text-white placeholder:text-[#767575] focus:outline-none focus:ring-1 focus:ring-[#ffbd5c]"
              placeholder="https://youtube.com/watch?v=... or Instagram link"
            />
          </div>

          {/* Folder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-['Inter'] uppercase tracking-widest text-[#adaaaa] font-bold">Folder</label>
              <button
                type="button"
                onClick={() => setUseCustom((v) => !v)}
                className="text-[10px] text-[#94aaff] font-bold uppercase tracking-wider"
              >
                {useCustom ? "← Pick preset" : "+ New folder"}
              </button>
            </div>
            {useCustom ? (
              <input
                value={customFolder}
                onChange={(e) => setCustomFolder(e.target.value)}
                required
                className="w-full bg-[#262626] border-none rounded-xl py-3 px-4 text-white placeholder:text-[#767575] focus:outline-none focus:ring-1 focus:ring-[#94aaff]"
                placeholder="My custom folder name"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {presetFolders.map((f) => {
                  const color = getFolderColor(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFolder(f)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all"
                      style={{
                        backgroundColor: folder === f ? color : "rgba(255,255,255,0.05)",
                        color: folder === f ? "#000" : color,
                        border: `1px solid ${color}40`,
                      }}
                    >
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {getFolderIcon(f)}
                      </span>
                      {f}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-[10px] font-['Inter'] uppercase tracking-widest text-[#adaaaa] font-bold">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-[#262626] border-none rounded-xl py-3 px-4 text-white placeholder:text-[#767575] focus:outline-none focus:ring-1 focus:ring-[#ffbd5c] resize-none"
              placeholder="Why is this video important to you?"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-2xl text-[#adaaaa] bg-[#1a1a1a] font-bold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !title.trim() || !url.trim()}
              className="flex-1 ds-liquid-gradient py-3.5 rounded-2xl font-['Manrope'] font-extrabold text-[#000] active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {isPending ? "Saving…" : mode === "create" ? "Save Video" : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
