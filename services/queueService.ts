export interface QueueEstimateInput {
  queueAheadCount: number;
  totalPendingPagesAhead: number;
  printerPpmSpeed?: number; // default 30 pages/minute
  currentJobPages: number;
}

export interface QueueEstimateResult {
  queuePosition: number;
  estimatedWaitMinutes: number;
  statusLabel: string;
}

export function calculateQueueEstimate(input: QueueEstimateInput): QueueEstimateResult {
  const {
    queueAheadCount,
    totalPendingPagesAhead,
    printerPpmSpeed = 30,
    currentJobPages,
  } = input;

  const position = queueAheadCount + 1;

  // Each job has ~45 seconds handling time, plus pages / ppm speed
  const handlingSeconds = queueAheadCount * 45;
  const printPagesSeconds = (totalPendingPagesAhead / Math.max(printerPpmSpeed, 10)) * 60;
  const totalSeconds = handlingSeconds + printPagesSeconds;

  let estimatedWaitMinutes = Math.ceil(totalSeconds / 60);
  if (estimatedWaitMinutes <= 0) {
    estimatedWaitMinutes = 1; // minimum 1 min if next in queue
  }

  let statusLabel = 'Next in queue';
  if (position > 1) {
    statusLabel = `${position - 1} print job${position - 1 > 1 ? 's' : ''} ahead of you`;
  }

  return {
    queuePosition: position,
    estimatedWaitMinutes,
    statusLabel,
  };
}
