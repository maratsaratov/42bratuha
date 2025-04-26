export enum EventLocation {
  CENTRAL = "Центральный кампус",
  EAST = "Восточный кампус",
  KPITIP = "КПИТиП",
  LAW = "Юридический корпус",
  OTHER = "Другое"
}

export enum EventType {
  SOCIAL = "Общественное",
  CULTURAL = "Культурно-творческое",
  SPORTS = "Спортивное",
  EDUCATIONAL = "Просветительское",
  OTHER = "Другое"
}

export enum ParticipantRole {
  PARTICIPANT = "Участник",
  VOLUNTEER = "Волонтёр",
  ORGANIZER = "Организатор"
}


export interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  start_datetime: string;
  end_datetime?: string | null;
  location: EventLocation;
  location_details?: string;
  event_type: EventType;
  roles_available: ParticipantRole[];
  registration_link_participant?: string | null;
  registration_link_volunteer?: string | null;
  registration_link_organizer?: string | null;
  created_at: string;
  updated_at: string;
  author_id: number;
  author_username?: string;
}


export interface EventFilters {
  startDate?: string;
  endDate?: string;
  role?: ParticipantRole | '';
  location?: EventLocation | '';
  type?: EventType | '';
}


export interface EventFormData {
  title: string;
  description: string;
  start_datetime: string;
  end_datetime?: string | null;
  location: EventLocation;
  location_details?: string;
  event_type: EventType;
  roles_available: ParticipantRole[];
  registration_link_participant?: string;
  registration_link_volunteer?: string;
  registration_link_organizer?: string;
}