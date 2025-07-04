/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may Otain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useActionState, useState } from 'react';

import DreamingOverlay from '@/components/DreamingOverlay';
import FormFields from '@/components/FormFields'; // Make sure this provides inputs named "request" and "images[]"

import { DESTINATIONS_LOCAL_STORAGE_KEY } from '@/lib/constants';
import { generateItinerary } from '@/lib/itinerary'; // This is the server action
import { ItineraryFlowOutput } from '@/lib/genkit/types'; // For typing the state
import { GEMINI } from '@/lib/routes';

export const maxDuration = 60;

// Type for the result of generateItinerary, which is ItineraryFlowOutput or undefined
type ItineraryResult = ItineraryFlowOutput | undefined | null;


export default function GeminiPromptPage() {
  const router = useRouter();

  // generateItinerary is the server action.
  // Its signature is (previousState, formData) => Promise<ItineraryResult>
  // useActionState will manage the pending and error states.
  const [itineraryResult, formAction, isPending] = useActionState<ItineraryResult, FormData>(
    generateItinerary, // Pass the server action directly
    null // Initial state
  );

  const [selectedModel, setSelectedModel] = useState('gemini'); // For controlling the radio buttons

  useEffect(() => {
    if (itineraryResult) {
      localStorage.setItem(
        DESTINATIONS_LOCAL_STORAGE_KEY,
        JSON.stringify(itineraryResult),
      );
      router.push(GEMINI.RESULTS);
    }
    // TODO: Handle error states from itineraryResult if generateItinerary can return error objects
  }, [itineraryResult, router]);

  return (
    <main className="container relative flex flex-col gap-6 bg-surface text-background">
      {/* The form action will now correctly call generateItinerary with FormData */}
      <form action={formAction}>
        {/* FormFields must contain:
            - an input named "request" for the text prompt
            - file input(s) named "images[]" for image uploads
        */}
        <FormFields />

        {/* Model Selection UI */}
        <div className="my-4 p-4 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 shadow">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Choose your AI Model:</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700">
              <input
                type="radio"
                name="modelChoice" // This name MUST be "modelChoice" to be picked up by generateItinerary from FormData
                value="gemini"
                checked={selectedModel === 'gemini'}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="radio radio-primary"
              />
              <span className="text-gray-700 dark:text-gray-300">Gemini</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700">
              <input
                type="radio"
                name="modelChoice" // This name MUST be "modelChoice"
                value="openai"
                checked={selectedModel === 'openai'}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="radio radio-primary"
              />
              <span className="text-gray-700 dark:text-gray-300">OpenAI</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-4 p-3 rounded-xl text-lg text-center font-medium gradient text-background animate-shadow disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isPending ? 'Dreaming...' : 'Plan my dream trip with AI'}
        </button>
        {/* DreamingOverlay might use isPending if it's a global overlay, or remove if button text is enough */}
        {isPending && <DreamingOverlay />}
      </form>
    </main>
  );
}
