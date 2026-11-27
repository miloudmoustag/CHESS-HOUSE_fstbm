import { analyzePosition, BotStrength, EngineEvalResult } from '../lib/chessEngine';

export interface EngineWorkerRequest {
  id: string;
  fen: string;
  depth?: number;
  strength?: BotStrength;
}

export interface EngineWorkerResponse {
  id: string;
  result?: EngineEvalResult;
  error?: string;
}

self.onmessage = (event: MessageEvent<EngineWorkerRequest>) => {
  const { id, fen, depth = 3, strength = 'strong' } = event.data;
  try {
    const result = analyzePosition(fen, depth, strength);
    const payload: EngineWorkerResponse = { id, result };
    self.postMessage(payload);
  } catch (err) {
    const payload: EngineWorkerResponse = {
      id,
      error: err instanceof Error ? err.message : 'Engine failure',
    };
    self.postMessage(payload);
  }
};
