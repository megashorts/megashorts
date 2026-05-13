import { Metadata } from "next";
// import VideosPage from "./VideosPage";
import VideoFeed from "./VideoFeed";

export const metadata: Metadata = {
  title: "Videos",
};

export default function Page() {
  return (
    <div className="container mx-auto px-4 py-4">
      <VideoFeed />
    </div>
  );
}
