import type { Metadata } from "next";
import { SourceShieldStory } from "@/components/story/source-shield-story";
import "./brand.css";
import "./story.css";
import "./scenes.css";

export const metadata: Metadata = {
  title: "SourceShield — A Privacy Story",
  description:
    "A scroll-through privacy story for the Krava × Linq hackathon — eleven cinematic scenes from surveillance to SourceShield.",
};

export default function StoryPage() {
  return <SourceShieldStory />;
}
