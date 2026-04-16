export default function generateID() {
    let id1: string = Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    let id2: string = Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);

    return `${id1}-${id2}`;
}
