export const setInterviewee = (tests,name,key) => {
    return {
        type: 'set_interviewee',
        tests: tests,
        name: name,
        key: key
    }
}

export const get_tests = () => {
    return {
        type: 'get_tests'
    }
}