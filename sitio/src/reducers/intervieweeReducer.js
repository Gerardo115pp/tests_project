const INITIAL_STATE = {
    needed_tests: {},
    interviewee_name: null,
    interviewee_key: null,
    interview_key:null
}

export default (state = INITIAL_STATE, action) => {
    switch(action.type)
    {
        case 'set_interviewee':
            return { ...state, needed_tests: action.tests, interviewee_name: action.name, interviewee_key: action.key, interview_key: action.interview_key};
        case 'get_tests':
            const { needed_tests } = state;
            return {
                ...state,
                needed_tests
            };
        default:
            return state;
    }
} 