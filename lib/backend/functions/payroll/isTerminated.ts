import dayjs from "dayjs";

export default function isTerminated(
    date: string,
    month:
        | "January"
        | "February"
        | "March"
        | "April"
        | "May"
        | "June"
        | "July"
        | "August"
        | "September"
        | "October"
        | "November"
        | "December",
    year: number,
): boolean {
    const terminationDate = dayjs(date, "MMMM YYYY", true); // Strict parsing
    const endOfMonth = dayjs(`${month} ${year}`, "MMMM YYYY", true);

    return terminationDate.isValid() && terminationDate.isSame(endOfMonth, "month");
}
