import { Loader } from "lucide-react";

interface Props {
    message?: string;
}

export default function LoadingComponent({ message }: Props) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <Loader className="animate-spin w-10 h-10 text-primary" />
                {message && <span className="text-sm text-muted-foreground">{message}</span>}
            </div>
        </div>
    );
}
