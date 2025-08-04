import { Card } from "../ui";

interface VideoPlayerProps {
  videoId: string;
  title: string;
  className?: string;
}

export function VideoPlayer({ videoId, title, className }: VideoPlayerProps) {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <Card className={className}>
      <div>
        {/* Embedded Player */}
        <div className="aspect-video w-full rounded-t-xl overflow-hidden">
          <iframe
            src={embedUrl}
            title={title}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Controls & Title */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div></div>
            <button
              onClick={() => window.open(youtubeUrl, "_blank")}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-pink-600 transition-colors"
            ></button>
          </div>

          <h3 className="font-medium text-gray-900 leading-tight">{title}</h3>
        </div>
      </div>
    </Card>
  );
}
