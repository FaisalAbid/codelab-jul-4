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

"use client";

import { useState } from 'react';

export default function AboutPopup() {
  const [isOpen, setIsOpen] = useState(false);

  const togglePopup = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button
        onClick={togglePopup}
        className="text-background bg-foreground w-full p-3 rounded-xl text-lg text-center font-medium mb-3.5"
      >
        About this app
      </button>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-5">
          <div className="bg-background p-5 rounded-xl shadow-lg text-center">
            <h2 className="text-xl font-medium mb-2.5">About this app</h2>
            <p className="mb-2.5">This is a travel planning application.</p>
            <button
              onClick={togglePopup}
              className="text-background bg-foreground p-2 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
