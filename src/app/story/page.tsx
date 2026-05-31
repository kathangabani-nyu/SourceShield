import type { Metadata } from "next";
import { SourceShieldStory } from "@/components/story/source-shield-story";
import "./brand.css";
import "./story.css";
import "./scenes.css";
import "./demo.css";

export const metadata: Metadata = {
  title: "SourceShield — A Privacy Story",
  description:
    "A scroll-through privacy story for the Krava × Linq hackathon — thirteen cinematic scenes with live intake and dashboard demos.",
};

export default function StoryPage() {
  return <SourceShieldStory />;
}
