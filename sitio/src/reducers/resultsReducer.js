const INITIAL_STATE = {
    results: {},
    title_name:"",
    profile: {},
    test_dictionary: {}
}

export default (state=INITIAL_STATE, action) => {
    switch(action.type)
    {
        case 'set_results':
            return { ...state, results: action.results, title_name: action.name_title, profile: action.profile };
        case 'get_results':
            return { ...state }
        case 'set_test_dictionary':
            return{
                ...state,
                test_dictionary: action.test_dict
            };
        default:
            return state;
    }
}