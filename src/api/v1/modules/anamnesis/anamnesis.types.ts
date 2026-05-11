export type AnamnesisBirthRecord = {
  id: string;
  anamnesisId: string;
  gestationalWeeks: number | null;
  birthType: string | null;
  birthWeightGrams: number | null;
  birthHeightCentimeters: number | null;
  apgarOneMinute: number | null;
  apgarFiveMinutes: number | null;
  birthComplication: string | null;
  hospitalizationDays: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UpsertAnamnesisBirthDTO = {
  gestationalWeeks?: number | null;
  birthType?: string | null;
  birthWeightGrams?: number | null;
  birthHeightCentimeters?: number | null;
  apgarOneMinute?: number | null;
  apgarFiveMinutes?: number | null;
  birthComplication?: string | null;
  hospitalizationDays?: number | null;
};

export type AnamnesisMotorDevelopmentRecord = {
  id: string;
  anamnesisId: string;
  neckControlAgeMonths: number | null;
  sittingAgeMonths: number | null;
  crawlingAgeMonths: number | null;
  firstStepsAgeMonths: number | null;
  fineCoordination: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UpsertAnamnesisMotorDevelopmentDTO = {
  neckControlAgeMonths?: number | null;
  sittingAgeMonths?: number | null;
  crawlingAgeMonths?: number | null;
  firstStepsAgeMonths?: number | null;
  fineCoordination?: string | null;
};

export type AnamnesisLanguageCommunicationRecord = {
  id: string;
  anamnesisId: string;
  firstWordsAgeMonths: number | null;
  fullSentencesAgeMonths: number | null;
  comprehension: string | null;
  currentCommunication: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UpsertAnamnesisLanguageCommunicationDTO = {
  firstWordsAgeMonths?: number | null;
  fullSentencesAgeMonths?: number | null;
  comprehension?: string | null;
  currentCommunication?: string | null;
};

export type AnamnesisHealthRecord = {
  id: string;
  anamnesisId: string;
  diagnosis: string | null;
  medication: string | null;
  allergies: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UpsertAnamnesisHealthDTO = {
  diagnosis?: string | null;
  medication?: string | null;
  allergies?: string | null;
};

export type AnamnesisBehaviorRecord = {
  id: string;
  anamnesisId: string;
  concentrationDifficulty: string | null;
  interaction: string | null;
  activityPreference: string | null;
  anxiety: string | null;
  hyperactivity: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UpsertAnamnesisBehaviorDTO = {
  concentrationDifficulty?: string | null;
  interaction?: string | null;
  activityPreference?: string | null;
  anxiety?: string | null;
  hyperactivity?: string | null;
};

export type AnamnesisRoutineRecord = {
  id: string;
  anamnesisId: string;
  wakesUpAt: string | null;
  therapies: string | null;
  schoolPeriod: string | null;
  extraActivity: string | null;
  sleepsAt: string | null;
  routineObservation: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UpsertAnamnesisRoutineDTO = {
  wakesUpAt?: string | null;
  therapies?: string | null;
  schoolPeriod?: string | null;
  extraActivity?: string | null;
  sleepsAt?: string | null;
  routineObservation?: string | null;
};

export type UpdateAnamnesisGeneralNotesDTO = {
  generalNotes?: string | null;
};

export type AnamnesisRecord = {
  id: string;
  childId: string;
  generalNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  birth: AnamnesisBirthRecord | null;
  motorDevelopment: AnamnesisMotorDevelopmentRecord | null;
  languageCommunication: AnamnesisLanguageCommunicationRecord | null;
  health: AnamnesisHealthRecord | null;
  behavior: AnamnesisBehaviorRecord | null;
  routine: AnamnesisRoutineRecord | null;
};

