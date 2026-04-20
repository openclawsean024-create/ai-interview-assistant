'use client';

import { useState, useEffect, useRef } from 'react';

interface VideoSimulationProps {
  isEnglish: boolean;
  onPracticeComplete?: (notes: string) => void;
}

const CAMERA_TIPS_EN = [
  'Position your camera at eye level',
  'Look at the camera lens, not the screen',
  'Maintain a neutral, confident expression',
  'Ensure good lighting on your face (avoid backlight)',
  'Keep your shoulders visible and centered in frame',
  'Minimize background distractions',
  'Wear professional attire as if in a real interview',
  'Keep a notepad nearby for quick notes',
];

const CAMERA_TIPS_ZH = [
  '將攝影機設置在眼睛高度',
  '說話時看著鏡頭，而非螢幕',
  '保持自然、自信的表情',
  '確保臉部光線充足（避免背光）',
  '肩膀保持在畫面中央可見範圍',
  '盡量減少背景干擾',
  '穿著專業服裝，如同實際面試',
  '身旁準備紙筆快速筆記',
];

const POST_PRACTICE_TIPS_EN = [
  'Review your posture and eye contact',
  'Notice moments where you hesitated — those need more preparation',
  'Check if your answers were structured and concise',
  'Did you speak at a good pace? Not too fast or slow?',
  'Were you using filler words too often?',
  'Did you maintain a confident tone throughout?',
];

const POST_PRACTICE_TIPS_ZH = [
  '回顧你的姿勢與眼神接觸',
  '注意你猶豫的地方 — 那些需要更多準備',
  '檢查你的回答是否有結構且簡潔',
  '你的說話節奏是否適中？不會太快或太慢？',
  '你是否過度使用口頭禪（如：嗯、這個）？',
  '你是否全程保持自信的語調？',
];

export function VideoSimulation({ isEnglish, onPracticeComplete }: VideoSimulationProps) {
  const [isActive, setIsActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [practiceStarted, setPracticeStarted] = useState(false);
  const [practiceNotes, setPracticeNotes] = useState('');
  const [showPostPractice, setShowPostPractice] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const tips = isEnglish ? CAMERA_TIPS_EN : CAMERA_TIPS_ZH;
  const postTips = isEnglish ? POST_PRACTICE_TIPS_EN : POST_PRACTICE_TIPS_ZH;

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraError(false);
    } catch {
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleStartPractice = async () => {
    await startCamera();
    setPracticeStarted(true);
    setIsActive(true);
  };

  const handleStopPractice = () => {
    setIsActive(false);
    setShowPostPractice(true);
    stopCamera();
  };

  const handleFinishReview = () => {
    onPracticeComplete?.(practiceNotes);
    setPracticeStarted(false);
    setShowPostPractice(false);
    setPracticeNotes('');
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Pre-practice: show camera setup tips
  if (!practiceStarted) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-lg">📹</div>
          <h3 className="text-base font-semibold text-zinc-200">
            {isEnglish ? 'Video Simulation Setup' : '錄影模擬準備'}
          </h3>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-zinc-300 mb-2">
            {isEnglish ? '📷 Front Camera Setup Tips' : '📷 正面視角設定提示'}
          </div>
          <ul className="space-y-2">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                <span className="text-blue-400 mt-0.5 flex-shrink-0">✓</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-3 bg-blue-500/8 border border-blue-500/20 rounded-lg">
          <div className="text-xs text-blue-300 font-medium mb-1">ℹ️ {isEnglish ? 'Note' : '注意'}</div>
          <div className="text-xs text-zinc-400">
            {isEnglish
              ? 'No actual video is stored. This simulation helps you practice your interview posture and delivery.'
              : '本功能不會儲存任何實際錄影。此模擬幫助你練習面試姿勢與表達方式。'}
          </div>
        </div>

        <button onClick={handleStartPractice} className="btn-brand w-full py-2.5 text-sm">
          {isEnglish ? '📹 Start Video Simulation' : '📹 開始錄影模擬'}
        </button>
      </div>
    );
  }

  // Post-practice: review tips
  if (showPostPractice) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-lg">✅</div>
          <h3 className="text-base font-semibold text-zinc-200">
            {isEnglish ? 'Practice Complete — Review Tips' : '練習完成 — 回顧提示'}
          </h3>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-zinc-300 mb-2">
            {isEnglish ? 'Self-Review Checklist' : '自我回顧檢查清單'}
          </div>
          <ul className="space-y-2">
            {postTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                <span className="text-amber-400 mt-0.5 flex-shrink-0">💡</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-xs text-zinc-400 mb-2 font-medium">
            {isEnglish ? 'Practice notes (optional):' : '練習筆記（選填）：'}
          </div>
          <textarea
            value={practiceNotes}
            onChange={(e) => setPracticeNotes(e.target.value)}
            placeholder={
              isEnglish
                ? 'Jot down areas for improvement...'
                : '記下需要改進的地方...'
            }
            className="w-full bg-zinc-800/60 border border-zinc-700/40 rounded-lg p-3 text-xs text-zinc-300 placeholder-zinc-600 resize-none h-20 focus:outline-none focus:border-blue-500/40"
          />
        </div>

        <button onClick={handleFinishReview} className="btn-brand w-full py-2.5 text-sm">
          {isEnglish ? '✅ Done — Back to Interview' : '✅ 完成 — 返回面試'}
        </button>
      </div>
    );
  }

  // Active: show camera feed
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-red-400 animate-pulse text-xs">● REC</div>
          <span className="text-xs text-zinc-400">
            {isEnglish ? 'Camera active — no recording stored' : '相機已啟動 — 無錄影儲存'}
          </span>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-700/40 aspect-video">
        {cameraError ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-500 text-sm">
            <div className="text-3xl">📷</div>
            <div>{isEnglish ? 'Camera not available' : '無法使用相機'}</div>
            <div className="text-xs text-zinc-600 px-6 text-center">
              {isEnglish
                ? 'Check browser permissions or use a device with a camera'
                : '請檢查瀏覽器權限或使用有相機的設備'}
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
        )}
      </div>

      <div className="text-xs text-zinc-500 text-center">
        {isEnglish
          ? 'Look at the camera lens and practice your answer'
          : '看著鏡頭，練習你的回答'}
      </div>

      {/* Tips overlay */}
      <div className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800/60">
        <div className="text-xs font-medium text-zinc-300 mb-2">
          {isEnglish ? '💡 While practicing, focus on:' : '💡 練習時專注於：'}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tips.slice(0, 3).map((tip, i) => (
            <span key={i} className="text-xs px-2 py-1 bg-zinc-800/80 rounded-md text-zinc-400">
              {tip.split(' ').slice(0, 4).join(' ')}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={handleStopPractice}
        className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/25"
      >
        ⏹ {isEnglish ? 'End Practice & Review' : '結束練習並回顧'}
      </button>
    </div>
  );
}
