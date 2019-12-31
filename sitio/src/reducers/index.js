import intervieweeReducer from './intervieweeReducer';
import userReducer from './userReducer';
import resultsReducer from './resultsReducer';
import utReducer from './utReducer';
import {combineReducers} from  'redux';


export default combineReducers({
    intervieweeReducer,
    userReducer,
    resultsReducer,
    utReducer
});