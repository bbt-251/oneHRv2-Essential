import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const SuggestionsOptions = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Suggestions Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="">Manage employee suggestion categories and options.</p>
                <div className="text-center py-12 text-gray-500">
                    Suggestions Options configuration will be implemented here.
                </div>
            </CardContent>
        </Card>
    );
};
