export type ReviewDecision = "approved" | "changes_requested";

export interface Review {
    id: number;
    submission_id: number;
    reviewer_id: number;
    status: ReviewDecision;
    comment: string | null;
    created_at: Date;
}

export interface ReviewWithReviewer extends Review {
    reviewer_name: string;
}