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

'use server';

import { ItineraryFlowOutput } from './genkit/types';
import { itineraryFlow } from './genkit/itineraryFlow';

export async function generateItinerary(
  previousState: null | undefined | ItineraryFlowOutput, // previousState is part of useActionState, not directly used here for inputs
  formData: FormData,
): Promise<ItineraryFlowOutput | undefined> {
  const request = formData.get('request');
  if (!request) {
    // It might be better to return an error state or object that the frontend can handle
    throw new Error('No request provided');
  }

  const modelChoice = formData.get('modelChoice') as string | null;

  // Assuming 'images[]' is the name used in FormFields for file inputs
  const images: File[] = formData.getAll('images[]') as File[];
  const imageUrls = await Promise.all(
    images.filter((i) => i.size > 0).map(fileToDataURL),
  );

  // Construct the input for itineraryFlow, now including modelChoice
  const flowInput = {
    request: request.toString(),
    imageUrls,
    // Only include modelChoice if it's present and valid, otherwise itineraryFlow will use its default
    ...(modelChoice && { modelChoice: modelChoice }),
  };

  return await itineraryFlow(flowInput);
}

export async function fileToDataURL(file: File): Promise<string> {
  // 1. Get the file's content as an ArrayBuffer
  // The .arrayBuffer() method is available on the File object, even on the server.
  const arrayBuffer = await file.arrayBuffer();

  // 2. Convert the ArrayBuffer to a Node.js Buffer
  const buffer = Buffer.from(arrayBuffer);

  // 3. Convert the Buffer to a Base64-encoded string
  const base64 = buffer.toString('base64');

  // 4. Get the MIME type from the File object
  const mimeType = file.type;

  // 5. Construct the Data URL
  const dataURL = `data:${mimeType};base64,${base64}`;

  return dataURL;
}
