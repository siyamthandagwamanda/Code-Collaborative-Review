export type SubmissionStatus = "pending" | "in_review" | "approved" | "changes_requested";

export const submission_statuses: SubmissionStatus[] = [ "pending", "in_review", "approved","changes_requested" ];

export interface Submission {
    id: number;
    project_id: number;
    submitter_id: number;
    title: string;
    code: string;
    status: SubmissionStatus;
    created_at: Date; 
}