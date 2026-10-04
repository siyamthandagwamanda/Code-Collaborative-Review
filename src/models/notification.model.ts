export interface AppNotification {
    id: number;
    user_id: number;
    message: string;
    is_read: boolean;
    created_at: Date;
}