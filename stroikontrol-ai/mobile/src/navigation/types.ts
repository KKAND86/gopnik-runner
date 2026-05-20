/**
 * Navigation types for React Navigation
 */
export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  ProjectCreate: undefined;
  Camera: { projectId: string; step: string };
  AudioRecord: { projectId: string };
  Report: { projectId: string };
  Analysis: { projectId: string };
  Settings: undefined;
  ExpertQueue: undefined;
  Dispute: { projectId: string; defectId: string; defectType: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
