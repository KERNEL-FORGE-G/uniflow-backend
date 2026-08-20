export interface LiveKitWebhookPayload {
  event: string; // ex: 'room_finished', 'room_started', 'participant_joined', 'participant_left'
  room?: {
    name: string; // = conferenceId chez nous, car mintToken() utilise conference.id comme roomName
    sid?: string;
    creationTime?: number;
  };
  participant?: {
    identity: string; // = userId chez nous
    sid?: string;
  };
  createdAt?: number;
}