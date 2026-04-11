import { NavigatorScreenParams, CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { JournalEntry, JournalEntryType } from './database.types';

// ─── Stack param lists ────────────────────────────────────────────────────────

export type RootStackParamList = {
  AppTabs: NavigatorScreenParams<RootTabParamList>;
  Auth: undefined;
};

export type RootTabParamList = {
  Home: { refresh?: number } | undefined;
  Plants: NavigatorScreenParams<PlantsStackParamList>;
  'Care Plan': { resetFilters?: boolean; filterOverdue?: boolean } | undefined;
  Journal: NavigatorScreenParams<JournalStackParamList> | undefined;
  More: NavigatorScreenParams<MoreStackParamList>;
};

export type PlantsStackParamList = {
  PlantsList: { healthFilter?: string; refresh?: number } | undefined;
  ArchivedPlants: undefined;
  PlantDetail: { plantId: string };
  PlantForm: { plantId?: string } | undefined;
};

export type JournalStackParamList = {
  JournalList: { refresh?: number } | undefined;
  JournalForm:
    | {
        entry?: JournalEntry;
        initialEntryType?: JournalEntryType;
        initialPlantId?: string;
      }
    | undefined;
};

export type MoreStackParamList = {
  MoreHome: undefined;
  ManageLocations: undefined;
  ManagePlantCatalog: undefined;
  Settings: undefined;
};

// ─── Global declaration (makes useNavigation() auto-typed) ───────────────────

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}

// ─── Per-screen convenience types ────────────────────────────────────────────

// TodayScreen (Home tab) — navigates to tabs
export type TodayScreenNavigationProp = BottomTabNavigationProp<RootTabParamList, 'Home'>;
export type TodayScreenRouteProp = RouteProp<RootTabParamList, 'Home'>;

// PlantsScreen — navigates within its own stack only
export type PlantsScreenNavigationProp = NativeStackNavigationProp<
  PlantsStackParamList,
  'PlantsList'
>;
export type PlantsScreenRouteProp = RouteProp<PlantsStackParamList, 'PlantsList'>;

// PlantDetailScreen — navigates within PlantsStack AND to Journal tab (composite)
export type PlantDetailScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<PlantsStackParamList, 'PlantDetail'>,
  BottomTabNavigationProp<RootTabParamList>
>;
export type PlantDetailScreenRouteProp = RouteProp<PlantsStackParamList, 'PlantDetail'>;

// PlantFormScreen / usePlantFormState — navigates within PlantsStack only
export type PlantFormScreenNavigationProp = NativeStackNavigationProp<
  PlantsStackParamList,
  'PlantForm'
>;
export type PlantFormScreenRouteProp = RouteProp<PlantsStackParamList, 'PlantForm'>;

// CalendarScreen (Care Plan tab) — receives tab-level params
export type CalendarScreenRouteProp = RouteProp<RootTabParamList, 'Care Plan'>;

// JournalScreen — navigates within JournalStack only
export type JournalScreenNavigationProp = NativeStackNavigationProp<
  JournalStackParamList,
  'JournalList'
>;
export type JournalScreenRouteProp = RouteProp<JournalStackParamList, 'JournalList'>;

// JournalFormScreen — navigates back (pop) within JournalStack
export type JournalFormScreenNavigationProp = NativeStackNavigationProp<
  JournalStackParamList,
  'JournalForm'
>;
export type JournalFormScreenRouteProp = RouteProp<JournalStackParamList, 'JournalForm'>;
