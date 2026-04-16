export default interface MultipleChoiceModel {
    id: string;
    timestamp: string;
    name: string;
    description: string;
    active: boolean;
    questions: Question[];
};;;;;;;;;;

interface Question {
    id: string;
    question: string;
    choices: string[];
    correctAnswerIndex: number | null;
}
