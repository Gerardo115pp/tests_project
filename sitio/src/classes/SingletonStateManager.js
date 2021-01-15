class StateEventCallback {
    constructor(callback_name, callback) {
        this.name = callback_name;
        this.callback = callback;
        this.active = true;
    }

    trigger = () => {
        if (this.active === true) {
            this.callback();
        } else {
            console.warn("trying to trigger a disabled callback");
        }
    };
}

class StateEvent {
    constructor(event_name) {
        this.event_name = event_name;
        this.callbacks = {};
        this.active = true;
    }

    isCallbackRegistred = name => this.callbacks[name] !== undefined;
    
    isCallbackActive = name => {
        if( this.callbacks[name] === undefined) {
            return false;
        }
        
        return this.callbacks[name].active;
    }

    toggleCallbackState = callback_name => {
        if (this.isCallbackRegistred(callback_name)) {
            this.callbacks[callback_name].active = !(this.callbacks[callback_name].active);
        } else {
            console.warn(`Attempt to toggle the state of an unknown callback '${callback_name}'.`);
        }
    }
 
    trigger = () => {
        if(this.active) {
            Object.keys(this.callbacks).forEach(clbk => {
                if(this.callbacks[clbk].active) {
                    this.callbacks[clbk].trigger();
                }
            })
        } else {
            console.warn(`Attempt to trigger a disabled event '${this.event_name}'`);
        }
    }
    
    registerCallback = (name, callback) => {
        if (this.callbacks[name] === undefined) {
            const new_callback = new StateEventCallback(name, callback);
            this.callbacks[name] = new_callback;
        } else {
            this.callbacks[name] = callback;
        }
    }
}

class SingletonStateException extends Error {
    constructor(message) {
        super(message);
        this.name = "SingletonStateException";
        this.message = message;
    }
}

class SingletonStateManager {
    static instance = null;
    
    static Awake = instance => {
        if(SingletonStateManager === null) {
            SingletonStateManager.instance = instance;
        } else {
            console.warn("Attempt to redefine SingletonStateManager instance");
        }
    }

    constructor() {
        this.events = {};
        SingletonStateManager.Awake(this);
    }

    isEventRegistred = name => this.events[name] !== undefined;

    registerEvent = event_name => {
        if(!this.isEventRegistred(event_name)) {
            const new_event = new StateEvent(event_name);
            this.events[event_name] = new_event;
        } else {
            throw new SingletonStateException(`Attempt to redefine an existing event '${event_name}'`);
        }
        
    } 

    triggerEvent = event_name => {
        if( this.isEventRegistred(event_name) ) {
            this.events[event_name].trigger();
        } else {
            throw new SingletonStateException(`Attempt to trigger an unknown event named: '${event_name}'`);
        }
    }
}

const instance = new SingletonStateManager();
Object.freeze(instance);
export default instance;