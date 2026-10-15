export type VideoEmbed =
  | { type: "youtube" | "vimeo" | "iframe"; src: string }
  | { type: "file"; src: string };

export function getVideoEmbed(url: string): VideoEmbed {
  const youtubeMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/
  );
  if (youtubeMatch) {
    return { type: "youtube", src: `https://www.youtube.com/embed/${youtubeMatch[1]}` };
  }

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return { type: "vimeo", src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  }

  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) {
    return { type: "file", src: url };
  }

  return { type: "iframe", src: url };
}
