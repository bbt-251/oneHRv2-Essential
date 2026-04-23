import dayjs from "dayjs";
export const months: string[] = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

/* The `interface Dates` is defining the structure of an object that will be returned by the
`getListOfDays` function. It specifies the properties and their types that the object should have. */
interface Dates {
    length: number;
    readable: string[];
    dates: dayjs.Dayjs[];
    months: string[];
    years: number[];
}

export default function getListOfDays(start: dayjs.Dayjs, end: dayjs.Dayjs): Dates {
    /* The code is declaring and initializing a variable named `obj` with an object of type `Dates`. The
    `Dates` interface defines the structure of the object. */
    let obj: Dates = {
        length: 0,
        readable: [],
        dates: [],
        months: [],
        years: [],
    };

    /* `let current = start;` is assigning the value of the `start` variable to the `current` variable.
    This is done to ensure that the original `start` variable is not modified during the execution
    of the code. */
    let current = start;

    /* The code block is a while loop that iterates as long as the `current` date is before the `end` date. */
    while (current.isBefore(end.add(1, "day"))) {
        obj.dates.push(current);
        obj.readable.push(current.format("MMMM DD, YYYY"));
        obj.length += 1;
        obj.months.push(months[current.month()]);
        obj.years.push(current.year());
        current = current.add(1, "day");
    }

    /* The code `obj.months = [...new Set(obj.months)];` and `obj.years = [...new Set(obj.years)];` are
    removing duplicate values from the `obj.months` and `obj.years` arrays, respectively. */
    obj.months = [...new Set(obj.months)];
    obj.years = [...new Set(obj.years)];

    return obj;
}
