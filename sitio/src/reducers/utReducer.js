const INITIAL_STATE = {
    interview: null,
    interviewee: null,
    interviewee_answers: {},
    interviewee_name: null,
    interviewee_stats: {},
    interviewer: null,
    question_num: 0,
    test_num: 0,
    test: []
}

export default (state=INITIAL_STATE, action) => {
    switch(action.type)
    {
        case 'setUT':
            const { data } = action;
            return { 
                ...state,
                interview: data.interview,
                interviewee: data.interviewee,
                interviewee_answers: data.interviewee_answers,
                interviewee_name: data.interviewee_name,
                interviewee_stats: data.interviewee_stats,
                interviewer: data.interviewer,
                question_num: data.question_num,
                test_num: data.test_num,
                tests: data.tests
            }
        case 'clearUTdata':
            return {
                interview: null,
                interviewee: null,
                interviewee_answers: {},
                interviewee_name: null,
                interviewee_stats: {},
                interviewer: null,
                question_num: 0,
                test_num: 0,
                test: []
            }

        default:
            return state
        }
}