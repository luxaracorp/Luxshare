export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface PlayerData {
  id: string;
  slug: string;
  title: string;
  language: string;
  audio_url: string;
  transcript: TranscriptSegment[];
  duration: number;
}
