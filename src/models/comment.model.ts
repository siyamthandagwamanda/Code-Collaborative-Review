export interface Comment {
    id: number;
    submission_id: number;
    author_id: number;
    line_number: number | null;
    body: string;
    created_at: Date;
}

export interface CommentWithAuthor extends Comment {
    author_name: string;
}