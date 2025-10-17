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
  avatarUrl?: string | null;
  notifications_enabled: boolean;
}

export interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  event_id: number | null;
  event_title: string | null;
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
  image_url?: string | null;
  created_at: string;
  updated_at: string;
  author_id: number;
  author_username?: string;
  is_archived: boolean;
  archived_at?: string | null;
  is_participating?: boolean;
}

export interface Participation {
  id: number;
  user_id: number;
  event_id: number;
  event_title: string;
  role_name: ParticipantRole;
  is_registered: boolean;
  attended: boolean;
  registered_at: string;
  event_start_datetime: string;
  event_end_datetime?: string | null;
  event_image_url?: string | null;
  event_location: EventLocation;
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