import axios from 'axios';

export type FaceInsight = {
  id: string | number;
  title: string;
  summary: string;
  advice: string;
};

type InferenceResponse = {
  insights?: FaceInsight[];
  needsRetake?: boolean;
  reason?: string;
};

type FaceInferenceResult = {
  insights: FaceInsight[];
  flags?: { needsRetake?: boolean; reason?: string };
};

const fallbackInsights: FaceInsight[] = [
  {
    id: 'forehead',
    title: 'Forehead',
    summary: 'Broad, smooth forehead shows strategic thinking and future orientation.',
    advice: 'Plan in weekly horizons; write a 3-bullet intent each morning.',
  },
  {
    id: 'eyes',
    title: 'Eyes',
    summary: 'Even gaze suggests clear perception and empathy.',
    advice: 'Leverage active listening; pause before responding to complex topics.',
  },
  {
    id: 'nose',
    title: 'Nose',
    summary: 'Centered bridge indicates steady ambition and practical drive.',
    advice: 'Pick one career lever to push this month; track wins weekly.',
  },
  {
    id: 'mouth',
    title: 'Mouth',
    summary: 'Balanced lips hint at honest expression and relational warmth.',
    advice: 'State intentions plainly; summarize conversations with next steps.',
  },
];

/**
 * Fetch face reading insights from a backend endpoint configured via EXPO_PUBLIC_FACE_ENDPOINT.
 * The backend should accept multipart/form-data with a `file` upload of the face image.
 */
export async function fetchFaceInsights(uri: string): Promise<FaceInferenceResult> {
  const endpoint = process.env.EXPO_PUBLIC_FACE_ENDPOINT;
  if (!endpoint) {
    return { insights: fallbackInsights, flags: { needsRetake: false } };
  }

  try {
    const form = new FormData();
    form.append('file', {
      uri,
      name: 'face.jpg',
      type: 'image/jpeg',
    } as any);

    const { data } = await axios.post<InferenceResponse>(endpoint, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 20000,
    });

    const insights = data.insights?.length ? data.insights : fallbackInsights;
    return {
      insights,
      flags: {
        needsRetake: data.needsRetake,
        reason: data.reason,
      },
    };
  } catch (error) {
    console.warn('Face inference failed, using fallback', error);
    return { insights: fallbackInsights, flags: { needsRetake: false } };
  }
}
