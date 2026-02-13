export class StateStore {
    private state: any = {};

    constructor(initialState: any = {}) {
        this.state = initialState;
    }


    set(key: string, value: any) {
        this.state[key] = value;
    }

    get(key: string) {
        return this.state[key];
    }

    keys() {
        return Object.keys(this.state);
    }

}