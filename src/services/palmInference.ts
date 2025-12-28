import axios from 'axios';

export type PalmInsight = {
  id: string;
  title: string;
  summary: string;
  advice: string;
};

type InferenceResponse = {
  insights?: PalmInsight[];
  needsRetake?: boolean;
  reason?: string;
};

type PalmInferenceResult = {
  insights: PalmInsight[];
  flags?: { needsRetake?: boolean; reason?: string };
};

const fallbackInsights: PalmInsight[] = [
  {
    id: 'life_line',
    title: 'Life line',
    summary: 'Strong, continuous line indicates resilience and consistent vitality.',
    advice: 'Protect rest cycles and hydrate; add weekly grounding walks.',
  },
  {
    id: 'heart_line',
    title: 'Heart line',
    summary: 'Gentle arc shows warmth and balanced empathy with clear limits.',
    advice: 'State your emotional needs early; journaling improves clarity.',
  },
  {
    id: 'head_line',
    title: 'Head line',
    summary: 'Even depth suggests practical creativity and thoughtful execution.',
    advice: 'Use 25-minute focus sprints; end sessions with a 3-bullet recap.',
  },
  {
    id: 'fate_line',
    title: 'Fate line',
    summary: 'Visible and upright fate line hints at steady career direction.',
    advice: 'Commit to one flagship goal this quarter and block deep-work time.',
  },
];

/**
 * Fetch palm insights from a backend. Expects the backend to accept a multipart/form-data upload
 * with the palm image and return structured insights.
 *
 * Configure endpoint via EXPO_PUBLIC_PALM_ENDPOINT.
 */
export async function fetchPalmInsights(uri: string): Promise<PalmInferenceResult> {
  const endpoint = process.env.EXPO_PUBLIC_PALM_ENDPOINT;
  if (!endpoint) {
    return { insights: fallbackInsights, flags: { needsRetake: false } };
  }

  try {
    const form = new FormData();
    form.append('file', {
      uri,
      name: 'palm.jpg',
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
    console.warn('Palm inference failed, using fallback', error);
    return { insights: fallbackInsights, flags: { needsRetake: false } };
  }
}
