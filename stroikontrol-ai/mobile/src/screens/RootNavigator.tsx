/**
 * Root Navigation — Auth check + Main Stack
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuthStore } from '@store/authStore';
import { AuthScreen } from '@screens/auth/AuthScreen';
import { HomeScreen } from '@screens/home/HomeScreen';
import ProjectCreateScreen from '@screens/project/ProjectCreateScreen';
import { CameraScreen } from '@screens/camera/CameraScreen';
import { CalibrationScreen } from '@screens/camera/CalibrationScreen';
import { AudioRecordScreen } from '@screens/camera/AudioRecordScreen';
import { AnalysisScreen } from '@screens/analysis/AnalysisScreen';
import { ReportScreen } from '@screens/report/ReportScreen';
import { ProfileScreen } from '@screens/profile/ProfileScreen';
import { PaymentScreen } from '@screens/payment/PaymentScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ProjectCreate: undefined;
  Camera: { projectId: string; step: 'calibration' | 'photos' | 'audio' };
  Calibration: { projectId: string };
  AudioRecord: { projectId: string };
  Analysis: { projectId: string };
  Report: { projectId: string };
  Payment: { tariff: string; projectId?: string };
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return null; // TODO: splash screen
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="ProjectCreate" component={ProjectCreateScreen} />
          <Stack.Screen name="Camera" component={CameraScreen} />
          <Stack.Screen name="Calibration" component={CalibrationScreen} />
          <Stack.Screen name="AudioRecord" component={AudioRecordScreen} />
          <Stack.Screen name="Analysis" component={AnalysisScreen} />
          <Stack.Screen name="Report" component={ReportScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
