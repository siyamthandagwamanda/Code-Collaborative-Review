export interface ReviewerActivity {
    reviewer_id: number;
    name: string;
    reviews_count: number;
    comments_count: number;
}

export interface MostCommentedSubmission {
    id: number;
    title: string;
    comment_count: number;
}

export interface ProjectStats {
    project_id: number;
    total_submissions: number;
    approved: number;
    changes_requested: number;
    awaiting_review: number;
    approved_percentage: number;
    changes_requested_percentage: number;
    avg_review_time_seconds: number | null;
    avg_review_time_hours: number | null;
    reviewer_activity: ReviewerActivity[];
    most_commented_submission: MostCommentedSubmission | null;
}