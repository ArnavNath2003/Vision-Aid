import { FaceMatch, ProcessedFace } from './GuardianVision';
import React from 'react';

export interface DashboardProps {
  onClose: () => void;
  processedFaces: ProcessedFace[];
  matchHistory: FaceMatch[];
  referenceImagesCount: number;
  clearHistory?: () => void;
}

declare const Dashboard: React.FC<DashboardProps>;
export default Dashboard;
