'use client';

import React, { useState } from 'react';
import { ChevronRight, Plus, Camera } from 'lucide-react';

const HealthTracker = () => {
  const [weight, setWeight] = useState('68.5');
  const [sleep, setSleep] = useState('7.5');
  const [condition, setCondition] = useState('good');

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      {/* Top Bar */}
      <div className="px-4 py-6 flex justify-between items-center border-b border-gray-100">
        <span className="text-xl font-medium">Today</span>
        <span className="text-sm text-gray-500">December 24</span>
      </div>

      {/* Quick Input Section */}
      <div className="p-4 space-y-4">
        {/* Weight Input */}
        <div className="bg-gray-50 p-4 rounded-xl">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Weight</span>
            <div className="flex items-center">
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-16 text-right bg-transparent text-xl font-medium focus:outline-none"
                step="0.1"
              />
              <span className="text-sm text-gray-500 ml-1">kg</span>
            </div>
          </div>
        </div>

        {/* Sleep Input */}
        <div className="bg-gray-50 p-4 rounded-xl">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Sleep</span>
            <div className="flex items-center">
              <input
                type="number"
                value={sleep}
                onChange={(e) => setSleep(e.target.value)}
                className="w-16 text-right bg-transparent text-xl font-medium focus:outline-none"
                step="0.5"
              />
              <span className="text-sm text-gray-500 ml-1">hrs</span>
            </div>
          </div>
        </div>

        {/* Condition Selection */}
        <div className="bg-gray-50 p-4 rounded-xl">
          <span className="text-sm text-gray-600 block mb-3">How do you feel today?</span>
          <div className="flex justify-between gap-2">
            {['Not Great', 'Good', 'Great'].map((status) => (
              <button
                key={status}
                onClick={() => setCondition(status.toLowerCase())}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors
                  ${
                    condition === status.toLowerCase()
                      ? 'bg-black text-white'
                      : 'bg-white text-gray-600'
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-auto p-4 space-y-3">
        <button className="w-full p-4 bg-black text-white rounded-xl flex justify-between items-center">
          <div className="flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            <span className="text-lg">Add Meal</span>
          </div>
          <ChevronRight className="w-5 h-5" />
        </button>

        <button className="w-full p-4 bg-gray-100 text-gray-900 rounded-xl flex justify-between items-center">
          <div className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            <span className="text-lg">Add Exercise</span>
          </div>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default HealthTracker;
