export const setInterviewee = (tests,name,key,interview) => {
    return {
        type: 'set_interviewee',
        tests: tests,
        name: name,
        key: key,
        interview_key: interview
    }
}

export const get_tests = () => {
    return {
        type: 'get_tests'
    }
}