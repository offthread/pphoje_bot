import { observable, applyBindings } from 'knockout';

class Shows {
    constructor( window ) {
        this.firstName = observable('Filipe')
        this.lastName = observable('Costa');
    }
}

export default( window ) => ( el ) => {
    applyBindings(new Shows(window), el)
}