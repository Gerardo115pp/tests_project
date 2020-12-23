import { createStore, applyMiddleware, compose } from 'redux';
import reduxThunk from 'redux-thunk';
import Reducers from './reducers/index';

const middleware = [reduxThunk];

const saveToLocalStorage = (state) => {
    try {
        const serialized_state = JSON.stringify(state);
        localStorage.setItem('state', serialized_state);
    } catch (error) {
        console.log(error);
    }
}

const loadToLocalStorage = () => {
    let return_stat = {}
    try {
        const serialized_state = localStorage.getItem('state');
        if(serialized_state === null)
        {
            return return_stat;
        }
        return JSON.parse(serialized_state);
    } catch (error) {
        console.log(error);
        return return_stat;
        
    }
}

const initialState = loadToLocalStorage();

const store = createStore(
    Reducers, //todos los reducers
    initialState, // estado inicial
    compose(applyMiddleware(...middleware),
    window.__REDUX_DEVTOOLS_EXTENSION__ ? window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__() :  f => f
    )
)

store.subscribe(() => saveToLocalStorage(store.getState()));

export default store;