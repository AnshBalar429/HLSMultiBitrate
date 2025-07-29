import VideoPlayer from "@/components/VideoPlayer";


interface VideoPageProps {
    params: Promise<{ videoId: string }>;
}

export default async function VideoPage({ params }: VideoPageProps) {
    const { videoId } = await params;

    return <VideoPlayer videoId={videoId} />;
}
