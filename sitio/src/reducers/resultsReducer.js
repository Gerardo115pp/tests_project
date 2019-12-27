const INITIAL_STATE = {
    results: {},
    title_name:""
}

export default (state=INITIAL_STATE, action) => {
    switch(action.type)
    {
        case 'set_results':
            return { ...state, results: action.results, title_name: action.name_title };
        case 'get_results':
            return { results: state.results, title_name: state.title_name}
        default:
            return state;
    }
}