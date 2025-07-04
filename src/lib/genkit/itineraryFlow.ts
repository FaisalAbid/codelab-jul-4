/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  Place,
  Destination,
  ItineraryFlowInput,
  ItineraryFlowOutput,
} from './types';

import {
  getActivitiesForDestination,
  placesRetriever,
} from './placesRetriever';
import { ai } from './genkit.config';
import { geminiPro, gpt4o } from 'genkitx-openai'; // Assuming gpt4o is the desired OpenAI model

import { z } from 'genkit';

export const ItineraryGeneratorPromptInput = ai.defineSchema(
  'ItineraryGeneratorPromptInput',
  z.object({
    request: z.string(),
    place: z.string(),
    placeDescription: z.string(),
    activities: z.array(
      z.object({
        name: z.string(),
        description: z.string(),
        imageUrl: z.string().optional(),
      }),
    ),
  }),
);

const generateItinerary = async (request: string, place: Place, modelChoice?: string) => {
  const activities = await getActivitiesForDestination(place.ref);

  const selectedModel = modelChoice === 'openai' ? gpt4o : geminiPro; // Default to geminiPro

  const itineraryGenerator = await ai.prompt<
    typeof ItineraryGeneratorPromptInput,
    typeof Destination,
    z.ZodTypeAny
  >('itineraryGen'); // This prompt likely needs to be model-agnostic or we might need separate prompts

  const response = await itineraryGenerator(
    {
      request,
      place: place.name,
      placeDescription: place.knownFor,
      activities,
    },
    { model: selectedModel } // Pass the selected model to the prompt
  );

  const destination = response.output;
  if (!destination) {
    return null;
  }
  destination.itineraryImageUrl = place.imageUrl;
  destination.placeRef = place.ref;
  return destination;
};

export const itineraryFlow = ai.defineFlow(
  {
    name: 'itineraryFlow',
    inputSchema: ItineraryFlowInput.extend({ modelChoice: z.string().optional() }), // Add modelChoice to input
    outputSchema: ItineraryFlowOutput,
  },

  async (tripDetails) => {
    const selectedModel = tripDetails.modelChoice === 'openai' ? gpt4o : geminiPro; // Default to geminiPro

    const imgDescription = await ai.run('imgDescription', async () => {
      if (!tripDetails.imageUrls?.length) {
        return '';
      }
      console.log(`Generating image description using ${tripDetails.modelChoice || 'default model'}...`);
      const images = tripDetails.imageUrls.map((url) => ({
        media: { url },
      }));
      const response = await ai.generate({
        model: selectedModel, // Use selected model for image description
        prompt: [
          {
            text: `Describe these image(s) in a detailed paragraph as though it was a tourist destination.
    Do not give the name of the location, only give a description of what you see in the image and what you think a tourist would like it described as in a dream vacation.`,
          },
          ...images,
        ],
      });
      console.log('Image description generated:', response.text);
      return response.text;
    });

    const places = await ai.run(
      'Retrieve matching places',
      { imgDescription, request: tripDetails.request },
      async () => {
        const docs = await ai.retrieve({
          retriever: placesRetriever, // Retrievers are typically model-agnostic, but underlying embeddings might be model-specific
          query: `${tripDetails.request}\n${imgDescription}`,
          options: {
            limit: 3,
          },
        });
        return docs.map((doc) => {
          const data = doc.toJSON();
          const place: Place = {
            continent: '',
            country: '',
            imageUrl: '',
            knownFor: '',
            name: '',
            ref: '',
            tags: [],
            ...data.metadata,
          };
          if (data.content[0].text) {
            place.knownFor = data.content[0].text;
          }
          delete place.embedding;
          return place;
        });
      },
    );

    const itineraries = await Promise.all(
      places.map((place, i) =>
        ai.run(`Generate itinerary #${i + 1}`, () =>
          generateItinerary(tripDetails.request, place, tripDetails.modelChoice),
        ),
      ),
    );
    return itineraries.filter((itinerary) => itinerary !== null);
  },
);
