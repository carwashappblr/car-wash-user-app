import { NavigatorScreenParams } from '@react-navigation/native';

// ─── Auth Stack ───────────────────────────────────────────────────────────────
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// ─── User Stack ───────────────────────────────────────────────────────────────
export type UserTabsParamList = {
  Home: undefined;
  MyCars: undefined;
  BookWash: { carId?: string } | undefined;
  MyTasks: undefined;
  Profile: undefined;
};

export type UserStackParamList = {
  UserTabs: NavigatorScreenParams<UserTabsParamList>;
  AddCar: undefined;
  EditCar: { carId: string };
};

// ─── Machine Stack ────────────────────────────────────────────────────────────
export type MachineTabsParamList = {
  Dashboard: undefined;
  MachineTasks: undefined;
};

export type MachineStackParamList = {
  MachineTabs: NavigatorScreenParams<MachineTabsParamList>;
};

// ─── Root Stack ───────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  UserApp: NavigatorScreenParams<UserStackParamList>;
  MachineApp: NavigatorScreenParams<MachineStackParamList>;
};

// Backward compat alias (used by existing MainTabs ref)
export type MainTabsParamList = UserTabsParamList;
