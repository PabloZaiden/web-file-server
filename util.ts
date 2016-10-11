export default class Util {
    public static isEmpty(s: string): boolean {
        return s == undefined || s.trim().length == 0;
    }
}