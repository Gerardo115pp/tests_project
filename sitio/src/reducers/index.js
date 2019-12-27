import intervieweeReducer from './intervieweeReducer';
import userReducer from './userReducer';
import resultsReducer from './resultsReducer';
import {combineReducers} from  'redux';


export default combineReducers({
    intervieweeReducer,
    userReducer,
    resultsReducer
});